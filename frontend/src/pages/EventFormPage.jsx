import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import apiClient from '../api/apiClient';
import { useAuth } from '../context/AuthContext';
import {
  Sparkles,
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  Users,
  DollarSign,
  Tag,
  ShieldCheck,
  FileText,
  Mail,
  Phone,
  User,
  Image,
  Send,
  Save,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
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
    rules: '1. Maintain discipline and university decorum.\n2. Carry physical college ID card.\n3. Late entries after start time are strictly prohibited.',
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

  // If edit mode, load event
  useEffect(() => {
    if (isEditMode) {
      const loadEvent = async () => {
        try {
          setFetching(true);
          const res = await apiClient.get(`/events/${id}`);
          const evt = res.data.data;
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
    if (!formData.contactInfo.name.trim()) newErrors['contact.name'] = 'Contact person name is required';
    if (!formData.contactInfo.email.trim()) newErrors['contact.email'] = 'Contact email is required';
    if (!formData.contactInfo.phone.trim()) newErrors['contact.phone'] = 'Contact phone number is required';

    if (formData.eventType === 'Team' && Number(formData.maxTeamSize) < Number(formData.minTeamSize)) {
      newErrors.maxTeamSize = 'Max team size cannot be smaller than min team size';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (submitDirectly = false) => {
    if (!validateForm()) {
      setStatusMessage('Please fix the errors highlighted in red before proceeding.');
      return;
    }

    try {
      setLoading(true);
      setStatusMessage('');

      const payload = {
        ...formData,
        submitDirectly,
      };

      if (isEditMode) {
        await apiClient.put(`/events/${id}`, payload);
        if (submitDirectly) {
          await apiClient.post(`/events/${id}/submit`);
        }
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
      <div className="min-h-screen flex items-center justify-center text-slate-400">
        <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        <span className="ml-3 text-sm">Loading event details...</span>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div className="flex items-center gap-3">
          <Link
            to="/organizer"
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              {isEditMode ? 'Edit Campus Event' : 'Create Campus Event'}
            </h1>
            <p className="text-xs text-slate-400">
              Provide comprehensive details for review and approval by campus authorities.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            disabled={loading}
            onClick={() => handleSubmit(false)}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-2 border border-slate-700 transition"
          >
            <Save className="w-4 h-4 text-slate-400" />
            <span>{isEditMode ? 'Update Details' : 'Save as Draft'}</span>
          </button>

          <button
            type="button"
            disabled={loading}
            onClick={() => handleSubmit(true)}
            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black flex items-center gap-2 shadow-lg shadow-indigo-600/30 transition hover:scale-[1.02]"
          >
            <Send className="w-4 h-4" />
            <span>{isEditMode ? 'Update & Submit' : 'Submit for Approval'}</span>
          </button>
        </div>
      </div>

      {statusMessage && (
        <div className="p-4 rounded-2xl bg-rose-950/40 border border-rose-800/60 text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* Form sections */}
      <form className="space-y-8" onSubmit={(e) => e.preventDefault()}>
        {/* Section 1: Core Details */}
        <section className="p-6 rounded-3xl bg-slate-900/70 border border-slate-800/80 space-y-6">
          <div className="flex items-center gap-2 border-b border-slate-800/60 pb-3">
            <Sparkles className="w-4 h-4 text-indigo-400" />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              1. Event Overview & Category
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="md:col-span-2 space-y-1.5">
              <label className="text-xs font-bold text-slate-300">
                Event Title <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="e.g., CodeSprint 2026: 24-Hour Hackathon"
                className={`w-full px-4 py-2.5 rounded-xl bg-slate-950 border text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                  errors.title ? 'border-rose-500' : 'border-slate-800'
                }`}
              />
              {errors.title && <p className="text-xs text-rose-400">{errors.title}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">Category</label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">Participation Format</label>
              <select
                name="eventType"
                value={formData.eventType}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="Individual">Individual Participant</option>
                <option value="Team">Team Event</option>
              </select>
            </div>

            <div className="md:col-span-2 space-y-1.5">
              <label className="text-xs font-bold text-slate-300">
                Short Catchy Summary <span className="text-rose-400">*</span> (Displayed on cards)
              </label>
              <input
                type="text"
                name="shortDescription"
                maxLength={300}
                value={formData.shortDescription}
                onChange={handleChange}
                placeholder="A compelling 1-2 sentence hook highlighting the event..."
                className={`w-full px-4 py-2.5 rounded-xl bg-slate-950 border text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                  errors.shortDescription ? 'border-rose-500' : 'border-slate-800'
                }`}
              />
              {errors.shortDescription && (
                <p className="text-xs text-rose-400">{errors.shortDescription}</p>
              )}
            </div>

            <div className="md:col-span-2 space-y-1.5">
              <label className="text-xs font-bold text-slate-300">
                Detailed Event Description <span className="text-rose-400">*</span>
              </label>
              <textarea
                rows={4}
                name="detailedDescription"
                value={formData.detailedDescription}
                onChange={handleChange}
                placeholder="Comprehensive agenda, tracks, expected outcomes, speaker profiles..."
                className={`w-full px-4 py-2.5 rounded-xl bg-slate-950 border text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                  errors.detailedDescription ? 'border-rose-500' : 'border-slate-800'
                }`}
              />
              {errors.detailedDescription && (
                <p className="text-xs text-rose-400">{errors.detailedDescription}</p>
              )}
            </div>

            {/* Poster selection */}
            <div className="md:col-span-2 space-y-2">
              <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Image className="w-3.5 h-3.5 text-indigo-400" />
                <span>Event Poster Image URL</span>
              </label>
              <input
                type="text"
                name="posterUrl"
                value={formData.posterUrl}
                onChange={handleChange}
                placeholder="https://images.unsplash.com/..."
                className="w-full px-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <div className="flex items-center gap-2 pt-1 text-xs text-slate-400">
                <span>Or select a preset poster:</span>
                {SAMPLE_POSTERS.map((p, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, posterUrl: p }))}
                    className="h-7 w-10 rounded border border-slate-700 overflow-hidden hover:scale-110 transition"
                  >
                    <img src={p} alt={`preset ${i}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Section 2: Venue & Schedule */}
        <section className="p-6 rounded-3xl bg-slate-900/70 border border-slate-800/80 space-y-6">
          <div className="flex items-center gap-2 border-b border-slate-800/60 pb-3">
            <Calendar className="w-4 h-4 text-emerald-400" />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              2. Venue & Timing
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="sm:col-span-2 space-y-1.5">
              <label className="text-xs font-bold text-slate-300">
                Campus Venue <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                name="venue"
                value={formData.venue}
                onChange={handleChange}
                placeholder="e.g., Main Auditorium, Lab 204"
                className={`w-full px-4 py-2.5 rounded-xl bg-slate-950 border text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                  errors.venue ? 'border-rose-500' : 'border-slate-800'
                }`}
              />
              {errors.venue && <p className="text-xs text-rose-400">{errors.venue}</p>}
            </div>

            <div className="sm:col-span-2 space-y-1.5">
              <label className="text-xs font-bold text-slate-300">
                Event Date <span className="text-rose-400">*</span>
              </label>
              <input
                type="date"
                name="eventDate"
                value={formData.eventDate}
                onChange={handleChange}
                className={`w-full px-4 py-2.5 rounded-xl bg-slate-950 border text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                  errors.eventDate ? 'border-rose-500' : 'border-slate-800'
                }`}
              />
              {errors.eventDate && <p className="text-xs text-rose-400">{errors.eventDate}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">Start Time</label>
              <input
                type="text"
                name="startTime"
                value={formData.startTime}
                onChange={handleChange}
                placeholder="10:00 AM"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">End Time</label>
              <input
                type="text"
                name="endTime"
                value={formData.endTime}
                onChange={handleChange}
                placeholder="04:00 PM"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">Registration Opens</label>
              <input
                type="date"
                name="registrationStartDate"
                value={formData.registrationStartDate}
                onChange={handleChange}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">
                Registration Deadline <span className="text-rose-400">*</span>
              </label>
              <input
                type="date"
                name="registrationDeadline"
                value={formData.registrationDeadline}
                onChange={handleChange}
                className={`w-full px-4 py-2.5 rounded-xl bg-slate-950 border text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                  errors.registrationDeadline ? 'border-rose-500' : 'border-slate-800'
                }`}
              />
            </div>
          </div>
        </section>

        {/* Section 3: Capacity, Teams & Pricing */}
        <section className="p-6 rounded-3xl bg-slate-900/70 border border-slate-800/80 space-y-6">
          <div className="flex items-center gap-2 border-b border-slate-800/60 pb-3">
            <Users className="w-4 h-4 text-purple-400" />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              3. Capacity, Teams & Fees
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">Max Capacity</label>
              <input
                type="number"
                min={1}
                name="maxCapacity"
                value={formData.maxCapacity}
                onChange={handleChange}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {formData.eventType === 'Team' && (
              <>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">Min Team Members</label>
                  <input
                    type="number"
                    min={1}
                    name="minTeamSize"
                    value={formData.minTeamSize}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">Max Team Members</label>
                  <input
                    type="number"
                    min={1}
                    name="maxTeamSize"
                    value={formData.maxTeamSize}
                    onChange={handleChange}
                    className={`w-full px-4 py-2.5 rounded-xl bg-slate-950 border text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                      errors.maxTeamSize ? 'border-rose-500' : 'border-slate-800'
                    }`}
                  />
                  {errors.maxTeamSize && (
                    <p className="text-xs text-rose-400">{errors.maxTeamSize}</p>
                  )}
                </div>
              </>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">Ticketing</label>
              <div className="flex items-center gap-3 pt-2">
                <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
                  <input
                    type="checkbox"
                    name="isPaid"
                    checked={formData.isPaid}
                    onChange={handleChange}
                    className="rounded bg-slate-950 border-slate-700 text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                  />
                  <span>Paid Event</span>
                </label>
                {formData.isPaid && (
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-slate-400">$</span>
                    <input
                      type="number"
                      min={0}
                      name="registrationFee"
                      value={formData.registrationFee}
                      onChange={handleChange}
                      className="w-20 px-2 py-1 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white"
                      placeholder="Fee"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Section 4: Eligibility & Restrictions */}
        <section className="p-6 rounded-3xl bg-slate-900/70 border border-slate-800/80 space-y-6">
          <div className="flex items-center gap-2 border-b border-slate-800/60 pb-3">
            <ShieldCheck className="w-4 h-4 text-cyan-400" />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              4. Eligibility & Restrictions
            </h2>
          </div>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">
                General Eligibility Criteria
              </label>
              <input
                type="text"
                name="eligibilityCriteria"
                value={formData.eligibilityCriteria}
                onChange={handleChange}
                placeholder="e.g., Open to all registered students with college ID"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Department pills */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300">Allowed Departments</label>
              <div className="flex flex-wrap gap-2">
                {DEPARTMENTS.map((dept) => {
                  const active = formData.departmentRestrictions.includes(dept);
                  return (
                    <button
                      type="button"
                      key={dept}
                      onClick={() => toggleDepartment(dept)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                        active
                          ? 'bg-indigo-600 text-white shadow'
                          : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                      }`}
                    >
                      {dept}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Academic Year pills */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300">Allowed Academic Years</label>
              <div className="flex flex-wrap gap-2">
                {YEARS.map((yr) => {
                  const active = formData.academicYearRestrictions.includes(yr);
                  return (
                    <button
                      type="button"
                      key={yr}
                      onClick={() => toggleYear(yr)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                        active
                          ? 'bg-indigo-600 text-white shadow'
                          : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                      }`}
                    >
                      {yr}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Rules */}
            <div className="space-y-1.5 pt-2">
              <label className="text-xs font-bold text-slate-300">Rules & Code of Conduct</label>
              <textarea
                rows={3}
                name="rules"
                value={formData.rules}
                onChange={handleChange}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
        </section>

        {/* Section 5: Contact Information */}
        <section className="p-6 rounded-3xl bg-slate-900/70 border border-slate-800/80 space-y-6">
          <div className="flex items-center gap-2 border-b border-slate-800/60 pb-3">
            <Mail className="w-4 h-4 text-amber-400" />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              5. Organizer Contact Info
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">Contact Person Name</label>
              <input
                type="text"
                name="contact.name"
                value={formData.contactInfo.name}
                onChange={handleChange}
                placeholder="Full Name"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">Contact Email</label>
              <input
                type="email"
                name="contact.email"
                value={formData.contactInfo.email}
                onChange={handleChange}
                placeholder="organizer@university.edu"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">Contact Phone</label>
              <input
                type="text"
                name="contact.phone"
                value={formData.contactInfo.phone}
                onChange={handleChange}
                placeholder="+1 555-0100"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
        </section>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
          <Link
            to="/organizer"
            className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition"
          >
            Cancel
          </Link>

          <button
            type="button"
            disabled={loading}
            onClick={() => handleSubmit(false)}
            className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-2 border border-slate-700 transition"
          >
            <Save className="w-4 h-4 text-slate-400" />
            <span>Save as Draft</span>
          </button>

          <button
            type="button"
            disabled={loading}
            onClick={() => handleSubmit(true)}
            className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black flex items-center gap-2 shadow-lg shadow-indigo-600/30 transition hover:scale-[1.02]"
          >
            <Send className="w-4 h-4" />
            <span>Submit for Admin Approval</span>
          </button>
        </div>
      </form>
    </div>
  );
};

export default EventFormPage;
