import mongoose from 'mongoose';

const teamMemberSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    role: {
      type: String,
      default: 'Member',
      trim: true,
    },
    joinedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const teamSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Team name is required'],
      trim: true,
      maxlength: [80, 'Team name cannot exceed 80 characters'],
    },
    description: {
      type: String,
      trim: true,
      default: '',
      maxlength: [300, 'Description cannot exceed 300 characters'],
    },
    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      required: true,
      index: true,
    },
    leader: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    members: [teamMemberSchema],
    requiredSkills: {
      type: [String],
      default: [],
    },
    openRoles: {
      type: [String],
      default: [],
    },
    isPublicRecruiting: {
      type: Boolean,
      default: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['forming', 'ready', 'registered', 'disbanded'],
      default: 'forming',
      index: true,
    },
    registration: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Registration',
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to facilitate searching by event & recruitment status
teamSchema.index({ event: 1, isPublicRecruiting: 1 });

const Team = mongoose.model('Team', teamSchema);
export default Team;
