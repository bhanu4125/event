import React, { useState, useEffect } from 'react';
import apiClient from '../api/apiClient';
import { useAuth } from '../context/AuthContext';
import StatusBadge from '../components/common/StatusBadge';
import ConfirmationModal from '../components/common/ConfirmationModal';
import EventDetailModal from '../components/common/EventDetailModal';
import {
  ShieldAlert,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Search,
  Filter,
  Eye,
  Calendar,
  Users,
  Clock,
  MapPin,
  RefreshCw,
  FileCheck,
  AlertTriangle,
  History,
  Info,
} from 'lucide-react';

const AdminApprovalPage = () => {
  const { user } = useAuth();

  const [events, setEvents] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    changesRequested: 0,
    approved: 0,
    published: 0,
    rejected: 0,
  });
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('pending_approval');
  const [searchTerm, setSearchTerm] = useState('');
  const [toastMessage, setToastMessage] = useState('');

  // Modals
  const [detailEvent, setDetailEvent] = useState(null);
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

  const fetchAdminEvents = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();
      if (statusFilter !== 'All') queryParams.append('status', statusFilter);
      if (searchTerm.trim()) queryParams.append('search', searchTerm.trim());

      const res = await apiClient.get(`/events/admin/all?${queryParams.toString()}`);
      setEvents(res.data.data || []);
      if (res.data.stats) {
        setStats(res.data.stats);
      }
    } catch (err) {
      console.error('Admin events fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminEvents();
  }, [statusFilter]);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 4000);
  };

  // 1. Approve
  const handleApprove = (evt) => {
    setModalConfig({
      isOpen: true,
      title: 'Approve Campus Event',
      message: `Approve "${evt.title}" organized by ${evt.organizer?.name}? The organizer will be notified immediately and permitted to publish it live to the campus directory.`,
      confirmText: 'Grant Approval',
      type: 'success',
      requireInput: false,
      onConfirm: async () => {
        try {
          setActionLoading(true);
          const res = await apiClient.post(`/events/${evt._id}/approve`, {
            comments: 'Approved by Campus Administration',
          });
          showToast(res.data.message || 'Event approved successfully!');
          setModalConfig((prev) => ({ ...prev, isOpen: false }));
          fetchAdminEvents();
        } catch (err) {
          alert(err.message);
        } finally {
          setActionLoading(false);
        }
      },
    });
  };

  // 2. Request Modifications
  const handleRequestChanges = (evt) => {
    setModalConfig({
      isOpen: true,
      title: 'Request Modifications',
      message: `Request adjustments for "${evt.title}". Specify the required changes in detail so the organizer can revise and resubmit.`,
      confirmText: 'Request Changes',
      type: 'warning',
      requireInput: true,
      inputLabel: 'Required Changes / Administrative Feedback',
      inputPlaceholder: 'e.g., Please attach proof of safety clearances and reduce team size limit to 4...',
      onConfirm: async (comments) => {
        try {
          setActionLoading(true);
          const res = await apiClient.post(`/events/${evt._id}/request-changes`, { comments });
          showToast(res.data.message || 'Modifications requested.');
          setModalConfig((prev) => ({ ...prev, isOpen: false }));
          fetchAdminEvents();
        } catch (err) {
          alert(err.message);
        } finally {
          setActionLoading(false);
        }
      },
    });
  };

  // 3. Reject (Mandatory reason)
  const handleReject = (evt) => {
    setModalConfig({
      isOpen: true,
      title: 'Reject Event Submission',
      message: `Reject "${evt.title}"? A mandatory justification reason is required for administrative compliance.`,
      confirmText: 'Reject Submission',
      type: 'danger',
      requireInput: true,
      inputLabel: 'Mandatory Rejection Reason',
      inputPlaceholder: 'e.g., Conflicts with university-wide examination schedule and violates campus decibel guidelines.',
      onConfirm: async (reason) => {
        try {
          setActionLoading(true);
          const res = await apiClient.post(`/events/${evt._id}/reject`, { reason });
          showToast(res.data.message || 'Event rejected.');
          setModalConfig((prev) => ({ ...prev, isOpen: false }));
          fetchAdminEvents();
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
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 p-4 rounded-2xl bg-emerald-600 text-white shadow-2xl flex items-center gap-3 animate-in slide-in-from-bottom duration-300">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span className="text-sm font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-black text-white tracking-tight">Approval Desk</h1>
            <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 text-xs font-bold border border-amber-500/30">
              Admin Governance
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Review event proposals, enforce compliance, request revisions, and manage official university approvals.
          </p>
        </div>

        <button
          onClick={fetchAdminEvents}
          className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition self-start sm:self-auto"
          title="Refresh Queue"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div
          onClick={() => setStatusFilter('pending_approval')}
          className={`p-4 rounded-2xl border cursor-pointer transition ${
            statusFilter === 'pending_approval'
              ? 'bg-amber-950/40 border-amber-500/80 shadow-lg shadow-amber-500/10'
              : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs text-amber-300 font-semibold">Pending Review</span>
            <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
          </div>
          <p className="text-2xl font-black text-amber-400 mt-2">{stats.pending}</p>
        </div>

        <div
          onClick={() => setStatusFilter('changes_requested')}
          className={`p-4 rounded-2xl border cursor-pointer transition ${
            statusFilter === 'changes_requested'
              ? 'bg-orange-950/40 border-orange-500/80 shadow-lg shadow-orange-500/10'
              : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
          }`}
        >
          <span className="text-xs text-orange-300 font-medium">Revisions Requested</span>
          <p className="text-2xl font-black text-orange-400 mt-2">{stats.changesRequested}</p>
        </div>

        <div
          onClick={() => setStatusFilter('approved')}
          className={`p-4 rounded-2xl border cursor-pointer transition ${
            statusFilter === 'approved'
              ? 'bg-emerald-950/40 border-emerald-500/80 shadow-lg shadow-emerald-500/10'
              : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
          }`}
        >
          <span className="text-xs text-emerald-300 font-medium">Approved</span>
          <p className="text-2xl font-black text-emerald-400 mt-2">{stats.approved}</p>
        </div>

        <div
          onClick={() => setStatusFilter('published')}
          className={`p-4 rounded-2xl border cursor-pointer transition ${
            statusFilter === 'published'
              ? 'bg-indigo-950/40 border-indigo-500/80 shadow-lg shadow-indigo-500/10'
              : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
          }`}
        >
          <span className="text-xs text-indigo-300 font-medium">Live on Campus</span>
          <p className="text-2xl font-black text-indigo-400 mt-2">{stats.published}</p>
        </div>

        <div
          onClick={() => setStatusFilter('rejected')}
          className={`p-4 rounded-2xl border cursor-pointer transition ${
            statusFilter === 'rejected'
              ? 'bg-rose-950/40 border-rose-500/80 shadow-lg shadow-rose-500/10'
              : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
          }`}
        >
          <span className="text-xs text-rose-300 font-medium">Rejected</span>
          <p className="text-2xl font-black text-rose-400 mt-2">{stats.rejected}</p>
        </div>

        <div
          onClick={() => setStatusFilter('All')}
          className={`p-4 rounded-2xl border cursor-pointer transition ${
            statusFilter === 'All'
              ? 'bg-indigo-950/40 border-indigo-500/80 shadow-lg shadow-indigo-500/10'
              : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
          }`}
        >
          <span className="text-xs text-slate-400 font-medium">All Events</span>
          <p className="text-2xl font-black text-white mt-2">{stats.total}</p>
        </div>
      </div>

      {/* Filter Chips & Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-2">
        <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-2xl bg-slate-900/90 border border-slate-800/80 text-xs font-semibold">
          {[
            { id: 'pending_approval', label: 'Pending Queue' },
            { id: 'changes_requested', label: 'Changes Requested' },
            { id: 'approved', label: 'Approved' },
            { id: 'published', label: 'Published' },
            { id: 'rejected', label: 'Rejected' },
            { id: 'All', label: 'All Submissions' },
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
            placeholder="Search proposals by title, venue, organizer..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchAdminEvents()}
            className="pl-9 pr-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 w-full sm:w-80"
          />
        </div>
      </div>

      {/* Events Approval List */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 rounded-2xl bg-slate-900/40 border border-slate-800 animate-pulse" />
          ))}
        </div>
      ) : events.length === 0 ? (
        <div className="p-16 text-center rounded-3xl bg-slate-900/40 border border-slate-800/80 space-y-3">
          <FileCheck className="w-12 h-12 text-slate-600 mx-auto" />
          <h3 className="text-base font-bold text-white">Queue is clear</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            No event submissions found for status: <strong className="text-slate-300">{statusFilter}</strong>.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {events.map((evt) => {
            const isPending = evt.status === 'pending_approval';

            return (
              <div
                key={evt._id}
                className={`p-6 rounded-2xl bg-slate-900/70 border transition space-y-4 ${
                  isPending
                    ? 'border-amber-500/30 hover:border-amber-500/60 shadow-lg shadow-amber-500/5'
                    : 'border-slate-800/80 hover:border-slate-700'
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
                  {/* Left Info */}
                  <div className="flex items-start gap-4">
                    <img
                      src={evt.posterUrl}
                      alt={evt.title}
                      className="h-24 w-32 rounded-xl object-cover bg-slate-950 shrink-0 border border-slate-800"
                      onError={(e) => {
                        e.target.src =
                          'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&auto=format&fit=crop&q=80';
                      }}
                    />

                    <div className="space-y-1.5 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <StatusBadge status={evt.status} size="sm" />
                        <span className="text-[11px] font-semibold text-slate-300 px-2 py-0.5 rounded bg-slate-800">
                          {evt.category}
                        </span>
                        <span className="text-[11px] font-semibold text-slate-400">
                          {evt.eventType} {evt.eventType === 'Team' && `(${evt.minTeamSize}-${evt.maxTeamSize} per team)`}
                        </span>
                        {evt.isPaid ? (
                          <span className="text-[11px] font-bold text-emerald-400">
                            ${evt.registrationFee} entry fee
                          </span>
                        ) : (
                          <span className="text-[11px] font-bold text-slate-400">
                            Free Admission
                          </span>
                        )}
                      </div>

                      <h3
                        onClick={() => setDetailEvent(evt)}
                        className="text-base font-bold text-white hover:text-indigo-300 transition cursor-pointer"
                      >
                        {evt.title}
                      </h3>

                      <p className="text-xs text-slate-400 line-clamp-1">
                        {evt.shortDescription}
                      </p>

                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 pt-1">
                        <span>
                          Organizer: <strong className="text-slate-300">{evt.organizer?.name || evt.contactInfo?.name}</strong> (
                          {evt.organizer?.department || 'Department'})
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                          {new Date(evt.eventDate).toLocaleDateString()}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                          {evt.venue}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right Actions */}
                  <div className="flex flex-wrap items-center gap-2.5 pt-2 lg:pt-0 shrink-0">
                    <button
                      onClick={() => setDetailEvent(evt)}
                      className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Review Details</span>
                    </button>

                    {/* Actions if Pending Approval */}
                    {isPending && (
                      <>
                        <button
                          onClick={() => handleRequestChanges(evt)}
                          className="px-3.5 py-2 rounded-xl bg-orange-600/80 hover:bg-orange-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-orange-600/20 transition"
                        >
                          <HelpCircle className="w-3.5 h-3.5" />
                          <span>Request Changes</span>
                        </button>

                        <button
                          onClick={() => handleReject(evt)}
                          className="px-3.5 py-2 rounded-xl bg-rose-600/80 hover:bg-rose-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-rose-600/20 transition"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Reject</span>
                        </button>

                        <button
                          onClick={() => handleApprove(evt)}
                          className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black flex items-center gap-1.5 shadow-lg shadow-emerald-600/30 transition hover:scale-[1.02]"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Approve Event</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Confirmation / Prompt Modal */}
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

      {/* Full Event Details & History Modal */}
      <EventDetailModal
        isOpen={!!detailEvent}
        onClose={() => setDetailEvent(null)}
        event={detailEvent}
      />
    </div>
  );
};

export default AdminApprovalPage;
