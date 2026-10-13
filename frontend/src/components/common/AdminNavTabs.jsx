import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Calendar, Bookmark, Layers, ShieldAlert } from 'lucide-react';

const AdminNavTabs = ({ pendingCount = 0 }) => {
  const location = useLocation();

  const tabs = [
    {
      id: 'calendar',
      label: 'Calendar',
      path: '/calendar',
      icon: Calendar,
      active: location.pathname === '/calendar',
      color: 'text-indigo-600',
    },
    {
      id: 'saved',
      label: 'Saved',
      path: '/bookmarks',
      icon: Bookmark,
      active: location.pathname === '/bookmarks',
      color: 'text-amber-500',
    },
    {
      id: 'organizer',
      label: 'Organizer',
      path: '/organizer',
      icon: Layers,
      active: location.pathname.startsWith('/organizer'),
      color: 'text-emerald-600',
    },
    {
      id: 'approvals',
      label: 'Approvals',
      path: '/admin/approvals',
      icon: ShieldAlert,
      active: location.pathname.startsWith('/admin'),
      color: 'text-purple-600',
      badge: pendingCount,
    },
  ];

  return (
    <div className="w-full bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto no-scrollbar py-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <Link
                key={tab.id}
                to={tab.path}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition shrink-0 ${
                  tab.active
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Icon
                  className={`w-4 h-4 ${
                    tab.active ? 'text-white' : tab.color
                  }`}
                />
                <span>{tab.label}</span>
                {tab.badge !== undefined && tab.badge > 0 && (
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${
                      tab.active
                        ? 'bg-amber-400 text-slate-900'
                        : 'bg-amber-100 text-amber-800 border border-amber-200'
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default AdminNavTabs;
