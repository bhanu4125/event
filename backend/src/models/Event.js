import mongoose from 'mongoose';

export const EVENT_STATUSES = [
  'draft',
  'pending_approval',
  'changes_requested',
  'approved',
  'published',
  'rejected',
  'cancelled',
  'completed',
];

export const EVENT_CATEGORIES = [
  'Technical',
  'Cultural',
  'Sports',
  'Academic',
  'Workshop',
  'Hackathon',
  'Other',
];

const eventSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Event title is required'],
      trim: true,
      maxlength: [150, 'Title cannot exceed 150 characters'],
    },
    shortDescription: {
      type: String,
      required: [true, 'Short description is required'],
      trim: true,
      maxlength: [300, 'Short description cannot exceed 300 characters'],
    },
    detailedDescription: {
      type: String,
      required: [true, 'Detailed description is required'],
      trim: true,
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: EVENT_CATEGORIES,
      default: 'Technical',
    },
    posterUrl: {
      type: String,
      default: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&auto=format&fit=crop&q=80',
    },
    venue: {
      type: String,
      required: [true, 'Venue is required'],
      trim: true,
    },
    eventDate: {
      type: Date,
      required: [true, 'Event date is required'],
    },
    startTime: {
      type: String,
      required: [true, 'Start time is required'],
    },
    endTime: {
      type: String,
      required: [true, 'End time is required'],
    },
    registrationStartDate: {
      type: Date,
      required: [true, 'Registration opening date is required'],
    },
    registrationDeadline: {
      type: Date,
      required: [true, 'Registration deadline is required'],
    },
    maxCapacity: {
      type: Number,
      required: [true, 'Maximum participant capacity is required'],
      min: [1, 'Capacity must be at least 1'],
    },
    currentRegistrations: {
      type: Number,
      default: 0,
      min: 0,
    },
    eventType: {
      type: String,
      enum: ['Individual', 'Team'],
      default: 'Individual',
    },
    minTeamSize: {
      type: Number,
      default: 1,
      min: 1,
    },
    maxTeamSize: {
      type: Number,
      default: 1,
      min: 1,
    },
    eligibilityCriteria: {
      type: String,
      default: 'Open to all students with valid college ID',
      trim: true,
    },
    departmentRestrictions: {
      type: [String],
      default: ['All Departments'],
    },
    academicYearRestrictions: {
      type: [String],
      default: ['All Years'],
    },
    isPaid: {
      type: Boolean,
      default: false,
    },
    registrationFee: {
      type: Number,
      default: 0,
      min: 0,
    },
    rules: {
      type: String,
      default: '1. Maintain discipline.\n2. Carry valid college ID card.\n3. Late entries are strictly prohibited.',
    },
    contactInfo: {
      name: { type: String, required: [true, 'Contact person name is required'] },
      email: { type: String, required: [true, 'Contact email is required'] },
      phone: { type: String, required: [true, 'Contact phone is required'] },
    },
    status: {
      type: String,
      enum: EVENT_STATUSES,
      default: 'draft',
      index: true,
    },
    organizer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    adminFeedback: {
      type: String,
      default: '',
    },
    rejectionReason: {
      type: String,
      default: '',
    },
    submissionDate: {
      type: Date,
    },
    approvedAt: {
      type: Date,
    },
    publishedAt: {
      type: Date,
    },
    cancelledAt: {
      type: Date,
    },
    cancellationReason: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

const Event = mongoose.model('Event', eventSchema);
export default Event;
