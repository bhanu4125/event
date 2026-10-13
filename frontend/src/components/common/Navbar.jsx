import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import apiClient from '../../api/apiClient';
import {
  Sparkles,
  Calendar,
  Layers,
  ShieldAlert,
  Bell,
  Check,
  CheckCheck,
  Bookmark,
  Users,
  Compass,
  Search,
} from 'lucide-react';

const Navbar = () => {
  const { user, switchRole, isAdmin, isOrganizer } = useAuth();
  const location = useLocation();

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [pendingReviewCount, setPendingReviewCount] = useState(0);
  const notifRef = useRef(null);

  const fetchNotifications = async () => {
    if (!user) return;
    try {
      const res = await apiClient.get('/notifications');
      setNotifications(res.data.data || []);
      setUnreadCount(res.data.unreadCount || 0);
    } catch (err) {}
  };

  const fetchPendingCount = async () => {
    try {
      const res = await apiClient.get('/events/admin/all?status=pending_approval');
      setPendingReviewCount(res.data.stats?.pending || 0);
    } catch (err) {}
  };

  useEffect(() => {
    fetchNotifications();
    fetchPendingCount();
    const interval = setInterval(() => {
      fetchNotifications();
      fetchPendingCount();
    }, 15000);
    return () => clearInterval(interval);
  }, [user]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkAsRead = async (id) => {
    try {
      await apiClient.patch(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch (err) {}
  };

  const handleMarkAllRead = async () => {
    try {
      await apiClient.patch('/notifications/mark-all-read');
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {}
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="h-9 w-9 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-sm group-hover:bg-indigo-700 transition">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-lg tracking-tight text-slate-900 group-hover:text-indigo-600 transition">
                EVENTRA
              </span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                Campus
              </span>
            </div>
          </div>
        </Link>

        {/* Center Nav Links */}
        <nav className="hidden lg:flex items-center gap-1 text-sm font-semibold text-slate-600">
          <Link
            to="/"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition ${
              location.pathname === '/'
                ? 'bg-indigo-50 text-indigo-700 font-bold'
                : 'hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Compass className="w-4 h-4" />
            <span>Discover</span>
          </Link>

          <Link
            to="/recommended"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition ${
              location.pathname === '/recommended'
                ? 'bg-indigo-50 text-indigo-700 font-bold'
                : 'hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Sparkles className="w-4 h-4 text-amber-600" />
            <span>Recommended</span>
          </Link>

          <Link
            to="/bookmarks"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition ${
              location.pathname === '/bookmarks'
                ? 'bg-indigo-50 text-indigo-700 font-bold'
                : 'hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Bookmark className="w-4 h-4" />
            <span>Bookmarks</span>
          </Link>

          <Link
            to="/calendar"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition ${
              location.pathname === '/calendar'
                ? 'bg-indigo-50 text-indigo-700 font-bold'
                : 'hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Calendar</span>
          </Link>

          <Link
            to="/teams"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition ${
              location.pathname.startsWith('/teams')
                ? 'bg-indigo-50 text-indigo-700 font-bold'
                : 'hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Teams</span>
          </Link>

          {/* Organizer portal link if authorized */}
          {isOrganizer && (
            <Link
              to="/organizer"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition ${
                location.pathname.startsWith('/organizer')
                  ? 'bg-indigo-50 text-indigo-700 font-bold'
                  : 'hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>Organizer</span>
            </Link>
          )}

          {/* Admin desk link if admin */}
          {isAdmin && (
            <Link
              to="/admin/approvals"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition relative ${
                location.pathname.startsWith('/admin')
                  ? 'bg-indigo-50 text-indigo-700 font-bold'
                  : 'hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <ShieldAlert className="w-4 h-4" />
              <span>Approvals</span>
              {pendingReviewCount > 0 && (
                <span className="ml-1 px-1.5 py-0.2 rounded-full bg-amber-600 text-white text-[10px] font-bold">
                  {pendingReviewCount}
                </span>
              )}
            </Link>
          )}
        </nav>

        {/* Right Section: Role Switcher & Notifications & Profile */}
        <div className="flex items-center gap-3">
          {/* Quick Demo Role Switcher */}
          <div className="flex items-center p-0.5 rounded-lg bg-slate-100 border border-slate-200 text-xs font-semibold">
            <button
              onClick={() => switchRole('student')}
              className={`px-2.5 py-1 rounded-md transition ${
                user?.role === 'student'
                  ? 'bg-white text-indigo-600 shadow-sm font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Student
            </button>
            <button
              onClick={() => switchRole('organizer')}
              className={`px-2.5 py-1 rounded-md transition ${
                user?.role === 'organizer'
                  ? 'bg-white text-indigo-600 shadow-sm font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Organizer
            </button>
            <button
              onClick={() => switchRole('admin')}
              className={`px-2.5 py-1 rounded-md transition ${
                user?.role === 'admin'
                  ? 'bg-white text-indigo-600 shadow-sm font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Admin
            </button>
          </div>

          {/* Notification Bell */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => setShowNotifications((prev) => !prev)}
              className="relative p-2 rounded-lg bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 hover:text-slate-900 transition"
              title="Notifications"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-600 text-[10px] font-bold text-white ring-2 ring-white">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Notification Dropdown */}
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-84 sm:w-96 rounded-xl bg-white border border-slate-200 shadow-xl overflow-hidden z-50 animate-in fade-in duration-150">
                <div className="p-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                  <div className="flex items-center gap-2">
                    <Bell className="w-4 h-4 text-indigo-600" />
                    <span className="font-bold text-sm text-slate-900">Notifications</span>
                    {unreadCount > 0 && (
                      <span className="px-1.5 py-0.2 rounded-full bg-indigo-100 text-indigo-700 text-xs font-semibold">
                        {unreadCount} new
                      </span>
                    )}
                  </div>
                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllRead}
                      className="text-xs text-slate-500 hover:text-indigo-600 flex items-center gap-1 transition"
                    >
                      <CheckCheck className="w-3.5 h-3.5" />
                      <span>Mark all read</span>
                    </button>
                  )}
                </div>

                <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                  {notifications.length === 0 ? (
                    <div className="py-8 text-center text-slate-400 text-xs">
                      No notifications yet.
                    </div>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n._id}
                        onClick={() => !n.isRead && handleMarkAsRead(n._id)}
                        className={`p-3.5 hover:bg-slate-50 transition cursor-pointer flex items-start gap-3 ${
                          !n.isRead ? 'bg-indigo-50/40' : ''
                        }`}
                      >
                        <div
                          className={`mt-1 h-2 w-2 rounded-full shrink-0 ${
                            !n.isRead ? 'bg-indigo-600' : 'bg-transparent'
                          }`}
                        />
                        <div className="flex-1 space-y-0.5">
                          <p className="text-xs font-semibold text-slate-900">{n.title}</p>
                          <p className="text-xs text-slate-600 leading-snug">{n.message}</p>
                          <span className="text-[10px] text-slate-400 block pt-0.5">
                            {new Date(n.createdAt).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User profile pill */}
          <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-slate-200">
            <div className="h-8 w-8 rounded-full bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-700 font-bold text-xs uppercase">
              {user?.name?.slice(0, 2) || 'EV'}
            </div>
            <div className="text-left text-xs leading-tight">
              <span className="font-semibold text-slate-900 block truncate max-w-[100px]">
                {user?.name || 'User'}
              </span>
              <span className="text-[10px] text-slate-500 capitalize">
                {user?.role}
              </span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
