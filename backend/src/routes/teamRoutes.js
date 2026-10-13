import express from 'express';
import {
  createTeam,
  getTeams,
  getMyTeams,
  getTeamById,
  updateTeam,
  leaveTeam,
  removeMember,
  transferLeadership,
  sendInvitation,
  getMyInvitations,
  respondInvitation,
  sendJoinRequest,
  getMyJoinRequests,
  respondJoinRequest,
  registerTeam,
  getTeamRegistrationStatus,
} from '../controllers/teamController.js';
import { protect, validateObjectId } from '../middleware/auth.js';

const router = express.Router();

// Team discovery (public for authenticated users)
router.get('/', getTeams);

// Protected routes
router.use(protect);

router.post('/', createTeam);
router.get('/me', getMyTeams);
router.get('/invitations/me', getMyInvitations);
router.patch('/invitations/:id', validateObjectId(), respondInvitation);
router.get('/join-requests/me', getMyJoinRequests);
router.patch('/join-requests/:id', validateObjectId(), respondJoinRequest);

router.get('/:id', validateObjectId(), getTeamById);
router.patch('/:id', validateObjectId(), updateTeam);
router.post('/:id/leave', validateObjectId(), leaveTeam);
router.delete('/:id/members/:memberUserId', validateObjectId(), removeMember);
router.patch('/:id/transfer-leadership', validateObjectId(), transferLeadership);
router.post('/:id/invitations', validateObjectId(), sendInvitation);
router.post('/:id/join-requests', validateObjectId(), sendJoinRequest);
router.post('/:id/register', validateObjectId(), registerTeam);
router.get('/:id/registration', validateObjectId(), getTeamRegistrationStatus);

export default router;
