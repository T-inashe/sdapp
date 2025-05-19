import mongoose from 'mongoose';

const expenseSchema = new mongoose.Schema({
  projectId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Project',
        required: true,
    }, 
  description: {
    type: String,
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  date: {
    type: Date,
    required: true,
  },
  category: {
    type: String,
    enum: ['Equipment', 'Personnel', 'Travel', 'Supplies',"Services","Other"],
    default: 'Personnel',
  },
  status: {
    type: Boolean,
    default: true,
  }
}, { timestamps: true });

const Expense = mongoose.model('Expense', expenseSchema);
export default Expense;
