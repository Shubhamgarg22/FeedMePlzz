const express = require("express");
const router = express.Router();
const Request = require("../model/Request");
const Donation = require("../model/Donation");
const User = require("../model/User");
const { asyncHandler, ApiError } = require("../middleware/errorHandler");
const { verifyToken, requireRole } = require("../middleware/auth");
const {
  notifyDonationAccepted,
  notifyPickupConfirmed,
  notifyDeliveryCompleted,
} = require("../utils/notifications");

/**
 * @route   POST /api/requests/accept
 * @desc    Accept a donation request (receiver claims donation)
 * @access  Private (Receiver only)
 */
router.post("/accept", verifyToken, requireRole("receiver", "admin"), asyncHandler(async (req, res) => {
  const { donationId, notes } = req.body;

  if (!donationId) {
    throw new ApiError(400, "Donation ID is required");
  }

  // Find donation
  const donation = await Donation.findById(donationId);
  
  if (!donation) {
    throw new ApiError(404, "Donation not found");
  }

  if (donation.status !== "available") {
    throw new ApiError(400, "Donation is no longer available");
  }

  // Check if receiver already has an active request
  const existingRequest = await Request.findOne({
    receiverId: req.user._id,
    status: { $in: ["pending", "accepted", "picked_up"] },
  });

  if (existingRequest) {
    throw new ApiError(400, "You already have an active request. Complete it before accepting another.");
  }

  // Create request
  const request = new Request({
    donationId,
    receiverId: req.user._id,
    donorId: donation.donorId,
    status: "accepted",
    acceptedTime: new Date(),
    notes: notes || "",
  });

  await request.save();

  // Update donation status
  donation.status = "accepted";
  await donation.save();

  // Get donor and receiver info for notification
  const [donor, receiver] = await Promise.all([
    User.findById(donation.donorId),
    User.findById(req.user._id),
  ]);

  // Send notification to donor
  await notifyDonationAccepted(donation, receiver, donor);

  res.status(201).json({
    success: true,
    message: "Donation request accepted successfully",
    request: await request.populate([
      { path: "donationId" },
      { path: "donorId", select: "name phone address organizationName" },
    ]),
  });
}));

/**
 * @route   PUT /api/requests/status
 * @desc    Update request status (picked_up, delivered, cancelled)
 * @access  Private (Receiver only)
 */
router.put("/status", verifyToken, requireRole("receiver", "admin"), asyncHandler(async (req, res) => {
  const { requestId, status, cancelReason, receiverLocation } = req.body;

  if (!requestId || !status) {
    throw new ApiError(400, "Request ID and status are required");
  }

  const validStatuses = ["picked_up", "delivered", "cancelled"];
  if (!validStatuses.includes(status)) {
    throw new ApiError(400, `Invalid status. Must be one of: ${validStatuses.join(", ")}`);
  }

  // Find request
  const request = await Request.findById(requestId);
  
  if (!request) {
    throw new ApiError(404, "Request not found");
  }

  // Check ownership
  if (request.receiverId.toString() !== req.user._id.toString() && req.user.role !== "admin") {
    throw new ApiError(403, "Not authorized to update this request");
  }

  // Validate status transitions
  const statusTransitions = {
    accepted: ["picked_up", "cancelled"],
    picked_up: ["delivered", "cancelled"],
  };

  if (!statusTransitions[request.status]?.includes(status)) {
    throw new ApiError(400, `Cannot change status from ${request.status} to ${status}`);
  }

  // Update request
  request.status = status;
  
  if (status === "picked_up") {
    request.pickupTime = new Date();
  } else if (status === "delivered") {
    request.completionTime = new Date();
  } else if (status === "cancelled") {
    request.cancelReason = cancelReason || "Cancelled by receiver";
  }

  if (receiverLocation) {
    request.receiverLocation = {
      ...receiverLocation,
      updatedAt: new Date(),
    };
  }

  await request.save();

  // Update donation status
  const donation = await Donation.findById(request.donationId);
  if (donation) {
    if (status === "picked_up") {
      donation.status = "picked_up";
    } else if (status === "delivered") {
      donation.status = "delivered";
    } else if (status === "cancelled") {
      donation.status = "available";
    }
    await donation.save();
  }

  // Get user info for notifications
  const [donor, receiver] = await Promise.all([
    User.findById(request.donorId),
    User.findById(request.receiverId),
  ]);

  // Send notifications
  if (status === "picked_up") {
    await notifyPickupConfirmed(donation, receiver, donor);
  } else if (status === "delivered") {
    await notifyDeliveryCompleted(donation, receiver, donor);
    
    // Update receiver's pickup count
    await User.findByIdAndUpdate(request.receiverId, {
      $inc: { totalPickups: 1 },
    });
  }

  res.json({
    success: true,
    message: `Request status updated to ${status}`,
    request,
  });
}));

