import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Calendar,
  MapPin,
  Users,
  Bookmark,
  ArrowRight,
  UserPlus,
  Check,
} from 'lucide-react';
import StatusBadge from './StatusBadge';
import apiClient from '../../api/apiClient';

const EventCard = ({
  event,
  onOpenDetails,
  isBookmarked: initialBookmarked = false,
  onBookmarkToggle,
}) => {
  const navigate = useNavigate();
  const [bookmarked, setBookmarked] = useState(initialBookmarked);
  const [bookmarkLoading, setBookmarkLoading] = useState(false);

  const toggleBookmark = async (e) => {
    e.stopPropagation();
    try {
      setBookmarkLoading(true);
      if (bookmarked) {
        await apiClient.delete(`/bookmarks/${event._id}`);
        setBookmarked(false);
        if (onBookmarkToggle) onBookmarkToggle(event._id, false);
      } else {
        await apiClient.post(`/bookmarks/${event._id}`);
        setBookmarked(true);
        if (onBookmarkToggle) onBookmarkToggle(event._id, true);
      }
    } catch (err) {
      console.error('Bookmark error:', err.message);
    } finally {
      setBookmarkLoading(false);
    }
  };

  const isTeamEvent = event.eventType === 'Team';
  const isCancelled = event.status === 'cancelled';
  const seatsRemaining = Math.max(0, (event.maxCapacity || 0) - (event.currentRegistrations || 0));

  return (
    <article
      onClick={() => onOpenDetails && onOpenDetails(event)}
      className="clean-card group flex flex-col justify-between overflow-hidden cursor-pointer"
    >
      <div>
        {/* Poster Header */}
        <div className="relative h-48 w-full overflow-hidden bg-slate-100">
          <img
            src={event.posterUrl}
            alt={event.title}
            className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
            onError={(e) => {
              e.target.src =
                'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&auto=format&fit=crop&q=80';
            }}
          />

          {/* Category Chip */}
          <div className="absolute top-3 left-3 flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-md bg-white/95 text-slate-800 text-xs font-semibold shadow-sm border border-slate-200">
              {event.category}
            </span>
          </div>

          {/* Bookmark Button & Status */}
          <div className="absolute top-3 right-3 flex items-center gap-2">
            {isCancelled && <StatusBadge status="cancelled" size="sm" />}
            <button
              type="button"
              onClick={toggleBookmark}
              disabled={bookmarkLoading}
              className={`p-2 rounded-lg border backdrop-blur-sm transition shadow-sm ${
                bookmarked
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : 'bg-white/90 text-slate-600 hover:text-indigo-600 border-slate-200 hover:bg-white'
              }`}
              title={bookmarked ? 'Remove Bookmark' : 'Bookmark Event'}
            >
              <Bookmark className={`w-4 h-4 ${bookmarked ? 'fill-current' : ''}`} />
            </button>
          </div>
        </div>

        {/* Card Body */}
        <div className="p-5 space-y-3">
          <div className="space-y-1.5">
            <h3 className="text-base font-bold text-slate-900 group-hover:text-indigo-600 transition line-clamp-1">
              {event.title}
            </h3>
            <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
              {event.shortDescription}
            </p>
          </div>

          {/* Event Meta list */}
          <div className="space-y-2 pt-2 border-t border-slate-100 text-xs text-slate-600">
            <div className="flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
              <span>
                {new Date(event.eventDate).toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}{' '}
                • {event.startTime}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span className="truncate">{event.venue}</span>
            </div>

            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-1.5 text-slate-500">
                <Users className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                <span>
                  <strong className="text-slate-800">{event.currentRegistrations || 0}</strong> / {event.maxCapacity} seats ({seatsRemaining} left)
                </span>
              </div>
              <span className="font-semibold text-emerald-700">
                {event.isPaid ? `$${event.registrationFee}` : 'Free'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Card Footer / Action */}
      <div className="p-5 pt-0 border-t border-slate-100 mt-2 flex items-center justify-between text-xs">
        <span className="inline-flex items-center px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium">
          {isTeamEvent ? `Team (${event.minTeamSize}-${event.maxTeamSize})` : 'Individual'}
        </span>

        <div className="flex items-center gap-2">
          {/* Action button: Form team or Join event */}
          {isTeamEvent && !isCancelled && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/teams/create?eventId=${event._id}`);
              }}
              className="px-2.5 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold flex items-center gap-1 transition"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Form Team</span>
            </button>
          )}

          {!isTeamEvent && !isCancelled && event.status === 'published' && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (onOpenDetails) onOpenDetails(event);
              }}
              className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold flex items-center gap-1 shadow-sm transition"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Join</span>
            </button>
          )}

          <span className="font-semibold text-indigo-600 flex items-center gap-1 group-hover:translate-x-0.5 transition">
            <span>Details</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </span>
        </div>
      </div>
    </article>
  );
};

export default EventCard;
