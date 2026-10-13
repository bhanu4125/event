import mongoose from 'mongoose';

const eventAuditLogSchema = new mongoose.Schema(
  {
    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      required: true,
      index: true,
    },
    action: {
      type: String,
      required: true,
    },
    previousStatus: {
      type: String,
      default: '',
    },
    newStatus: {
      type: String,
      required: true,
    },
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    comments: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

const EventAuditLog = mongoose.model('EventAuditLog', eventAuditLogSchema);
export default EventAuditLog;
