import express from 'express';
import {
  addBookmark,
  removeBookmark,
  getMyBookmarks,
  checkIsBookmarked,
} from '../controllers/bookmarkController.js';
import { protect, validateObjectId } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.get('/', getMyBookmarks);
router.post('/:eventId', validateObjectId('eventId'), addBookmark);
router.delete('/:eventId', validateObjectId('eventId'), removeBookmark);
router.get('/check/:eventId', validateObjectId('eventId'), checkIsBookmarked);

export default router;
