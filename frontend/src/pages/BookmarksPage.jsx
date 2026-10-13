import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../api/apiClient';
import EventCard from '../components/common/EventCard';
import EventDetailModal from '../components/common/EventDetailModal';
import { Bookmark, Compass, RefreshCw } from 'lucide-react';

const BookmarksPage = () => {
  const [bookmarkedEvents, setBookmarkedEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchBookmarks = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/bookmarks');
      setBookmarkedEvents(res.data.data || []);
    } catch (err) {
      console.error('Error fetching bookmarks:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookmarks();
  }, []);

  const handleBookmarkToggle = (eventId, isNowBookmarked) => {
    if (!isNowBookmarked) {
      setBookmarkedEvents((prev) => prev.filter((e) => e._id !== eventId));
    }
  };

  return (
    <div className="min-h-screen pb-20 bg-[#F8FAFC]">
      {/* Header */}
      <section className="bg-white border-b border-slate-200 py-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
              <Bookmark className="w-7 h-7 text-indigo-600 fill-indigo-600" />
              <span>Saved Events</span>
            </h1>
            <p className="text-sm text-slate-500">
              Your personalized shortlist of saved campus events and competitions.
            </p>
          </div>

          <button
            onClick={fetchBookmarks}
            className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 transition self-start sm:self-auto"
            title="Refresh saved events"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </section>

      {/* Bookmarks Grid */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-96 rounded-2xl bg-white border border-slate-200 animate-pulse"
              />
            ))}
          </div>
        ) : bookmarkedEvents.length === 0 ? (
          <div className="py-20 text-center rounded-2xl bg-white border border-slate-200 p-8 space-y-3">
            <Bookmark className="w-12 h-12 text-slate-300 mx-auto" />
            <h3 className="text-lg font-bold text-slate-800">No bookmarked events yet</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Save events you are interested in attending by clicking the bookmark button on any event card.
            </p>
            <Link
              to="/"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 transition mt-2"
            >
              <Compass className="w-3.5 h-3.5" />
              <span>Browse Campus Events</span>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {bookmarkedEvents.map((evt) => (
              <EventCard
                key={evt._id}
                event={evt}
                isBookmarked={true}
                onBookmarkToggle={handleBookmarkToggle}
                onOpenDetails={() => {
                  setSelectedEvent(evt);
                  setIsModalOpen(true);
                }}
              />
            ))}
          </div>
        )}
      </main>

      {/* Detail Modal */}
      <EventDetailModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        event={selectedEvent}
      />
    </div>
  );
};

export default BookmarksPage;
