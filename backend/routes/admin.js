const express = require("express");
const router = express.Router();
const User = require("../model/User");
const Donation = require("../model/Donation");
const Request = require("../model/Request");
const Notification = require("../model/Notification");
const { asyncHandler, ApiError } = require("../middleware/errorHandler");
const { verifyToken, requireRole } = require("../middleware/auth");
const { createNotification, NotificationTemplates } = require("../utils/notifications");

/**
 * @route   GET /api/admin/users
 * @desc    Get all users with filters
 * @access  Private (Admin only)
 */
router.get("/users", verifyToken, requireRole("admin"), asyncHandler(async (req, res) => {
  const { role, isVerified, isBlocked, search, page = 1, limit = 20 } = req.query;

  const query = {};
  
  if (role && role !== "all") {
    query.role = role;
  }
  
  if (isVerified !== undefined) {
    query.isVerified = isVerified === "true";
  }
  
  if (isBlocked !== undefined) {
    query.isBlocked = isBlocked === "true";
  }
  
  if (search) {
    query.$or = [
      { name: new RegExp(search, "i") },
      { email: new RegExp(search, "i") },
      { organizationName: new RegExp(search, "i") },
    ];
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [users, total] = await Promise.all([
    User.find(query)
      .select("-firebaseUid")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit)),
    User.countDocuments(query),
  ]);

  res.json({
    success: true,
    count: users.length,
    total,
    totalPages: Math.ceil(total / parseInt(limit)),
    currentPage: parseInt(page),
    users,
  });
}));

/**
 * @route   GET /api/admin/users/:id
 * @desc    Get single user details
 * @access  Private (Admin only)
 */
router.get("/users/:id", verifyToken, requireRole("admin"), asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select("-firebaseUid");

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  // Get user's activity stats
  const [donationsCount, requestsCount] = await Promise.all([
    Donation.countDocuments({ donorId: req.params.id }),
    Request.countDocuments({ receiverId: req.params.id }),
  ]);

  res.json({
    success: true,
    user,
    stats: {
      donationsCount,
      requestsCount,
    },
  });
}));

/**
 * @route   PUT /api/admin/verify/:id
 * @desc    Verify a user account
 * @access  Private (Admin only)
 */
router.put("/verify/:id", verifyToken, requireRole("admin"), asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  if (user.isVerified) {
    throw new ApiError(400, "User is already verified");
  }

  user.isVerified = true;
  await user.save();

  // Send notification to user
  const { title, message } = NotificationTemplates.userVerified();
  await createNotification({
    userId: user._id,
    type: "user_verified",
    title,
    message,
    sendSmsNotification: true,
    phoneNumber: user.phone,
  });

  res.json({
    success: true,
    message: "User verified successfully",
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      isVerified: user.isVerified,
    },
  });
}));

/**
 * @route   PUT /api/admin/block/:id
 * @desc    Block or unblock a user
 * @access  Private (Admin only)
 */
router.put("/block/:id", verifyToken, requireRole("admin"), asyncHandler(async (req, res) => {
  const { block, reason } = req.body;

  const user = await User.findById(req.params.id);

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  if (user.role === "admin") {
    throw new ApiError(400, "Cannot block admin users");
  }

  user.isBlocked = block;
  await user.save();

  // Send notification to user if blocked
  if (block) {
    const { title, message } = NotificationTemplates.userBlocked(reason);
    await createNotification({
      userId: user._id,
      type: "user_blocked",
      title,
      message,
    });
  }

  res.json({
    success: true,
    message: block ? "User blocked successfully" : "User unblocked successfully",
  });
}));

/**
 * @route   GET /api/admin/donations
 * @desc    Get all donations (admin view)
 * @access  Private (Admin only)
 */
router.get("/donations", verifyToken, requireRole("admin"), asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 20 } = req.query;

  const query = {};
  if (status && status !== "all") {
    query.status = status;
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [donations, total] = await Promise.all([
    Donation.find(query)
      .populate("donorId", "name email organizationName")
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
 * @route   GET /api/admin/requests
 * @desc    Get all requests (admin view)
 * @access  Private (Admin only)
 */
router.get("/requests", verifyToken, requireRole("admin"), asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 20 } = req.query;

  const query = {};
  if (status && status !== "all") {
    query.status = status;
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [requests, total] = await Promise.all([
    Request.find(query)
      .populate("donationId", "foodName quantity status")
      .populate("receiverId", "name email")
      .populate("donorId", "name email")
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
 * @route   GET /api/admin/stats
 * @desc    Get platform statistics
 * @access  Private (Admin only)
 */
router.get("/stats", verifyToken, requireRole("admin"), asyncHandler(async (req, res) => {
  const [
    totalUsers,
    totalDonors,
    totalReceivers,
    totalDonations,
    activeDonations,
    completedDonations,
    totalRequests,
    pendingVerifications,
  ] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ role: "donor" }),
    User.countDocuments({ role: "receiver" }),
    Donation.countDocuments(),
    Donation.countDocuments({ status: "available" }),
    Donation.countDocuments({ status: "delivered" }),
    Request.countDocuments(),
    User.countDocuments({ isVerified: false }),
  ]);

  // Get recent activity
  const recentDonations = await Donation.find()
    .populate("donorId", "name")
    .sort({ createdAt: -1 })
    .limit(5);

  // Get donations by status
  const donationsByStatus = await Donation.aggregate([
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 },
      },
    },
  ]);

  // Get daily stats for the last 7 days
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const dailyDonations = await Donation.aggregate([
    {
      $match: {
        createdAt: { $gte: sevenDaysAgo },
      },
    },
    {
      $group: {
        _id: {
          $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
        },
        count: { $sum: 1 },
        totalQuantity: { $sum: "$quantity" },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  res.json({
    success: true,
    stats: {
      users: {
        total: totalUsers,
        donors: totalDonors,
        receivers: totalReceivers,
        pendingVerifications,
      },
      donations: {
        total: totalDonations,
        active: activeDonations,
        completed: completedDonations,
        byStatus: donationsByStatus,
      },
      requests: {
        total: totalRequests,
      },
      recentDonations,
      dailyDonations,
    },
  });
}));

/**
 * @route   GET /api/admin/logs
 * @desc    Get activity logs
 * @access  Private (Admin only)
 */
router.get("/logs", verifyToken, requireRole("admin"), asyncHandler(async (req, res) => {
  const { type, page = 1, limit = 50 } = req.query;

  // Get recent notifications as activity logs
  const query = {};
  if (type && type !== "all") {
    query.type = type;
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [logs, total] = await Promise.all([
    Notification.find(query)
      .populate("userId", "name email role")
      .populate("relatedDonationId", "foodName")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit)),
    Notification.countDocuments(query),
  ]);

  res.json({
    success: true,
    count: logs.length,
    total,
    totalPages: Math.ceil(total / parseInt(limit)),
    currentPage: parseInt(page),
    logs,
  });
}));

module.exports = router;
