import express from 'express';
import {
  getMyNotifications,
  markAsRead,
  markAllAsRead,
} from '../controllers/notificationController.js';
import { protect, validateObjectId } from '../middleware/auth.js';

const router = express.Router();

router.get('/', protect, getMyNotifications);
router.patch('/:id/read', protect, validateObjectId(), markAsRead);
router.patch('/mark-all-read', protect, markAllAsRead);

export default router;
