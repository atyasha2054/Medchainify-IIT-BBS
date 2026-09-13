import mongoose from "mongoose";

const CampaignRegistrationSchema = new mongoose.Schema(
  {
    campaignId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Campaign",
      required: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    phone: {
      type: String,
      default: "",
    },
    status: {
      type: String,
      enum: ["confirmed", "waitlist", "cancelled"],
      default: "confirmed",
      index: true,
    },
    waitlistPosition: {
      type: Number,
      default: null,
    },
    feeType: {
      type: String,
      enum: ["free", "paid"],
      default: "free",
    },
    feeAmount: {
      type: Number,
      default: 0,
    },
    paymentStatus: {
      type: String,
      enum: ["na", "pending", "paid", "refunded"],
      default: "na",
    },
    stripeSessionId: {
      type: String,
      default: null,
      index: true,
    },
    stripePaymentIntentId: {
      type: String,
      default: null,
    },
    transactionId: {
      type: String,
      default: null,
    },
    invoiceNumber: {
      type: String,
      default: null,
    },
    registeredAt: {
      type: Date,
      default: Date.now,
    },
    cancelledAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

// Compound index to quickly find user's active registration per campaign
CampaignRegistrationSchema.index({ campaignId: 1, userId: 1 });

if (mongoose.models && mongoose.models.CampaignRegistration) {
  delete mongoose.models.CampaignRegistration;
}

const CampaignRegistration = mongoose.model(
  "CampaignRegistration",
  CampaignRegistrationSchema,
);

export default CampaignRegistration;
