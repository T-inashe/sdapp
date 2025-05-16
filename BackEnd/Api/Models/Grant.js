import mongoose from 'mongoose';

const grantSchema = new mongoose.Schema({
  grantTitle: {
    type: String,
    required: true,
  },
  funder: {
    type: String,
    required: true,
  },
  awarded: {
    type: Number,
    required: true,
  },
  spent: {
    type: Number,
    required: true,
    default: 0,
  },
  remaining: {
    type: Number,
    required: true,
    default: function () {
      return this.awarded - this.spent;
    },
  },
  endDate: {
    type: Date,
    required: true,
  },
  researcher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // assuming 'User' is the researcher model
    required: true,
  },
  status: {
    type: Boolean,
    default: true,
  },
}, { timestamps: true });

// Recalculate remaining before saving
grantSchema.pre('save', function (next) {
  this.remaining = this.awarded - this.spent;
  next();
});

const Grant = mongoose.model('Grant', grantSchema);
export default Grant;
