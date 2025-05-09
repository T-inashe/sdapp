import mongoose from 'mongoose';

const CollaboratorSchema = new mongoose.Schema({
  project_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project', // assuming you have a Project model
    required: [true, 'Project ID is required'],
  },
  collaborator_email: {
    type: String,
    required: [true, 'Collaborator email is required'],
    match: [/.+\@.+\..+/, 'Please enter a valid email address'],
  },
  role: {
    type: String,
    default: 'Collaborator',
    enum: ['Researcher', 'Admin', 'Viewer'], // customize roles if needed
  },
  status: {
    type: String,
    default: 'Active',
    enum: ['Active', 'Inactive', 'Pending'], // customize statuses if needed
  },
  joined_at: {
    type: Date,
    default: Date.now,
  },
}, { timestamps: true });

const Collaborator = mongoose.model('Collaborator', CollaboratorSchema);

export default Collaborator;
