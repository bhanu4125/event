import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
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
  CheckCircle2,
  AlertCircle,
  LogIn,
  Sparkles,
  Loader2,
} from 'lucide-react';
import StatusBadge from './StatusBadge';
import AuditTimeline from './AuditTimeline';
import { useAuth } from '../../context/AuthContext';
import apiClient from '../../api/apiClient';

const EventDetailModal = ({ isOpen, onClose, event, onEventUpdated }) => {
  const navigate = useNavigate();
  const { user, isAuthenticated, isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState('details'); // 'details' | 'audit'

  // Live registration states
  const [liveRegistrations, setLiveRegistrations] = useState(event?.currentRegistrations || 0);
  const [maxCapacity, setMaxCapacity] = useState(event?.maxCapacity || 100);
  const [isRegistered, setIsRegistered] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState(false);
  const [submittingAction, setSubmittingAction] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState({ text: '', type: '' });

  // Sync state when modal opens or event changes
  useEffect(() => {
    if (!isOpen || !event) return;

    setLiveRegistrations(event.currentRegistrations || 0);
    setMaxCapacity(event.maxCapacity || 100);
    setFeedbackMsg({ text: '', type: '' });

    const fetchLiveStatus = async () => {
      try {
        setLoadingStatus(true);
        const res = await apiClient.get(`/events/${event._id}/registration-status`);
        if (res.data.success && res.data.data) {
          setLiveRegistrations(res.data.data.currentRegistrations);
          setMaxCapacity(res.data.data.maxCapacity);
          setIsRegistered(res.data.data.isRegistered);
        }
      } catch (err) {
        console.error('Failed to load registration status:', err.message);
      } finally {
        setLoadingStatus(false);
      }
    };

    fetchLiveStatus();
  }, [isOpen, event]);

  if (!isOpen || !event) return null;

  const isTeamEvent = event.eventType === 'Team';
  const seatsRemaining = Math.max(0, maxCapacity - liveRegistrations);
  const percentFilled = Math.min(100, Math.round((liveRegistrations / (maxCapacity || 1)) * 100));

  // Handle Individual Event Join / Register
  const handleJoinEvent = async () => {
    if (!isAuthenticated) {
      navigate('/login?portal=student');
      return;
    }

    try {
      setSubmittingAction(true);
      setFeedbackMsg({ text: '', type: '' });
      const res = await apiClient.post(`/events/${event._id}/register`);
      
      const newCount = res.data.data.currentRegistrations;
      setLiveRegistrations(newCount);
      setIsRegistered(true);
      setFeedbackMsg({
        text: 'You have successfully joined this event! Your seat is reserved.',
        type: 'success',
      });

      if (onEventUpdated) {
        onEventUpdated({
          ...event,
          currentRegistrations: newCount,
        });
      }
    } catch (err) {
      setFeedbackMsg({
        text: err.message || 'Failed to register for this event',
        type: 'error',
      });
    } finally {
      setSubmittingAction(false);
    }
  };

  // Handle Cancel Individual Registration
  const handleCancelRegistration = async () => {
    if (!window.confirm('Are you sure you want to cancel your registration and release your seat?')) {
      return;
    }

    try {
      setSubmittingAction(true);
      setFeedbackMsg({ text: '', type: '' });
      const res = await apiClient.delete(`/events/${event._id}/register`);

      const newCount = res.data.data.currentRegistrations;
      setLiveRegistrations(newCount);
      setIsRegistered(false);
      setFeedbackMsg({
        text: 'Your registration has been cancelled.',
        type: 'info',
      });

      if (onEventUpdated) {
        onEventUpdated({
          ...event,
          currentRegistrations: newCount,
        });
      }
    } catch (err) {
      setFeedbackMsg({
        text: err.message || 'Failed to cancel registration',
        type: 'error',
      });
    } finally {
      setSubmittingAction(false);
    }
  };

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
          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent" />
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
              {/* Feedback Alert Box */}
              {feedbackMsg.text && (
                <div
                  className={`p-4 rounded-xl border flex items-center gap-3 animate-in fade-in duration-150 ${
                    feedbackMsg.type === 'success'
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                      : feedbackMsg.type === 'error'
                      ? 'bg-rose-50 border-rose-200 text-rose-800'
                      : 'bg-indigo-50 border-indigo-200 text-indigo-800'
                  }`}
                >
                  {feedbackMsg.type === 'success' ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  ) : feedbackMsg.type === 'error' ? (
                    <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
                  ) : (
                    <Info className="w-5 h-5 text-indigo-600 shrink-0" />
                  )}
                  <span className="text-xs font-semibold">{feedbackMsg.text}</span>
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

                {/* Capacity Card with Live Status Pill */}
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-purple-100 text-purple-700">
                    <Users className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] text-slate-500 font-medium">Capacity</span>
                      <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    </div>
                    <span className="text-sm font-bold text-slate-900">
                      {liveRegistrations} / {maxCapacity} seats
                    </span>
                  </div>
                </div>
              </div>

              {/* Live Capacity Meter Banner */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-800 flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-indigo-600" />
                    <span>Live Attendee Capacity</span>
                  </span>
                  <span className="font-semibold text-slate-600">
                    <strong className="text-indigo-600">{liveRegistrations}</strong> of{' '}
                    <strong className="text-slate-900">{maxCapacity}</strong> filled ({seatsRemaining} seats left)
                  </span>
                </div>
                {/* Visual Progress Bar */}
                <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 ${
                      percentFilled >= 100
                        ? 'bg-rose-500'
                        : percentFilled >= 80
                        ? 'bg-amber-500'
                        : 'bg-indigo-600'
                    }`}
                    style={{ width: `${percentFilled}%` }}
                  />
                </div>
              </div>

              {/* ACTION REGISTRATION BANNER */}
              {event.status === 'published' && (
                isAdmin ? (
                  /* Admin Governance Notice */
                  <div className="p-4 rounded-xl bg-purple-50 border border-purple-200 flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2.5 text-purple-900 font-semibold">
                      <ShieldCheck className="w-5 h-5 text-purple-600 shrink-0" />
                      <div>
                        <span className="font-bold block">Campus Admin Governance Role</span>
                        <span className="text-[11px] text-purple-700 font-normal">
                          Administrators have event creation, editing, and approval authority only. Participation in events as an attendee is restricted.
                        </span>
                      </div>
                    </div>
                  </div>
                ) : !isAuthenticated ? (
                  /* Guest: Needs to Log In */
                  <div className="p-4 rounded-xl bg-indigo-50 border border-indigo-200 flex flex-col sm:flex-row items-center justify-between gap-3">
                    <div>
                      <h5 className="text-sm font-bold text-indigo-950">Registration Open</h5>
                      <p className="text-xs text-indigo-800">
                        {seatsRemaining > 0
                          ? `Sign in with your campus account to join this event (${seatsRemaining} seats remaining).`
                          : 'This event is currently full.'}
                      </p>
                    </div>
                    <Link
                      to="/login?portal=student"
                      className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-1.5 transition shadow-sm shrink-0"
                    >
                      <LogIn className="w-4 h-4" />
                      <span>Sign In to Join</span>
                    </Link>
                  </div>
                ) : isTeamEvent ? (
                  /* Team Event Registration */
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
                      className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-1.5 transition shadow-sm shrink-0"
                    >
                      <UserPlus className="w-4 h-4" />
                      <span>Create / Register Team</span>
                    </button>
                  </div>
                ) : (
                  /* Individual Event Registration (The Join Button!) */
                  <div className="p-4 rounded-xl bg-indigo-50 border border-indigo-200 flex flex-col sm:flex-row items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h5 className="text-sm font-bold text-indigo-950">
                          {isRegistered ? 'Registration Confirmed!' : 'Individual Event Registration'}
                        </h5>
                        {isRegistered && (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-extrabold uppercase">
                            Registered
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-indigo-800 mt-0.5">
                        {isRegistered
                          ? `You are confirmed to attend at ${event.venue || 'Campus Venue'}. Seat reserved.`
                          : seatsRemaining > 0
                          ? `Venue capacity has ${seatsRemaining} seats available. Click Join to reserve your spot instantly.`
                          : 'This event has reached full capacity. No seats remain.'}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {isRegistered ? (
                        <button
                          type="button"
                          onClick={handleCancelRegistration}
                          disabled={submittingAction}
                          className="px-3.5 py-2 rounded-xl border border-rose-200 bg-white hover:bg-rose-50 text-rose-600 text-xs font-semibold transition"
                        >
                          {submittingAction ? 'Processing...' : 'Cancel Registration'}
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={handleJoinEvent}
                          disabled={submittingAction || seatsRemaining <= 0}
                          className={`px-5 py-2.5 rounded-xl text-white text-xs font-bold flex items-center gap-1.5 shadow-md transition ${
                            seatsRemaining <= 0
                              ? 'bg-slate-400 cursor-not-allowed'
                              : 'bg-indigo-600 hover:bg-indigo-700'
                          }`}
                        >
                          {submittingAction ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              <span>Reserving Seat...</span>
                            </>
                          ) : seatsRemaining <= 0 ? (
                            <span>Capacity Full</span>
                          ) : (
                            <>
                              <CheckCircle2 className="w-4 h-4" />
                              <span>Join Event Now</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                )
              )}

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
              {event.rules && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-slate-600" />
                    <span>Rules & Code of Conduct</span>
                  </h4>
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 whitespace-pre-wrap">
                    {event.rules}
                  </div>
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
