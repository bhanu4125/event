import mongoose from 'mongoose';
import Team from '../models/Team.js';
import Event from '../models/Event.js';
import User from '../models/User.js';
import TeamInvitation from '../models/TeamInvitation.js';
import JoinRequest from '../models/JoinRequest.js';
import Registration from '../models/Registration.js';
import Notification from '../models/Notification.js';

// Helper: send in-app notification
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
    console.error('Notification error in teamController:', err.message);
  }
};

// 1. Create a Team
export const createTeam = async (req, res) => {
  try {
    const { name, description, eventId, requiredSkills, openRoles, isPublicRecruiting } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Team name is required' });
    }

    if (!eventId) {
      return res.status(400).json({ success: false, message: 'Event ID is required' });
    }

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    if (event.status !== 'published') {
      return res.status(400).json({
        success: false,
        message: 'Cannot form teams for an event that is not published',
      });
    }

    if (event.eventType !== 'Team') {
      return res.status(400).json({
        success: false,
        message: 'This event is designated for individual participation only',
      });
    }

    // Check registration / formation deadline
    const deadline = event.teamFormationDeadline || event.registrationDeadline;
    if (new Date(deadline) < new Date()) {
      return res.status(400).json({
        success: false,
        message: 'Team formation deadline for this event has passed',
      });
    }

    // Check if user already leads a team for this event
    const existingLeaderTeam = await Team.findOne({
      event: eventId,
      leader: req.user._id,
      status: { $ne: 'disbanded' },
    });
    if (existingLeaderTeam) {
      return res.status(400).json({
        success: false,
        message: 'You already lead an active team for this event',
      });
    }

    const team = await Team.create({
      name: name.trim(),
      description: description?.trim() || '',
      event: eventId,
      leader: req.user._id,
      members: [
        {
          user: req.user._id,
          role: 'Team Leader',
          joinedAt: new Date(),
        },
      ],
      requiredSkills: Array.isArray(requiredSkills) ? requiredSkills : [],
      openRoles: Array.isArray(openRoles) ? openRoles : [],
      isPublicRecruiting: isPublicRecruiting !== undefined ? Boolean(isPublicRecruiting) : true,
      status: 'forming',
    });

    res.status(201).json({
      success: true,
      message: 'Team created successfully!',
      data: team,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 2. Discover Teams (Team Finder)
export const getTeams = async (req, res) => {
  try {
    const { eventId, skill, role, search } = req.query;

    const query = {
      isPublicRecruiting: true,
      status: { $in: ['forming', 'ready'] },
    };

    if (eventId) {
      query.event = eventId;
    }

    if (skill) {
      query.requiredSkills = { $in: [new RegExp(skill, 'i')] };
    }

    if (role) {
      query.openRoles = { $in: [new RegExp(role, 'i')] };
    }

    if (search && search.trim()) {
      query.$or = [
        { name: { $regex: search.trim(), $options: 'i' } },
        { description: { $regex: search.trim(), $options: 'i' } },
      ];
    }

    const teams = await Team.find(query)
      .populate('event', 'title eventDate maxTeamSize minTeamSize category posterUrl')
      .populate('leader', 'name email department avatar')
      .populate('members.user', 'name department avatar')
      .sort({ createdAt: -1 });

    // Compute available slots
    const mappedTeams = teams.map((t) => {
      const maxSlots = t.event?.maxTeamSize || 4;
      const memberCount = t.members?.length || 1;
      const openSlots = Math.max(0, maxSlots - memberCount);
      return {
        ...t.toObject(),
        memberCount,
        maxSlots,
        openSlots,
      };
    });

    res.json({
      success: true,
      count: mappedTeams.length,
      data: mappedTeams,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 3. Get User's Teams (Led or Joined)
export const getMyTeams = async (req, res) => {
  try {
    const teams = await Team.find({
      'members.user': req.user._id,
      status: { $ne: 'disbanded' },
    })
      .populate('event', 'title eventDate venue category maxTeamSize minTeamSize registrationDeadline posterUrl')
      .populate('leader', 'name email department')
      .populate('members.user', 'name email department year avatar')
      .populate('registration')
      .sort({ updatedAt: -1 });

    res.json({
      success: true,
      count: teams.length,
      data: teams,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 4. Get Team Details by ID
export const getTeamById = async (req, res) => {
  try {
    const team = await Team.findById(req.params.id)
      .populate('event')
      .populate('leader', 'name email department phone avatar')
      .populate('members.user', 'name email department year avatar')
      .populate('registration');

    if (!team) {
      return res.status(404).json({ success: false, message: 'Team not found' });
    }

    const isLeader = team.leader._id.toString() === req.user._id.toString();
    const isMember = team.members.some((m) => m.user._id.toString() === req.user._id.toString());

    let pendingInvitations = [];
    let joinRequests = [];

    // If leader, load pending invitations & join requests
    if (isLeader) {
      pendingInvitations = await TeamInvitation.find({ team: team._id })
        .populate('recipient', 'name email department year avatar')
        .sort({ createdAt: -1 });

      joinRequests = await JoinRequest.find({ team: team._id })
        .populate('applicant', 'name email department year avatar')
        .sort({ createdAt: -1 });
    }

    const maxSlots = team.event?.maxTeamSize || 4;
    const memberCount = team.members.length;
    const openSlots = Math.max(0, maxSlots - memberCount);

    res.json({
      success: true,
      data: {
        ...team.toObject(),
        isLeader,
        isMember,
        memberCount,
        maxSlots,
        openSlots,
        pendingInvitations,
        joinRequests,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 5. Update Team (Leader only)
export const updateTeam = async (req, res) => {
  try {
    const team = await Team.findById(req.params.id);
    if (!team) {
      return res.status(404).json({ success: false, message: 'Team not found' });
    }

    if (team.leader.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Only the team leader can update team settings' });
    }

    const { name, description, requiredSkills, openRoles, isPublicRecruiting } = req.body;
    if (name) team.name = name.trim();
    if (description !== undefined) team.description = description.trim();
    if (Array.isArray(requiredSkills)) team.requiredSkills = requiredSkills;
    if (Array.isArray(openRoles)) team.openRoles = openRoles;
    if (isPublicRecruiting !== undefined) team.isPublicRecruiting = Boolean(isPublicRecruiting);

    await team.save();

    res.json({
      success: true,
      message: 'Team updated successfully',
      data: team,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 6. Leave Team (Non-leader member only)
export const leaveTeam = async (req, res) => {
  try {
    const team = await Team.findById(req.params.id);
    if (!team) {
      return res.status(404).json({ success: false, message: 'Team not found' });
    }

    if (team.status === 'registered') {
      return res.status(400).json({
        success: false,
        message: 'Cannot leave a team that is already officially registered for the event',
      });
    }

    const isLeader = team.leader.toString() === req.user._id.toString();
    if (isLeader) {
      return res.status(400).json({
        success: false,
        message: 'Team leaders cannot leave without transferring leadership first or disbanding the team',
      });
    }

    const memberIndex = team.members.findIndex(
      (m) => m.user.toString() === req.user._id.toString()
    );
    if (memberIndex === -1) {
      return res.status(400).json({ success: false, message: 'You are not a member of this team' });
    }

    team.members.splice(memberIndex, 1);
    await team.save();

    await notify({
      recipientId: team.leader,
      senderId: req.user._id,
      title: 'Team Member Left',
      message: `${req.user.name} has left team "${team.name}". A slot has reopened.`,
      type: 'member_removed',
      eventId: team.event,
    });

    res.json({
      success: true,
      message: 'You have left the team',
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 7. Remove Member (Leader only)
export const removeMember = async (req, res) => {
  try {
    const { memberUserId } = req.params;
    const team = await Team.findById(req.params.id);
    if (!team) {
      return res.status(404).json({ success: false, message: 'Team not found' });
    }

    if (team.leader.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Only team leaders can remove members' });
    }

    if (memberUserId === team.leader.toString()) {
      return res.status(400).json({ success: false, message: 'Leader cannot remove themselves' });
    }

    if (team.status === 'registered') {
      return res.status(400).json({ success: false, message: 'Cannot modify members after team registration' });
    }

    team.members = team.members.filter((m) => m.user.toString() !== memberUserId);
    await team.save();

    await notify({
      recipientId: memberUserId,
      senderId: req.user._id,
      title: 'Removed from Team',
      message: `You were removed from team "${team.name}" by the team leader.`,
      type: 'member_removed',
      eventId: team.event,
    });

    res.json({
      success: true,
      message: 'Member removed from team',
      data: team,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 8. Transfer Leadership (Leader only)
export const transferLeadership = async (req, res) => {
  try {
    const { newLeaderId } = req.body;
    const team = await Team.findById(req.params.id);
    if (!team) {
      return res.status(404).json({ success: false, message: 'Team not found' });
    }

    if (team.leader.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Only the team leader can transfer leadership' });
    }

    const targetMember = team.members.find((m) => m.user.toString() === newLeaderId);
    if (!targetMember) {
      return res.status(400).json({ success: false, message: 'Target user must be an active team member' });
    }

    team.leader = newLeaderId;
    team.members.forEach((m) => {
      if (m.user.toString() === newLeaderId) {
        m.role = 'Team Leader';
      } else if (m.user.toString() === req.user._id.toString()) {
        m.role = 'Core Member';
      }
    });

    await team.save();

    await notify({
      recipientId: newLeaderId,
      senderId: req.user._id,
      title: 'Team Leadership Transferred',
      message: `You are now the team leader of "${team.name}".`,
      type: 'leadership_transferred',
      eventId: team.event,
    });

    res.json({
      success: true,
      message: 'Leadership transferred successfully',
      data: team,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 9. Send Team Invitation (Leader only)
export const sendInvitation = async (req, res) => {
  try {
    const { recipientId, invitedRole, message } = req.body;
    const team = await Team.findById(req.params.id);
    if (!team) {
      return res.status(404).json({ success: false, message: 'Team not found' });
    }

    if (team.leader.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Only team leaders can invite members' });
    }

    const event = await Event.findById(team.event);
    if (team.members.length >= event.maxTeamSize) {
      return res.status(400).json({
        success: false,
        message: `Team has reached the maximum size of ${event.maxTeamSize} members`,
      });
    }

    // Check recipient exists
    const recipient = await User.findById(recipientId);
    if (!recipient) {
      return res.status(404).json({ success: false, message: 'Recipient student not found' });
    }

    // Check not already member
    const isMember = team.members.some((m) => m.user.toString() === recipientId);
    if (isMember) {
      return res.status(400).json({ success: false, message: 'Student is already a member of this team' });
    }

    // Check existing pending invitation
    const existingInvite = await TeamInvitation.findOne({
      team: team._id,
      recipient: recipientId,
      status: 'pending',
    });
    if (existingInvite) {
      return res.status(400).json({ success: false, message: 'A pending invitation already exists for this student' });
    }

    const invitation = await TeamInvitation.create({
      team: team._id,
      event: team.event,
      sender: req.user._id,
      recipient: recipientId,
      invitedRole: invitedRole || 'Member',
      message: message || `Join team "${team.name}" for ${event.title}!`,
    });

    await notify({
      recipientId,
      senderId: req.user._id,
      title: 'Team Invitation Received',
      message: `You were invited by ${req.user.name} to join team "${team.name}" for event "${event.title}".`,
      type: 'team_invitation',
      eventId: team.event,
    });

    res.status(201).json({
      success: true,
      message: 'Invitation sent successfully',
      data: invitation,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 10. Get Received Invitations (Student)
export const getMyInvitations = async (req, res) => {
  try {
    const invitations = await TeamInvitation.find({ recipient: req.user._id })
      .populate('team', 'name description requiredSkills openRoles')
      .populate('event', 'title eventDate venue category posterUrl maxTeamSize')
      .populate('sender', 'name email department avatar')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: invitations.length,
      data: invitations,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 11. Respond to Invitation (Accept or Reject)
export const respondInvitation = async (req, res) => {
  try {
    const { action } = req.body; // 'accept' | 'reject'
    const invitation = await TeamInvitation.findById(req.params.id);

    if (!invitation) {
      return res.status(404).json({ success: false, message: 'Invitation not found' });
    }

    if (invitation.recipient.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'This invitation was not sent to you' });
    }

    if (invitation.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Invitation has already been ${invitation.status}`,
      });
    }

    if (action === 'reject') {
      invitation.status = 'rejected';
      await invitation.save();

      await notify({
        recipientId: invitation.sender,
        senderId: req.user._id,
        title: 'Invitation Declined',
        message: `${req.user.name} declined the invitation to join your team.`,
        type: 'invitation_rejected',
        eventId: invitation.event,
      });

      return res.json({ success: true, message: 'Invitation declined' });
    }

    if (action === 'accept') {
      // Concurrency & Capacity check: Revalidate team size and event max size
      const team = await Team.findById(invitation.team);
      const event = await Event.findById(invitation.event);

      if (!team || !event) {
        return res.status(404).json({ success: false, message: 'Team or Event no longer exists' });
      }

      if (team.members.length >= event.maxTeamSize) {
        invitation.status = 'expired';
        await invitation.save();
        return res.status(400).json({
          success: false,
          message: 'Sorry, the team has already reached its maximum capacity of members.',
        });
      }

      // Check if user is already member
      const alreadyMember = team.members.some((m) => m.user.toString() === req.user._id.toString());
      if (alreadyMember) {
        invitation.status = 'accepted';
        await invitation.save();
        return res.json({ success: true, message: 'You are already a member of this team' });
      }

      // Add user to team
      team.members.push({
        user: req.user._id,
        role: invitation.invitedRole || 'Member',
        joinedAt: new Date(),
      });
      await team.save();

      invitation.status = 'accepted';
      await invitation.save();

      await notify({
        recipientId: invitation.sender,
        senderId: req.user._id,
        title: 'Invitation Accepted!',
        message: `${req.user.name} accepted your invitation and joined team "${team.name}".`,
        type: 'invitation_accepted',
        eventId: invitation.event,
      });

      return res.json({
        success: true,
        message: `You successfully joined team "${team.name}"!`,
        data: team,
      });
    }

    res.status(400).json({ success: false, message: "Invalid action. Must be 'accept' or 'reject'" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 12. Send Join Request (Student applies to team)
export const sendJoinRequest = async (req, res) => {
  try {
    const { desiredRole, message } = req.body;
    const team = await Team.findById(req.params.id);

    if (!team) {
      return res.status(404).json({ success: false, message: 'Team not found' });
    }

    if (!team.isPublicRecruiting) {
      return res.status(400).json({ success: false, message: 'This team is not currently accepting public applications' });
    }

    const event = await Event.findById(team.event);
    if (team.members.length >= event.maxTeamSize) {
      return res.status(400).json({
        success: false,
        message: 'This team has already reached maximum capacity',
      });
    }

    // Check not already member
    const isMember = team.members.some((m) => m.user.toString() === req.user._id.toString());
    if (isMember) {
      return res.status(400).json({ success: false, message: 'You are already a member of this team' });
    }

    // Check existing pending request
    const existingReq = await JoinRequest.findOne({
      team: team._id,
      applicant: req.user._id,
      status: 'pending',
    });
    if (existingReq) {
      return res.status(400).json({ success: false, message: 'You already have a pending join request for this team' });
    }

    const joinRequest = await JoinRequest.create({
      team: team._id,
      event: team.event,
      applicant: req.user._id,
      desiredRole: desiredRole || 'Member',
      message: message || '',
    });

    await notify({
      recipientId: team.leader,
      senderId: req.user._id,
      title: 'New Team Join Request',
      message: `${req.user.name} requested to join your team "${team.name}".`,
      type: 'join_request',
      eventId: team.event,
    });

    res.status(201).json({
      success: true,
      message: 'Join request sent to team leader successfully',
      data: joinRequest,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 13. Get My Sent Join Requests (Student)
export const getMyJoinRequests = async (req, res) => {
  try {
    const requests = await JoinRequest.find({ applicant: req.user._id })
      .populate('team', 'name description requiredSkills openRoles')
      .populate('event', 'title eventDate venue category posterUrl')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: requests.length,
      data: requests,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 14. Respond to Join Request (Leader accepts or rejects)
export const respondJoinRequest = async (req, res) => {
  try {
    const { action } = req.body; // 'accept' | 'reject'
    const joinReq = await JoinRequest.findById(req.params.id);

    if (!joinReq) {
      return res.status(404).json({ success: false, message: 'Join request not found' });
    }

    const team = await Team.findById(joinReq.team);
    if (!team) {
      return res.status(404).json({ success: false, message: 'Team not found' });
    }

    if (team.leader.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Only team leaders can accept or reject join requests' });
    }

    if (joinReq.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Join request is already ${joinReq.status}`,
      });
    }

    if (action === 'reject') {
      joinReq.status = 'rejected';
      await joinReq.save();

      await notify({
        recipientId: joinReq.applicant,
        senderId: req.user._id,
        title: 'Team Join Request Declined',
        message: `Your request to join team "${team.name}" was declined.`,
        type: 'join_request_rejected',
        eventId: team.event,
      });

      return res.json({ success: true, message: 'Join request declined' });
    }

    if (action === 'accept') {
      const event = await Event.findById(team.event);

      // Capacity verification
      if (team.members.length >= event.maxTeamSize) {
        joinReq.status = 'rejected';
        await joinReq.save();
        return res.status(400).json({
          success: false,
          message: `Team has reached maximum capacity of ${event.maxTeamSize} members. Cannot add more.`,
        });
      }

      // Check not already member
      const alreadyMember = team.members.some(
        (m) => m.user.toString() === joinReq.applicant.toString()
      );
      if (!alreadyMember) {
        team.members.push({
          user: joinReq.applicant,
          role: joinReq.desiredRole || 'Member',
          joinedAt: new Date(),
        });
        await team.save();
      }

      joinReq.status = 'accepted';
      await joinReq.save();

      await notify({
        recipientId: joinReq.applicant,
        senderId: req.user._id,
        title: 'Welcome to the Team!',
        message: `Your request was accepted! You are now a member of team "${team.name}".`,
        type: 'join_request_accepted',
        eventId: team.event,
      });

      return res.json({
        success: true,
        message: 'Applicant accepted into team',
        data: team,
      });
    }

    res.status(400).json({ success: false, message: "Action must be 'accept' or 'reject'" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 15. Submit Team Registration for Event (Leader only)
export const registerTeam = async (req, res) => {
  try {
    const team = await Team.findById(req.params.id).populate('members.user', 'name email department');

    if (!team) {
      return res.status(404).json({ success: false, message: 'Team not found' });
    }

    if (team.leader.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Only the team leader can register the team' });
    }

    if (team.status === 'registered') {
      return res.status(400).json({ success: false, message: 'Team is already registered for this event' });
    }

    const event = await Event.findById(team.event);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    if (event.status !== 'published') {
      return res.status(400).json({ success: false, message: 'Event is not published for registration' });
    }

    if (event.eventType !== 'Team') {
      return res.status(400).json({ success: false, message: 'This event does not allow team registration' });
    }

    // Deadline check
    const now = new Date();
    if (new Date(event.registrationDeadline) < now) {
      return res.status(400).json({ success: false, message: 'Event registration deadline has passed' });
    }

    // Team Size Constraints check
    const memberCount = team.members.length;
    if (memberCount < event.minTeamSize) {
      return res.status(400).json({
        success: false,
        message: `Team has ${memberCount} member(s). A minimum of ${event.minTeamSize} members is required to register.`,
      });
    }

    if (memberCount > event.maxTeamSize) {
      return res.status(400).json({
        success: false,
        message: `Team exceeds maximum allowed team size of ${event.maxTeamSize} members.`,
      });
    }

    // Capacity Concurrency check: Ensure event capacity not exceeded
    if (event.currentRegistrations >= event.maxCapacity) {
      return res.status(400).json({
        success: false,
        message: 'Registration is full. No available participant slots remain.',
      });
    }

    // Check duplicate team registration in Registration collection
    const existingReg = await Registration.findOne({
      event: event._id,
      team: team._id,
    });
    if (existingReg) {
      return res.status(400).json({ success: false, message: 'This team is already registered' });
    }

    const initialStatus = event.requiresOrganizerApproval ? 'pending' : 'confirmed';

    // Create Registration document
    const registration = await Registration.create({
      event: event._id,
      registrationType: 'team',
      team: team._id,
      leader: req.user._id,
      teamMembers: team.members.map((m) => ({
        user: m.user._id,
        name: m.user.name,
        email: m.user.email,
        role: m.role,
      })),
      status: initialStatus,
    });

    // Atomically increment event currentRegistrations
    await Event.findByIdAndUpdate(event._id, {
      $inc: { currentRegistrations: memberCount },
    });

    // Update team
    team.status = 'registered';
    team.isPublicRecruiting = false; // Close recruitment once registered
    team.registration = registration._id;
    await team.save();

    // Notify all team members
    for (const m of team.members) {
      await notify({
        recipientId: m.user._id,
        senderId: req.user._id,
        title: 'Team Officially Registered!',
        message: `Team "${team.name}" has been registered for "${event.title}". Status: ${initialStatus}.`,
        type: 'team_registered',
        eventId: event._id,
      });
    }

    res.status(201).json({
      success: true,
      message:
        initialStatus === 'confirmed'
          ? 'Team successfully registered and confirmed!'
          : 'Team registration submitted for organizer approval!',
      data: registration,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 16. Get Team Registration Status
export const getTeamRegistrationStatus = async (req, res) => {
  try {
    const registration = await Registration.findOne({ team: req.params.id })
      .populate('event', 'title eventDate venue category')
      .populate('leader', 'name email');

    if (!registration) {
      return res.status(404).json({ success: false, message: 'No registration found for this team' });
    }

    res.json({
      success: true,
      data: registration,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
