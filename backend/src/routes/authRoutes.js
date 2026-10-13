import express from 'express';
import { register, login, getMe, demoLogin, getMyInterests, updateMyInterests, searchStudents } from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/demo-login', demoLogin);
router.get('/me', protect, getMe);
router.get('/interests', protect, getMyInterests);
router.put('/interests', protect, updateMyInterests);
router.get('/students/search', protect, searchStudents);

export default router;
