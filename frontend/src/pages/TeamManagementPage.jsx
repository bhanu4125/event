import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import apiClient from '../api/apiClient';
import { useAuth } from '../context/AuthContext';
import StatusBadge from '../components/common/StatusBadge';
import ConfirmationModal from '../components/common/ConfirmationModal';
import {
  Users,
  ArrowLeft,
  Mail,
  Send,
  UserPlus,
  ShieldAlert,
  Calendar,
  CheckCircle2,
  XCircle,
  Trash2,
  Edit,
  Globe,
  Lock,
  Sparkles,
  Search,
  Check,
  AlertTriangle,
  FileCheck,
} from 'lucide-react';

const TeamManagementPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [team, setTeam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Invite modal state
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [studentSearchQuery, setStudentSearchQuery] = useState('');
  const [studentSearchResults, setStudentSearchResults] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [inviteRole, setInviteRole] = useState('Core Developer');
  const [inviteMessage, setInviteMessage] = useState('');
  const [searchingStudents, setSearchingStudents] = useState(false);

  // Transfer leadership modal
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [newLeaderId, setNewLeaderId] = useState('');

  // Confirmation modal config
  const [modalConfig, setModalConfig] = useState({
    isOpen: false,
    title: '',
    message: '',
    confirmText: '',
    type: 'warning',
    onConfirm: () => {},
  });

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 4000);
  };

  const fetchTeamDetails = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get(`/teams/${id}`);
      setTeam(res.data.data);
    } catch (err) {
      alert('Failed to load team: ' + err.message);
      navigate('/teams/me');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeamDetails();
  }, [id]);

  // Debounced student search
  useEffect(() => {
    if (!studentSearchQuery || studentSearchQuery.trim().length < 2) {
      setStudentSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        setSearchingStudents(true);
        const res = await apiClient.get(`/auth/students/search?query=${encodeURIComponent(studentSearchQuery.trim())}`);
        setStudentSearchResults(res.data.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setSearchingStudents(false);
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [studentSearchQuery]);

  // 1. Send Invitation
  const handleSendInvitation = async () => {
    if (!selectedStudent) {
      alert('Please select a student from search results to invite');
      return;
    }
    try {
      setActionLoading(true);
      await apiClient.post(`/teams/${id}/invitations`, {
        recipientId: selectedStudent._id,
        invitedRole: inviteRole,
        message: inviteMessage,
      });
      showToast(`Invitation sent to ${selectedStudent.name}!`);
      setShowInviteModal(false);
      setSelectedStudent(null);
      setStudentSearchQuery('');
      setInviteMessage('');
      fetchTeamDetails();
    } catch (err) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // 2. Respond to Join Request
  const handleRespondJoinRequest = async (requestId, action) => {
    try {
      setActionLoading(true);
      await apiClient.patch(`/teams/join-requests/${requestId}`, { action });
      showToast(action === 'accept' ? 'Applicant accepted into team!' : 'Join request declined.');
      fetchTeamDetails();
    } catch (err) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // 3. Remove Member
  const handleRemoveMember = (memberUserId, memberName) => {
    setModalConfig({
      isOpen: true,
      title: 'Remove Team Member',
      message: `Are you sure you want to remove ${memberName} from the team?`,
      confirmText: 'Remove Member',
      type: 'danger',
      onConfirm: async () => {
        try {
          setActionLoading(true);
          await apiClient.delete(`/teams/${id}/members/${memberUserId}`);
          showToast(`${memberName} was removed from the team.`);
          setModalConfig((p) => ({ ...p, isOpen: false }));
          fetchTeamDetails();
        } catch (err) {
          alert(err.message);
        } finally {
          setActionLoading(false);
        }
      },
    });
  };

  // 4. Leave Team
  const handleLeaveTeam = () => {
    setModalConfig({
      isOpen: true,
      title: 'Leave Team',
      message: `Are you sure you want to leave team "${team.name}"? Your spot will be reopened.`,
      confirmText: 'Confirm Leave',
      type: 'danger',
      onConfirm: async () => {
        try {
          setActionLoading(true);
          await apiClient.post(`/teams/${id}/leave`);
          showToast('You left the team.');
          navigate('/teams/me');
        } catch (err) {
          alert(err.message);
        } finally {
          setActionLoading(false);
        }
      },
    });
  };

  // 5. Transfer Leadership
  const handleTransferLeadership = async () => {
    if (!newLeaderId) {
      alert('Please select a member to transfer leadership to');
      return;
    }
    try {
      setActionLoading(true);
      await apiClient.patch(`/teams/${id}/transfer-leadership`, { newLeaderId });
      showToast('Leadership transferred successfully!');
      setShowTransferModal(false);
      fetchTeamDetails();
    } catch (err) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // 6. Submit Team Registration
  const handleRegisterTeam = () => {
    const minSize = team.event?.minTeamSize || 1;
    const currentSize = team.memberCount;
    if (currentSize < minSize) {
      alert(`Team currently has ${currentSize} member(s). A minimum of ${minSize} members is required to register!`);
      return;
    }

    setModalConfig({
      isOpen: true,
      title: 'Submit Team Registration',
      message: `Register team "${team.name}" for "${team.event?.title}"? All team members will be locked and registered for the competition.`,
      confirmText: 'Confirm & Register Team',
      type: 'success',
      onConfirm: async () => {
        try {
          setActionLoading(true);
          const res = await apiClient.post(`/teams/${id}/register`);
          showToast(res.data.message || 'Team successfully registered!');
          setModalConfig((p) => ({ ...p, isOpen: false }));
          fetchTeamDetails();
        } catch (err) {
          alert(err.message);
        } finally {
          setActionLoading(false);
        }
      },
    });
  };

  if (loading || !team) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-500">
        <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        <span className="ml-3 text-sm">Loading team details...</span>
      </div>
    );
  }

  const isLeader = team.isLeader;
  const isMember = team.isMember;
  const isRegistered = team.status === 'registered';
  const minRequired = team.event?.minTeamSize || 1;
  const maxAllowed = team.maxSlots || 4;
  const canRegister = isLeader && !isRegistered && team.memberCount >= minRequired;

  return (
    <div className="min-h-screen pb-20 bg-[#F8FAFC]">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 p-4 rounded-xl bg-emerald-600 text-white shadow-xl flex items-center gap-2.5 text-xs font-semibold animate-in slide-in-from-bottom duration-200">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <section className="bg-white border-b border-slate-200 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Link
                to="/teams/me"
                className="p-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-500 hover:text-slate-900 transition"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                    {team.name}
                  </h1>
                  <StatusBadge status={team.status} size="sm" />
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Competing in: <strong className="text-slate-700">{team.event?.title}</strong>
                </p>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex flex-wrap items-center gap-2">
              {isLeader && !isRegistered && (
                <button
                  type="button"
                  onClick={() => setShowInviteModal(true)}
                  disabled={team.openSlots <= 0}
                  className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition disabled:opacity-40"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Invite Teammate</span>
                </button>
              )}

              {canRegister && (
                <button
                  type="button"
                  onClick={handleRegisterTeam}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition"
                >
                  <FileCheck className="w-4 h-4" />
                  <span>Register Team for Event</span>
                </button>
              )}

              {isMember && !isLeader && !isRegistered && (
                <button
                  type="button"
                  onClick={handleLeaveTeam}
                  className="px-3 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-semibold transition"
                >
                  Leave Team
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Main Grid */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Roster, Invitations & Join Requests */}
        <div className="lg:col-span-2 space-y-6">
          {/* Registered Team Banner */}
          {isRegistered && (
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <div>
                  <h4 className="text-sm font-bold">Team Successfully Registered!</h4>
                  <p className="text-xs text-emerald-700">
                    Your team is locked and confirmed for {team.event?.title}. All members are registered.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Members Roster Card */}
          <div className="clean-card p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Team Roster</h3>
                <p className="text-xs text-slate-500">
                  {team.memberCount} of {maxAllowed} members • Minimum required to register: {minRequired}
                </p>
              </div>

              {isLeader && team.members.length > 1 && !isRegistered && (
                <button
                  onClick={() => setShowTransferModal(true)}
                  className="text-xs text-indigo-600 font-semibold hover:underline"
                >
                  Transfer Leadership
                </button>
              )}
            </div>

            <div className="divide-y divide-slate-100">
              {team.members?.map((m) => {
                const isMemberLeader = m.user?._id === team.leader?._id;
                const canRemove = isLeader && !isMemberLeader && !isRegistered;

                return (
                  <div key={m.user?._id} className="py-3 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold flex items-center justify-center uppercase">
                        {m.user?.name?.slice(0, 2) || 'TM'}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-slate-900">{m.user?.name}</span>
                          {isMemberLeader && (
                            <span className="px-2 py-0.2 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-bold">
                              Leader
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-slate-500 block">
                          {m.role || 'Member'} • {m.user?.department}
                        </span>
                      </div>
                    </div>

                    {canRemove && (
                      <button
                        onClick={() => handleRemoveMember(m.user?._id, m.user?.name)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-50 transition"
                        title="Remove member"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Leader Review Panels: Join Requests & Sent Invites */}
          {isLeader && (
            <>
              {/* Incoming Join Requests */}
              <div className="clean-card p-6 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Send className="w-4 h-4 text-indigo-600" />
                    <span>Incoming Join Requests ({team.joinRequests?.length || 0})</span>
                  </h3>
                  <span className="text-xs text-slate-500">
                    Students applying to join this team
                  </span>
                </div>

                {(!team.joinRequests || team.joinRequests.length === 0) ? (
                  <p className="text-xs text-slate-400 italic py-4 text-center">
                    No pending join requests right now.
                  </p>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {team.joinRequests.map((req) => (
                      <div key={req._id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-900">{req.applicant?.name}</span>
                            <span className="text-[11px] text-slate-500">({req.applicant?.department})</span>
                            <StatusBadge status={req.status} size="sm" />
                          </div>
                          <span className="text-xs text-slate-600 block">
                            Desired role: <strong className="text-slate-800">{req.desiredRole}</strong>
                          </span>
                          {req.message && (
                            <p className="text-xs text-slate-500 italic bg-slate-50 p-2 rounded-lg border border-slate-200">
                              "{req.message}"
                            </p>
                          )}
                        </div>

                        {req.status === 'pending' && !isRegistered && (
                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              type="button"
                              disabled={actionLoading}
                              onClick={() => handleRespondJoinRequest(req._id, 'reject')}
                              className="px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-semibold"
                            >
                              Decline
                            </button>
                            <button
                              type="button"
                              disabled={actionLoading || team.openSlots <= 0}
                              onClick={() => handleRespondJoinRequest(req._id, 'accept')}
                              className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs disabled:opacity-40"
                            >
                              Accept
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Sent Pending Invitations */}
              <div className="clean-card p-6 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Mail className="w-4 h-4 text-indigo-600" />
                    <span>Sent Invitations ({team.pendingInvitations?.length || 0})</span>
                  </h3>
                </div>

                {(!team.pendingInvitations || team.pendingInvitations.length === 0) ? (
                  <p className="text-xs text-slate-400 italic py-4 text-center">
                    No active invitations sent.
                  </p>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {team.pendingInvitations.map((inv) => (
                      <div key={inv._id} className="py-2.5 flex items-center justify-between text-xs">
                        <div>
                          <strong className="text-slate-900">{inv.recipient?.name}</strong>{' '}
                          <span className="text-slate-500">({inv.recipient?.department})</span>
                          <span className="text-slate-400 block text-[11px]">
                            Invited as: {inv.invitedRole}
                          </span>
                        </div>
                        <StatusBadge status={inv.status} size="sm" />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Right 1 Col: Event & Team Parameters */}
        <div className="space-y-6">
          <div className="clean-card p-6 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
              Event Details
            </h3>

            <div className="space-y-3 text-xs text-slate-600">
              <div className="space-y-1">
                <span className="text-slate-400 block">Competition:</span>
                <strong className="text-slate-900 text-sm">{team.event?.title}</strong>
              </div>

              <div className="flex justify-between border-b border-slate-100 pb-1.5">
                <span>Event Date:</span>
                <span className="font-semibold text-slate-800">
                  {new Date(team.event?.eventDate).toLocaleDateString()}
                </span>
              </div>

              <div className="flex justify-between border-b border-slate-100 pb-1.5">
                <span>Venue:</span>
                <span className="font-semibold text-slate-800 truncate max-w-[150px]">
                  {team.event?.venue}
                </span>
              </div>

              <div className="flex justify-between border-b border-slate-100 pb-1.5">
                <span>Team Limits:</span>
                <span className="font-semibold text-slate-800">
                  {minRequired} to {maxAllowed} members
                </span>
              </div>

              <div className="flex justify-between border-b border-slate-100 pb-1.5">
                <span>Registration Deadline:</span>
                <span className="font-semibold text-slate-800">
                  {new Date(team.event?.registrationDeadline).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>

          <div className="clean-card p-6 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
              Team Skills & Roles
            </h3>

            {/* Skills */}
            <div className="space-y-1.5">
              <span className="text-xs font-semibold text-slate-700 block">Required Skills:</span>
              <div className="flex flex-wrap gap-1">
                {team.requiredSkills?.map((s, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 text-xs font-medium border border-indigo-200"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>

            {/* Open Roles */}
            <div className="space-y-1.5 pt-2">
              <span className="text-xs font-semibold text-slate-700 block">Open Positions:</span>
              <div className="flex flex-wrap gap-1">
                {team.openRoles?.map((r, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-xs font-medium"
                  >
                    {r}
                  </span>
                ))}
              </div>
            </div>

            {/* Recruitment status */}
            <div className="pt-2 text-xs flex items-center justify-between border-t border-slate-100">
              <span className="text-slate-500">Public Recruitment:</span>
              <span className="font-semibold text-slate-800">
                {team.isPublicRecruiting ? 'Enabled (Open)' : 'Disabled (Closed)'}
              </span>
            </div>
          </div>
        </div>
      </main>

      {/* Invite Member Modal with Live Student Search */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="relative w-full max-w-lg p-6 rounded-2xl bg-white border border-slate-200 shadow-xl space-y-4">
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-slate-900">Invite Student to Team</h3>
              <p className="text-xs text-slate-500">
                Search campus students by name or department to send an invitation.
              </p>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={studentSearchQuery}
                onChange={(e) => setStudentSearchQuery(e.target.value)}
                placeholder="Type student name (e.g. Elena, Devin, Sam)..."
                className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-300 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
              />
            </div>

            {/* Search Results Dropdown */}
            {studentSearchResults.length > 0 && (
              <div className="max-h-40 overflow-y-auto divide-y divide-slate-100 border border-slate-200 rounded-xl">
                {studentSearchResults.map((st) => (
                  <div
                    key={st._id}
                    onClick={() => {
                      setSelectedStudent(st);
                      setStudentSearchQuery(st.name);
                      setStudentSearchResults([]);
                    }}
                    className="p-2.5 hover:bg-indigo-50 cursor-pointer flex items-center justify-between text-xs transition"
                  >
                    <div>
                      <strong className="text-slate-900">{st.name}</strong>
                      <span className="text-slate-500 block text-[11px]">
                        {st.department} • {st.email}
                      </span>
                    </div>
                    <span className="text-[11px] font-semibold text-indigo-600">Select</span>
                  </div>
                ))}
              </div>
            )}

            {selectedStudent && (
              <div className="p-3 rounded-xl bg-indigo-50 border border-indigo-200 text-xs flex items-center justify-between">
                <div>
                  <span className="text-slate-500 block text-[11px]">Selected Invitee:</span>
                  <strong className="text-indigo-900">{selectedStudent.name}</strong> (
                  {selectedStudent.department})
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedStudent(null)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  Change
                </button>
              </div>
            )}

            <div className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Role Assigned</label>
                <input
                  type="text"
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                  placeholder="e.g. Frontend Engineer, ML Researcher"
                  className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Invitation Message</label>
                <textarea
                  rows={2}
                  value={inviteMessage}
                  onChange={(e) => setInviteMessage(e.target.value)}
                  placeholder="Personal note to invitee..."
                  className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowInviteModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={actionLoading || !selectedStudent}
                onClick={handleSendInvitation}
                className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition disabled:opacity-40"
              >
                {actionLoading ? 'Sending...' : 'Send Invitation'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Transfer Leadership Modal */}
      {showTransferModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="relative w-full max-w-md p-6 rounded-2xl bg-white border border-slate-200 shadow-xl space-y-4">
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-slate-900">Transfer Team Leadership</h3>
              <p className="text-xs text-slate-500">
                Choose an active teammate to become the new primary team leader.
              </p>
            </div>

            <div className="space-y-1 text-xs">
              <label className="font-semibold text-slate-700">Select Teammate</label>
              <select
                value={newLeaderId}
                onChange={(e) => setNewLeaderId(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Choose new leader...</option>
                {team.members
                  ?.filter((m) => m.user?._id !== team.leader?._id)
                  .map((m) => (
                    <option key={m.user?._id} value={m.user?._id}>
                      {m.user?.name} ({m.role || 'Member'})
                    </option>
                  ))}
              </select>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowTransferModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={actionLoading || !newLeaderId}
                onClick={handleTransferLeadership}
                className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition disabled:opacity-40"
              >
                Confirm Transfer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={modalConfig.isOpen}
        onClose={() => setModalConfig((p) => ({ ...p, isOpen: false }))}
        onConfirm={modalConfig.onConfirm}
        title={modalConfig.title}
        message={modalConfig.message}
        confirmText={modalConfig.confirmText}
        type={modalConfig.type}
        isLoading={actionLoading}
      />
    </div>
  );
};

export default TeamManagementPage;
