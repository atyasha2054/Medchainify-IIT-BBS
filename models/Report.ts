import mongoose from "mongoose";

const ReportSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    patientDetails: {
      name: String,
      age: String,
      gender: String,
      date: String,
    },
    overallSummary: String,
    healthScore: Number,
    markers: [
      {
        name: String,
        value: String,
        unit: String,
        referenceRange: String,
        status: String,
        interpretation: String,
        advice: String,
      },
    ],
    recommendations: [String],
  },
  {
    timestamps: true,
  },
);

const Report = mongoose.models.Report || mongoose.model("Report", ReportSchema);
export default Report;
