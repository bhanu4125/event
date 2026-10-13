import React from 'react';
import { Navigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ShieldAlert, ArrowLeft, LogIn, Lock, CheckCircle2, UserX } from 'lucide-react';

const ProtectedRoute = ({ children, allowedRoles = [], portal = 'student' }) => {
  const { user, loading, isAuthenticated, logout } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-slate-500">
        <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mb-3"></div>
        <p className="text-xs font-medium tracking-wide text-slate-500">Verifying security credentials...</p>
      </div>
    );
  }

  // If not logged in, redirect to login page with portal hint
  if (!isAuthenticated) {
    return <Navigate to={`/login?portal=${portal}`} state={{ from: location }} replace />;
  }

  // If user role is not authorized for this specific route/portal
  if (allowedRoles.length > 0 && !allowedRoles.includes(user?.role)) {
    const requiredRoleLabel = allowedRoles
      .map((r) => r.charAt(0).toUpperCase() + r.slice(1))
      .join(' or ');

    const targetLoginPortal = allowedRoles.includes('admin')
      ? 'admin'
      : allowedRoles.includes('organizer')
      ? 'organizer'
      : 'student';

    return (
      <div className="min-h-[75vh] flex items-center justify-center px-4 py-12">
        <div className="max-w-md w-full bg-white rounded-2xl border border-rose-200 shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          {/* Header Banner */}
          <div className="bg-rose-50 border-b border-rose-100 p-6 text-center">
            <div className="w-14 h-14 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-inner">
              <ShieldAlert className="w-8 h-8" />
            </div>
            <span className="inline-block px-2.5 py-0.5 rounded-full bg-rose-200 text-rose-800 text-xs font-bold uppercase tracking-wider mb-1">
              403 • Unauthorized Access
            </span>
            <h2 className="text-xl font-extrabold text-slate-900">Access Denied</h2>
            <p className="text-xs text-rose-700 mt-1">
              You do not have the credentials required to view this area.
            </p>
          </div>

          {/* Details Body */}
          <div className="p-6 space-y-4">
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-2.5 text-xs">
              <div className="flex justify-between items-center text-slate-600">
                <span>Active Account:</span>
                <span className="font-semibold text-slate-900">{user?.name}</span>
              </div>
              <div className="flex justify-between items-center text-slate-600">
                <span>Email Address:</span>
                <span className="font-mono text-slate-800">{user?.email}</span>
              </div>
              <div className="flex justify-between items-center text-slate-600">
                <span>Your Current Role:</span>
                <span className="px-2 py-0.5 rounded bg-slate-200 text-slate-800 font-bold uppercase text-[10px]">
                  {user?.role}
                </span>
              </div>
              <div className="pt-2 border-t border-slate-200 flex justify-between items-center text-rose-700 font-semibold">
                <span>Required Role:</span>
                <span className="px-2 py-0.5 rounded bg-rose-100 text-rose-700 font-bold uppercase text-[10px]">
                  {requiredRoleLabel}
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed text-center">
              This portal is restricted to authorized campus personnel. Please sign in with an account having <strong className="text-slate-800">{requiredRoleLabel}</strong> privileges.
            </p>

            {/* Actions */}
            <div className="space-y-2 pt-2">
              <Link
                to={`/login?portal=${targetLoginPortal}`}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-sm transition"
              >
                <LogIn className="w-4 h-4" />
                <span>Log In to {targetLoginPortal.charAt(0).toUpperCase() + targetLoginPortal.slice(1)} Portal</span>
              </Link>

              <div className="flex gap-2">
                <Link
                  to="/"
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Return Home</span>
                </Link>
                <button
                  onClick={logout}
                  className="px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-semibold transition"
                >
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return children;
};

export default ProtectedRoute;
