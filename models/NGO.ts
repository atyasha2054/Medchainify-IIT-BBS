import mongoose from "mongoose";

const NGOSchema = new mongoose.Schema(
  {
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    name: {
      type: String,
      required: [true, "NGO name is required"],
      unique: true,
      trim: true,
      minlength: [4, "NGO name must consist of at least 4 characters"],
      maxlength: [30, "NGO name cannot exceed 30 characters"],
    },
    tagline: {
      type: String,
      required: [true, "NGO tagline is required"],
      trim: true,
    },
    logo: {
      type: String,
      required: [true, "NGO logo is required"],
    },
    address: {
      type: String,
      required: [true, "NGO address is required"],
      trim: true,
    },
    state: {
      type: String,
      required: [true, "State is required"],
    },
    city: {
      type: String,
      required: [true, "City is required"],
    },
    pincode: {
      type: String,
      required: [true, "Pincode is required"],
    },
    landmark: {
      lat: { type: Number, required: true },
      lng: { type: Number, required: true },
      addressDetails: { type: mongoose.Schema.Types.Mixed },
    },
    selectedPurposes: {
      type: [String],
      required: [true, "At least one purpose is required"],
    },
    foundingMembers: {
      type: Number,
      required: true,
      min: 0,
      max: 10,
      default: 3,
    },
    description: {
      type: String,
      required: [true, "Detailed description is required"],
      trim: true,
    },
    walletBalance: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
  },
);

if (mongoose.models && mongoose.models.NGO) {
  delete mongoose.models.NGO;
}
const NGO = mongoose.model("NGO", NGOSchema);
export default NGO;
