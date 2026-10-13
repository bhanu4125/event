import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
  UserPlus,
} from 'lucide-react';
import StatusBadge from './StatusBadge';
import AuditTimeline from './AuditTimeline';

const EventDetailModal = ({ isOpen, onClose, event }) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('details'); // 'details' | 'audit'

  if (!isOpen || !event) return null;

  const isTeamEvent = event.eventType === 'Team';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-4xl max-h-[90vh] flex flex-col rounded-2xl bg-white border border-slate-200 shadow-2xl overflow-hidden">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 text-slate-500 hover:text-slate-900 bg-white/90 hover:bg-white rounded-full border border-slate-200 shadow-sm transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Banner / Poster */}
        <div className="relative h-56 w-full overflow-hidden bg-slate-100 shrink-0">
          <img
            src={event.posterUrl}
            alt={event.title}
            className="w-full h-full object-cover object-center"
            onError={(e) => {
              e.target.src =
                'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&auto=format&fit=crop&q=80';
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
          <div className="absolute bottom-4 left-6 right-6 flex flex-wrap items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-md bg-white/95 text-slate-800 text-xs font-bold uppercase tracking-wider shadow-sm">
                  {event.category}
                </span>
                <StatusBadge status={event.status} size="sm" />
              </div>
              <h2 className="text-2xl font-black text-white drop-shadow-md">
                {event.title}
              </h2>
            </div>
          </div>
        </div>

        {/* Tab Switcher Header */}
        <div className="flex border-b border-slate-200 px-6 bg-slate-50">
          <button
            onClick={() => setActiveTab('details')}
            className={`flex items-center gap-2 py-3 px-4 text-sm font-semibold border-b-2 transition ${
              activeTab === 'details'
                ? 'border-indigo-600 text-indigo-600 bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Info className="w-4 h-4" />
            <span>Event Information</span>
          </button>
          <button
            onClick={() => setActiveTab('audit')}
            className={`flex items-center gap-2 py-3 px-4 text-sm font-semibold border-b-2 transition ${
              activeTab === 'audit'
                ? 'border-indigo-600 text-indigo-600 bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
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
              {/* Admin Remarks alert if changes requested or rejected */}
              {(event.status === 'changes_requested' || event.status === 'rejected') && (
                <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 space-y-1">
                  <div className="flex items-center gap-2 font-bold text-amber-800 text-sm">
                    <ShieldCheck className="w-4 h-4" />
                    <span>Administrator Feedback:</span>
                  </div>
                  <p className="text-sm text-amber-800 whitespace-pre-wrap pl-6">
                    {event.adminFeedback || event.rejectionReason}
                  </p>
                </div>
              )}

              {/* Cancellation notice */}
              {event.status === 'cancelled' && (
                <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 space-y-1">
                  <div className="flex items-center gap-2 font-bold text-rose-800 text-sm">
                    <X className="w-4 h-4" />
                    <span>Notice: Event Cancelled</span>
                  </div>
                  <p className="text-sm text-rose-800 pl-6">
                    Reason: {event.cancellationReason || 'Cancelled by administration/organizer.'}
                  </p>
                </div>
              )}

              {/* Key Quick Specs Bar */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-indigo-100 text-indigo-700">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-500 block font-medium">Event Date</span>
                    <span className="text-sm font-bold text-slate-900">
                      {new Date(event.eventDate).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </span>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-cyan-100 text-cyan-700">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-500 block font-medium">Timing</span>
                    <span className="text-sm font-bold text-slate-900">
                      {event.startTime} - {event.endTime}
                    </span>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-emerald-100 text-emerald-700">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-500 block font-medium">Venue</span>
                    <span className="text-sm font-bold text-slate-900 truncate block max-w-[120px]">
                      {event.venue}
                    </span>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-purple-100 text-purple-700">
                    <Users className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-500 block font-medium">Capacity</span>
                    <span className="text-sm font-bold text-slate-900">
                      {event.currentRegistrations || 0} / {event.maxCapacity} seats
                    </span>
                  </div>
                </div>
              </div>

              {/* Short & Detailed Descriptions */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Event Overview
                </h4>
                <p className="text-sm text-slate-800 font-medium leading-relaxed">
                  {event.shortDescription}
                </p>
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                  {event.detailedDescription}
                </div>
              </div>

              {/* Participation & Restrictions Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                    <Tag className="w-4 h-4 text-indigo-600" />
                    <span>Participation Details</span>
                  </h4>
                  <ul className="text-sm space-y-2 text-slate-700">
                    <li className="flex justify-between border-b border-slate-200 pb-1.5">
                      <span className="text-slate-500">Format:</span>
                      <span className="font-semibold text-slate-900">
                        {event.eventType}{' '}
                        {event.eventType === 'Team' &&
                          `(${event.minTeamSize}-${event.maxTeamSize} members)`}
                      </span>
                    </li>
                    <li className="flex justify-between border-b border-slate-200 pb-1.5">
                      <span className="text-slate-500">Registration Fee:</span>
                      <span className="font-semibold text-emerald-700">
                        {event.isPaid ? `$${event.registrationFee}` : 'Free'}
                      </span>
                    </li>
                    <li className="flex justify-between border-b border-slate-200 pb-1.5">
                      <span className="text-slate-500">Registration Closes:</span>
                      <span className="font-semibold text-slate-900">
                        {new Date(event.registrationDeadline).toLocaleDateString()}
                      </span>
                    </li>
                  </ul>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>Eligibility & Restrictions</span>
                  </h4>
                  <div className="text-xs space-y-2">
                    <div>
                      <span className="text-slate-500 block mb-1">Eligible Departments:</span>
                      <div className="flex flex-wrap gap-1.5">
                        {event.departmentRestrictions?.map((dept, i) => (
                          <span
                            key={i}
                            className="px-2 py-0.5 rounded-md bg-white text-slate-700 border border-slate-200"
                          >
                            {dept}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <span className="text-slate-500 block mb-1">Eligible Years:</span>
                      <div className="flex flex-wrap gap-1.5">
                        {event.academicYearRestrictions?.map((yr, i) => (
                          <span
                            key={i}
                            className="px-2 py-0.5 rounded-md bg-white text-slate-700 border border-slate-200"
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
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-slate-600" />
                  <span>Rules & Code of Conduct</span>
                </h4>
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 whitespace-pre-wrap">
                  {event.rules}
                </div>
              </div>

              {/* Action Banner for Team Formation */}
              {isTeamEvent && event.status === 'published' && (
                <div className="p-4 rounded-xl bg-indigo-50 border border-indigo-200 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div>
                    <h5 className="text-sm font-bold text-indigo-950">Team Event Registration</h5>
                    <p className="text-xs text-indigo-800">
                      Form a team of {event.minTeamSize} to {event.maxTeamSize} members to compete in this event.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      onClose();
                      navigate(`/teams/create?eventId=${event._id}`);
                    }}
                    className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-1.5 transition shadow-sm shrink-0"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>Create / Register Team</span>
                  </button>
                </div>
              )}

              {/* Contact Information & Organizer */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <span className="text-xs text-slate-500 block">Organized By</span>
                  <span className="text-sm font-bold text-slate-900">
                    {event.organizer?.name || event.contactInfo?.name}
                  </span>
                  <span className="text-xs text-slate-500 block">
                    {event.organizer?.department || 'Campus Department'}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600">
                  <div className="flex items-center gap-1.5">
                    <Mail className="w-4 h-4 text-indigo-600" />
                    <span>{event.contactInfo?.email}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Phone className="w-4 h-4 text-emerald-600" />
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
