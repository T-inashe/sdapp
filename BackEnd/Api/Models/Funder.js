import mongoose from 'mongoose';

const funderSchema = new mongoose.Schema({
  projectId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'ResearchProject',
          required: true,
      }, 
  funder: {
    type: String,
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  endDate: {
    type: Date,
    required: true,
  },
  status: {
    type: Boolean,
    default: true,
  }
}, { timestamps: true });

const Funder = mongoose.model('Funder', funderSchema);
export default Funder;
