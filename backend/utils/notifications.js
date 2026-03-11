const twilio = require("twilio");
const Notification = require("../model/Notification");

// Initialize Twilio client
const twilioClient = process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN
  ? twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
  : null;

/**
 * Send SMS notification via Twilio
 * @param {string} phoneNumber - Recipient phone number
 * @param {string} message - SMS message content
 * @returns {Promise<boolean>} - Success status
 */
const sendSMS = async (phoneNumber, message) => {
  if (!twilioClient) {
    console.warn("Twilio not configured, skipping SMS");
    return false;
  }

  try {
    await twilioClient.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: phoneNumber,
    });
    console.log(`SMS sent to ${phoneNumber}`);
    return true;
  } catch (error) {
    console.error("SMS sending failed:", error);
    return false;
  }
};

/**
 * Create and send notification
 * @param {Object} options - Notification options
 */
const createNotification = async ({
  userId,
  type,
  title,
  message,
  relatedDonationId,
  relatedRequestId,
  sendSmsNotification = false,
  phoneNumber = null,
}) => {
  try {
    let smsSent = false;

    // Send SMS if requested
    if (sendSmsNotification && phoneNumber) {
      smsSent = await sendSMS(phoneNumber, `${title}: ${message}`);
    }

    // Create notification in database
    const notification = new Notification({
      userId,
      type,
      title,
      message,
      relatedDonationId,
      relatedRequestId,
      smsSent,
    });

    await notification.save();
    return notification;
  } catch (error) {
    console.error("Failed to create notification:", error);
    throw error;
  }
};

/**
 * Notification templates
 */
const NotificationTemplates = {
  donationAccepted: (donorName, foodName, receiverName) => ({
    title: "Donation Accepted!",
    message: `${receiverName} has accepted your ${foodName} donation and will pick it up soon.`,
  }),

  pickupConfirmed: (foodName, receiverName) => ({
    title: "Pickup Confirmed",
    message: `${receiverName} has picked up the ${foodName} donation. Thank you for your contribution!`,
  }),

  deliveryCompleted: (foodName, receiverName) => ({
    title: "Delivery Completed",
    message: `The ${foodName} donation has been successfully delivered by ${receiverName}.`,
  }),

  newDonationNearby: (donorName, foodName, distance) => ({
    title: "New Donation Nearby",
    message: `${donorName} has listed ${foodName} for donation, ${distance} away from you.`,
  }),

  donationExpiringSoon: (foodName, expiryTime) => ({
    title: "Donation Expiring Soon",
    message: `Your ${foodName} donation will expire at ${expiryTime}. Consider updating the listing.`,
  }),

  userVerified: () => ({
    title: "Account Verified",
    message: "Your account has been verified. You now have full access to the platform.",
  }),

  userBlocked: (reason) => ({
    title: "Account Suspended",
    message: `Your account has been suspended. Reason: ${reason || "Policy violation"}`,
  }),
};

/**
 * Send notification when donation is accepted
 */
const notifyDonationAccepted = async (donation, receiver, donor) => {
  const { title, message } = NotificationTemplates.donationAccepted(
    donor.name,
    donation.foodName,
    receiver.name
  );

  await createNotification({
    userId: donor._id,
    type: "donation_accepted",
    title,
    message,
    relatedDonationId: donation._id,
    sendSmsNotification: true,
    phoneNumber: donor.phone,
  });
};

/**
 * Send notification when pickup is confirmed
 */
const notifyPickupConfirmed = async (donation, receiver, donor) => {
  const { title, message } = NotificationTemplates.pickupConfirmed(
    donation.foodName,
    receiver.name
  );

  await createNotification({
    userId: donor._id,
    type: "pickup_confirmed",
    title,
    message,
    relatedDonationId: donation._id,
    sendSmsNotification: true,
    phoneNumber: donor.phone,
  });
};

/**
 * Send notification when delivery is completed
 */
const notifyDeliveryCompleted = async (donation, receiver, donor) => {
  const { title, message } = NotificationTemplates.deliveryCompleted(
    donation.foodName,
    receiver.name
  );

  // Notify donor
  await createNotification({
    userId: donor._id,
    type: "delivery_completed",
    title,
    message,
    relatedDonationId: donation._id,
    sendSmsNotification: true,
    phoneNumber: donor.phone,
  });

  // Notify receiver
  await createNotification({
    userId: receiver._id,
    type: "delivery_completed",
    title: "Delivery Completed",
    message: `You have successfully delivered the ${donation.foodName} donation. Thank you!`,
    relatedDonationId: donation._id,
  });
};

module.exports = {
  sendSMS,
  createNotification,
  NotificationTemplates,
  notifyDonationAccepted,
  notifyPickupConfirmed,
  notifyDeliveryCompleted,
};
