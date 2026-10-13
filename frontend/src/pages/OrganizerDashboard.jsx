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
  Eye,
  AlertCircle,
  CheckCircle,
  Users,
  Search,
  RefreshCw,
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

  // Submit for approval
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
          showToast(err.message || 'Failed to submit event');
          setModalConfig((prev) => ({ ...prev, isOpen: false }));
          fetchOrganizerData();
        } finally {
          setActionLoading(false);
        }
      },
    });
  };

  // Publish event
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

  // Cancel event
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
          await apiClient.post(`/events/${event._id}/cancel`, { reason });
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
    <div className="min-h-screen pb-20 bg-[#F8FAFC]">
      {/* Toast Alert */}
      {notificationMsg && (
        <div className="fixed bottom-6 right-6 z-50 p-4 rounded-xl bg-indigo-600 text-white shadow-xl flex items-center gap-2.5 text-xs font-semibold animate-in slide-in-from-bottom duration-200">
          <CheckCircle className="w-4 h-4 shrink-0" />
          <span>{notificationMsg}</span>
        </div>
      )}

      {/* Header */}
      <section className="bg-white border-b border-slate-200 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
              <Layers className="w-7 h-7 text-indigo-600" />
              <span>Organizer Studio</span>
            </h1>
            <p className="text-sm text-slate-500">
              Manage event lifecycle: drafts, admin approval workflow, publishing, and attendee registrations.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={fetchOrganizerData}
              className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 transition"
              title="Refresh"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <Link
              to="/organizer/events/new"
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition"
            >
              <Plus className="w-4 h-4" />
              <span>Create New Event</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Main Body */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 space-y-6">
        {/* KPI Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="clean-card p-4 space-y-1">
            <span className="text-xs text-slate-500 font-medium">Total Events</span>
            <p className="text-2xl font-black text-slate-900">{stats.total}</p>
          </div>

          <div className="clean-card p-4 space-y-1">
            <span className="text-xs text-slate-500 font-medium">Drafts</span>
            <p className="text-2xl font-black text-slate-700">{stats.draft}</p>
          </div>

          <div className="clean-card p-4 bg-amber-50/50 border-amber-200 space-y-1">
            <span className="text-xs text-amber-800 font-medium">Pending Review</span>
            <p className="text-2xl font-black text-amber-700">{stats.pending}</p>
          </div>

          <div className="clean-card p-4 bg-orange-50/50 border-orange-200 space-y-1">
            <span className="text-xs text-orange-800 font-medium">Changes Needed</span>
            <p className="text-2xl font-black text-orange-700">{stats.changesRequested}</p>
          </div>

          <div className="clean-card p-4 bg-emerald-50/50 border-emerald-200 space-y-1">
            <span className="text-xs text-emerald-800 font-medium">Approved</span>
            <p className="text-2xl font-black text-emerald-700">{stats.approved}</p>
          </div>

          <div className="clean-card p-4 bg-indigo-50/50 border-indigo-200 space-y-1">
            <span className="text-xs text-indigo-800 font-medium">Live Published</span>
            <p className="text-2xl font-black text-indigo-700">{stats.published}</p>
          </div>
        </div>

        {/* Filter Tabs & Search */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-2">
          <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-xl bg-slate-100 border border-slate-200 text-xs font-semibold">
            {[
              { id: 'All', label: 'All' },
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
                className={`px-3 py-1.5 rounded-lg transition ${
                  statusFilter === tab.id
                    ? 'bg-white text-indigo-700 shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="relative">
            <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search your events..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchOrganizerData()}
              className="pl-9 pr-4 py-2 rounded-xl bg-white border border-slate-300 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full sm:w-64"
            />
          </div>
        </div>

        {/* Event List */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-28 rounded-2xl bg-white border border-slate-200 animate-pulse" />
            ))}
          </div>
        ) : events.length === 0 ? (
          <div className="p-12 text-center rounded-2xl bg-white border border-slate-200 space-y-3">
            <Layers className="w-12 h-12 text-slate-300 mx-auto" />
            <h3 className="text-base font-bold text-slate-800">No events found in this category</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Create a new event or adjust the status filter above.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {events.map((evt) => {
              const hasRemarks =
                evt.status === 'changes_requested' || (evt.status === 'rejected' && evt.rejectionReason);

              return (
                <div
                  key={evt._id}
                  className="clean-card p-5 space-y-4"
                >
                  {/* Admin feedback banner */}
                  {hasRemarks && (
                    <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start justify-between gap-3">
                      <div className="flex items-start gap-2.5">
                        <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                        <div>
                          <strong className="text-amber-800 font-bold block mb-0.5">
                            Admin Feedback ({evt.status === 'changes_requested' ? 'Action Required' : 'Rejected'}):
                          </strong>
                          <p className="text-amber-800 leading-relaxed whitespace-pre-wrap">
                            {evt.adminFeedback || evt.rejectionReason}
                          </p>
                        </div>
                      </div>
                      <Link
                        to={`/organizer/events/edit/${evt._id}`}
                        className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold shrink-0 text-xs transition"
                      >
                        Edit & Resubmit
                      </Link>
                    </div>
                  )}

                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <img
                        src={evt.posterUrl}
                        alt={evt.title}
                        className="h-20 w-28 rounded-xl object-cover bg-slate-100 shrink-0 border border-slate-200"
                        onError={(e) => {
                          e.target.src =
                            'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&auto=format&fit=crop&q=80';
                        }}
                      />
                      <div className="space-y-1.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <StatusBadge status={evt.status} size="sm" />
                          <span className="text-[11px] font-semibold text-slate-600 px-2 py-0.5 rounded bg-slate-100">
                            {evt.category}
                          </span>
                          <span className="text-[11px] font-semibold text-slate-500">
                            {evt.eventType}
                          </span>
                        </div>
                        <h3
                          className="text-base font-bold text-slate-900 hover:text-indigo-600 transition cursor-pointer"
                          onClick={() => setPreviewEvent(evt)}
                        >
                          {evt.title}
                        </h3>
                        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                            {new Date(evt.eventDate).toLocaleDateString()}
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Users className="w-3.5 h-3.5 text-purple-600" />
                            {evt.currentRegistrations || 0} / {evt.maxCapacity} Registrations
                          </span>
                          <span>•</span>
                          <span>{evt.venue}</span>
                        </div>
                      </div>
                    </div>

                    {/* State Actions */}
                    <div className="flex flex-wrap items-center gap-2 pt-2 lg:pt-0">
                      <button
                        onClick={() => setPreviewEvent(evt)}
                        className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold flex items-center gap-1.5 transition"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Preview</span>
                      </button>

                      {['draft', 'changes_requested', 'rejected', 'pending_approval'].includes(evt.status) && (
                        <Link
                          to={`/organizer/events/edit/${evt._id}`}
                          className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold flex items-center gap-1.5 transition"
                        >
                          <Edit className="w-3.5 h-3.5" />
                          <span>Edit</span>
                        </Link>
                      )}

                      {['draft', 'changes_requested', 'rejected'].includes(evt.status) && (
                        <button
                          onClick={() => handleSubmitForApproval(evt)}
                          className="px-3.5 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold flex items-center gap-1.5 transition shadow-2xs"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>{evt.status === 'draft' ? 'Submit for Review' : 'Resubmit'}</span>
                        </button>
                      )}

                      {evt.status === 'approved' && (
                        <button
                          onClick={() => handlePublish(evt)}
                          className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition"
                        >
                          <Globe className="w-3.5 h-3.5" />
                          <span>Publish Live Now</span>
                        </button>
                      )}

                      {['approved', 'published'].includes(evt.status) && (
                        <button
                          onClick={() => handleCancel(evt)}
                          className="px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-1.5 transition"
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
      </main>

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
