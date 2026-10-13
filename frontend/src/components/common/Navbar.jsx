import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import apiClient from '../../api/apiClient';
import {
  Sparkles,
  Calendar,
  Layers,
  ShieldAlert,
  ShieldCheck,
  Bell,
  CheckCheck,
  Bookmark,
  Users,
  Compass,
  LogIn,
  LogOut,
  ChevronDown,
  GraduationCap,
  ExternalLink,
} from 'lucide-react';

const Navbar = () => {
  const { user, isAuthenticated, logout, isAdmin, isOrganizer } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showPortalMenu, setShowPortalMenu] = useState(false);
  const [pendingReviewCount, setPendingReviewCount] = useState(0);

  const notifRef = useRef(null);
  const userMenuRef = useRef(null);
  const portalMenuRef = useRef(null);

  const fetchNotifications = async () => {
    if (!isAuthenticated) return;
    try {
      const res = await apiClient.get('/notifications');
      setNotifications(res.data.data || []);
      setUnreadCount(res.data.unreadCount || 0);
    } catch (err) {}
  };

  const fetchPendingCount = async () => {
    if (!isAdmin) return;
    try {
      const res = await apiClient.get('/events/admin/all?status=pending_approval');
      setPendingReviewCount(res.data.stats?.pending || 0);
    } catch (err) {}
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchNotifications();
      fetchPendingCount();
      const interval = setInterval(() => {
        fetchNotifications();
        fetchPendingCount();
      }, 15000);
      return () => clearInterval(interval);
    } else {
      setNotifications([]);
      setUnreadCount(0);
      setPendingReviewCount(0);
    }
  }, [isAuthenticated, isAdmin]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifications(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setShowUserMenu(false);
      }
      if (portalMenuRef.current && !portalMenuRef.current.contains(e.target)) {
        setShowPortalMenu(false);
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

  const handleLogout = () => {
    logout();
    setShowUserMenu(false);
    navigate('/login');
  };

  const getRoleBadge = (role) => {
    switch (role) {
      case 'admin':
        return {
          label: 'Admin',
          bg: 'bg-purple-100 text-purple-700 border-purple-200',
          dot: 'bg-purple-600',
        };
      case 'organizer':
        return {
          label: 'Organizer',
          bg: 'bg-emerald-100 text-emerald-700 border-emerald-200',
          dot: 'bg-emerald-600',
        };
      default:
        return {
          label: 'Student',
          bg: 'bg-indigo-100 text-indigo-700 border-indigo-200',
          dot: 'bg-indigo-600',
        };
    }
  };

  const badgeConfig = getRoleBadge(user?.role);

  return (
    <header className="sticky top-0 z-40 w-full bg-white border-b border-slate-200 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand */}
        <Link to={isAdmin ? '/admin/approvals' : '/'} className="flex items-center gap-2.5 group">
          <div className="h-9 w-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-sm group-hover:bg-indigo-700 transition">
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
          {isAdmin ? (
            /* Admin Only Options: Calendar, Saved, Organizer, Approvals */
            <>
              <Link
                to="/calendar"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition ${
                  location.pathname === '/calendar'
                    ? 'bg-indigo-50 text-indigo-700 font-bold'
                    : 'hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Calendar className="w-4 h-4 text-indigo-600" />
                <span>Calendar</span>
              </Link>

              <Link
                to="/bookmarks"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition ${
                  location.pathname === '/bookmarks'
                    ? 'bg-indigo-50 text-indigo-700 font-bold'
                    : 'hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Bookmark className="w-4 h-4 text-amber-500" />
                <span>Saved</span>
              </Link>

              <Link
                to="/organizer"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition ${
                  location.pathname.startsWith('/organizer')
                    ? 'bg-emerald-50 text-emerald-700 font-bold'
                    : 'hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Layers className="w-4 h-4 text-emerald-600" />
                <span>Organizer</span>
              </Link>

              <Link
                to="/admin/approvals"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition relative ${
                  location.pathname.startsWith('/admin')
                    ? 'bg-purple-50 text-purple-700 font-bold'
                    : 'hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <ShieldAlert className="w-4 h-4 text-purple-600" />
                <span>Approvals</span>
                {pendingReviewCount > 0 && (
                  <span className="ml-1 px-1.5 py-0.2 rounded-full bg-amber-600 text-white text-[10px] font-bold">
                    {pendingReviewCount}
                  </span>
                )}
              </Link>
            </>
          ) : (
            /* Non-Admin (Student / General Visitor) Options */
            <>
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
                  location.pathname === '/teams'
                    ? 'bg-indigo-50 text-indigo-700 font-bold'
                    : 'hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Users className="w-4 h-4" />
                <span>Teams</span>
              </Link>

              <Link
                to="/recommended"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition ${
                  location.pathname === '/recommended'
                    ? 'bg-indigo-50 text-indigo-700 font-bold'
                    : 'hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>For You</span>
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
                <span>Saved</span>
              </Link>

              {isOrganizer && (
                <Link
                  to="/organizer"
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition ${
                    location.pathname.startsWith('/organizer')
                      ? 'bg-emerald-50 text-emerald-700 font-bold'
                      : 'hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Layers className="w-4 h-4 text-emerald-600" />
                  <span>Organizer</span>
                </Link>
              )}
            </>
          )}
        </nav>

        {/* Right Section: Sign In OR Authenticated User Controls */}
        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <>
              {/* Notification Bell */}
              <div className="relative" ref={notifRef}>
                <button
                  onClick={() => setShowNotifications((prev) => !prev)}
                  className="relative p-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 hover:text-slate-900 transition"
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
                  <div className="absolute right-0 mt-2 w-84 sm:w-96 rounded-2xl bg-white border border-slate-200 shadow-xl overflow-hidden z-50 animate-in fade-in duration-150">
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

              {/* User Profile Pill & Dropdown */}
              <div className="relative" ref={userMenuRef}>
                <button
                  type="button"
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2 p-1.5 pr-2.5 rounded-xl border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 transition cursor-pointer shadow-sm"
                >
                  <div className="h-7 w-7 rounded-lg bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-700 font-bold text-xs uppercase">
                    {user?.name?.slice(0, 2) || 'EV'}
                  </div>
                  <div className="hidden sm:block text-left text-xs leading-tight">
                    <span className="font-bold text-slate-900 block truncate max-w-[110px]">
                      {user?.name}
                    </span>
                    <span className={`inline-block px-1.5 py-0.2 rounded text-[9px] font-extrabold uppercase border ${badgeConfig.bg}`}>
                      {badgeConfig.label}
                    </span>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
                </button>

                {/* Profile dropdown */}
                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-white border border-slate-200 shadow-xl overflow-hidden z-50 animate-in fade-in duration-150">
                    <div className="p-4 bg-slate-50 border-b border-slate-100">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${badgeConfig.bg}`}>
                          {badgeConfig.label} Access
                        </span>
                      </div>
                      <p className="font-bold text-sm text-slate-900">{user?.name}</p>
                      <p className="text-xs text-slate-500 font-mono truncate">{user?.email}</p>
                      <p className="text-[11px] text-slate-600 mt-1">
                        {user?.department} • {user?.year}
                      </p>
                    </div>

                    <div className="p-2 space-y-1 text-xs font-semibold text-slate-700">
                      {isOrganizer && (
                        <Link
                          to="/organizer"
                          onClick={() => setShowUserMenu(false)}
                          className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-emerald-50 hover:text-emerald-700 transition"
                        >
                          <Layers className="w-4 h-4 text-emerald-600" />
                          <span>Organizer Studio</span>
                        </Link>
                      )}

                      {isAdmin && (
                        <Link
                          to="/admin/approvals"
                          onClick={() => setShowUserMenu(false)}
                          className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-purple-50 hover:text-purple-700 transition"
                        >
                          <ShieldCheck className="w-4 h-4 text-purple-600" />
                          <span>Admin Approvals</span>
                        </Link>
                      )}

                      <Link
                        to="/login"
                        onClick={() => setShowUserMenu(false)}
                        className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-slate-100 transition"
                      >
                        <ExternalLink className="w-4 h-4 text-slate-400" />
                        <span>Switch Role Portal</span>
                      </Link>

                      <div className="pt-1 border-t border-slate-100">
                        <button
                          type="button"
                          onClick={handleLogout}
                          className="w-full flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-rose-50 text-rose-600 font-semibold transition"
                        >
                          <LogOut className="w-4 h-4" />
                          <span>Sign Out</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            /* Unauthenticated Visitor Options */
            <div className="flex items-center gap-2">
              {/* Separate Portal Logins Dropdown */}
              <div className="relative" ref={portalMenuRef}>
                <button
                  type="button"
                  onClick={() => setShowPortalMenu(!showPortalMenu)}
                  className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 hover:border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                >
                  <span>Select Portal</span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>

                {showPortalMenu && (
                  <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-white border border-slate-200 shadow-xl overflow-hidden z-50 animate-in fade-in duration-150 p-2 space-y-1">
                    <Link
                      to="/login/student"
                      onClick={() => setShowPortalMenu(false)}
                      className="flex items-center gap-2.5 p-2.5 rounded-xl hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 text-xs font-semibold transition"
                    >
                      <GraduationCap className="w-4 h-4 text-indigo-600" />
                      <div>
                        <div className="font-bold">Student Portal</div>
                        <div className="text-[10px] text-slate-400 font-normal">Events & Teams</div>
                      </div>
                    </Link>

                    <Link
                      to="/login/organizer"
                      onClick={() => setShowPortalMenu(false)}
                      className="flex items-center gap-2.5 p-2.5 rounded-xl hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 text-xs font-semibold transition"
                    >
                      <Layers className="w-4 h-4 text-emerald-600" />
                      <div>
                        <div className="font-bold">Organizer Studio</div>
                        <div className="text-[10px] text-slate-400 font-normal">Create & Manage</div>
                      </div>
                    </Link>

                    <Link
                      to="/login/admin"
                      onClick={() => setShowPortalMenu(false)}
                      className="flex items-center gap-2.5 p-2.5 rounded-xl hover:bg-purple-50 text-slate-700 hover:text-purple-700 text-xs font-semibold transition"
                    >
                      <ShieldCheck className="w-4 h-4 text-purple-600" />
                      <div>
                        <div className="font-bold">Admin Desk</div>
                        <div className="text-[10px] text-slate-400 font-normal">Approval & Review</div>
                      </div>
                    </Link>
                  </div>
                )}
              </div>

              {/* Primary Sign In Button */}
              <Link
                to="/login"
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm transition"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
