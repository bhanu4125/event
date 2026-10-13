import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../api/apiClient';
import { useAuth } from '../context/AuthContext';
import StatusBadge from '../components/common/StatusBadge';
import {
  Users,
  Mail,
  Send,
  Plus,
  Compass,
  CheckCircle2,
  XCircle,
  Calendar,
  ArrowRight,
  ShieldAlert,
  Clock,
  Layers,
} from 'lucide-react';

const MyTeamsPage = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('teams'); // 'teams' | 'invitations' | 'requests'

  const [teams, setTeams] = useState([]);
  const [invitations, setInvitations] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 4000);
  };

  const fetchAll = async () => {
    try {
      setLoading(true);
      const [teamsRes, invRes, reqRes] = await Promise.all([
        apiClient.get('/teams/me'),
        apiClient.get('/teams/invitations/me'),
        apiClient.get('/teams/join-requests/me'),
      ]);
      setTeams(teamsRes.data.data || []);
      setInvitations(invRes.data.data || []);
      setRequests(reqRes.data.data || []);
    } catch (err) {
      console.error('Error fetching teams data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, [user]);

  // Handle invitation response
  const handleRespondInvitation = async (invitationId, action) => {
    try {
      setActionLoading(true);
      await apiClient.patch(`/teams/invitations/${invitationId}`, { action });
      showToast(action === 'accept' ? 'Joined team successfully!' : 'Invitation declined.');
      fetchAll();
    } catch (err) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const pendingInvitesCount = invitations.filter((i) => i.status === 'pending').length;
  const pendingRequestsCount = requests.filter((r) => r.status === 'pending').length;

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
      <section className="bg-white border-b border-slate-200 py-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
              <Users className="w-7 h-7 text-indigo-600" />
              <span>My Teams & Collaboration</span>
            </h1>
            <p className="text-sm text-slate-500">
              Manage your teams, view invitations from leaders, and track your sent join requests.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/teams"
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition"
            >
              <Compass className="w-4 h-4" />
              <span>Team Finder</span>
            </Link>
            <Link
              to="/teams/create"
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition"
            >
              <Plus className="w-4 h-4" />
              <span>Create New Team</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        <div className="flex border-b border-slate-200 space-x-8">
          <button
            onClick={() => setActiveTab('teams')}
            className={`py-3.5 text-xs font-bold border-b-2 transition flex items-center gap-2 ${
              activeTab === 'teams'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Active Teams ({teams.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('invitations')}
            className={`py-3.5 text-xs font-bold border-b-2 transition flex items-center gap-2 ${
              activeTab === 'invitations'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Mail className="w-4 h-4" />
            <span>Invitations Received</span>
            {pendingInvitesCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-indigo-600 text-white text-[10px] font-bold">
                {pendingInvitesCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('requests')}
            className={`py-3.5 text-xs font-bold border-b-2 transition flex items-center gap-2 ${
              activeTab === 'requests'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Send className="w-4 h-4" />
            <span>My Sent Requests</span>
            {pendingRequestsCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-amber-600 text-white text-[10px] font-bold">
                {pendingRequestsCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-28 rounded-2xl bg-white border border-slate-200 animate-pulse" />
            ))}
          </div>
        ) : activeTab === 'teams' ? (
          /* Active Teams Tab */
          teams.length === 0 ? (
            <div className="py-20 text-center rounded-2xl bg-white border border-slate-200 p-8 space-y-3">
              <Users className="w-12 h-12 text-slate-300 mx-auto" />
              <h3 className="text-lg font-bold text-slate-800">You are not part of any teams yet</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Create a new team for a campus hackathon or discover teams looking for members in the Team Finder.
              </p>
              <div className="flex items-center justify-center gap-3 pt-2">
                <Link
                  to="/teams/create"
                  className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 transition"
                >
                  Create a Team
                </Link>
                <Link
                  to="/teams"
                  className="px-4 py-2 rounded-lg bg-slate-100 text-slate-700 text-xs font-semibold hover:bg-slate-200 transition"
                >
                  Explore Team Finder
                </Link>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {teams.map((team) => {
                const isLeader = team.leader?._id === user?._id || team.leader === user?._id;
                const memberCount = team.members?.length || 1;
                const maxSlots = team.event?.maxTeamSize || 4;

                return (
                  <div
                    key={team._id}
                    className="clean-card p-6 flex flex-col justify-between space-y-4"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 uppercase tracking-wider">
                          {team.event?.title}
                        </span>
                        <StatusBadge status={team.status} size="sm" />
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-base font-bold text-slate-900">{team.name}</h3>
                          {isLeader && (
                            <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-bold">
                              Leader
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 line-clamp-2 mt-1">
                          {team.description || 'No description provided.'}
                        </p>
                      </div>

                      {/* Roster overview */}
                      <div className="space-y-1.5 pt-1">
                        <div className="flex justify-between text-xs text-slate-600 font-medium">
                          <span>Team Size:</span>
                          <span className="font-bold text-slate-900">
                            {memberCount} / {maxSlots} members
                          </span>
                        </div>
                        {/* Member avatars */}
                        <div className="flex -space-x-2 overflow-hidden py-1">
                          {team.members?.map((m, idx) => (
                            <div
                              key={idx}
                              className="inline-block h-7 w-7 rounded-full ring-2 ring-white bg-slate-200 text-slate-700 text-[10px] font-bold flex items-center justify-center uppercase"
                              title={`${m.user?.name} (${m.role})`}
                            >
                              {m.user?.name?.slice(0, 2) || 'TM'}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-[11px] text-slate-500 font-medium">
                        {team.status === 'registered' ? 'Registered for Event' : 'Team Forming'}
                      </span>

                      <Link
                        to={`/teams/${team._id}`}
                        className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-1 shadow-xs transition"
                      >
                        <span>Manage Team</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )
        ) : activeTab === 'invitations' ? (
          /* Received Invitations Tab */
          invitations.length === 0 ? (
            <div className="py-20 text-center rounded-2xl bg-white border border-slate-200 p-8 space-y-3">
              <Mail className="w-12 h-12 text-slate-300 mx-auto" />
              <h3 className="text-lg font-bold text-slate-800">No invitations received</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                When team leaders invite you to join their squads, their invites will appear here for you to accept or decline.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {invitations.map((inv) => (
                <div
                  key={inv._id}
                  className="clean-card p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 text-xs font-semibold">
                        {inv.event?.title}
                      </span>
                      <StatusBadge status={inv.status} size="sm" />
                    </div>

                    <h4 className="text-base font-bold text-slate-900">
                      Invitation to join team "{inv.team?.name}"
                    </h4>

                    <p className="text-xs text-slate-600">
                      From leader <strong>{inv.sender?.name}</strong> • Role offered: <strong>{inv.invitedRole}</strong>
                    </p>

                    {inv.message && (
                      <p className="text-xs text-slate-500 italic bg-slate-50 p-2 rounded-lg border border-slate-200 max-w-lg">
                        "{inv.message}"
                      </p>
                    )}
                  </div>

                  {inv.status === 'pending' && (
                    <div className="flex items-center gap-2 self-start sm:self-auto">
                      <button
                        type="button"
                        disabled={actionLoading}
                        onClick={() => handleRespondInvitation(inv._id, 'reject')}
                        className="px-3.5 py-1.5 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-semibold transition"
                      >
                        Decline
                      </button>
                      <button
                        type="button"
                        disabled={actionLoading}
                        onClick={() => handleRespondInvitation(inv._id, 'accept')}
                        className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs transition"
                      >
                        Accept Invitation
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )
        ) : (
          /* My Sent Join Requests Tab */
          requests.length === 0 ? (
            <div className="py-20 text-center rounded-2xl bg-white border border-slate-200 p-8 space-y-3">
              <Send className="w-12 h-12 text-slate-300 mx-auto" />
              <h3 className="text-lg font-bold text-slate-800">No join requests sent</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Explore the Team Finder to apply to teams looking for your skills!
              </p>
              <Link
                to="/teams"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 transition"
              >
                <span>Browse Team Finder</span>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {requests.map((req) => (
                <div
                  key={req._id}
                  className="clean-card p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 text-xs font-semibold">
                        {req.event?.title}
                      </span>
                      <StatusBadge status={req.status} size="sm" />
                    </div>

                    <h4 className="text-base font-bold text-slate-900">
                      Application to join team "{req.team?.name}"
                    </h4>

                    <p className="text-xs text-slate-600">
                      Applied as: <strong>{req.desiredRole}</strong>
                    </p>

                    {req.message && (
                      <p className="text-xs text-slate-500 italic bg-slate-50 p-2 rounded-lg border border-slate-200 max-w-lg">
                        "{req.message}"
                      </p>
                    )}
                  </div>

                  <span className="text-xs font-medium text-slate-500">
                    Applied on {new Date(req.createdAt).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          )
        )}
      </main>
    </div>
  );
};

export default MyTeamsPage;
