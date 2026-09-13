import mongoose from "mongoose";

const AyushConsultationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    ayurvedicAnalysis: { type: String, required: true },
    ayushMantrakQuote: { type: String, required: true },
    ayurvedicSolutions: { type: mongoose.Schema.Types.Mixed, required: true },
    measures: {
      medicine: {
        name: String,
        description: String,
        benefits: String,
        howToTake: String,
        imageUrl: String,
      },
    },
    ayurvedicMedications: [
      {
        name: String,
        use: String,
        dosage: String,
        imageUrl: String,
      },
    ],
    yogaAsana: [
      {
        name: String,
        benefit: String,
        youtubeQuery: String,
        videoUrl: String,
      },
    ],
    savedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  },
);

const AyushConsultation =
  mongoose.models.AyushConsultation ||
  mongoose.model("AyushConsultation", AyushConsultationSchema);
export default AyushConsultation;
