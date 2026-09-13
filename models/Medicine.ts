import mongoose from "mongoose";

const MedicineSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    "price(₹)": {
      type: String,
    },
    Is_discontinued: {
      type: String,
    },
    manufacturer_name: {
      type: String,
    },
    type: {
      type: String,
    },
    pack_size_label: {
      type: String,
    },
    short_composition1: {
      type: String,
    },
    short_composition2: {
      type: String,
    },
  },
  {
    timestamps: true,
  },
);

// Explicitly specify collection name if needed, though Mongoose usually pluralizes
const Medicine =
  mongoose.models.Medicine ||
  mongoose.model("Medicine", MedicineSchema, "medicines");
export default Medicine;
