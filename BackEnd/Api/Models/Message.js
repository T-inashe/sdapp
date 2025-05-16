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
    required: true,
  },
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
<<<<<<< HEAD
    required: true,
  },  
=======
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
>>>>>>> 4482fc85418b87cede89550053f57f8b0c389c45
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
