import mongoose from "mongoose";

const BillSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
  },
  patientDetails: {
    name: String,
    id: String,
    admissionDate: String,
    dischargeDate: String,
  },
  hospitalDetails: {
    name: String,
    address: String,
    contact: String,
    registrationId: String,
  },
  items: [
    {
      description: String,
      quantity: Number,
      unitPrice: Number,
      total: Number,
      isShady: Boolean,
      severity: {
        type: String,
        enum: ["Low", "Medium", "High"],
        default: "Low",
      },
      shadyReason: String,
      forensicAnalysis: String,
    },
  ],
  financials: {
    subtotal: Number,
    taxes: [
      {
        name: String,
        amount: Number,
      },
    ],
    totalAmount: Number,
    discount: Number,
    netAmount: Number,
  },
  analysis: {
    transparencyScore: Number,
    overallAssessment: String,
    shadyChargesCount: Number,
    costComparisonNote: String, // Comparison with Indian cost reports
  },
  legalAction: {
    legislature: [String],
    steps: [String],
    policyReferences: [String], // References to Indian Healthcare policies/Budget
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.models.Bill || mongoose.model("Bill", BillSchema);
