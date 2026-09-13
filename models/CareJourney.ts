import mongoose from "mongoose";

const CareTaskSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    category: {
      type: String,
      enum: [
        "TODAY",
        "UPCOMING",
        "MISSED",
        "LONG_TERM",
        "PREVENTIVE",
        "RECOVERY",
        "WELLNESS",
        "MILESTONE",
      ],
      required: true,
    },
    phase: {
      type: String,
      enum: [
        "DIAGNOSIS",
        "TREATMENT",
        "FOLLOW_UP",
        "REHABILITATION",
        "WELLNESS",
      ],
      default: "TREATMENT",
    },
    priority: {
      type: String,
      enum: ["CRITICAL", "HIGH", "MEDIUM", "LOW"],
      default: "MEDIUM",
    },
    confidenceScore: { type: Number, required: true }, // e.g. 96 (percentage)
    guidelineCitation: { type: String, default: "Standard Clinical Protocol" }, // e.g. "ADA Guidelines 2026"
    clinicalReasoning: { type: String, required: true },
    triggerSource: {
      type: String, // e.g. "Lab Report: HbA1c (10.2%)", "MRI Report: Left ACL Tear", "Diet Plan: High Sodium"
      required: true,
    },
    triggerSourceUrl: { type: String }, // e.g. "/analyze-report", "/diet-chart", "/analyze-prescription"
    actionType: {
      type: String,
      enum: [
        "BOOK_APPOINTMENT",
        "REFILL_MEDICINE",
        "UPDATE_DIET",
        "REPEAT_LAB_TEST",
        "PHYSIOTHERAPY_SESSION",
        "HEALTH_QUESTIONNAIRE",
        "VACCINATION",
        "LIFESTYLE_CHECK",
        "GENERAL_TASK",
      ],
      default: "GENERAL_TASK",
    },
    actionLink: { type: String }, // e.g. "/find-doctor?specialty=Diabetologist", "/diet-chart", "/medicines"
    dueDate: { type: Date },
    status: {
      type: String,
      enum: [
        "PENDING",
        "COMPLETED",
        "POSTPONED",
        "DOCTOR_APPROVED",
        "DISMISSED",
      ],
      default: "PENDING",
    },
    doctorFeedback: {
      status: {
        type: String,
        enum: ["APPROVED", "MODIFIED", "DISMISSED", "NONE"],
        default: "NONE",
      },
      notes: { type: String },
      updatedByDoctor: { type: String },
      updatedAt: { type: Date },
    },
    completedAt: { type: Date },
    postponedUntil: { type: Date },
  },
  { timestamps: true },
);

const CareJourneySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    userEmail: { type: String, required: true },
    healthStatusSummary: {
      primaryDiagnoses: [String],
      activeRiskLevel: {
        type: String,
        enum: ["CRITICAL", "ELEVATED", "MODERATE", "STABLE"],
        default: "STABLE",
      },
      activePhase: {
        type: String,
        enum: [
          "DIAGNOSIS",
          "TREATMENT",
          "FOLLOW_UP",
          "REHABILITATION",
          "WELLNESS",
        ],
        default: "TREATMENT",
      },
      overallScore: { type: Number, default: 85 },
      lastAnalyzedAt: { type: Date, default: Date.now },
    },
    tasks: [CareTaskSchema],
    milestonesCompletedCount: { type: Number, default: 0 },
  },
  { timestamps: true },
);

const CareJourney =
  mongoose.models.CareJourney ||
  mongoose.model("CareJourney", CareJourneySchema, "care-journeys");

export default CareJourney;
