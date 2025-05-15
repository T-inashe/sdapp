const mongoose = require("mongoose");

const MilestoneSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: false },
  expectedCompletion: { type: Date, required: true },
  status: { 
    type: String, 
    enum: ["Not Started", "In Progress", "Completed"], 
    default: "Not Started" 
  },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: "Project", required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Milestone", MilestoneSchema);