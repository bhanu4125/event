import Event, { EVENT_CATEGORIES, EVENT_STATUSES } from '../models/Event.js';
import EventAuditLog from '../models/EventAuditLog.js';
import Notification from '../models/Notification.js';
import User from '../models/User.js';

// Helper: create audit log
const recordAudit = async ({ eventId, action, previousStatus, newStatus, userId, comments = '' }) => {
  try {
    await EventAuditLog.create({
      event: eventId,
      action,
      previousStatus: previousStatus || '',
      newStatus,
      performedBy: userId,
      comments,
    });
  } catch (err) {
    console.error('Audit log error:', err.message);
  }
};

// Helper: send notification
const notify = async ({ recipientId, senderId, title, message, type, eventId }) => {
  try {
    await Notification.create({
      recipient: recipientId,
      sender: senderId,
      title,
      message,
      type,
      event: eventId,
    });
  } catch (err) {
    console.error('Notification creation error:', err.message);
  }
};

// Helper: notify all admins
const notifyAdmins = async ({ senderId, title, message, type, eventId }) => {
  try {
    const admins = await User.find({ role: 'admin' });
    for (const admin of admins) {
      await Notification.create({
        recipient: admin._id,
        sender: senderId,
        title,
        message,
        type,
        event: eventId,
      });
    }
  } catch (err) {
    console.error('Notify admins error:', err.message);
  }
};

