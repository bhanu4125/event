import mongoose from 'mongoose';

const joinRequestSchema = new mongoose.Schema(
  {
    team: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Team',
      required: true,
      index: true,
    },
    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      required: true,
      index: true,
    },
    applicant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    message: {
      type: String,
      default: '',
      trim: true,
    },
    desiredRole: {
      type: String,
      default: 'Member',
      trim: true,
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected', 'cancelled'],
      default: 'pending',
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Prevent multiple pending requests from the same applicant to the same team
joinRequestSchema.index({ team: 1, applicant: 1, status: 1 });

const JoinRequest = mongoose.model('JoinRequest', joinRequestSchema);
export default JoinRequest;
