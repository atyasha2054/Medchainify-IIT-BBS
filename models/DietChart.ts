import mongoose from "mongoose";

const DietChartSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    userEmail: {
      type: String,
      required: true,
    },
    summary: {
      dailyCaloriesTarget: Number,
      macroRatio: String,
      hydrationGoal: String,
      personalRecommendation: String,
    },
    dietPlan: {
      type: Object,
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

const DietChart =
  mongoose.models.DietChart ||
  mongoose.model("DietChart", DietChartSchema, "diet-chart");
export default DietChart;
