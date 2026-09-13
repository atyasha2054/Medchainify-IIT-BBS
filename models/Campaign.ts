import mongoose from "mongoose";

const CampaignSchema = new mongoose.Schema(
  {
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    ngo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "NGO",
    },
    name: {
      type: String,
      required: [true, "Campaign name is required"],
      trim: true,
      maxlength: [100, "Campaign name cannot exceed 100 characters"],
    },
    tagline: {
      type: String,
      required: [true, "Campaign tagline is required"],
      trim: true,
      maxlength: [100, "Tagline cannot exceed 100 characters"],
    },
    description: {
      type: String,
      required: [true, "Campaign description is required"],
      trim: true,
      maxlength: [750, "Description cannot exceed 750 characters"],
    },
    bannerImage: {
      type: String,
      required: [true, "Campaign banner image is required"],
    },
    location: {
      address: {
        type: String,
        required: [true, "Campaign address is required"],
        trim: true,
      },
      state: { type: String, default: "" },
      city: { type: String, default: "" },
      pincode: { type: String, default: "" },
      lat: { type: Number, required: true },
      lng: { type: Number, required: true },
      addressDetails: { type: mongoose.Schema.Types.Mixed },
    },
    startDate: {
      type: String,
      required: [true, "Start date is required"],
    },
    startTime: {
      type: String,
      required: [true, "Start time is required"],
    },
    endDate: {
      type: String,
      required: [true, "End date is required"],
    },
    endTime: {
      type: String,
      required: [true, "End time is required"],
    },
    feeType: {
      type: String,
      enum: ["free", "paid"],
      default: "free",
      required: true,
    },
    feeAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    services: {
      type: [String],
      default: [],
    },
    requirements: {
      type: [String],
      enum: ["Doctor", "Volunteer", "Fund", "Venue"],
      default: [],
    },
    additionalInstructions: {
      type: [String],
      default: [],
    },
    capacity: {
      type: Number,
      required: [true, "Target capacity is required"],
      min: [1, "Capacity must be at least 1 person"],
    },
    status: {
      type: String,
      enum: ["active", "completed", "cancelled"],
      default: "active",
    },
  },
  {
    timestamps: true,
  },
);

if (mongoose.models && mongoose.models.Campaign) {
  delete mongoose.models.Campaign;
}

const Campaign = mongoose.model("Campaign", CampaignSchema);
export default Campaign;
