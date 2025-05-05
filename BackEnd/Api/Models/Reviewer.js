import mongoose from 'mongoose';

const evaluationSchema = new mongoose.Schema({
  scientific_merit: { type: Number, min: 1, max: 5, required: true },
  methodology: { type: Number, min: 1, max: 5, required: true },
  feasibility: { type: Number, min: 1, max: 5, required: true },
  impact: { type: Number, min: 1, max: 5, required: true },
  comments: { type: String, required: true },
  recommendation: {
    type: String,
    enum: ['Approve', 'Reject', 'Revise'],
  }
}, { _id: false }); // Optional: Disable _id for subdocument

const reviewSchema = new mongoose.Schema({
  reviewer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', 
    required: [true, 'Reviewer is required'],
  },
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', 
    required: [true, 'Creator is required'],
  },
  project_title: {
    type: String,
    required: [true, 'Project title is required'],
  },
  research_area: {
    type: String,
    required: [true, 'Research area is required'],
  },
  start_date: {
    type: Date,
    required: [true, 'Start date is required'],
  },
  end_date: {
    type: Date,
    required: [true, 'End date is required'],
  },
  institution: {
    type: String,
    default: null,
  },
  status: {
    type: String,
    enum: ['Active', 'Pending Collab', 'Declined', 'Active Collab',"Cancelled"], 
    default: 'Pending',
  },
  feedback: {
    type: String,
    enum: ['Approved', 'Rejected', 'Revisions Requested', 'Pending'], 
    default: 'Pending',
  },
  assigned: {
    type: Boolean,
    default: true,
  },
  evaluation: evaluationSchema, 
}, { timestamps: true });

const Reviewer = mongoose.model('Reviewer', reviewSchema);
export default Reviewer;
