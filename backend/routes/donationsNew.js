const express = require("express");
const router = express.Router();
const Donation = require("../model/Donation");
const User = require("../model/User");
const { asyncHandler, ApiError } = require("../middleware/errorHandler");
const { verifyToken, requireRole, optionalAuth } = require("../middleware/auth");

/**
 * @route   GET /api/donations
 * @desc    Get all available donations with filters
 * @access  Public (with optional auth for personalized results)
 */
router.get("/", optionalAuth, asyncHandler(async (req, res) => {
  const {
    status,
    foodType,
    search,
    lat,
    lng,
    radius,
    limit = 20,
    page = 1,
    sortBy = "createdAt",
    sortOrder = "desc",
  } = req.query;

  const query = {};

  // Status filter
  if (status && status !== "all") {
    query.status = status;
  } else {
    // Default: show available donations
    query.status = "available";
  }

  // Food type filter
  if (foodType && foodType !== "all") {
    query.foodType = foodType;
  }

  // Search by food name
  if (search) {
    query.foodName = new RegExp(search, "i");
  }

  // Filter out expired donations
  query.expiryTime = { $gt: new Date() };

  // Location-based filtering (if lat/lng provided)
  if (lat && lng && radius) {
    // Calculate bounds (simplified)
    const latNum = parseFloat(lat);
    const lngNum = parseFloat(lng);
    const radiusKm = parseFloat(radius);
    const latDelta = radiusKm / 111; // ~111km per degree latitude
    const lngDelta = radiusKm / (111 * Math.cos(latNum * Math.PI / 180));

    query["pickupLocation.lat"] = {
      $gte: latNum - latDelta,
      $lte: latNum + latDelta,
    };
    query["pickupLocation.lng"] = {
      $gte: lngNum - lngDelta,
      $lte: lngNum + lngDelta,
    };
  }

  // Pagination
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const sortOptions = { [sortBy]: sortOrder === "asc" ? 1 : -1 };

  const [donations, total] = await Promise.all([
    Donation.find(query)
      .populate("donorId", "name organizationName rating profileImage")
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit)),
    Donation.countDocuments(query),
  ]);

  res.json({
    success: true,
    count: donations.length,
    total,
    totalPages: Math.ceil(total / parseInt(limit)),
    currentPage: parseInt(page),
    donations,
  });
}));

/**
 * @route   GET /api/donations/my
 * @desc    Get current user's donations
 * @access  Private (Donor only)
 */
router.get("/my", verifyToken, requireRole("donor", "admin"), asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 20 } = req.query;

  const query = { donorId: req.user._id };
  if (status && status !== "all") {
    query.status = status;
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [donations, total] = await Promise.all([
    Donation.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit)),
    Donation.countDocuments(query),
  ]);

  res.json({
    success: true,
    count: donations.length,
    total,
    totalPages: Math.ceil(total / parseInt(limit)),
    currentPage: parseInt(page),
    donations,
  });
}));

/**
 * @route   GET /api/donations/:id
 * @desc    Get single donation by ID
 * @access  Public
 */
router.get("/:id", optionalAuth, asyncHandler(async (req, res) => {
  const donation = await Donation.findById(req.params.id)
    .populate("donorId", "name organizationName phone rating profileImage address");

  if (!donation) {
    throw new ApiError(404, "Donation not found");
  }

  res.json({
    success: true,
    donation,
  });
}));

/**
 * @route   POST /api/donations
 * @desc    Create new donation
 * @access  Private (Donor only)
 */
