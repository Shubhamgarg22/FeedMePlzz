const mongoose = require("mongoose");

const requestSchema = new mongoose.Schema({
  donationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Donation",
    required: true,
  },
  receiverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  donorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  status: {
    type: String,
    enum: ["pending", "accepted", "picked_up", "delivered", "cancelled"],
    default: "pending",
  },
  requestTime: {
    type: Date,
    default: Date.now,
  },
  acceptedTime: {
    type: Date,
  },
  pickupTime: {
    type: Date,
  },
  completionTime: {
    type: Date,
  },
  cancelReason: {
    type: String,
    default: "",
  },
  receiverLocation: {
    lat: Number,
    lng: Number,
    updatedAt: Date,
  },
  rating: {
    type: Number,
    min: 1,
    max: 5,
  },
  feedback: {
    type: String,
    default: "",
  },
  notes: {
    type: String,
    default: "",
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
requestSchema.pre("save", function (next) {
  this.updatedAt = new Date();
  next();
});

// Index for faster queries
requestSchema.index({ donationId: 1, status: 1 });
requestSchema.index({ receiverId: 1, status: 1 });
requestSchema.index({ donorId: 1, status: 1 });

module.exports = mongoose.model("Request", requestSchema);
