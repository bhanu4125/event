import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/common/Navbar';
import PublicEventsPage from './pages/PublicEventsPage';
import OrganizerDashboard from './pages/OrganizerDashboard';
import EventFormPage from './pages/EventFormPage';
import AdminApprovalPage from './pages/AdminApprovalPage';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
          <Navbar />
          <div className="flex-1">
            <Routes>
              {/* Public Student Discovery */}
              <Route path="/" element={<PublicEventsPage />} />

              {/* Organizer Studio */}
              <Route path="/organizer" element={<OrganizerDashboard />} />
              <Route path="/organizer/events/new" element={<EventFormPage />} />
              <Route path="/organizer/events/edit/:id" element={<EventFormPage />} />

              {/* Administrative Approval Desk */}
              <Route path="/admin/approvals" element={<AdminApprovalPage />} />

              {/* Catch-all redirect */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>

          {/* Footer */}
          <footer className="border-t border-slate-900 bg-slate-950/80 py-8 px-4 text-center text-xs text-slate-500">
            <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-400">EVENTRA</span>
                <span>• Integrated Campus Event Management & Approval Workflow</span>
              </div>
              <p>MERN Stack Architecture • Strict Lifecycle & RBAC Enforcement</p>
            </div>
          </footer>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
