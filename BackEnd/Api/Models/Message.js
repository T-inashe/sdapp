import mongoose from 'mongoose';

const MessageSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  receiver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
  },  
  file: {
    data: {
      type: Buffer, 
    },
    contentType: {
      type: String, 
    },
    originalName: {
      type: String, 
    },
  },
  content: {
    type: String,
    required: [true, 'Message content is required'],
  },
  read: {
    type: Boolean,
    default: false,
  },
  delivered: {
    type: Boolean,
    default: false, 
  },
}, { timestamps: true });

const Message = mongoose.model('Message', MessageSchema);

export default Message;
