import mongoose from 'mongoose';

const NotificationSchema = new mongoose.Schema({
  message: {
    type: String,
    required: [true, 'Notification message is required'],
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User reference is required'],
  },
  read: {
    type: Boolean,
    default: false,
  },
  type: {
    type: String,
    enum: ['booking', 'message', 'reminder', 'success',"InviteDeclined","AssignedReview","Invite"], // customize as needed
    default: 'message',
>>>>>>> 4482fc85418b87cede89550053f57f8b0c389c45
  },
  date: {
    type: Date,
    default: Date.now,
  },
}, { timestamps: true });

const Notification = mongoose.model('Notification', NotificationSchema);

export default Notification;
