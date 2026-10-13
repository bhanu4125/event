import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/common/Navbar';
import PublicEventsPage from './pages/PublicEventsPage';
import RecommendedEventsPage from './pages/RecommendedEventsPage';
import BookmarksPage from './pages/BookmarksPage';
import CalendarPage from './pages/CalendarPage';
import TeamFinderPage from './pages/TeamFinderPage';
import MyTeamsPage from './pages/MyTeamsPage';
import CreateTeamPage from './pages/CreateTeamPage';
import TeamManagementPage from './pages/TeamManagementPage';
import OrganizerDashboard from './pages/OrganizerDashboard';
import EventFormPage from './pages/EventFormPage';
import AdminApprovalPage from './pages/AdminApprovalPage';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] flex flex-col font-sans selection:bg-indigo-600 selection:text-white">
          <Navbar />
          <div className="flex-1">
            <Routes>
              {/* Feature 1: Event Discovery & Shortlisting */}
              <Route path="/" element={<PublicEventsPage />} />
              <Route path="/recommended" element={<RecommendedEventsPage />} />
              <Route path="/bookmarks" element={<BookmarksPage />} />
              <Route path="/calendar" element={<CalendarPage />} />

              {/* Feature 2: Team Formation & Registration */}
              <Route path="/teams" element={<TeamFinderPage />} />
              <Route path="/teams/me" element={<MyTeamsPage />} />
              <Route path="/teams/create" element={<CreateTeamPage />} />
              <Route path="/teams/:id" element={<TeamManagementPage />} />

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

          {/* Minimal Light Footer */}
          <footer className="border-t border-slate-200 bg-white py-8 px-4 text-center text-xs text-slate-500">
            <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-800">EVENTRA</span>
                <span>• Smart Event Discovery & Team Collaboration Platform</span>
              </div>
              <p>MERN Stack Architecture • Minimal Light-Themed System</p>
            </div>
          </footer>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
