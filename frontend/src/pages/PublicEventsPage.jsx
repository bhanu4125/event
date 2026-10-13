import React, { useState, useEffect } from 'react';
import apiClient from '../api/apiClient';
import StatusBadge from '../components/common/StatusBadge';
import EventDetailModal from '../components/common/EventDetailModal';
import {
  Search,
  Calendar,
  MapPin,
  Clock,
  Users,
  Sparkles,
  ArrowRight,
  Filter,
  CheckCircle2,
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

const PublicEventsPage = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchPublicEvents = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();
      if (selectedCategory !== 'All') queryParams.append('category', selectedCategory);
      if (search.trim()) queryParams.append('search', search.trim());

      const res = await apiClient.get(`/events/public?${queryParams.toString()}`);
      setEvents(res.data.data || []);
    } catch (err) {
      console.error('Error fetching public events:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchPublicEvents();
    }, 250);
    return () => clearTimeout(delayDebounce);
  }, [search, selectedCategory]);

  const handleOpenDetail = (evt) => {
    setSelectedEvent(evt);
    setIsModalOpen(true);
  };

  return (
    <div className="min-h-screen pb-20">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-16 px-4 sm:px-6 lg:px-8 border-b border-slate-800/80 bg-gradient-to-b from-indigo-950/20 via-slate-950 to-slate-950">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-5xl mx-auto text-center space-y-5 relative">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold backdrop-blur-sm">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Campus Engagement Reimagined</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-black text-white tracking-tight leading-tight">
            Discover Verified <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-300 to-cyan-400">Campus Events</span>
          </h1>

          <p className="text-slate-400 text-base sm:text-lg max-w-2xl mx-auto font-normal">
            Explore faculty-approved workshops, flagship hackathons, guest lectures, and cultural fests happening across university grounds.
          </p>

          {/* Search Bar */}
          <div className="pt-4 max-w-2xl mx-auto">
            <div className="relative flex items-center">
              <Search className="absolute left-4 w-5 h-5 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search events by title, keyword, or venue..."
                className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 shadow-xl"
              />
            </div>
          </div>

          {/* Category Chips */}
          <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition ${
                  selectedCategory === cat
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                    : 'bg-slate-900/80 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Events Listing Grid */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">
              Featured Events ({events.length})
            </h2>
            <p className="text-xs text-slate-400">
              Only approved & officially published events are presented here
            </p>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-96 rounded-3xl bg-slate-900/40 border border-slate-800/60 animate-pulse"
              />
            ))}
          </div>
        ) : events.length === 0 ? (
          <div className="py-20 text-center rounded-3xl bg-slate-900/40 border border-slate-800/60 p-8 space-y-3">
            <Calendar className="w-12 h-12 text-slate-600 mx-auto" />
            <h3 className="text-lg font-bold text-white">No published events found</h3>
            <p className="text-sm text-slate-400 max-w-md mx-auto">
              There are currently no events matching your criteria. Try adjusting your search or category filter.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((evt) => (
              <article
                key={evt._id}
                onClick={() => handleOpenDetail(evt)}
                className="group relative flex flex-col rounded-3xl bg-slate-900/70 border border-slate-800/80 hover:border-indigo-500/40 hover:shadow-2xl hover:shadow-indigo-500/10 transition-all duration-300 overflow-hidden cursor-pointer"
              >
                {/* Poster */}
                <div className="relative h-48 w-full overflow-hidden bg-slate-950">
                  <img
                    src={evt.posterUrl}
                    alt={evt.title}
                    className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500 filter brightness-95"
                    onError={(e) => {
                      e.target.src =
                        'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&auto=format&fit=crop&q=80';
                    }}
                  />
                  <div className="absolute top-3 left-3 flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-black/60 backdrop-blur-md text-white text-xs font-semibold border border-white/10">
                      {evt.category}
                    </span>
                  </div>
                  <div className="absolute top-3 right-3">
                    <StatusBadge status={evt.status} size="sm" />
                  </div>
                </div>

                {/* Body */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <h3 className="text-lg font-bold text-white group-hover:text-indigo-300 transition line-clamp-1">
                      {evt.title}
                    </h3>
                    <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                      {evt.shortDescription}
                    </p>
                  </div>

                  {/* Meta items */}
                  <div className="space-y-2 pt-2 border-t border-slate-800/60 text-xs text-slate-300">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-indigo-400 shrink-0" />
                      <span>
                        {new Date(evt.eventDate).toLocaleDateString(undefined, {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric',
                        })}{' '}
                        • {evt.startTime}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span className="truncate">{evt.venue}</span>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <div className="flex items-center gap-1.5 text-slate-400">
                        <Users className="w-3.5 h-3.5 text-purple-400" />
                        <span>
                          {evt.currentRegistrations || 0} / {evt.maxCapacity} seats
                        </span>
                      </div>
                      <span className="font-bold text-emerald-400">
                        {evt.isPaid ? `$${evt.registrationFee}` : 'Free'}
                      </span>
                    </div>
                  </div>

                  {/* Action Link */}
                  <div className="pt-2 flex items-center justify-between">
                    <span className="text-xs font-semibold text-indigo-400 group-hover:underline flex items-center gap-1">
                      <span>View Details</span>
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition" />
                    </span>
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                      {evt.eventType}
                    </span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>

      {/* Modal */}
      <EventDetailModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        event={selectedEvent}
      />
    </div>
  );
};

export default PublicEventsPage;
