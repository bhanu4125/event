import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import apiClient from '../api/apiClient';
import { useAuth } from '../context/AuthContext';
import StatusBadge from '../components/common/StatusBadge';
import ConfirmationModal from '../components/common/ConfirmationModal';
import EventDetailModal from '../components/common/EventDetailModal';
import {
  Plus,
  Calendar,
  Layers,
  Send,
  Globe,
  Edit,
  Trash2,
  Eye,
  AlertCircle,
  CheckCircle,
  Clock,
  Users,
  Search,
  Filter,
  RefreshCw,
  MessageSquare,
  XCircle,
} from 'lucide-react';

const OrganizerDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [events, setEvents] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    draft: 0,
    pending: 0,
    changesRequested: 0,
    approved: 0,
    published: 0,
    rejected: 0,
    totalRegistrations: 0,
  });
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');

  // Modals state
  const [previewEvent, setPreviewEvent] = useState(null);
  const [modalConfig, setModalConfig] = useState({
    isOpen: false,
    title: '',
    message: '',
    confirmText: '',
    type: 'warning',
    requireInput: false,
    inputLabel: '',
    inputPlaceholder: '',
    onConfirm: () => {},
  });
  const [actionLoading, setActionLoading] = useState(false);
  const [notificationMsg, setNotificationMsg] = useState('');

  const fetchOrganizerData = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();
      if (statusFilter !== 'All') queryParams.append('status', statusFilter);
      if (searchTerm.trim()) queryParams.append('search', searchTerm.trim());

      const res = await apiClient.get(`/events/organizer/my-events?${queryParams.toString()}`);
      setEvents(res.data.data || []);
      if (res.data.stats) {
        setStats(res.data.stats);
      }
    } catch (err) {
      console.error('Error fetching organizer events:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrganizerData();
  }, [statusFilter]);

  const showToast = (msg) => {
    setNotificationMsg(msg);
    setTimeout(() => setNotificationMsg(''), 4000);
  };

  // Action: Submit for approval
  const handleSubmitForApproval = (event) => {
    const isResubmit = event.status === 'changes_requested' || event.status === 'rejected';
    setModalConfig({
      isOpen: true,
      title: isResubmit ? 'Resubmit Event for Approval' : 'Submit Event for Admin Approval',
      message: isResubmit
        ? `Are you ready to resubmit "${event.title}" to the administration after addressing feedback?`
        : `Submit "${event.title}" to campus administration for formal review and approval.`,
      confirmText: isResubmit ? 'Resubmit Event' : 'Submit for Review',
      type: 'warning',
      requireInput: false,
      onConfirm: async () => {
        try {
          setActionLoading(true);
          const res = await apiClient.post(`/events/${event._id}/submit`);
          showToast(res.data.message || 'Event submitted successfully!');
          setModalConfig((prev) => ({ ...prev, isOpen: false }));
          fetchOrganizerData();
        } catch (err) {
          alert(err.message);
        } finally {
          setActionLoading(false);
        }
      },
    });
  };

  // Action: Publish approved event
  const handlePublish = (event) => {
    if (event.status !== 'approved') {
      alert('Only approved events can be published to the campus directory!');
      return;
    }

    setModalConfig({
      isOpen: true,
      title: 'Publish Event Live',
      message: `Publish "${event.title}" to the student directory? All enrolled students will be able to discover and register for it immediately.`,
      confirmText: 'Publish Live',
      type: 'success',
      requireInput: false,
      onConfirm: async () => {
        try {
          setActionLoading(true);
          const res = await apiClient.post(`/events/${event._id}/publish`);
          showToast(res.data.message || 'Event is now officially published live!');
          setModalConfig((prev) => ({ ...prev, isOpen: false }));
          fetchOrganizerData();
        } catch (err) {
          alert(err.message);
        } finally {
          setActionLoading(false);
        }
      },
    });
  };

  // Action: Cancel event
  const handleCancel = (event) => {
    setModalConfig({
      isOpen: true,
      title: 'Cancel Campus Event',
      message: `Are you sure you want to cancel "${event.title}"? Please provide a clear cancellation reason for students and administrators.`,
      confirmText: 'Confirm Cancellation',
      type: 'danger',
      requireInput: true,
      inputLabel: 'Cancellation Reason',
      inputPlaceholder: 'e.g., Unforeseen speaker illness, weather conditions, scheduling conflict...',
      onConfirm: async (reason) => {
        try {
          setActionLoading(true);
          const res = await apiClient.post(`/events/${event._id}/cancel`, { reason });
          showToast('Event has been cancelled.');
          setModalConfig((prev) => ({ ...prev, isOpen: false }));
          fetchOrganizerData();
        } catch (err) {
          alert(err.message);
        } finally {
          setActionLoading(false);
        }
      },
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Toast Notification */}
      {notificationMsg && (
        <div className="fixed bottom-6 right-6 z-50 p-4 rounded-2xl bg-indigo-600 text-white shadow-2xl flex items-center gap-3 animate-in slide-in-from-bottom duration-300">
          <CheckCircle className="w-5 h-5 shrink-0" />
          <span className="text-sm font-semibold">{notificationMsg}</span>
        </div>
      )}

      {/* Header & Quick Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-black text-white tracking-tight">Organizer Studio</h1>
            <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-400 text-xs font-bold border border-indigo-500/30">
              Workspace
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Manage your events lifecycle from initial draft through campus admin approval and live publishing.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchOrganizerData}
            className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition"
            title="Refresh events"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <Link
            to="/organizer/events/new"
            className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm flex items-center gap-2 shadow-lg shadow-indigo-600/30 transition hover:scale-[1.02]"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Event</span>
          </Link>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800/80 space-y-1">
          <span className="text-xs text-slate-400 font-medium">Total Events</span>
          <p className="text-2xl font-black text-white">{stats.total}</p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800/80 space-y-1">
          <span className="text-xs text-slate-400 font-medium">Drafts</span>
          <p className="text-2xl font-black text-slate-300">{stats.draft}</p>
        </div>

        <div className="p-4 rounded-2xl bg-amber-950/20 border border-amber-800/40 space-y-1">
          <span className="text-xs text-amber-300 font-medium">Pending Review</span>
          <p className="text-2xl font-black text-amber-400">{stats.pending}</p>
        </div>

        <div className="p-4 rounded-2xl bg-orange-950/20 border border-orange-800/40 space-y-1">
          <span className="text-xs text-orange-300 font-medium">Needs Changes</span>
          <p className="text-2xl font-black text-orange-400">{stats.changesRequested}</p>
        </div>

        <div className="p-4 rounded-2xl bg-emerald-950/20 border border-emerald-800/40 space-y-1">
          <span className="text-xs text-emerald-300 font-medium">Approved</span>
          <p className="text-2xl font-black text-emerald-400">{stats.approved}</p>
        </div>

        <div className="p-4 rounded-2xl bg-indigo-950/20 border border-indigo-800/40 space-y-1">
          <span className="text-xs text-indigo-300 font-medium">Published Live</span>
          <p className="text-2xl font-black text-indigo-400">{stats.published}</p>
        </div>
      </div>

      {/* Filter Tabs & Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-2">
        <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-2xl bg-slate-900/90 border border-slate-800/80 text-xs font-semibold">
          {[
            { id: 'All', label: 'All Events' },
            { id: 'draft', label: 'Drafts' },
            { id: 'pending_approval', label: 'Pending' },
            { id: 'changes_requested', label: 'Changes Requested' },
            { id: 'approved', label: 'Approved' },
            { id: 'published', label: 'Live' },
            { id: 'cancelled', label: 'Cancelled' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 rounded-xl transition ${
                statusFilter === tab.id
                  ? 'bg-indigo-600 text-white shadow'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative">
          <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search your events..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchOrganizerData()}
            className="pl-9 pr-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 w-full sm:w-64"
          />
        </div>
      </div>

      {/* Event Cards & Action Rows */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-28 rounded-2xl bg-slate-900/40 border border-slate-800 animate-pulse" />
          ))}
        </div>
      ) : events.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-slate-900/40 border border-slate-800/80 space-y-3">
          <Layers className="w-12 h-12 text-slate-600 mx-auto" />
          <h3 className="text-base font-bold text-white">No events found in this view</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            You don't have any events matching the selected filter. Create a new event or adjust your filter.
          </p>
          <Link
            to="/organizer/events/new"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-500 transition mt-2"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create Event Now</span>
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {events.map((evt) => {
            const hasRemarks =
              evt.status === 'changes_requested' || (evt.status === 'rejected' && evt.rejectionReason);

            return (
              <div
                key={evt._id}
                className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800/80 hover:border-slate-700 transition space-y-4"
              >
                {/* Admin Remarks alert if changes requested */}
                {hasRemarks && (
                  <div className="p-3.5 rounded-xl bg-orange-950/40 border border-orange-800/60 text-xs text-orange-200 flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2.5">
                      <AlertCircle className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-orange-300 font-bold block mb-0.5">
                          Admin Feedback ({evt.status === 'changes_requested' ? 'Action Required' : 'Rejected'}):
                        </strong>
                        <p className="text-orange-100/90 leading-relaxed whitespace-pre-wrap">
                          {evt.adminFeedback || evt.rejectionReason}
                        </p>
                      </div>
                    </div>
                    <Link
                      to={`/organizer/events/edit/${evt._id}`}
                      className="px-3 py-1.5 rounded-lg bg-orange-600 hover:bg-orange-500 text-white font-bold shrink-0 text-xs transition"
                    >
                      Edit & Resubmit
                    </Link>
                  </div>
                )}

                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Left: Thumbnail & Details */}
                  <div className="flex items-start gap-4">
                    <img
                      src={evt.posterUrl}
                      alt={evt.title}
                      className="h-20 w-28 rounded-xl object-cover bg-slate-950 shrink-0 border border-slate-800"
                      onError={(e) => {
                        e.target.src =
                          'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&auto=format&fit=crop&q=80';
                      }}
                    />
                    <div className="space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <StatusBadge status={evt.status} size="sm" />
                        <span className="text-[11px] font-semibold text-slate-400 px-2 py-0.5 rounded bg-slate-800">
                          {evt.category}
                        </span>
                        <span className="text-[11px] font-semibold text-slate-400">
                          {evt.eventType}
                        </span>
                      </div>
                      <h3 className="text-base font-bold text-white hover:text-indigo-300 transition cursor-pointer"
                        onClick={() => setPreviewEvent(evt)}>
                        {evt.title}
                      </h3>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                          {new Date(evt.eventDate).toLocaleDateString()}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Users className="w-3.5 h-3.5 text-purple-400" />
                          {evt.currentRegistrations || 0} / {evt.maxCapacity} Registrations
                        </span>
                        <span>•</span>
                        <span>{evt.venue}</span>
                      </div>
                    </div>
                  </div>

                  {/* Right: State Transition Buttons */}
                  <div className="flex flex-wrap items-center gap-2 pt-2 lg:pt-0">
                    {/* Preview Button */}
                    <button
                      onClick={() => setPreviewEvent(evt)}
                      className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Preview</span>
                    </button>

                    {/* Edit button (enabled for draft, changes_requested, rejected, pending) */}
                    {['draft', 'changes_requested', 'rejected', 'pending_approval'].includes(
                      evt.status
                    ) && (
                      <Link
                        to={`/organizer/events/edit/${evt._id}`}
                        className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition"
                      >
                        <Edit className="w-3.5 h-3.5" />
                        <span>Edit</span>
                      </Link>
                    )}

                    {/* Submit for Approval (Draft or Changes Requested or Rejected) */}
                    {['draft', 'changes_requested', 'rejected'].includes(evt.status) && (
                      <button
                        onClick={() => handleSubmitForApproval(evt)}
                        className="px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-amber-600/20 transition"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>
                          {evt.status === 'draft' ? 'Submit for Approval' : 'Resubmit'}
                        </span>
                      </button>
                    )}

                    {/* Publish Button (Only allowed if status is 'approved') */}
                    {evt.status === 'approved' && (
                      <button
                        onClick={() => handlePublish(evt)}
                        className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black flex items-center gap-1.5 shadow-lg shadow-emerald-600/30 transition animate-pulse"
                      >
                        <Globe className="w-3.5 h-3.5" />
                        <span>Publish Live Now</span>
                      </button>
                    )}

                    {/* Cancel button (allowed if approved or published) */}
                    {['approved', 'published'].includes(evt.status) && (
                      <button
                        onClick={() => handleCancel(evt)}
                        className="px-3 py-1.5 rounded-xl bg-rose-950/60 hover:bg-rose-900/60 border border-rose-800/50 text-rose-300 text-xs font-semibold flex items-center gap-1.5 transition"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Cancel Event</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={modalConfig.isOpen}
        onClose={() => setModalConfig((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={modalConfig.onConfirm}
        title={modalConfig.title}
        message={modalConfig.message}
        confirmText={modalConfig.confirmText}
        type={modalConfig.type}
        requireInput={modalConfig.requireInput}
        inputLabel={modalConfig.inputLabel}
        inputPlaceholder={modalConfig.inputPlaceholder}
        isLoading={actionLoading}
      />

      {/* Preview Modal */}
      <EventDetailModal
        isOpen={!!previewEvent}
        onClose={() => setPreviewEvent(null)}
        event={previewEvent}
      />
    </div>
  );
};

export default OrganizerDashboard;
