import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: [
        'event_submitted',
        'event_approved',
        'event_rejected',
        'changes_requested',
        'event_resubmitted',
        'event_published',
        'event_cancelled',
        'team_invitation',
        'invitation_accepted',
        'invitation_rejected',
        'join_request',
        'join_request_accepted',
        'join_request_rejected',
        'team_registered',
        'registration_confirmed',
        'registration_rejected',
        'member_removed',
        'leadership_transferred',
        'system',
      ],
      default: 'system',
    },
    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
    },
    isRead: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

const Notification = mongoose.model('Notification', notificationSchema);
export default Notification;
