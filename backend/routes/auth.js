const express = require("express");
const router = express.Router();
const User = require("../model/User");
const { asyncHandler, ApiError } = require("../middleware/errorHandler");
const { verifyToken } = require("../middleware/auth");
const admin = require("firebase-admin");

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Public (requires Firebase token)
 */
router.post("/register", asyncHandler(async (req, res) => {
  const { firebaseToken, name, email, phone, role, organizationName, organizationType } = req.body;

  if (!firebaseToken || !name || !email || !phone || !role) {
    throw new ApiError(400, "Missing required fields");
  }

  // Verify Firebase token
  const decodedToken = await admin.auth().verifyIdToken(firebaseToken);
  
  // Check if user already exists
  const existingUser = await User.findOne({ 
    $or: [{ firebaseUid: decodedToken.uid }, { email }] 
  });
  
  if (existingUser) {
    // User already exists - return their data instead of error
    return res.status(200).json({
      success: true,
      message: "User already registered",
      user: {
        id: existingUser._id,
        name: existingUser.name,
        email: existingUser.email,
        role: existingUser.role,
        isVerified: existingUser.isVerified,
      },
    });
  }

  // Create new user
  const user = new User({
    firebaseUid: decodedToken.uid,
    name,
    email,
    phone,
    role,
    organizationName: organizationName || "",
    organizationType: organizationType || "",
    isVerified: role === "admin" ? false : false, // Admin needs manual verification
  });

  await user.save();

  res.status(201).json({
    success: true,
    message: "User registered successfully",
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      isVerified: user.isVerified,
    },
  });
}));

/**
 * @route   POST /api/auth/login
 * @desc    Login user (verify token and return user data)
 * @access  Public (requires Firebase token)
 */
router.post("/login", asyncHandler(async (req, res) => {
  const { firebaseToken } = req.body;

  if (!firebaseToken) {
    throw new ApiError(400, "Firebase token required");
  }

  // Verify Firebase token
  const decodedToken = await admin.auth().verifyIdToken(firebaseToken);
  
  // Find user
  const user = await User.findOne({ firebaseUid: decodedToken.uid });
  
  if (!user) {
    throw new ApiError(404, "User not found. Please register first.");
  }

  if (user.isBlocked) {
    throw new ApiError(403, "Your account has been blocked");
  }

  res.json({
    success: true,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      isVerified: user.isVerified,
      profileImage: user.profileImage,
      organizationName: user.organizationName,
      organizationType: user.organizationType,
      address: user.address,
      totalDonations: user.totalDonations,
      totalPickups: user.totalPickups,
      rating: user.rating,
    },
  });
}));

/**
 * @route   GET /api/auth/me
 * @desc    Get current user profile
 * @access  Private
 */
router.get("/me", verifyToken, asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  
  res.json({
    success: true,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      isVerified: user.isVerified,
      profileImage: user.profileImage,
      organizationName: user.organizationName,
      organizationType: user.organizationType,
      address: user.address,
      totalDonations: user.totalDonations,
      totalPickups: user.totalPickups,
      rating: user.rating,
      ratingCount: user.ratingCount,
      createdAt: user.createdAt,
    },
  });
}));

/**
 * @route   PUT /api/auth/profile
 * @desc    Update user profile
 * @access  Private
 */
router.put("/profile", verifyToken, asyncHandler(async (req, res) => {
  const { name, phone, organizationName, organizationType, address, profileImage } = req.body;

  const updateData = {};
  if (name) updateData.name = name;
  if (phone) updateData.phone = phone;
  if (organizationName !== undefined) updateData.organizationName = organizationName;
  if (organizationType !== undefined) updateData.organizationType = organizationType;
  if (address) updateData.address = address;
  if (profileImage) updateData.profileImage = profileImage;

  const user = await User.findByIdAndUpdate(
    req.user._id,
    updateData,
    { new: true, runValidators: true }
  );

  res.json({
    success: true,
    message: "Profile updated successfully",
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      isVerified: user.isVerified,
      profileImage: user.profileImage,
      organizationName: user.organizationName,
      organizationType: user.organizationType,
      address: user.address,
    },
  });
}));

/**
 * @route   DELETE /api/auth/account
 * @desc    Delete user account
 * @access  Private
 */
router.delete("/account", verifyToken, asyncHandler(async (req, res) => {
  // Delete user from database
  await User.findByIdAndDelete(req.user._id);
  
  // Delete from Firebase
  try {
    await admin.auth().deleteUser(req.user.firebaseUid);
  } catch (error) {
    console.error("Failed to delete Firebase user:", error);
  }

  res.json({
    success: true,
    message: "Account deleted successfully",
  });
}));

module.exports = router;