router.post("/", verifyToken, requireRole("donor", "admin"), asyncHandler(async (req, res) => {
  const {
    foodType,
    foodName,
    description,
    quantity,
    quantityUnit,
    expiryTime,
    pickupLocation,
    pickupStartTime,
    pickupEndTime,
    imageUrl,
    specialInstructions,
    allergens,
    isVegetarian,
    isVegan,
  } = req.body;

  // Validation
  if (!foodType || !foodName || !quantity || !expiryTime || !pickupLocation) {
    throw new ApiError(400, "Missing required fields");
  }

  if (!pickupLocation.address || !pickupLocation.lat || !pickupLocation.lng) {
    throw new ApiError(400, "Pickup location must include address, lat, and lng");
  }

  // Create donation
  const donation = new Donation({
    donorId: req.user._id,
    foodType,
    foodName,
    description: description || "",
    quantity: Math.round(Number(quantity)),
    quantityUnit: quantityUnit || "meals",
    expiryTime: new Date(expiryTime),
    pickupLocation,
    pickupStartTime: pickupStartTime ? new Date(pickupStartTime) : null,
    pickupEndTime: pickupEndTime ? new Date(pickupEndTime) : null,
    imageUrl: imageUrl || "",
    specialInstructions: specialInstructions || "",
    allergens: allergens || [],
    isVegetarian: isVegetarian || false,
    isVegan: isVegan || false,
  });

  await donation.save();

  // Update user's donation count
  await User.findByIdAndUpdate(req.user._id, {
    $inc: { totalDonations: 1 },
  });

  res.status(201).json({
    success: true,
    message: "Donation created successfully",
    donation,
  });
}));

/**
 * @route   PUT /api/donations/:id
 * @desc    Update donation
 * @access  Private (Donation owner or Admin)
 */
router.put("/:id", verifyToken, asyncHandler(async (req, res) => {
  const donation = await Donation.findById(req.params.id);

  if (!donation) {
    throw new ApiError(404, "Donation not found");
  }

  // Check ownership
  if (donation.donorId.toString() !== req.user._id.toString() && req.user.role !== "admin") {
    throw new ApiError(403, "Not authorized to update this donation");
  }

  // Don't allow updating if already accepted/completed
  if (["accepted", "picked_up", "delivered"].includes(donation.status)) {
    throw new ApiError(400, "Cannot update donation that is already in progress");
  }

  const allowedUpdates = [
    "foodType", "foodName", "description", "quantity", "quantityUnit",
    "expiryTime", "pickupLocation", "pickupStartTime", "pickupEndTime",
    "imageUrl", "specialInstructions", "allergens", "isVegetarian", "isVegan", "status"
  ];

  const updates = {};
  allowedUpdates.forEach((field) => {
    if (req.body[field] !== undefined) {
      updates[field] = req.body[field];
    }
  });

  const updatedDonation = await Donation.findByIdAndUpdate(
    req.params.id,
    updates,
    { new: true, runValidators: true }
  );

  res.json({
    success: true,
    message: "Donation updated successfully",
    donation: updatedDonation,
  });
}));

/**
 * @route   DELETE /api/donations/:id
 * @desc    Delete donation
 * @access  Private (Donation owner or Admin)
 */
router.delete("/:id", verifyToken, asyncHandler(async (req, res) => {
  const donation = await Donation.findById(req.params.id);

  if (!donation) {
    throw new ApiError(404, "Donation not found");
  }

  // Check ownership
  if (donation.donorId.toString() !== req.user._id.toString() && req.user.role !== "admin") {
    throw new ApiError(403, "Not authorized to delete this donation");
  }

  // Don't allow deleting if already accepted/in progress
  if (["accepted", "picked_up"].includes(donation.status)) {
    throw new ApiError(400, "Cannot delete donation that is in progress");
  }

  await Donation.findByIdAndDelete(req.params.id);

  // Update user's donation count
  await User.findByIdAndUpdate(req.user._id, {
    $inc: { totalDonations: -1 },
  });

  res.json({
    success: true,
    message: "Donation deleted successfully",
  });
}));

/**
 * @route   GET /api/donations/stats/summary
 * @desc    Get donation statistics
 * @access  Private
 */
router.get("/stats/summary", verifyToken, asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const userRole = req.user.role;

  let matchQuery = {};
  
  if (userRole === "donor") {
    matchQuery = { donorId: userId };
  }

  const stats = await Donation.aggregate([
    { $match: matchQuery },
    {
      $group: {
        _id: null,
        totalDonations: { $sum: 1 },
        availableDonations: {
          $sum: { $cond: [{ $eq: ["$status", "available"] }, 1, 0] },
        },
        completedDonations: {
          $sum: { $cond: [{ $eq: ["$status", "delivered"] }, 1, 0] },
        },
        totalQuantity: { $sum: "$quantity" },
      },
    },
  ]);

  res.json({
    success: true,
    stats: stats[0] || {
      totalDonations: 0,
      availableDonations: 0,
      completedDonations: 0,
      totalQuantity: 0,
    },
  });
}));

module.exports = router;
