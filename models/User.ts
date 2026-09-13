import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Please provide a name"],
    },
    email: {
      type: String,
      required: [true, "Please provide an email"],
      unique: true,
    },
    avatar: {
      type: String,
    },
    role: {
      type: String,
      enum: ["doctor", "patient"],
      default: "patient",
    },
    specialization: {
      type: String,
    },
    mobile: {
      type: Number,
      unique: true,
      sparse: true,
    },
    idNumber: {
      type: String,
      unique: true,
      sparse: true,
    },
    gender: {
      type: String,
      enum: ["male", "female", "non binary"],
      default: "male",
    },
    state: {
      type: String,
    },
    city: {
      type: String,
    },
    pincode: {
      type: String,
    },
    isAddressUpdated: {
      type: Boolean,
      default: false,
    },
    weight: {
      type: Number,
    },
    height: {
      feet: { type: Number },
      inches: { type: Number },
    },
    diet: {
      type: String,
      enum: ["veg", "non veg", "jain"],
    },
    bloodGroup: {
      type: String,
    },
    diseases: {
      type: [String],
      default: [],
    },
    allergies: {
      type: [String],
      default: [],
    },
    dob: {
      type: Date,
    },
    age: {
      years: { type: Number },
      months: { type: Number },
      days: { type: Number },
    },
    sl_no: {
      type: Number,
      unique: true,
      sparse: true,
    },
    short_description: {
      type: String,
    },
    bio: {
      type: String,
    },
    experience: {
      type: Number,
    },
    rating: {
      type: Number,
    },
    easyCard: {
      bloodGroup: { type: String },
      allergies: { type: [String], default: [] },
      chronicConditions: { type: [String], default: [] },
      emergencyContact: { type: String },
      healthStatusSummary: { type: String },
      recentActivity: { type: String },
      healthIndexScore: { type: Number },
      primaryCarePhysician: { type: String },
      historySummary: { type: String },
      generatedAt: { type: Date },
    },
  },
  {
    timestamps: true,
  },
);

if (mongoose.models.User) {
  delete mongoose.models.User;
}
const User = mongoose.model("User", UserSchema);
export default User;
