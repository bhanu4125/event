import mongoose from 'mongoose';

const registrationSchema = new mongoose.Schema(
  {
    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      required: true,
      index: true,
    },
    registrationType: {
      type: String,
      enum: ['individual', 'team'],
      required: true,
    },
    participant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    team: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Team',
      index: true,
    },
    leader: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    teamMembers: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        name: String,
        email: String,
        role: String,
      },
    ],
    status: {
      type: String,
      enum: ['draft', 'pending', 'confirmed', 'rejected', 'waitlisted', 'cancelled'],
      default: 'confirmed',
      index: true,
    },
    organizerNotes: {
      type: String,
      default: '',
    },
    registeredAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Prevent duplicate active registrations for the same user or team in an event
registrationSchema.index(
  { event: 1, participant: 1 },
  { unique: true, partialFilterExpression: { participant: { $exists: true } } }
);
registrationSchema.index(
  { event: 1, team: 1 },
  { unique: true, partialFilterExpression: { team: { $exists: true } } }
);

const Registration = mongoose.model('Registration', registrationSchema);
export default Registration;
