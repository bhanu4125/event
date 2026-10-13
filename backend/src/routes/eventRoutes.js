import express from 'express';
import {
  createEvent,
  updateEvent,
  submitForApproval,
  approveEvent,
  rejectEvent,
  requestChanges,
  publishEvent,
  cancelEvent,
  getPublicEvents,
  getRecommendedEvents,
  getEventsCalendar,
  getOrganizerEvents,
  getAdminEvents,
  getEventById,
  getEventAuditLogs,
} from '../controllers/eventController.js';
import { protect, authorize, validateObjectId } from '../middleware/auth.js';

const router = express.Router();

// Public discovery routes
router.get('/public', getPublicEvents);
router.get('/recommended', getRecommendedEvents);
router.get('/calendar', getEventsCalendar);

// Organizer routes
router.get('/organizer/my-events', protect, authorize('organizer', 'admin'), getOrganizerEvents);
router.post('/', protect, authorize('organizer', 'admin'), createEvent);
router.put('/:id', protect, authorize('organizer', 'admin'), validateObjectId(), updateEvent);
router.post('/:id/submit', protect, authorize('organizer', 'admin'), validateObjectId(), submitForApproval);
router.post('/:id/publish', protect, authorize('organizer', 'admin'), validateObjectId(), publishEvent);

// Admin routes
router.get('/admin/all', protect, authorize('admin'), getAdminEvents);
router.post('/:id/approve', protect, authorize('admin'), validateObjectId(), approveEvent);
router.post('/:id/reject', protect, authorize('admin'), validateObjectId(), rejectEvent);
router.post('/:id/request-changes', protect, authorize('admin'), validateObjectId(), requestChanges);

// Shared protected routes
router.post('/:id/cancel', protect, authorize('organizer', 'admin'), validateObjectId(), cancelEvent);
router.get('/:id/audit-logs', protect, validateObjectId(), getEventAuditLogs);
router.get('/:id', validateObjectId(), getEventById);

export default router;
