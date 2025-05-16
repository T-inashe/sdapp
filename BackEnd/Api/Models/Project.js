import mongoose from 'mongoose';

const ResearchProjectSchema = new mongoose.Schema(
  {
    creator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User', 
      required: [true, 'Creator is required'],
    },
    title: {
      type: String,
      required: [true, 'Project title is required'],
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
    },
    research_goals: {
      type: String,
      required: [true, 'Research goals are required'],
    },
    research_area: {
      type: String,
      required: [true, 'Research area is required'],
    },
    start_date: {
      type: Date,
      required: [true, 'Start date is required'],
    },
    end_date: {
      type: Date,
      required: [true, 'End date is required'],
    },
    funding_available: {
      type: Boolean,
      default: false,
    },
    funding_amount: {
      type: Number,
      default: null,
    },
    file: {
      data: {
        type: Buffer, 
        required: true,
      },
      contentType: {
        type: String, 
        required: true,
      },
      originalName: {
        type: String, 
        required: true,
      },
    },
    collaborators_needed: {
      type: Boolean,
      default: false,
    },
    collaborator_roles: {
      type: String,
      default: null,
    },
    institution: {
      type: String,
      default: null,
    },
    contact_email: {
      type: String,
      default: null,
    },
    funder: {
      type: String,
      default:"No funder available"
    },
    awarded: {
      type: Number,
      default: 0,
    },
    spent: {
      type: Number,
      required: true,
      default: 0,
    },
    remaining: {
    type: Number,
    default: 0,
  },
    status: {
      type: String,
      enum: ['Active', 'Pending Collab', 'Declined', 'Active Collab',"Cancelled"], 
      default: 'Active',
    },
    fundstatus: {
      type: String,
      enum: ['Active',"Expired","Low Funds","Out Of Funds"], 
      default: 'Active',
    },
    collaborators: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],

  },
  { timestamps: { createdAt: 'created_at', updatedAt: false } }
);

const ResearchProject = mongoose.model('ResearchProject', ResearchProjectSchema);

export default ResearchProject;
