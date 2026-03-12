const mongoose = require("mongoose");

const donationSchema = new mongoose.Schema({
  donorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  foodType: {
    type: String,
    enum: ["cooked", "packaged", "fresh_produce", "bakery", "dairy", "other"],
    required: true,
  },
  foodName: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    default: "",
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
  },
  quantityUnit: {
    type: String,
    enum: ["meals", "kg", "items", "servings", "boxes"],
    default: "meals",
  },
  expiryTime: {
    type: Date,
    required: true,
  },
  pickupLocation: {
    address: {
      type: String,
      required: true,
    },
    lat: {
      type: Number,
      required: true,
    },
    lng: {
      type: Number,
      required: true,
    },
  },
  pickupStartTime: {
    type: Date,
    default: null,
  },
  pickupEndTime: {
    type: Date,
    default: null,
  },
  imageUrl: {
    type: String,
    default: "",
  },
  status: {
    type: String,
    enum: ["available", "accepted", "picked_up", "delivered", "cancelled", "expired"],
    default: "available",
  },
  specialInstructions: {
    type: String,
    default: "",
  },
  allergens: [{
    type: String,
  }],
  isVegetarian: {
    type: Boolean,
    default: false,
  },
  isVegan: {
    type: Boolean,
    default: false,
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
donationSchema.pre("save", function (next) {
  this.updatedAt = new Date();
  next();
});

// Index for faster queries
donationSchema.index({ status: 1, expiryTime: 1 });
donationSchema.index({ donorId: 1, status: 1 });
donationSchema.index({ "pickupLocation.lat": 1, "pickupLocation.lng": 1 });

module.exports = mongoose.model("Donation", donationSchema);
