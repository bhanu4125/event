import React, { useEffect, useState } from 'react';
import apiClient from '../../api/apiClient';
import StatusBadge from './StatusBadge';
import { Clock, User, ArrowRight, MessageSquare, AlertCircle } from 'lucide-react';

const AuditTimeline = ({ eventId }) => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!eventId) return;
    const fetchLogs = async () => {
      try {
        setLoading(true);
        const res = await apiClient.get(`/events/${eventId}/audit-logs`);
        setLogs(res.data.data || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, [eventId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8 space-x-2 text-slate-400">
        <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        <span className="text-sm">Loading audit history...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-800/50 text-rose-300 text-sm flex items-center gap-2">
        <AlertCircle className="w-4 h-4 shrink-0" />
        <span>Failed to load audit history: {error}</span>
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <div className="text-center py-8 text-slate-400 text-sm">
        No state transition history recorded yet.
      </div>
    );
  }

  const formatActionName = (action) => {
    return action
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (char) => char.toUpperCase());
  };

  return (
    <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-800">
      {logs.map((log) => (
        <div key={log._id} className="relative group">
          {/* Timeline bullet */}
          <div className="absolute -left-[27px] top-1.5 h-3.5 w-3.5 rounded-full border-2 border-slate-900 bg-indigo-500 shadow-[0_0_8px_#6366f1]" />

          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 hover:border-slate-700 transition">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
              <span className="font-semibold text-sm text-slate-200">
                {formatActionName(log.action)}
              </span>
              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                <Clock className="w-3.5 h-3.5" />
                <span>
                  {new Date(log.createdAt).toLocaleString(undefined, {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                  })}
                </span>
              </div>
            </div>

            {/* Transition Pill */}
            <div className="flex items-center gap-2 text-xs my-2">
              {log.previousStatus && (
                <>
                  <StatusBadge status={log.previousStatus} size="sm" />
                  <ArrowRight className="w-3 h-3 text-slate-500" />
                </>
              )}
              <StatusBadge status={log.newStatus} size="sm" />
            </div>

            {/* Performed by & Comments */}
            <div className="mt-2 text-xs text-slate-400 flex items-center gap-2">
              <User className="w-3.5 h-3.5 text-slate-500" />
              <span>
                By <strong className="text-slate-300">{log.performedBy?.name || 'System User'}</strong> (
                {log.performedBy?.role || 'user'})
              </span>
            </div>

            {log.comments && (
              <div className="mt-3 p-2.5 rounded-lg bg-slate-950/70 border border-slate-800/60 text-xs text-slate-300 flex items-start gap-2">
                <MessageSquare className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />
                <p className="whitespace-pre-wrap">{log.comments}</p>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default AuditTimeline;
