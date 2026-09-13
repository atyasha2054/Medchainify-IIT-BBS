import mongoose from "mongoose";

const PrescriptionSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
  },
  patientDetails: {
    name: String,
    age: String,
    gender: String,
    other: String,
    temperature: String,
    bloodPressure: String,
  },
  doctorDetails: {
    name: String,
    specialization: String,
    hospital: String,
    contact: String,
  },
  diagnosis: String,
  medicines: [
    {
      name: String,
      composition: String,
      frequency: String,
      mealRelation: String,
      mealTime: String,
      useCase: String,
      sideEffects: String,
      precautions: String,
    },
  ],
  labTests: [
    {
      name: String,
      description: String,
    },
  ],
  nextVisit: String,
  specialCare: String,
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.models.Prescription ||
  mongoose.model("Prescription", PrescriptionSchema);
