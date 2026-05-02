// Structure for the problems collection

const mongoose = require("mongoose");

const problemSchema = new mongoose.Schema(
  {
    // required: field must be present or Mongoose throws
    question: { type: String, required: true },

    // required: solved explanation from the AI
    solution: { type: String, required: true },
  },
  {
    versionKey: false, // hides the __v field from output
    timestamps: true,  // adds createdAt and updatedAt automatically
  }
);

// "Problem" → lowercase → pluralize → "problems" collection
const Problem = mongoose.model("Problem", problemSchema);

module.exports = Problem;