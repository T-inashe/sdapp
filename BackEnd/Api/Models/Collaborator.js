import mongoose from 'mongoose';

const CollaboratorInviteSchema = new mongoose.Schema({
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ResearchProject',
    required: [true, 'Project reference is required'],
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Sender is required'],
  },
  receiver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Receiver is required'],
  },
  message: {
    type: String,
    default: '',
  },
  status: {
    type: String,
    enum: ['Pending', 'Accepted', 'Declined'],
    default: 'Pending',
  },
   type: { 
    type: String,
    enum: ['invite', 'application'], 
    required: true },
  respondedAt: {
    type: Date,
    default: null,
  }
}, { timestamps: true });

const CollaboratorInvite = mongoose.model('CollaboratorInvite', CollaboratorInviteSchema);

export default CollaboratorInvite;
