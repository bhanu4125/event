import React, { useState, useEffect } from 'react';
import apiClient from '../api/apiClient';
import EventDetailModal from '../components/common/EventDetailModal';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  Tag,
  ArrowRight,
} from 'lucide-react';

const CalendarPage = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDayEvents, setSelectedDayEvents] = useState([]);
  const [selectedDateString, setSelectedDateString] = useState('');
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth(); // 0-indexed

  const monthString = `${year}-${String(month + 1).padStart(2, '0')}`;

  const fetchMonthEvents = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get(`/events/calendar?month=${monthString}`);
      setEvents(res.data.data || []);
    } catch (err) {
      console.error('Error fetching calendar events:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMonthEvents();
  }, [monthString]);

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
    setSelectedDayEvents([]);
    setSelectedDateString('');
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
    setSelectedDayEvents([]);
    setSelectedDateString('');
  };

  const monthName = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });

  // Calendar calculations
  const firstDayIndex = new Date(year, month, 1).getDay(); // 0 = Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Map events to days of the month
  const eventsByDay = {};
  events.forEach((evt) => {
    const d = new Date(evt.eventDate).getDate();
    if (!eventsByDay[d]) eventsByDay[d] = [];
    eventsByDay[d].push(evt);
  });

  const handleDayClick = (dayNumber, dayEvents) => {
    const dateFormatted = new Date(year, month, dayNumber).toLocaleDateString(undefined, {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
    setSelectedDateString(dateFormatted);
    setSelectedDayEvents(dayEvents || []);
  };

  return (
    <div className="min-h-screen pb-20 bg-[#F8FAFC]">
      {/* Header */}
      <section className="bg-white border-b border-slate-200 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
              <CalendarIcon className="w-7 h-7 text-indigo-600" />
              <span>Campus Event Calendar</span>
            </h1>
            <p className="text-sm text-slate-500">
              Interactive monthly schedule of upcoming campus workshops, talks, and competitions.
            </p>
          </div>

          {/* Month Switcher Controls */}
          <div className="flex items-center gap-3 self-start sm:self-auto">
            <button
              onClick={handlePrevMonth}
              className="p-2 rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 transition"
              title="Previous Month"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="text-sm font-bold text-slate-900 min-w-[150px] text-center">
              {monthName}
            </span>
            <button
              onClick={handleNextMonth}
              className="p-2 rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 transition"
              title="Next Month"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </section>

      {/* Calendar Grid Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Monthly Grid */}
        <div className="lg:col-span-2 clean-card p-6 space-y-4">
          {/* Day of Week Headers */}
          <div className="grid grid-cols-7 text-center text-xs font-bold text-slate-400 uppercase tracking-wider">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
              <div key={d} className="py-2">
                {d}
              </div>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1.5">
            {/* Empty cells before month start */}
            {Array.from({ length: firstDayIndex }).map((_, i) => (
              <div key={`empty-${i}`} className="h-20 sm:h-24 rounded-lg bg-slate-50/50" />
            ))}

            {/* Days in Month */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dayEvents = eventsByDay[day] || [];
              const isToday =
                new Date().getDate() === day &&
                new Date().getMonth() === month &&
                new Date().getFullYear() === year;

              return (
                <div
                  key={day}
                  onClick={() => handleDayClick(day, dayEvents)}
                  className={`h-20 sm:h-24 p-1.5 rounded-lg border transition flex flex-col justify-between cursor-pointer ${
                    dayEvents.length > 0
                      ? 'bg-indigo-50/40 border-indigo-200 hover:border-indigo-400'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs font-bold rounded-md px-1.5 py-0.5 ${
                        isToday
                          ? 'bg-indigo-600 text-white'
                          : 'text-slate-700'
                      }`}
                    >
                      {day}
                    </span>
                    {dayEvents.length > 0 && (
                      <span className="h-1.5 w-1.5 rounded-full bg-indigo-600" />
                    )}
                  </div>

                  <div className="space-y-1 overflow-hidden">
                    {dayEvents.slice(0, 2).map((evt) => (
                      <div
                        key={evt._id}
                        className="truncate text-[10px] font-semibold px-1 py-0.5 rounded bg-white border border-indigo-200 text-indigo-900 shadow-2xs"
                        title={evt.title}
                      >
                        {evt.title}
                      </div>
                    ))}
                    {dayEvents.length > 2 && (
                      <span className="text-[9px] text-indigo-600 font-bold block pl-1">
                        +{dayEvents.length - 2} more
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right 1 Col: Selected Date Schedule Inspector */}
        <div className="space-y-4">
          <div className="clean-card p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900">
                {selectedDateString ? selectedDateString : 'Click a date on the calendar'}
              </h3>
              {selectedDayEvents.length > 0 && (
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700">
                  {selectedDayEvents.length} event(s)
                </span>
              )}
            </div>

            {selectedDayEvents.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400 space-y-2">
                <CalendarIcon className="w-8 h-8 text-slate-300 mx-auto" />
                <p>No events scheduled on this date.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {selectedDayEvents.map((evt) => (
                  <div
                    key={evt._id}
                    onClick={() => {
                      setSelectedEvent(evt);
                      setIsModalOpen(true);
                    }}
                    className="p-3.5 rounded-xl border border-slate-200 hover:border-indigo-300 bg-slate-50/50 hover:bg-white transition cursor-pointer space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-100 text-indigo-700 uppercase">
                        {evt.category}
                      </span>
                      <span className="text-xs text-slate-500 font-medium">
                        {evt.startTime}
                      </span>
                    </div>

                    <h4 className="text-xs font-bold text-slate-900 line-clamp-1">
                      {evt.title}
                    </h4>

                    <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                      <MapPin className="w-3 h-3 text-emerald-600 shrink-0" />
                      <span className="truncate">{evt.venue}</span>
                    </div>

                    <div className="pt-1 flex items-center justify-between text-xs text-indigo-600 font-semibold">
                      <span>View details</span>
                      <ArrowRight className="w-3 h-3" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Event Details Modal */}
      <EventDetailModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        event={selectedEvent}
      />
    </div>
  );
};

export default CalendarPage;
