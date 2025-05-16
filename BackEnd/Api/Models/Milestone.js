// models/milestone.js
import mongoose from 'mongoose';
const milestoneSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
    },
    status: {
      type: String,
      enum: ["not started", "in progress", "completed"],
      default: "not started",
    },
    assignedTo: {
      type: String,
      required:true
    },
    dueDate: {
    type: Date,
    required: true,
  },
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
    },
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt fields
  }
);
const Milestone = mongoose.model('Milestone', milestoneSchema);

export default Milestone;