import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import apiClient from '../api/apiClient';
import { useAuth } from '../context/AuthContext';
import {
  ArrowLeft,
  Calendar,
  Users,
  Image,
  Send,
  Save,
  AlertCircle,
  Clock,
  MapPin,
  Tag,
  ShieldCheck,
  Mail,
  Phone,
  Sparkles,
  AlertTriangle,
} from 'lucide-react';

const CATEGORIES = [
  'Technical',
  'Cultural',
  'Sports',
  'Academic',
  'Workshop',
  'Hackathon',
  'Other',
];

const DEPARTMENTS = [
  'All Departments',
  'Computer Science',
  'Information Technology',
  'Electronics & Comm.',
  'Mechanical Eng.',
  'Civil Engineering',
  'Management & Business',
];

const YEARS = [
  'All Years',
  '1st Year',
  '2nd Year',
  '3rd Year',
  'Final Year',
  'Postgraduate',
];

const SAMPLE_POSTERS = [
  'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=900&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=900&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=900&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=900&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?w=900&auto=format&fit=crop&q=80',
];

const EventFormPage = () => {
  const { id } = useParams();
  const isEditMode = Boolean(id);
  const navigate = useNavigate();
  const { user } = useAuth();

  const [formData, setFormData] = useState({
    title: '',
    shortDescription: '',
    detailedDescription: '',
    category: 'Technical',
    posterUrl: SAMPLE_POSTERS[0],
    venue: '',
    eventDate: '',
    startTime: '10:00 AM',
    endTime: '04:00 PM',
    registrationStartDate: new Date().toISOString().split('T')[0],
    registrationDeadline: '',
    maxCapacity: 100,
    eventType: 'Individual',
    minTeamSize: 1,
    maxTeamSize: 1,
    eligibilityCriteria: 'Open to all enrolled university students with valid college ID.',
    departmentRestrictions: ['All Departments'],
    academicYearRestrictions: ['All Years'],
    isPaid: false,
    registrationFee: 0,
    rules: '1. Maintain discipline.\n2. Carry physical college ID.\n3. Late entries prohibited.',
    contactInfo: {
      name: user?.name || '',
      email: user?.email || '',
      phone: user?.phone || '+1 555-0100',
    },
  });

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(isEditMode);
  const [errors, setErrors] = useState({});
  const [statusMessage, setStatusMessage] = useState('');
  const [eventStatus, setEventStatus] = useState('');
  const [adminFeedback, setAdminFeedback] = useState('');

  useEffect(() => {
    if (isEditMode) {
      const loadEvent = async () => {
        try {
          setFetching(true);
          const res = await apiClient.get(`/events/${id}`);
          const evt = res.data.data;
          setEventStatus(evt.status || '');
          setAdminFeedback(evt.adminFeedback || evt.rejectionReason || '');
          setFormData({
            title: evt.title,
            shortDescription: evt.shortDescription,
            detailedDescription: evt.detailedDescription,
            category: evt.category,
            posterUrl: evt.posterUrl,
            venue: evt.venue,
            eventDate: evt.eventDate ? new Date(evt.eventDate).toISOString().split('T')[0] : '',
            startTime: evt.startTime,
            endTime: evt.endTime,
            registrationStartDate: evt.registrationStartDate
              ? new Date(evt.registrationStartDate).toISOString().split('T')[0]
              : '',
            registrationDeadline: evt.registrationDeadline
              ? new Date(evt.registrationDeadline).toISOString().split('T')[0]
              : '',
            maxCapacity: evt.maxCapacity,
            eventType: evt.eventType,
            minTeamSize: evt.minTeamSize || 1,
            maxTeamSize: evt.maxTeamSize || 1,
            eligibilityCriteria: evt.eligibilityCriteria,
            departmentRestrictions: evt.departmentRestrictions || ['All Departments'],
            academicYearRestrictions: evt.academicYearRestrictions || ['All Years'],
            isPaid: evt.isPaid,
            registrationFee: evt.registrationFee || 0,
            rules: evt.rules,
            contactInfo: evt.contactInfo || {
              name: user?.name || '',
              email: user?.email || '',
              phone: '',
            },
          });
        } catch (err) {
          alert('Failed to load event: ' + err.message);
          navigate('/organizer');
        } finally {
          setFetching(false);
        }
      };
      loadEvent();
    }
  }, [id, isEditMode]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (name.startsWith('contact.')) {
      const key = name.split('.')[1];
      setFormData((prev) => ({
        ...prev,
        contactInfo: { ...prev.contactInfo, [key]: value },
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value,
      }));
    }
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const toggleDepartment = (dept) => {
    setFormData((prev) => {
      let current = [...prev.departmentRestrictions];
      if (dept === 'All Departments') {
        return { ...prev, departmentRestrictions: ['All Departments'] };
      }
      current = current.filter((d) => d !== 'All Departments');
      if (current.includes(dept)) {
        current = current.filter((d) => d !== dept);
        if (current.length === 0) current = ['All Departments'];
      } else {
        current.push(dept);
      }
      return { ...prev, departmentRestrictions: current };
    });
  };

  const toggleYear = (yr) => {
    setFormData((prev) => {
      let current = [...prev.academicYearRestrictions];
      if (yr === 'All Years') {
        return { ...prev, academicYearRestrictions: ['All Years'] };
      }
      current = current.filter((y) => y !== 'All Years');
      if (current.includes(yr)) {
        current = current.filter((y) => y !== yr);
        if (current.length === 0) current = ['All Years'];
      } else {
        current.push(yr);
      }
      return { ...prev, academicYearRestrictions: current };
    });
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.title.trim()) newErrors.title = 'Event title is required';
    if (!formData.shortDescription.trim()) newErrors.shortDescription = 'Short description is required';
    if (!formData.detailedDescription.trim()) newErrors.detailedDescription = 'Detailed description is required';
    if (!formData.venue.trim()) newErrors.venue = 'Venue location is required';
    if (!formData.eventDate) newErrors.eventDate = 'Event date is required';
    if (!formData.startTime) newErrors.startTime = 'Start time is required';
    if (!formData.endTime) newErrors.endTime = 'End time is required';
    if (!formData.registrationDeadline) newErrors.registrationDeadline = 'Registration deadline is required';
    if (!formData.contactInfo.name.trim()) newErrors['contact.name'] = 'Contact name is required';
    if (!formData.contactInfo.email.trim()) newErrors['contact.email'] = 'Contact email is required';
    if (!formData.contactInfo.phone.trim()) newErrors['contact.phone'] = 'Contact phone is required';

    if (formData.eventType === 'Team' && Number(formData.maxTeamSize) < Number(formData.minTeamSize)) {
      newErrors.maxTeamSize = 'Max team size cannot be smaller than min team size';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (submitDirectly = false) => {
    if (!validateForm()) {
      setStatusMessage('Please fix the highlighted errors before saving.');
      return;
    }

    try {
      setLoading(true);
      setStatusMessage('');

      const payload = {
        ...formData,
        submitDirectly,
        resubmissionComments: 'Organizer updated details and resubmitted for approval',
      };

      if (isEditMode) {
        await apiClient.put(`/events/${id}`, payload);
      } else {
        await apiClient.post('/events', payload);
      }

      navigate('/organizer');
    } catch (err) {
      setStatusMessage(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-500">
        <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        <span className="ml-3 text-sm">Loading event details...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20 bg-[#F8FAFC]">
      <section className="bg-white border-b border-slate-200 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              to="/organizer"
              className="p-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-500 hover:text-slate-900 transition"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                  {isEditMode ? 'Edit Campus Event' : 'Create Campus Event'}
                </h1>
                {eventStatus === 'changes_requested' && (
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200 text-xs font-bold uppercase">
                    Changes Requested
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500">
                {eventStatus === 'changes_requested'
                  ? 'Update requested event parameters and resubmit to administration for approval.'
                  : 'Complete all event parameters for administrative review and publication.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              disabled={loading}
              onClick={() => handleSubmit(false)}
              className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-bold flex items-center gap-1.5 transition"
            >
              <Save className="w-4 h-4 text-slate-500" />
              <span>{isEditMode ? 'Save Updates' : 'Save Draft'}</span>
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={() => handleSubmit(true)}
              className={`px-5 py-2 rounded-xl text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition ${
                eventStatus === 'changes_requested'
                  ? 'bg-amber-600 hover:bg-amber-700'
                  : 'bg-indigo-600 hover:bg-indigo-700'
              }`}
            >
              <Send className="w-4 h-4" />
              <span>
                {eventStatus === 'changes_requested'
                  ? 'Save & Resubmit to Admin'
                  : isEditMode
                  ? 'Update & Submit'
                  : 'Submit for Approval'}
              </span>
            </button>
          </div>
        </div>
      </section>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 space-y-6">
        {/* Admin Feedback Box when Changes are Requested */}
        {eventStatus === 'changes_requested' && (
          <div className="p-5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-950 space-y-2 animate-in fade-in duration-150">
            <div className="flex items-center gap-2 font-bold text-sm text-amber-900">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
              <span>Action Required: Administrator Requested Modifications</span>
            </div>
            <div className="p-3 bg-white/90 rounded-xl border border-amber-200 text-xs text-amber-900 font-medium">
              <strong>Administrator Feedback:</strong> {adminFeedback || 'Please address required changes before resubmission.'}
            </div>
            <p className="text-[11px] text-amber-800 leading-relaxed">
              Please make the requested adjustments in the form below (e.g. venue, timings, or details). Once ready, click <strong>"Save & Resubmit to Admin"</strong> above to send this event back to the dean/admin desk.
            </p>
          </div>
        )}

        {statusMessage && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{statusMessage}</span>
          </div>
        )}

        <form onSubmit={(e) => e.preventDefault()} className="space-y-6">
          {/* Section 1: Overview */}
          <div className="clean-card p-6 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
              1. Event Overview & Category
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2 space-y-1">
                <label className="text-xs font-bold text-slate-700">
                  Event Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="e.g. HackNova 2026: Campus Hackathon"
                  className={`w-full px-3.5 py-2 rounded-xl bg-slate-50 border text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white ${
                    errors.title ? 'border-rose-500' : 'border-slate-300'
                  }`}
                />
                {errors.title && <p className="text-[11px] text-rose-500">{errors.title}</p>}
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Category</label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Participation Format</label>
                <select
                  name="eventType"
                  value={formData.eventType}
                  onChange={handleChange}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="Individual">Individual Participant</option>
                  <option value="Team">Team Event</option>
                </select>
              </div>

              <div className="md:col-span-2 space-y-1">
                <label className="text-xs font-bold text-slate-700">
                  Short Summary <span className="text-rose-500">*</span> (Displayed on cards)
                </label>
                <input
                  type="text"
                  name="shortDescription"
                  value={formData.shortDescription}
                  onChange={handleChange}
                  placeholder="A concise 1-2 sentence hook highlighting the event..."
                  className={`w-full px-3.5 py-2 rounded-xl bg-slate-50 border text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white ${
                    errors.shortDescription ? 'border-rose-500' : 'border-slate-300'
                  }`}
                />
              </div>

              <div className="md:col-span-2 space-y-1">
                <label className="text-xs font-bold text-slate-700">
                  Detailed Event Description <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={4}
                  name="detailedDescription"
                  value={formData.detailedDescription}
                  onChange={handleChange}
                  placeholder="Complete event agenda, guidelines, speakers, prize pools..."
                  className={`w-full px-3.5 py-2 rounded-xl bg-slate-50 border text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white ${
                    errors.detailedDescription ? 'border-rose-500' : 'border-slate-300'
                  }`}
                />
              </div>

              <div className="md:col-span-2 space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Poster Image URL</label>
                <input
                  type="text"
                  name="posterUrl"
                  value={formData.posterUrl}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-300 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                />
                <div className="flex items-center gap-2 pt-1 text-[11px] text-slate-500">
                  <span>Presets:</span>
                  {SAMPLE_POSTERS.map((p, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setFormData({ ...formData, posterUrl: p })}
                      className="h-6 w-9 rounded border border-slate-200 overflow-hidden hover:scale-105 transition"
                    >
                      <img src={p} alt={`p-${i}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Venue & Schedule */}
          <div className="clean-card p-6 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
              2. Venue & Timing
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="sm:col-span-2 space-y-1">
                <label className="text-xs font-bold text-slate-700">
                  Venue Location <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  name="venue"
                  value={formData.venue}
                  onChange={handleChange}
                  placeholder="e.g. Auditorium Hall 2"
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-300 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                />
              </div>

              <div className="sm:col-span-2 space-y-1">
                <label className="text-xs font-bold text-slate-700">
                  Event Date <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  name="eventDate"
                  value={formData.eventDate}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-300 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Start Time</label>
                <input
                  type="text"
                  name="startTime"
                  value={formData.startTime}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-300 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">End Time</label>
                <input
                  type="text"
                  name="endTime"
                  value={formData.endTime}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-300 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Registration Opens</label>
                <input
                  type="date"
                  name="registrationStartDate"
                  value={formData.registrationStartDate}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-300 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">
                  Registration Deadline <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  name="registrationDeadline"
                  value={formData.registrationDeadline}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-300 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Capacity & Teams */}
          <div className="clean-card p-6 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
              3. Capacity, Teams & Fees
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Max Capacity</label>
                <input
                  type="number"
                  name="maxCapacity"
                  value={formData.maxCapacity}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-300 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {formData.eventType === 'Team' && (
                <>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">Min Team Size</label>
                    <input
                      type="number"
                      name="minTeamSize"
                      value={formData.minTeamSize}
                      onChange={handleChange}
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-300 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">Max Team Size</label>
                    <input
                      type="number"
                      name="maxTeamSize"
                      value={formData.maxTeamSize}
                      onChange={handleChange}
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-300 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Section 4: Eligibility & Contact */}
          <div className="clean-card p-6 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
              4. Contact Information & Code of Conduct
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Contact Person</label>
                <input
                  type="text"
                  name="contact.name"
                  value={formData.contactInfo.name}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-300 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Contact Email</label>
                <input
                  type="email"
                  name="contact.email"
                  value={formData.contactInfo.email}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-300 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Contact Phone</label>
                <input
                  type="text"
                  name="contact.phone"
                  value={formData.contactInfo.phone}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-300 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="sm:col-span-3 space-y-1">
                <label className="text-xs font-bold text-slate-700">Rules & Code of Conduct</label>
                <textarea
                  rows={2}
                  name="rules"
                  value={formData.rules}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-300 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>
        </form>
      </main>
    </div>
  );
};

export default EventFormPage;
