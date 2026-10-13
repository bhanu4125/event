import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/common/Navbar';
import ProtectedRoute from './components/common/ProtectedRoute';
import LoginPage from './pages/LoginPage';
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
              {/* Authentication & Role Portals */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/login/:portalRole" element={<LoginPage />} />

              {/* Feature 1: Public Event Discovery */}
              <Route path="/" element={<PublicEventsPage />} />
              <Route path="/calendar" element={<CalendarPage />} />

              {/* Personalized Student Discovery (Protected) */}
              <Route
                path="/recommended"
                element={
                  <ProtectedRoute allowedRoles={['student', 'organizer', 'admin']} portal="student">
                    <RecommendedEventsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/bookmarks"
                element={
                  <ProtectedRoute allowedRoles={['student', 'organizer', 'admin']} portal="student">
                    <BookmarksPage />
                  </ProtectedRoute>
                }
              />

              {/* Feature 2: Team Formation & Registration */}
              <Route path="/teams" element={<TeamFinderPage />} />
              <Route
                path="/teams/me"
                element={
                  <ProtectedRoute allowedRoles={['student', 'organizer', 'admin']} portal="student">
                    <MyTeamsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/teams/create"
                element={
                  <ProtectedRoute allowedRoles={['student', 'organizer', 'admin']} portal="student">
                    <CreateTeamPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/teams/:id"
                element={
                  <ProtectedRoute allowedRoles={['student', 'organizer', 'admin']} portal="student">
                    <TeamManagementPage />
                  </ProtectedRoute>
                }
              />

              {/* Organizer Studio (Restricted to Organizers & Admins) */}
              <Route
                path="/organizer"
                element={
                  <ProtectedRoute allowedRoles={['organizer', 'admin']} portal="organizer">
                    <OrganizerDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/organizer/events/new"
                element={
                  <ProtectedRoute allowedRoles={['organizer', 'admin']} portal="organizer">
                    <EventFormPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/organizer/events/edit/:id"
                element={
                  <ProtectedRoute allowedRoles={['organizer', 'admin']} portal="organizer">
                    <EventFormPage />
                  </ProtectedRoute>
                }
              />

              {/* Administrative Approval Desk (Restricted to Admins ONLY) */}
              <Route
                path="/admin/approvals"
                element={
                  <ProtectedRoute allowedRoles={['admin']} portal="admin">
                    <AdminApprovalPage />
                  </ProtectedRoute>
                }
              />

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