// 1. Create an Event (as Draft or directly Pending Approval)
export const createEvent = async (req, res) => {
  try {
    const {
      title,
      shortDescription,
      detailedDescription,
      category,
      posterUrl,
      venue,
      eventDate,
      startTime,
      endTime,
      registrationStartDate,
      registrationDeadline,
      maxCapacity,
      eventType,
      minTeamSize,
      maxTeamSize,
      eligibilityCriteria,
      departmentRestrictions,
      academicYearRestrictions,
      isPaid,
      registrationFee,
      rules,
      contactInfo,
      submitDirectly, // boolean: submit directly for approval
    } = req.body;

    // Basic Validation
    if (!title || !shortDescription || !detailedDescription || !venue || !eventDate || !startTime || !endTime) {
      return res.status(400).json({
        success: false,
        message: 'Please fill in all core event information (Title, Descriptions, Venue, Dates, Times)',
      });
    }

    if (!contactInfo || !contactInfo.name || !contactInfo.email || !contactInfo.phone) {
      return res.status(400).json({
        success: false,
        message: 'Contact person information (Name, Email, Phone) is required',
      });
    }

    if (category && !EVENT_CATEGORIES.includes(category)) {
      return res.status(400).json({
        success: false,
        message: `Invalid category. Must be one of: ${EVENT_CATEGORIES.join(', ')}`,
      });
    }

    const initialStatus = submitDirectly ? 'pending_approval' : 'draft';

    const event = await Event.create({
      title,
      shortDescription,
      detailedDescription,
      category: category || 'Technical',
      posterUrl: posterUrl || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&auto=format&fit=crop&q=80',
      venue,
      eventDate,
      startTime,
      endTime,
      registrationStartDate: registrationStartDate || new Date(),
      registrationDeadline: registrationDeadline || eventDate,
      maxCapacity: Number(maxCapacity) || 100,
      eventType: eventType || 'Individual',
      minTeamSize: Number(minTeamSize) || 1,
      maxTeamSize: Number(maxTeamSize) || 1,
      eligibilityCriteria: eligibilityCriteria || 'Open to all registered students',
      departmentRestrictions: departmentRestrictions?.length ? departmentRestrictions : ['All Departments'],
      academicYearRestrictions: academicYearRestrictions?.length ? academicYearRestrictions : ['All Years'],
      isPaid: Boolean(isPaid),
      registrationFee: isPaid ? Number(registrationFee) || 0 : 0,
      rules: rules || 'Follow campus code of conduct.',
      contactInfo,
      status: initialStatus,
      organizer: req.user._id,
      submissionDate: submitDirectly ? new Date() : null,
    });

    // Record Audit Log
    await recordAudit({
      eventId: event._id,
      action: submitDirectly ? 'submitted_on_creation' : 'created_as_draft',
      previousStatus: '',
      newStatus: initialStatus,
      userId: req.user._id,
      comments: submitDirectly ? 'Created and submitted for administrative approval' : 'Saved as draft',
    });

    if (submitDirectly) {
      await notifyAdmins({
        senderId: req.user._id,
        title: 'New Event Pending Approval',
        message: `Event "${event.title}" has been submitted for approval by ${req.user.name}.`,
        type: 'event_submitted',
        eventId: event._id,
      });
    }

    res.status(201).json({
      success: true,
      message: submitDirectly ? 'Event submitted for approval successfully!' : 'Event draft saved successfully!',
      data: event,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 2. Update an Event (Organizer only, if draft, changes_requested, or pending_approval)
export const updateEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    // Security Check: Only organizer or admin
    if (event.organizer.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You can only edit events you organized',
      });
    }

    // Organizers cannot edit approved, published, or completed events directly without admin reset
    if (
      req.user.role !== 'admin' &&
      !['draft', 'changes_requested', 'pending_approval', 'rejected'].includes(event.status)
    ) {
      return res.status(400).json({
        success: false,
        message: `Cannot edit event while in status '${event.status}'. Contact an administrator.`,
      });
    }

    const previousStatus = event.status;
    const allowedUpdates = [
      'title',
      'shortDescription',
      'detailedDescription',
      'category',
      'posterUrl',
      'venue',
      'eventDate',
      'startTime',
      'endTime',
      'registrationStartDate',
      'registrationDeadline',
      'maxCapacity',
      'eventType',
      'minTeamSize',
      'maxTeamSize',
      'eligibilityCriteria',
      'departmentRestrictions',
      'academicYearRestrictions',
      'isPaid',
      'registrationFee',
      'rules',
      'contactInfo',
    ];

    allowedUpdates.forEach((field) => {
      if (req.body[field] !== undefined) {
        event[field] = req.body[field];
      }
    });

    await event.save();

    await recordAudit({
      eventId: event._id,
      action: 'event_updated',
      previousStatus,
      newStatus: event.status,
      userId: req.user._id,
      comments: 'Event details updated by organizer',
    });

    res.json({
      success: true,
      message: 'Event updated successfully',
      data: event,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 3. Submit Event for Approval (Organizer: Draft or Changes Requested -> Pending Approval)
export const submitForApproval = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    // Security Check
    if (event.organizer.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to submit this event' });
    }

    // Transition validation
    if (!['draft', 'changes_requested', 'rejected'].includes(event.status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot submit event from status '${event.status}'. Valid source statuses: Draft, Changes Requested, Rejected.`,
      });
    }

    // Strict validation of mandatory fields before submission
    if (!event.title || !event.shortDescription || !event.venue || !event.eventDate || !event.contactInfo?.email) {
      return res.status(400).json({
        success: false,
        message: 'Event is missing essential details. Please complete all required fields before submission.',
      });
    }

    const previousStatus = event.status;
    const isResubmission = previousStatus === 'changes_requested' || previousStatus === 'rejected';

    event.status = 'pending_approval';
    event.submissionDate = new Date();
    await event.save();

    // Audit Log
    await recordAudit({
      eventId: event._id,
      action: isResubmission ? 'resubmitted_for_approval' : 'submitted_for_approval',
      previousStatus,
      newStatus: 'pending_approval',
      userId: req.user._id,
      comments: req.body.comments || (isResubmission ? 'Resubmitted with modifications' : 'Submitted for review'),
    });

    // Notify Administrators
    await notifyAdmins({
      senderId: req.user._id,
      title: isResubmission ? 'Event Resubmitted for Approval' : 'New Event Pending Approval',
      message: `Organizer ${req.user.name} has ${isResubmission ? 'resubmitted' : 'submitted'} event "${event.title}".`,
      type: isResubmission ? 'event_resubmitted' : 'event_submitted',
      eventId: event._id,
    });

    res.json({
      success: true,
      message: isResubmission ? 'Event resubmitted for approval successfully!' : 'Event submitted for approval successfully!',
      data: event,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 4. Admin: Approve Event (Pending Approval -> Approved)
export const approveEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    if (event.status !== 'pending_approval') {
      return res.status(400).json({
        success: false,
        message: `Cannot approve event from status '${event.status}'. Event must be 'pending_approval'.`,
      });
    }

    const previousStatus = event.status;
    event.status = 'approved';
    event.approvedAt = new Date();
    event.adminFeedback = req.body.comments || 'Approved by campus administration';
    await event.save();

    // Audit Log
    await recordAudit({
      eventId: event._id,
      action: 'event_approved',
      previousStatus,
      newStatus: 'approved',
      userId: req.user._id,
      comments: req.body.comments || 'Event verified and approved',
    });

    // Notify Organizer
    await notify({
      recipientId: event.organizer,
      senderId: req.user._id,
      title: 'Congratulations! Event Approved',
      message: `Your event "${event.title}" has been approved by the administrator. You may now publish it.`,
      type: 'event_approved',
      eventId: event._id,
    });

    res.json({
      success: true,
      message: 'Event has been successfully approved!',
      data: event,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 5. Admin: Reject Event (Pending Approval -> Rejected, requires mandatory reason)
export const rejectEvent = async (req, res) => {
  try {
    const { reason } = req.body;

    if (!reason || !reason.trim()) {
      return res.status(400).json({
        success: false,
        message: 'A mandatory rejection reason is required to reject an event.',
      });
    }

    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    if (event.status !== 'pending_approval') {
      return res.status(400).json({
        success: false,
        message: `Cannot reject event from status '${event.status}'. Event must be 'pending_approval'.`,
      });
    }

    const previousStatus = event.status;
    event.status = 'rejected';
    event.rejectionReason = reason.trim();
    event.adminFeedback = reason.trim();
    await event.save();

    // Audit Log
    await recordAudit({
      eventId: event._id,
      action: 'event_rejected',
      previousStatus,
      newStatus: 'rejected',
      userId: req.user._id,
      comments: `Rejection Reason: ${reason.trim()}`,
    });

    // Notify Organizer
    await notify({
      recipientId: event.organizer,
      senderId: req.user._id,
      title: 'Event Submission Rejected',
      message: `Your event "${event.title}" was rejected. Reason: ${reason.trim()}`,
      type: 'event_rejected',
      eventId: event._id,
    });

    res.json({
      success: true,
      message: 'Event submission was rejected.',
      data: event,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 6. Admin: Request Modifications / Changes (Pending Approval -> Changes Requested)
export const requestChanges = async (req, res) => {
  try {
    const { comments } = req.body;

    if (!comments || !comments.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Please provide detailed comments describing the requested changes.',
      });
    }

    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    if (event.status !== 'pending_approval') {
      return res.status(400).json({
        success: false,
        message: `Cannot request changes for event in status '${event.status}'. Must be 'pending_approval'.`,
      });
    }

    const previousStatus = event.status;
    event.status = 'changes_requested';
    event.adminFeedback = comments.trim();
    await event.save();

    // Audit Log
    await recordAudit({
      eventId: event._id,
      action: 'changes_requested',
      previousStatus,
      newStatus: 'changes_requested',
      userId: req.user._id,
      comments: `Admin Requested Changes: ${comments.trim()}`,
    });

    // Notify Organizer
    await notify({
      recipientId: event.organizer,
      senderId: req.user._id,
      title: 'Modifications Requested for Event',
      message: `The administrator has requested changes for "${event.title}": "${comments.trim()}"`,
      type: 'changes_requested',
      eventId: event._id,
    });

    res.json({
      success: true,
      message: 'Modification request sent to organizer.',
      data: event,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 7. Publish Event (Organizer: Approved -> Published)
export const publishEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    // Security Check: Only organizer or admin
    if (event.organizer.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to publish this event' });
    }

    // Critical Rule: An organizer should NOT be able to publish an event before it has been approved
    if (event.status !== 'approved') {
      return res.status(400).json({
        success: false,
        message: `Event cannot be published from '${event.status}'. Only 'approved' events can be published!`,
      });
    }

    const previousStatus = event.status;
    event.status = 'published';
    event.publishedAt = new Date();
    await event.save();

    // Audit Log
    await recordAudit({
      eventId: event._id,
      action: 'event_published',
      previousStatus,
      newStatus: 'published',
      userId: req.user._id,
      comments: 'Event officially published for public campus view',
    });

    // Notify in-app
    await notify({
      recipientId: event.organizer,
      senderId: req.user._id,
      title: 'Event Published Live!',
      message: `Your event "${event.title}" is now visible to all students on campus.`,
      type: 'event_published',
      eventId: event._id,
    });

    res.json({
      success: true,
      message: 'Event published successfully! It is now live for students.',
      data: event,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 8. Cancel Event (Organizer or Admin: Approved / Published -> Cancelled)
export const cancelEvent = async (req, res) => {
  try {
    const { reason } = req.body;
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    // Security check
    if (event.organizer.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to cancel this event' });
    }

    if (['draft', 'cancelled', 'completed'].includes(event.status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot cancel an event that is already in '${event.status}' state.`,
      });
    }

    const previousStatus = event.status;
    event.status = 'cancelled';
    event.cancelledAt = new Date();
    event.cancellationReason = reason || 'Cancelled by organizer / administrator';
    await event.save();

    // Audit Log
    await recordAudit({
      eventId: event._id,
      action: 'event_cancelled',
      previousStatus,
      newStatus: 'cancelled',
      userId: req.user._id,
      comments: `Cancellation Reason: ${event.cancellationReason}`,
    });

    // Notify organizer if cancelled by admin, or notify admins if cancelled by organizer
    if (req.user.role === 'admin' && event.organizer.toString() !== req.user._id.toString()) {
      await notify({
        recipientId: event.organizer,
        senderId: req.user._id,
        title: 'Event Cancelled by Administration',
        message: `Event "${event.title}" has been cancelled. Reason: ${event.cancellationReason}`,
        type: 'event_cancelled',
        eventId: event._id,
      });
    } else {
      await notifyAdmins({
        senderId: req.user._id,
        title: 'Event Cancelled by Organizer',
        message: `Event "${event.title}" was cancelled by ${req.user.name}.`,
        type: 'event_cancelled',
        eventId: event._id,
      });
    }

    res.json({
      success: true,
      message: 'Event has been cancelled',
      data: event,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 9. Public Events (Only 'published' or 'cancelled' status for campus directory)
export const getPublicEvents = async (req, res) => {
  try {
    const { category, search, department } = req.query;

    // Strict Backend Rule: Students should see only published events (or cancelled with clear indicator).
    // Draft, pending, rejected, changes_requested MUST NEVER appear in public listings!
    const query = {
      status: { $in: ['published', 'cancelled'] },
    };

    if (category && category !== 'All') {
      query.category = category;
    }

    if (department && department !== 'All') {
      query.departmentRestrictions = { $in: ['All Departments', department] };
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { shortDescription: { $regex: search, $options: 'i' } },
        { venue: { $regex: search, $options: 'i' } },
      ];
    }

    const events = await Event.find(query)
      .populate('organizer', 'name email department')
      .sort({ eventDate: 1 });

    res.json({
      success: true,
      count: events.length,
      data: events,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 10. Organizer Events (Retrieves events owned by the authenticated organizer)
export const getOrganizerEvents = async (req, res) => {
  try {
    const { status, search, category } = req.query;

    const query = { organizer: req.user._id };

    if (status && status !== 'All') {
      query.status = status;
    }

    if (category && category !== 'All') {
      query.category = category;
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { shortDescription: { $regex: search, $options: 'i' } },
        { venue: { $regex: search, $options: 'i' } },
      ];
    }

    const events = await Event.find(query).sort({ updatedAt: -1 });

    // Calculate summary statistics
    const stats = {
      total: await Event.countDocuments({ organizer: req.user._id }),
      draft: await Event.countDocuments({ organizer: req.user._id, status: 'draft' }),
      pending: await Event.countDocuments({ organizer: req.user._id, status: 'pending_approval' }),
      changesRequested: await Event.countDocuments({ organizer: req.user._id, status: 'changes_requested' }),
      approved: await Event.countDocuments({ organizer: req.user._id, status: 'approved' }),
      published: await Event.countDocuments({ organizer: req.user._id, status: 'published' }),
      rejected: await Event.countDocuments({ organizer: req.user._id, status: 'rejected' }),
      totalRegistrations: events.reduce((acc, curr) => acc + (curr.currentRegistrations || 0), 0),
    };

    res.json({
      success: true,
      stats,
      count: events.length,
      data: events,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 11. Admin Events (Approval management queue)
export const getAdminEvents = async (req, res) => {
  try {
    const { status, search, category } = req.query;

    const query = {};

    if (status && status !== 'All') {
      query.status = status;
    }

    if (category && category !== 'All') {
      query.category = category;
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { shortDescription: { $regex: search, $options: 'i' } },
        { venue: { $regex: search, $options: 'i' } },
      ];
    }

    const events = await Event.find(query)
      .populate('organizer', 'name email department phone')
      .sort({ updatedAt: -1 });

    const stats = {
      total: await Event.countDocuments(),
      pending: await Event.countDocuments({ status: 'pending_approval' }),
      changesRequested: await Event.countDocuments({ status: 'changes_requested' }),
      approved: await Event.countDocuments({ status: 'approved' }),
      published: await Event.countDocuments({ status: 'published' }),
      rejected: await Event.countDocuments({ status: 'rejected' }),
      draft: await Event.countDocuments({ status: 'draft' }),
    };

    res.json({
      success: true,
      stats,
      count: events.length,
      data: events,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 12. Get Event Details by ID
export const getEventById = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id).populate('organizer', 'name email department phone avatar');

    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    // Permission Check:
    // If user is guest/student, they can only view 'published' or 'cancelled' events
    const isOwner = req.user && event.organizer._id.toString() === req.user._id.toString();
    const isAdmin = req.user && req.user.role === 'admin';

    if (!isOwner && !isAdmin && !['published', 'cancelled'].includes(event.status)) {
      return res.status(403).json({
        success: false,
        message: 'This event has not been approved and published yet.',
      });
    }

    res.json({
      success: true,
      data: event,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 13. Get Audit History for an Event
export const getEventAuditLogs = async (req, res) => {
  try {
    const logs = await EventAuditLog.find({ event: req.params.id })
      .populate('performedBy', 'name email role')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: logs.length,
      data: logs,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
