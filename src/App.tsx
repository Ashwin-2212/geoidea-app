import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { HomePage } from './pages/HomePage';
import { ProfilePage } from './pages/ProfilePage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { LeaderboardPage } from './pages/LeaderboardPage';
import { SqlSchemaModal } from './components/SqlSchemaModal';
import { AdminUsersView } from './components/AdminUsersView';
import { PostIdeaModal } from './components/PostIdeaModal';
import { AuthModal } from './components/AuthModal';
import { GeoIdea } from './types';
import { MapPin, Database, Users, BarChart2, Trophy } from 'lucide-react';

function AppContent() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'map' | 'analytics' | 'leaderboard' | 'profile' | 'schema' | 'users'>('map');
  const [showPostModal, setShowPostModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [selectedIdeaForDetail, setSelectedIdeaForDetail] = useState<GeoIdea | null>(null);

  const isAdmin = user?.role === 'admin';
  const isStudent = user?.role === 'student';

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenPostModal={() => setShowPostModal(true)}
        onOpenAuthModal={() => setShowAuthModal(true)}
      />

      {/* Main Content Body */}
      <main className="flex-1 p-3 sm:p-6 max-w-7xl w-full mx-auto">
        {activeTab === 'map' && (
          <HomePage onOpenAuthModal={() => setShowAuthModal(true)} />
        )}

        {activeTab === 'analytics' && (
          <AnalyticsPage />
        )}

        {activeTab === 'leaderboard' && (
          <LeaderboardPage />
        )}

        {activeTab === 'profile' && (
          <ProfilePage
            onSelectIdea={(idea) => {
              setActiveTab('map');
              setSelectedIdeaForDetail(idea);
            }}
            onLikeToggle={() => {}}
            onRequireAuth={() => setShowAuthModal(true)}
          />
        )}

        {activeTab === 'users' && (
          <AdminUsersView />
        )}

        {activeTab === 'schema' && !isStudent && !isAdmin && (
          <SqlSchemaModal />
        )}
      </main>

      {/* Global Modals */}
      {showPostModal && (
        <PostIdeaModal
          onClose={() => setShowPostModal(false)}
          onCreated={() => {
            setActiveTab('map');
          }}
        />
      )}

      {showAuthModal && (
        <AuthModal onClose={() => setShowAuthModal(false)} />
      )}

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-200/80 bg-white/80 py-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold">
              <MapPin className="w-3.5 h-3.5 fill-white" />
            </div>
            <span className="font-bold text-slate-800 text-sm">CivicPulse</span>
            <span>— Smart City Geo-Innovation & Civic Response</span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 text-slate-500 font-medium">
            <button onClick={() => setActiveTab('map')} className="hover:text-emerald-600 transition-colors">
              Interactive Map
            </button>

            <button onClick={() => setActiveTab('analytics')} className="hover:text-emerald-600 transition-colors flex items-center gap-1">
              <BarChart2 className="w-3.5 h-3.5 text-sky-600" />
              Dashboards
            </button>

            <button onClick={() => setActiveTab('leaderboard')} className="hover:text-emerald-600 transition-colors flex items-center gap-1">
              <Trophy className="w-3.5 h-3.5 text-amber-500" />
              Leaderboard
            </button>

            {/* Admin view button instead of Schema */}
            {isAdmin && (
              <button
                onClick={() => setActiveTab('users')}
                className="hover:text-indigo-600 transition-colors flex items-center gap-1 font-bold text-indigo-900"
              >
                <Users className="w-3.5 h-3.5 text-amber-500" />
                User Directory & Logins
              </button>
            )}

            {/* REST API & Schema hidden for students */}
            {!isStudent && !isAdmin && (
              <button onClick={() => setActiveTab('schema')} className="hover:text-emerald-600 transition-colors flex items-center gap-1">
                <Database className="w-3.5 h-3.5 text-cyan-600" />
                REST API & SQL
              </button>
            )}

            <button onClick={() => setActiveTab('profile')} className="hover:text-emerald-600 transition-colors">
              Profile
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
