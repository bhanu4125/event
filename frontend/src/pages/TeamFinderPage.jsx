import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../api/apiClient';
import { useAuth } from '../context/AuthContext';
import {
  Users,
  Search,
  Plus,
  Send,
  Calendar,
  Layers,
  Sparkles,
  CheckCircle2,
  Clock,
  Filter,
  ArrowRight,
} from 'lucide-react';

const TeamFinderPage = () => {
  const { user } = useAuth();
  const [teams, setTeams] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedEventId, setSelectedEventId] = useState('');
  const [skillFilter, setSkillFilter] = useState('');

  // Request modal
  const [joinModalTeam, setJoinModalTeam] = useState(null);
  const [desiredRole, setDesiredRole] = useState('Fullstack Developer');
  const [joinMessage, setJoinMessage] = useState('');
  const [submittingJoin, setSubmittingJoin] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const fetchTeams = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();
      if (selectedEventId) queryParams.append('eventId', selectedEventId);
      if (skillFilter.trim()) queryParams.append('skill', skillFilter.trim());
      if (search.trim()) queryParams.append('search', search.trim());

      const res = await apiClient.get(`/teams?${queryParams.toString()}`);
      setTeams(res.data.data || []);
    } catch (err) {
      console.error('Error fetching teams:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchTeamEvents = async () => {
    try {
      const res = await apiClient.get('/events/public?eventType=Team');
      setEvents(res.data.data || []);
    } catch (err) {}
  };

  useEffect(() => {
    fetchTeamEvents();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchTeams();
    }, 200);
    return () => clearTimeout(timer);
  }, [search, selectedEventId, skillFilter]);

  const handleSendJoinRequest = async () => {
    if (!joinModalTeam) return;
    try {
      setSubmittingJoin(true);
      await apiClient.post(`/teams/${joinModalTeam._id}/join-requests`, {
        desiredRole,
        message: joinMessage,
      });
      setToastMessage(`Join request sent to ${joinModalTeam.name}!`);
      setTimeout(() => setToastMessage(''), 4000);
      setJoinModalTeam(null);
      setJoinMessage('');
      fetchTeams();
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmittingJoin(false);
    }
  };

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
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
                <Users className="w-7 h-7 text-indigo-600" />
                <span>Team Finder & Recruitment</span>
              </h1>
              <p className="text-sm text-slate-500">
                Find teams actively recruiting members for campus hackathons and competitions, or create your own team.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Link
                to="/teams/me"
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition"
              >
                My Teams & Requests
              </Link>
              <Link
                to="/teams/create"
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition"
              >
                <Plus className="w-4 h-4" />
                <span>Create a Team</span>
              </Link>
            </div>
          </div>

          {/* Search & Event Filters */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="relative">
              <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search teams by name or goal..."
                className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-300 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
              />
            </div>

            <select
              value={selectedEventId}
              onChange={(e) => setSelectedEventId(e.target.value)}
              className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">All Team Events</option>
              {events.map((e) => (
                <option key={e._id} value={e._id}>
                  {e.title}
                </option>
              ))}
            </select>

            <input
              type="text"
              value={skillFilter}
              onChange={(e) => setSkillFilter(e.target.value)}
              placeholder="Filter by skill (e.g. React, Python, UI)..."
              className="px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-300 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
            />
          </div>
        </div>
      </section>

      {/* Teams Grid */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-64 rounded-2xl bg-white border border-slate-200 animate-pulse"
              />
            ))}
          </div>
        ) : teams.length === 0 ? (
          <div className="py-20 text-center rounded-2xl bg-white border border-slate-200 p-8 space-y-3">
            <Users className="w-12 h-12 text-slate-300 mx-auto" />
            <h3 className="text-lg font-bold text-slate-800">No recruiting teams found</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              There are currently no public teams seeking members matching your filters. Why not start your own team?
            </p>
            <Link
              to="/teams/create"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 transition mt-2"
            >
              <Plus className="w-4 h-4" />
              <span>Create Team Now</span>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {teams.map((team) => {
              const openSlots = team.openSlots || 0;
              const isUserMember = team.members.some(
                (m) => m.user?._id === user?._id || m.user === user?._id
              );

              return (
                <div
                  key={team._id}
                  className="clean-card p-6 flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-3">
                    {/* Event Tag */}
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 uppercase tracking-wider">
                        {team.event?.title || 'Campus Event'}
                      </span>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {openSlots} slot{openSlots !== 1 ? 's' : ''} left
                      </span>
                    </div>

                    <div>
                      <h3 className="text-base font-bold text-slate-900 line-clamp-1">
                        {team.name}
                      </h3>
                      <p className="text-xs text-slate-500 line-clamp-2 mt-1">
                        {team.description || 'No description provided.'}
                      </p>
                    </div>

                    {/* Leader info */}
                    <div className="flex items-center gap-2 pt-1 text-xs text-slate-600">
                      <span className="text-slate-400">Led by</span>
                      <strong className="text-slate-800">{team.leader?.name}</strong>
                      <span>({team.leader?.department})</span>
                    </div>

                    {/* Open Roles */}
                    {team.openRoles && team.openRoles.length > 0 && (
                      <div className="space-y-1 pt-1">
                        <span className="text-[11px] font-semibold text-slate-500 block">
                          Seeking Roles:
                        </span>
                        <div className="flex flex-wrap gap-1">
                          {team.openRoles.map((role, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[11px] font-medium"
                            >
                              {role}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Required Skills */}
                    {team.requiredSkills && team.requiredSkills.length > 0 && (
                      <div className="space-y-1">
                        <span className="text-[11px] font-semibold text-slate-500 block">
                          Desired Skills:
                        </span>
                        <div className="flex flex-wrap gap-1">
                          {team.requiredSkills.map((sk, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 text-[11px] font-medium"
                            >
                              {sk}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-xs text-slate-500 font-medium">
                      {team.memberCount} of {team.maxSlots} members
                    </span>

                    <div className="flex items-center gap-2">
                      <Link
                        to={`/teams/${team._id}`}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition"
                      >
                        View Team
                      </Link>

                      {!isUserMember && openSlots > 0 && (
                        <button
                          type="button"
                          onClick={() => {
                            setJoinModalTeam(team);
                            setDesiredRole(team.openRoles?.[0] || 'Member');
                          }}
                          className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-1 shadow-sm transition"
                        >
                          <Send className="w-3 h-3" />
                          <span>Request to Join</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Join Request Modal */}
      {joinModalTeam && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="relative w-full max-w-md p-6 rounded-2xl bg-white border border-slate-200 shadow-xl space-y-4">
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-slate-900">
                Join Team "{joinModalTeam.name}"
              </h3>
              <p className="text-xs text-slate-500">
                Send an application to {joinModalTeam.leader?.name}. They will review your profile and skills.
              </p>
            </div>

            <div className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Desired Role in Team</label>
                <input
                  type="text"
                  value={desiredRole}
                  onChange={(e) => setDesiredRole(e.target.value)}
                  placeholder="e.g. Frontend Developer, Designer, AI Specialist"
                  className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Introductory Message</label>
                <textarea
                  rows={3}
                  value={joinMessage}
                  onChange={(e) => setJoinMessage(e.target.value)}
                  placeholder="Tell the leader about your skills and what you can bring to the project..."
                  className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setJoinModalTeam(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={submittingJoin}
                onClick={handleSendJoinRequest}
                className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition"
              >
                {submittingJoin ? 'Sending...' : 'Send Join Request'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamFinderPage;
