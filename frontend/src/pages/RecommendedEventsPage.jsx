import React, { useState, useEffect } from 'react';
import apiClient from '../api/apiClient';
import { useAuth } from '../context/AuthContext';
import EventCard from '../components/common/EventCard';
import EventDetailModal from '../components/common/EventDetailModal';
import {
  Sparkles,
  Sliders,
  CheckCircle2,
  Calendar,
  Layers,
  ArrowRight,
  Info,
  Check,
} from 'lucide-react';

const AVAILABLE_INTERESTS = [
  'Web Development',
  'Competitive Programming',
  'Artificial Intelligence',
  'Cybersecurity',
  'Robotics',
  'Research',
  'Cultural Activities',
  'Sports',
  'Entrepreneurship',
  'Design',
  'Workshops',
  'Hackathons',
];

const RecommendedEventsPage = () => {
  const { user } = useAuth();
  const [recommendedEvents, setRecommendedEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userInterests, setUserInterests] = useState([]);
  const [showInterestsModal, setShowInterestsModal] = useState(false);
  const [selectedInterests, setSelectedInterests] = useState([]);
  const [savingInterests, setSavingInterests] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchRecommendations = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/events/recommended');
      setRecommendedEvents(res.data.data || []);
    } catch (err) {
      console.error('Error fetching recommendations:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserInterests = async () => {
    try {
      const res = await apiClient.get('/auth/interests');
      setUserInterests(res.data.data || []);
      setSelectedInterests(res.data.data || []);
    } catch (err) {}
  };

  useEffect(() => {
    fetchRecommendations();
    fetchUserInterests();
  }, [user]);

  const toggleInterest = (interest) => {
    if (selectedInterests.includes(interest)) {
      setSelectedInterests(selectedInterests.filter((i) => i !== interest));
    } else {
      setSelectedInterests([...selectedInterests, interest]);
    }
  };

  const saveInterests = async () => {
    try {
      setSavingInterests(true);
      const res = await apiClient.put('/auth/interests', {
        interests: selectedInterests,
      });
      setUserInterests(res.data.data || []);
      setShowInterestsModal(false);
      fetchRecommendations();
    } catch (err) {
      alert('Failed to update interests: ' + err.message);
    } finally {
      setSavingInterests(false);
    }
  };

  return (
    <div className="min-h-screen pb-20 bg-[#F8FAFC]">
      {/* Header */}
      <section className="bg-white border-b border-slate-200 py-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Rule-Based Personalization (Non-AI)</span>
              </div>
              <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
                Recommended For You
              </h1>
              <p className="text-sm text-slate-500">
                Ranked using our rule-based relevance scoring model matching your profile interests, registration status, seat availability, and upcoming dates.
              </p>
            </div>

            <button
              onClick={() => setShowInterestsModal(true)}
              className="px-4 py-2.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold text-xs border border-indigo-200 flex items-center gap-2 transition self-start sm:self-auto"
            >
              <Sliders className="w-4 h-4" />
              <span>Customize Interests ({userInterests.length})</span>
            </button>
          </div>

          {/* Active Interests Chips */}
          <div className="flex flex-wrap items-center gap-1.5 pt-2">
            <span className="text-xs text-slate-500 font-medium mr-1">Your active interests:</span>
            {userInterests.map((interest) => (
              <span
                key={interest}
                className="px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-700 text-xs font-semibold border border-slate-200"
              >
                {interest}
              </span>
            ))}
            {userInterests.length === 0 && (
              <span className="text-xs text-slate-400 italic">None selected yet.</span>
            )}
          </div>
        </div>
      </section>

      {/* Recommended Grid */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 space-y-6">
        {/* Scoring logic info card */}
        <div className="p-4 rounded-xl bg-white border border-slate-200 flex items-start gap-3 shadow-2xs">
          <Info className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
          <div className="text-xs text-slate-600 leading-relaxed space-y-1">
            <p className="font-semibold text-slate-800">How Rule-Based Scoring Works:</p>
            <p>
              Events are scored transparently: <strong>+40</strong> for category/keyword interest match,{' '}
              <strong>+20</strong> for open registration, <strong>+15</strong> for available seats,{' '}
              <strong>+15</strong> for department match, and <strong>+10</strong> if happening in the next 14 days.
            </p>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-96 rounded-2xl bg-white border border-slate-200 animate-pulse"
              />
            ))}
          </div>
        ) : recommendedEvents.length === 0 ? (
          <div className="py-20 text-center rounded-2xl bg-white border border-slate-200 p-8 space-y-3">
            <Sparkles className="w-12 h-12 text-slate-300 mx-auto" />
            <h3 className="text-lg font-bold text-slate-800">No matching recommendations found</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Try selecting more campus interests to expand your personalized event stream.
            </p>
            <button
              onClick={() => setShowInterestsModal(true)}
              className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-xs font-semibold"
            >
              Set Interests
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recommendedEvents.map((evt) => (
              <div key={evt._id} className="relative group">
                {/* Scoring score pill overlay */}
                <div className="absolute top-2 left-2 z-10 flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-indigo-600 text-white text-[11px] font-bold shadow-md">
                  <Sparkles className="w-3 h-3" />
                  <span>Relevance: {evt.recommendationScore} pts</span>
                </div>

                <EventCard event={evt} onOpenDetails={() => {
                  setSelectedEvent(evt);
                  setIsModalOpen(true);
                }} />
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Customize Interests Modal */}
      {showInterestsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="relative w-full max-w-md p-6 rounded-2xl bg-white border border-slate-200 shadow-xl space-y-5">
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-slate-900">Manage Your Interests</h3>
              <p className="text-xs text-slate-500">
                Select topics you enjoy. Our rule-based ranker prioritizes campus events tailored to these areas.
              </p>
            </div>

            <div className="flex flex-wrap gap-2 py-2">
              {AVAILABLE_INTERESTS.map((interest) => {
                const active = selectedInterests.includes(interest);
                return (
                  <button
                    key={interest}
                    type="button"
                    onClick={() => toggleInterest(interest)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border flex items-center gap-1.5 transition ${
                      active
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {active && <Check className="w-3 h-3" />}
                    <span>{interest}</span>
                  </button>
                );
              })}
            </div>

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowInterestsModal(false)}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={savingInterests}
                onClick={saveInterests}
                className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition"
              >
                {savingInterests ? 'Saving...' : 'Save Interests'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Event Details Modal */}
      <EventDetailModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        event={selectedEvent}
      />
    </div>
  );
};

export default RecommendedEventsPage;