/**
 * @route   PUT /api/requests/:id/location
 * @desc    Update receiver location (for tracking)
 * @access  Private (Receiver only)
 */
router.put("/:id/location", verifyToken, requireRole("receiver"), asyncHandler(async (req, res) => {
  const { lat, lng } = req.body;

  if (!lat || !lng) {
    throw new ApiError(400, "Latitude and longitude are required");
  }

  const request = await Request.findById(req.params.id);
  
  if (!request) {
    throw new ApiError(404, "Request not found");
  }

  if (request.receiverId.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "Not authorized");
  }

  request.receiverLocation = {
    lat,
    lng,
    updatedAt: new Date(),
  };

  await request.save();

  res.json({
    success: true,
    message: "Location updated",
  });
}));

/**
 * @route   GET /api/requests/my
 * @desc    Get receiver's requests
 * @access  Private (Receiver only)
 */
router.get("/my", verifyToken, requireRole("receiver", "admin"), asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 20 } = req.query;

  const query = { receiverId: req.user._id };
  if (status && status !== "all") {
    query.status = status;
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [requests, total] = await Promise.all([
    Request.find(query)
      .populate("donationId")
      .populate("donorId", "name phone address organizationName")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit)),
    Request.countDocuments(query),
  ]);

  res.json({
    success: true,
    count: requests.length,
    total,
    totalPages: Math.ceil(total / parseInt(limit)),
    currentPage: parseInt(page),
    requests,
  });
}));

/**
 * @route   GET /api/requests/donation/:donationId
 * @desc    Get requests for a specific donation
 * @access  Private (Donor or Admin)
 */
router.get("/donation/:donationId", verifyToken, asyncHandler(async (req, res) => {
  const donation = await Donation.findById(req.params.donationId);
  
  if (!donation) {
    throw new ApiError(404, "Donation not found");
  }

  // Check if user owns the donation or is admin
  if (donation.donorId.toString() !== req.user._id.toString() && req.user.role !== "admin") {
    throw new ApiError(403, "Not authorized");
  }

  const requests = await Request.find({ donationId: req.params.donationId })
    .populate("receiverId", "name phone rating profileImage")
    .sort({ createdAt: -1 });

  res.json({
    success: true,
    requests,
  });
}));

/**
 * @route   GET /api/requests/:id
 * @desc    Get single request details
 * @access  Private
 */
router.get("/:id", verifyToken, asyncHandler(async (req, res) => {
  const request = await Request.findById(req.params.id)
    .populate("donationId")
    .populate("donorId", "name phone address organizationName profileImage")
    .populate("receiverId", "name phone profileImage");

  if (!request) {
    throw new ApiError(404, "Request not found");
  }

  // Check authorization
  const isAuthorized = 
    request.receiverId._id.toString() === req.user._id.toString() ||
    request.donorId._id.toString() === req.user._id.toString() ||
    req.user.role === "admin";

  if (!isAuthorized) {
    throw new ApiError(403, "Not authorized");
  }

  res.json({
    success: true,
    request,
  });
}));

/**
 * @route   POST /api/requests/:id/rate
 * @desc    Rate a completed request
 * @access  Private (Donor only)
 */
router.post("/:id/rate", verifyToken, requireRole("donor"), asyncHandler(async (req, res) => {
  const { rating, feedback } = req.body;

  if (!rating || rating < 1 || rating > 5) {
    throw new ApiError(400, "Rating must be between 1 and 5");
  }

  const request = await Request.findById(req.params.id);
  
  if (!request) {
    throw new ApiError(404, "Request not found");
  }

  if (request.donorId.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "Not authorized");
  }

  if (request.status !== "delivered") {
    throw new ApiError(400, "Can only rate completed deliveries");
  }

  if (request.rating) {
    throw new ApiError(400, "Already rated");
  }

  // Update request
  request.rating = rating;
  request.feedback = feedback || "";
  await request.save();

  // Update receiver's rating
  const receiver = await User.findById(request.receiverId);
  const newRatingCount = receiver.ratingCount + 1;
  const newRating = ((receiver.rating * receiver.ratingCount) + rating) / newRatingCount;

  await User.findByIdAndUpdate(request.receiverId, {
    rating: newRating,
    ratingCount: newRatingCount,
  });

  res.json({
    success: true,
    message: "Rating submitted successfully",
  });
}));

module.exports = router;
