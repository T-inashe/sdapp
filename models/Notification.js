const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  user_email: { type: String, required: true },
  message: { type: String, required: true },
  type: { type: String, enum: ['invitation', 'acceptance', 'match', 'other'], default: 'other' },
  related_id: { type: mongoose.Schema.Types.ObjectId, default: null },
  read: { type: Boolean, default: false },
  created_at: { type: Date, default: Date.now }
});

module.exports = mongoose.models.Notification || mongoose.model('Notification', notificationSchema);
