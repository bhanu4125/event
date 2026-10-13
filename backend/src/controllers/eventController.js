import Event, { EVENT_CATEGORIES, EVENT_STATUSES } from '../models/Event.js';
import EventAuditLog from '../models/EventAuditLog.js';
import Notification from '../models/Notification.js';
import User from '../models/User.js';
import Registration from '../models/Registration.js';
import jwt from 'jsonwebtoken';

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

    let finalMessage = 'Event updated successfully';

    // If submitDirectly is requested (e.g. "Update & Submit" or "Resubmit")
    if (req.body.submitDirectly && ['draft', 'changes_requested', 'rejected', 'pending_approval'].includes(previousStatus)) {
      const isResubmission = previousStatus === 'changes_requested' || previousStatus === 'rejected' || previousStatus === 'pending_approval';
      event.status = 'pending_approval';
      event.submissionDate = new Date();
      await event.save();

      await recordAudit({
        eventId: event._id,
        action: isResubmission ? 'resubmitted_for_approval' : 'submitted_for_approval',
        previousStatus,
        newStatus: 'pending_approval',
        userId: req.user._id,
        comments: req.body.resubmissionComments || (isResubmission ? 'Resubmitted with modifications' : 'Submitted for review'),
      });

      await notifyAdmins({
        senderId: req.user._id,
        title: isResubmission ? 'Event Resubmitted for Approval' : 'New Event Pending Approval',
        message: `Organizer ${req.user.name} has ${isResubmission ? 'resubmitted' : 'submitted'} event "${event.title}".`,
        type: isResubmission ? 'event_resubmitted' : 'event_submitted',
        eventId: event._id,
      });

      finalMessage = isResubmission ? 'Event updated and resubmitted for approval successfully!' : 'Event submitted for approval successfully!';
    } else {
      await recordAudit({
        eventId: event._id,
        action: 'event_updated',
        previousStatus,
        newStatus: event.status,
        userId: req.user._id,
        comments: 'Event details updated by organizer',
      });
    }

    res.json({
      success: true,
      message: finalMessage,
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

    // Transition validation - allows draft, changes_requested, rejected, and pending_approval
    if (!['draft', 'changes_requested', 'rejected', 'pending_approval'].includes(event.status)) {
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
    const isResubmission = previousStatus === 'changes_requested' || previousStatus === 'rejected' || previousStatus === 'pending_approval';

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
    const commentsText = (req.body.comments || req.body.feedback || '').trim();

    if (!commentsText) {
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
    event.adminFeedback = commentsText;
    await event.save();

    // Audit Log
    await recordAudit({
      eventId: event._id,
      action: 'changes_requested',
      previousStatus,
      newStatus: 'changes_requested',
      userId: req.user._id,
      comments: `Admin Requested Changes: ${commentsText}`,
    });

    // Notify Organizer
    await notify({
      recipientId: event.organizer,
      senderId: req.user._id,
      title: 'Modifications Requested for Event',
      message: `The administrator has requested changes for "${event.title}": "${commentsText}"`,
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

// 9. Public Events (Advanced Search, Filtering, Sorting & Pagination)
export const getPublicEvents = async (req, res) => {
  try {
    const {
      search,
      category,
      department,
      academicYear,
      eventType,
      isPaid,
      isOnline,
      dateFrom,
      dateTo,
      registrationOpenOnly,
      availableSeatsOnly,
      includeCancelled,
      sortBy = 'date_asc',
      page = 1,
      limit = 9,
    } = req.query;

    const now = new Date();
    const query = {};

    // By default, exclude cancelled events from upcoming discover listings unless explicitly requested
    if (includeCancelled === 'true') {
      query.status = { $in: ['published', 'cancelled'] };
    } else {
      query.status = 'published';
    }

    if (category && category !== 'All') {
      query.category = category;
    }

    if (department && department !== 'All') {
      query.departmentRestrictions = { $in: ['All Departments', department] };
    }

    if (academicYear && academicYear !== 'All') {
      query.academicYearRestrictions = { $in: ['All Years', academicYear] };
    }

    if (eventType && eventType !== 'All') {
      query.eventType = eventType;
    }

    if (isPaid !== undefined && isPaid !== 'All') {
      query.isPaid = isPaid === 'true';
    }

    if (isOnline !== undefined && isOnline !== 'All') {
      query.isOnline = isOnline === 'true';
    }

    // Date Range
    if (dateFrom || dateTo) {
      query.eventDate = {};
      if (dateFrom) query.eventDate.$gte = new Date(dateFrom);
      if (dateTo) query.eventDate.$lte = new Date(dateTo);
    }

    // Registration Open
    if (registrationOpenOnly === 'true') {
      query.registrationStartDate = { $lte: now };
      query.registrationDeadline = { $gte: now };
    }

    // Available Seats
    if (availableSeatsOnly === 'true') {
      query.$expr = { $lt: ['$currentRegistrations', '$maxCapacity'] };
    }

    // Text Search
    if (search && search.trim()) {
      const trimmedSearch = search.trim();
      query.$or = [
        { title: { $regex: trimmedSearch, $options: 'i' } },
        { shortDescription: { $regex: trimmedSearch, $options: 'i' } },
        { detailedDescription: { $regex: trimmedSearch, $options: 'i' } },
        { venue: { $regex: trimmedSearch, $options: 'i' } },
      ];
    }

    // Sorting
    let sortOptions = { eventDate: 1 };
    if (sortBy === 'date_desc') sortOptions = { eventDate: -1 };
    else if (sortBy === 'deadline_asc') sortOptions = { registrationDeadline: 1 };
    else if (sortBy === 'popularity') sortOptions = { currentRegistrations: -1 };
    else if (sortBy === 'capacity') sortOptions = { maxCapacity: -1 };

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, parseInt(limit, 10) || 9);
    const skip = (pageNum - 1) * limitNum;

    const total = await Event.countDocuments(query);
    const events = await Event.find(query)
      .populate('organizer', 'name email department phone')
      .sort(sortOptions)
      .skip(skip)
      .limit(limitNum);

    res.json({
      success: true,
      total,
      totalPages: Math.ceil(total / limitNum) || 1,
      currentPage: pageNum,
      count: events.length,
      data: events,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 9b. Rule-Based Personalized Event Recommendations
export const getRecommendedEvents = async (req, res) => {
  try {
    const user = req.user || (await User.findOne({ role: 'student' }));
    const userInterests = user?.interests && user.interests.length > 0
      ? user.interests
      : ['Web Development', 'Artificial Intelligence', 'Hackathons'];

    const userDept = user?.department || 'Computer Science';
    const now = new Date();
    const fourteenDaysFromNow = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);

    // Fetch active published events only
    const events = await Event.find({ status: 'published' })
      .populate('organizer', 'name email department')
      .lean();

    const scoredEvents = events.map((event) => {
      let score = 0;
      const reasons = [];

      // 1. Category / Keyword Interest Match: +40 points
      const hasInterestMatch = userInterests.some((interest) => {
        const lowerInterest = interest.toLowerCase();
        return (
          event.category.toLowerCase().includes(lowerInterest) ||
          event.title.toLowerCase().includes(lowerInterest) ||
          event.shortDescription.toLowerCase().includes(lowerInterest)
        );
      });

      if (hasInterestMatch) {
        score += 40;
        reasons.push('Matches your interests');
      }

      // 2. Registration is Open: +20 points
      const isRegOpen =
        new Date(event.registrationStartDate) <= now &&
        new Date(event.registrationDeadline) >= now;
      if (isRegOpen) {
        score += 20;
        reasons.push('Registration open now');
      }

      // 3. Seats Available: +15 points
      if (event.currentRegistrations < event.maxCapacity) {
        score += 15;
        reasons.push('Seats available');
      }

      // 4. Event Date Approaching (within 14 days): +10 points
      if (new Date(event.eventDate) >= now && new Date(event.eventDate) <= fourteenDaysFromNow) {
        score += 10;
        reasons.push('Happening soon');
      }

      // 5. Department Eligibility Match: +15 points
      const deptMatch =
        event.departmentRestrictions.includes('All Departments') ||
        event.departmentRestrictions.includes(userDept);
      if (deptMatch) {
        score += 15;
        reasons.push('Department eligible');
      }

      return {
        ...event,
        recommendationScore: score,
        matchReasons: reasons,
      };
    });

    // Sort descending by score, tie-breaker: eventDate ascending
    scoredEvents.sort((a, b) => {
      if (b.recommendationScore !== a.recommendationScore) {
        return b.recommendationScore - a.recommendationScore;
      }
      return new Date(a.eventDate) - new Date(b.eventDate);
    });

    res.json({
      success: true,
      count: scoredEvents.length,
      data: scoredEvents.slice(0, 8),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 9c. Event Calendar View
export const getEventsCalendar = async (req, res) => {
  try {
    const { month } = req.query; // format: 'YYYY-MM'
    let startDate;
    let endDate;

    if (month && /^\d{4}-\d{2}$/.test(month)) {
      const [year, m] = month.split('-').map(Number);
      startDate = new Date(year, m - 1, 1);
      endDate = new Date(year, m, 0, 23, 59, 59, 999);
    } else {
      const now = new Date();
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    }

    const events = await Event.find({
      status: 'published',
      eventDate: { $gte: startDate, $lte: endDate },
    })
      .populate('organizer', 'name email department')
      .sort({ eventDate: 1 });

    res.json({
      success: true,
      month: month || `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`,
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
    // Extract user from token if Authorization header is present
    let currentUser = req.user;
    if (!currentUser && req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      try {
        const token = req.headers.authorization.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'eventra_super_secret_jwt_key_2026_xyz');
        currentUser = await User.findById(decoded.id);
      } catch (e) {}
    }

    const isOwner = currentUser && event.organizer && event.organizer._id.toString() === currentUser._id.toString();
    const isAdmin = currentUser && currentUser.role === 'admin';

    // If user is guest/student, they can only view 'published' or 'cancelled' events
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

// 14. Individual Event Registration (Join Event)
export const registerForEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    // Role check: Administrators only govern and approve events; cannot participate
    if (req.user.role === 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Administrators have governance and approval authority only and cannot register as participants in events.',
      });
    }

    if (event.status !== 'published') {
      return res.status(400).json({
        success: false,
        message: `Registration is closed. Event is currently in '${event.status}' status.`,
      });
    }

    // Team events require team formation
    if (event.eventType === 'Team') {
      return res.status(400).json({
        success: false,
        message: 'This is a team-based event. Please create or join a team to register.',
      });
    }

    // Deadline check with end-of-day handling for date-only pickers
    if (event.registrationDeadline) {
      const deadline = new Date(event.registrationDeadline);
      const isMidnight = deadline.getUTCHours() === 0 && deadline.getUTCMinutes() === 0;
      const effectiveDeadline = isMidnight
        ? new Date(deadline.getTime() + 24 * 60 * 60 * 1000 - 1) // 23:59:59.999 of that day
        : deadline;

      if (effectiveDeadline < new Date()) {
        return res.status(400).json({
          success: false,
          message: 'Registration deadline for this event has passed.',
        });
      }
    }

    // Live Capacity check
    if (event.currentRegistrations >= event.maxCapacity) {
      return res.status(400).json({
        success: false,
        message: `Event has reached maximum capacity (${event.maxCapacity} seats). No available seats remaining.`,
      });
    }

    // Check duplicate active registration
    const existingRegistration = await Registration.findOne({
      event: event._id,
      participant: req.user._id,
      status: { $in: ['confirmed', 'pending'] },
    });

    if (existingRegistration) {
      return res.status(400).json({
        success: false,
        message: 'You are already registered for this event.',
      });
    }

    // Create Registration
    const registration = await Registration.create({
      event: event._id,
      registrationType: 'individual',
      participant: req.user._id,
      status: 'confirmed',
      registeredAt: new Date(),
    });

    // Atomically increment currentRegistrations on Event
    const updatedEvent = await Event.findByIdAndUpdate(
      event._id,
      { $inc: { currentRegistrations: 1 } },
      { new: true }
    );

    // Send in-app notification
    await notify({
      recipientId: req.user._id,
      senderId: req.user._id,
      title: 'Registration Confirmed!',
      message: `You have successfully registered for "${event.title}". Venue: ${event.venue || 'Campus Main Venue'}.`,
      type: 'registration_confirmed',
      eventId: event._id,
    });

    res.status(201).json({
      success: true,
      message: 'Successfully registered for the event!',
      data: {
        registrationId: registration._id,
        currentRegistrations: updatedEvent.currentRegistrations,
        maxCapacity: updatedEvent.maxCapacity,
        isRegistered: true,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 15. Cancel Registration (Leave Event)
export const unregisterFromEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    const registration = await Registration.findOne({
      event: event._id,
      participant: req.user._id,
      status: { $in: ['confirmed', 'pending'] },
    });

    if (!registration) {
      return res.status(404).json({
        success: false,
        message: 'No active registration found for this event.',
      });
    }

    registration.status = 'cancelled';
    await registration.save();

    // Decrement currentRegistrations atomically (keep >= 0)
    const newCount = Math.max(0, (event.currentRegistrations || 1) - 1);
    const updatedEvent = await Event.findByIdAndUpdate(
      event._id,
      { $set: { currentRegistrations: newCount } },
      { new: true }
    );

    res.json({
      success: true,
      message: 'Registration successfully cancelled.',
      data: {
        currentRegistrations: updatedEvent.currentRegistrations,
        maxCapacity: updatedEvent.maxCapacity,
        isRegistered: false,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 16. Get Live Registration Status & Count
export const getEventRegistrationStatus = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id).select('currentRegistrations maxCapacity status eventType');
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    let isRegistered = false;
    let userRegistration = null;

    // Check optional token if provided
    let userId = null;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      try {
        const token = req.headers.authorization.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'eventra_super_secret_jwt_key_2026_xyz');
        userId = decoded.id;
      } catch (e) {}
    }

    if (userId) {
      userRegistration = await Registration.findOne({
        event: event._id,
        $or: [
          { participant: userId, status: { $in: ['confirmed', 'pending'] } },
          { 'teamMembers.user': userId, status: { $in: ['confirmed', 'pending'] } },
        ],
      });
      if (userRegistration) {
        isRegistered = true;
      }
    }

    const currentRegistrations = event.currentRegistrations || 0;
    const maxCapacity = event.maxCapacity || 0;
    const seatsRemaining = Math.max(0, maxCapacity - currentRegistrations);

    res.json({
      success: true,
      data: {
        currentRegistrations,
        maxCapacity,
        seatsRemaining,
        isRegistered,
        registration: userRegistration,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

