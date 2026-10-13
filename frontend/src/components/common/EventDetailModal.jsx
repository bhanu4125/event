import React, { useState } from 'react';
import {
  X,
  Calendar,
  Clock,
  MapPin,
  Users,
  Tag,
  DollarSign,
  FileText,
  Mail,
  Phone,
  ShieldCheck,
  History,
  Info,
} from 'lucide-react';
import StatusBadge from './StatusBadge';
import AuditTimeline from './AuditTimeline';

const EventDetailModal = ({ isOpen, onClose, event }) => {
  const [activeTab, setActiveTab] = useState('details'); // 'details' | 'audit'

  if (!isOpen || !event) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl max-h-[90vh] flex flex-col rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 text-slate-300 hover:text-white bg-slate-950/70 hover:bg-slate-900 rounded-full border border-slate-700 backdrop-blur transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Banner / Poster */}
        <div className="relative h-60 w-full overflow-hidden bg-slate-950 shrink-0">
          <img
            src={event.posterUrl}
            alt={event.title}
            className="w-full h-full object-cover object-center filter brightness-90"
            onError={(e) => {
              e.target.src =
                'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&auto=format&fit=crop&q=80';
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent" />
          <div className="absolute bottom-4 left-6 right-6 flex flex-wrap items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/80 text-white text-xs font-semibold uppercase tracking-wider backdrop-blur-sm">
                  {event.category}
                </span>
                <StatusBadge status={event.status} size="md" />
              </div>
              <h2 className="text-2xl font-black text-white drop-shadow-md">
                {event.title}
              </h2>
            </div>
          </div>
        </div>

        {/* Tab Switcher Header */}
        <div className="flex border-b border-slate-800 px-6 bg-slate-950/50">
          <button
            onClick={() => setActiveTab('details')}
            className={`flex items-center gap-2 py-3 px-4 text-sm font-semibold border-b-2 transition ${
              activeTab === 'details'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Info className="w-4 h-4" />
            <span>Event Information</span>
          </button>
          <button
            onClick={() => setActiveTab('audit')}
            className={`flex items-center gap-2 py-3 px-4 text-sm font-semibold border-b-2 transition ${
              activeTab === 'audit'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <History className="w-4 h-4" />
            <span>Approval & State History</span>
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto p-6 space-y-6 flex-1">
          {activeTab === 'details' ? (
            <>
              {/* Admin Feedback Box (if changes requested or rejected) */}
              {(event.status === 'changes_requested' || event.status === 'rejected') && (
                <div className="p-4 rounded-2xl bg-amber-950/40 border border-amber-800/60 text-amber-200 space-y-1">
                  <div className="flex items-center gap-2 font-bold text-amber-300 text-sm">
                    <ShieldCheck className="w-4 h-4" />
                    <span>Administrator Remarks / Feedback:</span>
                  </div>
                  <p className="text-sm text-amber-100/90 whitespace-pre-wrap pl-6">
                    {event.adminFeedback || event.rejectionReason}
                  </p>
                </div>
              )}

              {/* Cancellation notice */}
              {event.status === 'cancelled' && (
                <div className="p-4 rounded-2xl bg-rose-950/40 border border-rose-800/60 text-rose-200 space-y-1">
                  <div className="flex items-center gap-2 font-bold text-rose-300 text-sm">
                    <X className="w-4 h-4" />
                    <span>Notice: Event Cancelled</span>
                  </div>
                  <p className="text-sm text-rose-100/90 pl-6">
                    Reason: {event.cancellationReason || 'Cancelled by administration/organizer.'}
                  </p>
                </div>
              )}

              {/* Key Quick Specs Bar */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/80 flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400 block font-medium">Event Date</span>
                    <span className="text-sm font-semibold text-slate-200">
                      {new Date(event.eventDate).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </span>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/80 flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400 block font-medium">Timing</span>
                    <span className="text-sm font-semibold text-slate-200">
                      {event.startTime} - {event.endTime}
                    </span>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/80 flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400 block font-medium">Venue</span>
                    <span className="text-sm font-semibold text-slate-200 truncate block max-w-[120px]">
                      {event.venue}
                    </span>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/80 flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400">
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400 block font-medium">Capacity</span>
                    <span className="text-sm font-semibold text-slate-200">
                      {event.currentRegistrations || 0} / {event.maxCapacity} seats
                    </span>
                  </div>
                </div>
              </div>

              {/* Short & Detailed Descriptions */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-400">
                  About Event
                </h4>
                <p className="text-base text-slate-200 font-medium leading-relaxed">
                  {event.shortDescription}
                </p>
                <div className="p-4 rounded-2xl bg-slate-950/40 border border-slate-800/60 text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">
                  {event.detailedDescription}
                </div>
              </div>

              {/* Registration & Eligibility Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                    <Tag className="w-4 h-4 text-indigo-400" />
                    <span>Participation Details</span>
                  </h4>
                  <ul className="text-sm space-y-2 text-slate-300">
                    <li className="flex justify-between border-b border-slate-800/60 pb-1.5">
                      <span className="text-slate-400">Type:</span>
                      <span className="font-semibold text-white">
                        {event.eventType}{' '}
                        {event.eventType === 'Team' &&
                          `(${event.minTeamSize}-${event.maxTeamSize} members)`}
                      </span>
                    </li>
                    <li className="flex justify-between border-b border-slate-800/60 pb-1.5">
                      <span className="text-slate-400">Registration Fee:</span>
                      <span className="font-semibold text-emerald-400">
                        {event.isPaid ? `$${event.registrationFee}` : 'Free'}
                      </span>
                    </li>
                    <li className="flex justify-between border-b border-slate-800/60 pb-1.5">
                      <span className="text-slate-400">Registration Closes:</span>
                      <span className="font-semibold text-white">
                        {new Date(event.registrationDeadline).toLocaleDateString()}
                      </span>
                    </li>
                  </ul>
                </div>

                <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span>Eligibility & Restrictions</span>
                  </h4>
                  <div className="text-xs space-y-2">
                    <div>
                      <span className="text-slate-400 block mb-1">Eligible Departments:</span>
                      <div className="flex flex-wrap gap-1.5">
                        {event.departmentRestrictions?.map((dept, i) => (
                          <span
                            key={i}
                            className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-200 border border-slate-700"
                          >
                            {dept}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <span className="text-slate-400 block mb-1">Eligible Years:</span>
                      <div className="flex flex-wrap gap-1.5">
                        {event.academicYearRestrictions?.map((yr, i) => (
                          <span
                            key={i}
                            className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-200 border border-slate-700"
                          >
                            {yr}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Rules & Guidelines */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-cyan-400" />
                  <span>Rules & Code of Conduct</span>
                </h4>
                <div className="p-4 rounded-2xl bg-slate-950/40 border border-slate-800/60 text-xs text-slate-300 whitespace-pre-wrap">
                  {event.rules}
                </div>
              </div>

              {/* Contact Information & Organizer */}
              <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <span className="text-xs text-slate-400 block">Organized By</span>
                  <span className="text-sm font-bold text-white">
                    {event.organizer?.name || event.contactInfo?.name}
                  </span>
                  <span className="text-xs text-slate-400 block">
                    {event.organizer?.department || 'Campus Club'}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-300">
                  <div className="flex items-center gap-1.5">
                    <Mail className="w-4 h-4 text-indigo-400" />
                    <span>{event.contactInfo?.email}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Phone className="w-4 h-4 text-emerald-400" />
                    <span>{event.contactInfo?.phone}</span>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <AuditTimeline eventId={event._id} />
          )}
        </div>
      </div>
    </div>
  );
};

export default EventDetailModal;
