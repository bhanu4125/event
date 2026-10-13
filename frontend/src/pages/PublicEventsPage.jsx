import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../api/apiClient';
import { useAuth } from '../context/AuthContext';
import EventCard from '../components/common/EventCard';
import EventDetailModal from '../components/common/EventDetailModal';
import {
  Search,
  Calendar,
  Filter,
  X,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Users,
} from 'lucide-react';

const CATEGORIES = [
  'All',
  'Technical',
  'Cultural',
  'Sports',
  'Academic',
  'Workshop',
  'Hackathon',
  'Other',
];

const DEPARTMENTS = [
  'All',
  'Computer Science',
  'Information Technology',
  'Electronics & Comm.',
  'Mechanical Eng.',
  'Civil Engineering',
  'Management & Business',
];

const PublicEventsPage = () => {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAdmin) {
      navigate('/admin/approvals', { replace: true });
    }
  }, [isAdmin, navigate]);

  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedDepartment, setSelectedDepartment] = useState('All');
  const [selectedEventType, setSelectedEventType] = useState('All');
  const [isPaidFilter, setIsPaidFilter] = useState('All');
  const [registrationOpenOnly, setRegistrationOpenOnly] = useState(false);
  const [availableSeatsOnly, setAvailableSeatsOnly] = useState(false);
  const [sortBy, setSortBy] = useState('date_asc');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const [showFiltersDrawer, setShowFiltersDrawer] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [bookmarkedIds, setBookmarkedIds] = useState(new Set());

  // Fetch bookmarks for current user to show active bookmark state
  const fetchBookmarks = async () => {
    try {
      const res = await apiClient.get('/bookmarks');
      const ids = new Set((res.data.data || []).map((e) => e._id));
      setBookmarkedIds(ids);
    } catch (err) {}
  };

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();
      if (selectedCategory !== 'All') queryParams.append('category', selectedCategory);
      if (selectedDepartment !== 'All') queryParams.append('department', selectedDepartment);
      if (selectedEventType !== 'All') queryParams.append('eventType', selectedEventType);
      if (isPaidFilter !== 'All') queryParams.append('isPaid', isPaidFilter);
      if (registrationOpenOnly) queryParams.append('registrationOpenOnly', 'true');
      if (availableSeatsOnly) queryParams.append('availableSeatsOnly', 'true');
      if (search.trim()) queryParams.append('search', search.trim());
      queryParams.append('sortBy', sortBy);
      queryParams.append('page', page);
      queryParams.append('limit', 9);

      const res = await apiClient.get(`/events/public?${queryParams.toString()}`);
      setEvents(res.data.data || []);
      setTotalPages(res.data.totalPages || 1);
      setTotalCount(res.data.total || 0);
    } catch (err) {
      console.error('Error fetching public events:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookmarks();
  }, []);

  // Debounced search & filter refresh
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchEvents();
    }, 200);
    return () => clearTimeout(timer);
  }, [
    search,
    selectedCategory,
    selectedDepartment,
    selectedEventType,
    isPaidFilter,
    registrationOpenOnly,
    availableSeatsOnly,
    sortBy,
    page,
  ]);

  const handleClearFilters = () => {
    setSearch('');
    setSelectedCategory('All');
    setSelectedDepartment('All');
    setSelectedEventType('All');
    setIsPaidFilter('All');
    setRegistrationOpenOnly(false);
    setAvailableSeatsOnly(false);
    setSortBy('date_asc');
    setPage(1);
  };

  const activeFiltersCount =
    (selectedCategory !== 'All' ? 1 : 0) +
    (selectedDepartment !== 'All' ? 1 : 0) +
    (selectedEventType !== 'All' ? 1 : 0) +
    (isPaidFilter !== 'All' ? 1 : 0) +
    (registrationOpenOnly ? 1 : 0) +
    (availableSeatsOnly ? 1 : 0);

  const handleOpenDetail = (evt) => {
    setSelectedEvent(evt);
    setIsModalOpen(true);
  };

  const handleBookmarkToggle = (eventId, isNowBookmarked) => {
    setBookmarkedIds((prev) => {
      const next = new Set(prev);
      if (isNowBookmarked) next.add(eventId);
      else next.delete(eventId);
      return next;
    });
  };

  const handleEventUpdated = (updatedEvent) => {
    setEvents((prev) =>
      prev.map((e) => (e._id === updatedEvent._id ? { ...e, ...updatedEvent } : e))
    );
    if (selectedEvent && selectedEvent._id === updatedEvent._id) {
      setSelectedEvent((prev) => ({ ...prev, ...updatedEvent }));
    }
  };

  return (
    <div className="min-h-screen pb-20 bg-[#F8FAFC]">
      {/* Header & Hero */}
      <section className="bg-white border-b border-slate-200 py-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="max-w-3xl space-y-2">
            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Campus Event Discovery
            </h1>
            <p className="text-sm sm:text-base text-slate-500 font-normal">
              Browse approved hackathons, workshops, conferences, and sports meets. Use smart search, filters, and team formation tools.
            </p>
          </div>

          {/* Search & Main Controls Row */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                placeholder="Search events by title, description, or venue..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowFiltersDrawer((prev) => !prev)}
                className={`px-3.5 py-2.5 rounded-xl border text-xs font-semibold flex items-center gap-2 transition ${
                  showFiltersDrawer || activeFiltersCount > 0
                    ? 'bg-indigo-50 border-indigo-300 text-indigo-700'
                    : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <SlidersHorizontal className="w-4 h-4" />
                <span>Filters</span>
                {activeFiltersCount > 0 && (
                  <span className="h-5 w-5 rounded-full bg-indigo-600 text-white text-[11px] flex items-center justify-center font-bold">
                    {activeFiltersCount}
                  </span>
                )}
              </button>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="date_asc">Date: Earliest First</option>
                <option value="date_desc">Date: Latest First</option>
                <option value="deadline_asc">Registration Deadline</option>
                <option value="popularity">Most Popular</option>
                <option value="capacity">Capacity: High to Low</option>
              </select>
            </div>
          </div>

          {/* Category Chips Bar */}
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => {
                  setSelectedCategory(cat);
                  setPage(1);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  selectedCategory === cat
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Advanced Filters Expandable Drawer */}
          {showFiltersDrawer && (
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-4 animate-in fade-in duration-150">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Advanced Filters
                </span>
                {activeFiltersCount > 0 && (
                  <button
                    onClick={handleClearFilters}
                    className="text-xs text-rose-600 hover:underline font-semibold"
                  >
                    Clear All Filters
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
                {/* Event Format */}
                <div className="space-y-1">
                  <label className="font-semibold text-slate-600">Participation Format</label>
                  <select
                    value={selectedEventType}
                    onChange={(e) => setSelectedEventType(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-700 focus:outline-none"
                  >
                    <option value="All">All Formats</option>
                    <option value="Individual">Individual Only</option>
                    <option value="Team">Team Events</option>
                  </select>
                </div>

                {/* Admission Fee */}
                <div className="space-y-1">
                  <label className="font-semibold text-slate-600">Admission Fee</label>
                  <select
                    value={isPaidFilter}
                    onChange={(e) => setIsPaidFilter(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-700 focus:outline-none"
                  >
                    <option value="All">All Events</option>
                    <option value="false">Free Only</option>
                    <option value="true">Paid Only</option>
                  </select>
                </div>

                {/* Department */}
                <div className="space-y-1">
                  <label className="font-semibold text-slate-600">Target Department</label>
                  <select
                    value={selectedDepartment}
                    onChange={(e) => setSelectedDepartment(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-700 focus:outline-none"
                  >
                    {DEPARTMENTS.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Toggles */}
                <div className="flex flex-col justify-end space-y-2 pt-2 sm:pt-0">
                  <label className="flex items-center gap-2 cursor-pointer text-slate-700">
                    <input
                      type="checkbox"
                      checked={registrationOpenOnly}
                      onChange={(e) => setRegistrationOpenOnly(e.target.checked)}
                      className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                    />
                    <span>Registration Open Only</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-slate-700">
                    <input
                      type="checkbox"
                      checked={availableSeatsOnly}
                      onChange={(e) => setAvailableSeatsOnly(e.target.checked)}
                      className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                    />
                    <span>Available Seats Only</span>
                  </label>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Main Events Grid */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 space-y-6">
        <div className="flex items-center justify-between text-xs text-slate-500">
          <span>
            Showing <strong className="text-slate-800">{events.length}</strong> of{' '}
            <strong className="text-slate-800">{totalCount}</strong> published events
          </span>
          {activeFiltersCount > 0 && (
            <button
              onClick={handleClearFilters}
              className="text-indigo-600 font-semibold hover:underline"
            >
              Reset Filters
            </button>
          )}
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="h-96 rounded-2xl bg-white border border-slate-200 animate-pulse"
              />
            ))}
          </div>
        ) : events.length === 0 ? (
          <div className="py-20 text-center rounded-2xl bg-white border border-slate-200 p-8 space-y-3">
            <Calendar className="w-12 h-12 text-slate-300 mx-auto" />
            <h3 className="text-lg font-bold text-slate-800">No events found</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              No published events match your selected filters. Try broadening your search or resetting filters.
            </p>
            <button
              onClick={handleClearFilters}
              className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 transition"
            >
              Clear All Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((evt) => (
              <EventCard
                key={evt._id}
                event={evt}
                isBookmarked={bookmarkedIds.has(evt._id)}
                onBookmarkToggle={handleBookmarkToggle}
                onOpenDetails={handleOpenDetail}
              />
            ))}
          </div>
        )}

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 pt-8">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-2 rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-semibold text-slate-700 px-3">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-2 rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </main>

      {/* Detail Modal */}
      <EventDetailModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        event={selectedEvent}
        onEventUpdated={handleEventUpdated}
      />
    </div>
  );
};

export default PublicEventsPage;
