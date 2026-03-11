const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  firebaseUid: {
    type: String,
    required: true,
    unique: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  phone: {
    type: String,
    required: true,
    trim: true,
  },
  role: {
    type: String,
    enum: ["donor", "receiver", "admin"],
    required: true,
    default: "donor",
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
  isBlocked: {
    type: Boolean,
    default: false,
  },
  profileImage: {
    type: String,
    default: "",
  },
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    coordinates: {
      lat: Number,
      lng: Number,
    },
  },
  organizationName: {
    type: String,
    default: "",
  },
  organizationType: {
    type: String,
    enum: ["restaurant", "event", "individual", "ngo", "other", ""],
    default: "",
  },
  totalDonations: {
    type: Number,
    default: 0,
  },
  totalPickups: {
    type: Number,
    default: 0,
  },
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5,
  },
  ratingCount: {
    type: Number,
    default: 0,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Update timestamp on save
userSchema.pre("save", function (next) {
  this.updatedAt = new Date();
  next();
});

// Index for faster queries
userSchema.index({ role: 1, isVerified: 1 });
userSchema.index({ "address.coordinates": "2dsphere" });

module.exports = mongoose.model("User", userSchema);
