import bcrypt from 'bcrypt';
import mongoose from 'mongoose';


const userSchema = new mongoose.Schema({
  googleId: {
    type: String,
    required: true,
    unique: true,
  },
  role: {
    type: String,
    enum: ['Researcher', 'Reviewer','Admin'],
    required: false,
  },
  fname: {
    type: String,
    required: true,
  },
  lname: {
    type: String,
    required: true,
  },
  academicrole: {
    type: String,
    enum: ['Student', 'Lecturer','Academic Researcher'],
    required: false,
  },
  contact: {
    type: String,
    required: false,
  },
  department: {
    type: String,
    required: false,
  },
  researcharea: {
    type: String,
    required: false,
  },
  researchExperience: {
    type: String,
    enum: ['Bachelor', 'Honours','Masters','PhD'],
    required: false,
  },
  
  status: {
    type: Boolean,
    default: true,
  },
}, { timestamps: true }); 

// Middleware to hash password before saving
userSchema.pre('save', async function (next) {
  if (this.isModified('password')&& this.password) {
    this.password = await bcrypt.hash(this.password, 10);
  }
});


const User = mongoose.model('User', userSchema);
export default User;
