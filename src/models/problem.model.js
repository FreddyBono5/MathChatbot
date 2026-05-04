
const mongoose = require("mongoose");
const problemSchema = new mongoose.Schema(
  {
   
    question: { type: String, required: true },

    solution: { type: String, required: true },
  },
  {
    versionKey: false, 
    timestamps: true,  
  }
);

const Problem = mongoose.model("Problem", problemSchema);

module.exports = Problem;