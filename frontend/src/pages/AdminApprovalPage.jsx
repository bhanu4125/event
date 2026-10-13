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
  Eye,
  Calendar,
  Users,
  MapPin,
  RefreshCw,
  FileCheck,
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

  // Approve
  const handleApprove = (evt) => {
    setModalConfig({
      isOpen: true,
      title: 'Approve Campus Event',
      message: `Approve "${evt.title}" organized by ${evt.organizer?.name}? The organizer will be notified and allowed to publish it to students.`,
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
          setModalConfig((p) => ({ ...p, isOpen: false }));
          fetchAdminEvents();
        } catch (err) {
          alert(err.message);
        } finally {
          setActionLoading(false);
        }
      },
    });
  };

  // Request Changes
  const handleRequestChanges = (evt) => {
    setModalConfig({
      isOpen: true,
      title: 'Request Modifications',
      message: `Request adjustments for "${evt.title}". Specify the required changes in detail so the organizer can revise and resubmit.`,
      confirmText: 'Request Changes',
      type: 'warning',
      requireInput: true,
      inputLabel: 'Required Changes / Administrative Feedback',
      inputPlaceholder: 'e.g. Please update the team size limits and attach lab booking confirmation...',
      onConfirm: async (comments) => {
        try {
          setActionLoading(true);
          const res = await apiClient.post(`/events/${evt._id}/request-changes`, { comments });
          showToast(res.data.message || 'Modifications requested.');
          setModalConfig((p) => ({ ...p, isOpen: false }));
          fetchAdminEvents();
        } catch (err) {
          alert(err.message);
        } finally {
          setActionLoading(false);
        }
      },
    });
  };

  // Reject
  const handleReject = (evt) => {
    setModalConfig({
      isOpen: true,
      title: 'Reject Event Submission',
      message: `Reject "${evt.title}"? A mandatory justification reason is required for administrative compliance.`,
      confirmText: 'Reject Submission',
      type: 'danger',
      requireInput: true,
      inputLabel: 'Mandatory Rejection Reason',
      inputPlaceholder: 'e.g. Conflicts with campus safety guidelines...',
      onConfirm: async (reason) => {
        try {
          setActionLoading(true);
          const res = await apiClient.post(`/events/${evt._id}/reject`, { reason });
          showToast(res.data.message || 'Event rejected.');
          setModalConfig((p) => ({ ...p, isOpen: false }));
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
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
              <ShieldAlert className="w-7 h-7 text-indigo-600" />
              <span>Campus Approval Desk</span>
            </h1>
            <p className="text-sm text-slate-500">
              Review incoming event proposals, approve or request revisions, and moderate campus activities.
            </p>
          </div>

          <button
            onClick={fetchAdminEvents}
            className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 transition self-start sm:self-auto"
            title="Refresh Queue"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </section>

      {/* Main Body */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 space-y-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div
            onClick={() => setStatusFilter('pending_approval')}
            className={`clean-card p-4 cursor-pointer transition ${
              statusFilter === 'pending_approval' ? 'bg-amber-50 border-amber-300' : ''
            }`}
          >
            <span className="text-xs text-amber-800 font-semibold">Pending Review</span>
            <p className="text-2xl font-black text-amber-700 mt-2">{stats.pending}</p>
          </div>

          <div
            onClick={() => setStatusFilter('changes_requested')}
            className={`clean-card p-4 cursor-pointer transition ${
              statusFilter === 'changes_requested' ? 'bg-orange-50 border-orange-300' : ''
            }`}
          >
            <span className="text-xs text-orange-800 font-semibold">Changes Needed</span>
            <p className="text-2xl font-black text-orange-700 mt-2">{stats.changesRequested}</p>
          </div>

          <div
            onClick={() => setStatusFilter('approved')}
            className={`clean-card p-4 cursor-pointer transition ${
              statusFilter === 'approved' ? 'bg-emerald-50 border-emerald-300' : ''
            }`}
          >
            <span className="text-xs text-emerald-800 font-semibold">Approved</span>
            <p className="text-2xl font-black text-emerald-700 mt-2">{stats.approved}</p>
          </div>

          <div
            onClick={() => setStatusFilter('published')}
            className={`clean-card p-4 cursor-pointer transition ${
              statusFilter === 'published' ? 'bg-indigo-50 border-indigo-300' : ''
            }`}
          >
            <span className="text-xs text-indigo-800 font-semibold">Live Published</span>
            <p className="text-2xl font-black text-indigo-700 mt-2">{stats.published}</p>
          </div>

          <div
            onClick={() => setStatusFilter('rejected')}
            className={`clean-card p-4 cursor-pointer transition ${
              statusFilter === 'rejected' ? 'bg-rose-50 border-rose-300' : ''
            }`}
          >
            <span className="text-xs text-rose-800 font-semibold">Rejected</span>
            <p className="text-2xl font-black text-rose-700 mt-2">{stats.rejected}</p>
          </div>

          <div
            onClick={() => setStatusFilter('All')}
            className={`clean-card p-4 cursor-pointer transition ${
              statusFilter === 'All' ? 'bg-slate-100 border-slate-300' : ''
            }`}
          >
            <span className="text-xs text-slate-600 font-semibold">All Events</span>
            <p className="text-2xl font-black text-slate-900 mt-2">{stats.total}</p>
          </div>
        </div>

        {/* Filter Chips & Search Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-2">
          <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-xl bg-slate-100 border border-slate-200 text-xs font-semibold">
            {[
              { id: 'pending_approval', label: 'Pending Queue' },
              { id: 'changes_requested', label: 'Changes Requested' },
              { id: 'approved', label: 'Approved' },
              { id: 'published', label: 'Published' },
              { id: 'rejected', label: 'Rejected' },
              { id: 'All', label: 'All Events' },
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
              placeholder="Search by title, organizer, venue..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchAdminEvents()}
              className="pl-9 pr-4 py-2 rounded-xl bg-white border border-slate-300 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full sm:w-72"
            />
          </div>
        </div>

        {/* Events Approval List */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 rounded-2xl bg-white border border-slate-200 animate-pulse" />
            ))}
          </div>
        ) : events.length === 0 ? (
          <div className="p-16 text-center rounded-2xl bg-white border border-slate-200 space-y-3">
            <FileCheck className="w-12 h-12 text-slate-300 mx-auto" />
            <h3 className="text-base font-bold text-slate-800">Queue is clear</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              No events found for status filter: <strong className="text-slate-700">{statusFilter}</strong>.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {events.map((evt) => {
              const isPending = evt.status === 'pending_approval';

              return (
                <div
                  key={evt._id}
                  className={`clean-card p-6 space-y-4 ${
                    isPending ? 'border-amber-300 bg-amber-50/20' : ''
                  }`}
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
                    <div className="flex items-start gap-4">
                      <img
                        src={evt.posterUrl}
                        alt={evt.title}
                        className="h-24 w-32 rounded-xl object-cover bg-slate-100 shrink-0 border border-slate-200"
                        onError={(e) => {
                          e.target.src =
                            'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&auto=format&fit=crop&q=80';
                        }}
                      />

                      <div className="space-y-1.5 flex-1">
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
                          onClick={() => setDetailEvent(evt)}
                          className="text-base font-bold text-slate-900 hover:text-indigo-600 transition cursor-pointer"
                        >
                          {evt.title}
                        </h3>

                        <p className="text-xs text-slate-500 line-clamp-1">
                          {evt.shortDescription}
                        </p>

                        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 pt-1">
                          <span>
                            Organizer:{' '}
                            <strong className="text-slate-800">
                              {evt.organizer?.name || evt.contactInfo?.name}
                            </strong>{' '}
                            ({evt.organizer?.department})
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                            {new Date(evt.eventDate).toLocaleDateString()}
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                            {evt.venue}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Right Actions */}
                    <div className="flex flex-wrap items-center gap-2 pt-2 lg:pt-0 shrink-0">
                      <button
                        onClick={() => setDetailEvent(evt)}
                        className="px-3.5 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-semibold flex items-center gap-1.5 transition"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Inspect</span>
                      </button>

                      {isPending && (
                        <>
                          <button
                            onClick={() => handleRequestChanges(evt)}
                            className="px-3.5 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition"
                          >
                            <HelpCircle className="w-3.5 h-3.5" />
                            <span>Request Changes</span>
                          </button>

                          <button
                            onClick={() => handleReject(evt)}
                            className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            <span>Reject</span>
                          </button>

                          <button
                            onClick={() => handleApprove(evt)}
                            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition"
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
      </main>

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={modalConfig.isOpen}
        onClose={() => setModalConfig((p) => ({ ...p, isOpen: false }))}
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

      {/* Full Event Details Modal */}
      <EventDetailModal
        isOpen={!!detailEvent}
        onClose={() => setDetailEvent(null)}
        event={detailEvent}
      />
    </div>
  );
};

export default AdminApprovalPage;
