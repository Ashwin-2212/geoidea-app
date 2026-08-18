import React from 'react';
import { useAuth } from '../context/AuthContext';
import {
  MapPin,
  Plus,
  User as UserIcon,
  LogOut,
  Database,
  Navigation,
  Sparkles,
  Users,
  BarChart2,
  Trophy,
  Globe,
  Building2,
  ShieldAlert
} from 'lucide-react';

interface NavbarProps {
  activeTab: 'map' | 'analytics' | 'leaderboard' | 'profile' | 'schema' | 'users';
  setActiveTab: (tab: 'map' | 'analytics' | 'leaderboard' | 'profile' | 'schema' | 'users') => void;
  onOpenPostModal: () => void;
  onOpenAuthModal: () => void;
  selectedLanguage?: string;
  onChangeLanguage?: (lang: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onOpenPostModal,
  onOpenAuthModal,
  selectedLanguage = 'en',
  onChangeLanguage = (_lang: string) => {},
}) => {
  const { user, isAuthenticated, logout } = useAuth();
  const [showDropdown, setShowDropdown] = React.useState(false);

  const role = user?.role || 'citizen';
  const isAdmin = role === 'admin';
  const isOfficial = role === 'official';
  const isModerator = role === 'moderator';

  const getRoleBadge = () => {
    switch (role) {
      case 'admin':
        return { label: '🛡️ ADMIN', color: 'bg-indigo-950 text-amber-300 border-indigo-800' };
      case 'official':
        return { label: '🏛️ GOVT OFFICIAL', color: 'bg-blue-950 text-sky-300 border-blue-800' };
      case 'moderator':
        return { label: '⚖️ MODERATOR', color: 'bg-purple-950 text-purple-200 border-purple-800' };
      default:
        return { label: '🌱 CITIZEN', color: 'bg-emerald-100 text-emerald-800 border-emerald-200' };
    }
  };

  const badge = getRoleBadge();

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab('map')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 via-teal-500 to-cyan-500 flex items-center justify-center text-white shadow-md shadow-emerald-500/20 transform hover:scale-105 transition-all">
              <MapPin className="w-5 h-5 fill-white/20 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-900 bg-clip-text text-transparent">
                  CivicPulse
                </span>
                <span className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-extrabold tracking-wider uppercase bg-emerald-100 text-emerald-800 rounded-full border border-emerald-200">
                  Smart City 3.0
                </span>
              </div>
              <p className="text-[10px] font-medium text-slate-500 hidden md:block">
                Geo-Based Community Innovation Platform
              </p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-100/80 p-1.5 rounded-xl border border-slate-200/60">
            <button
              id="nav-explore-map-btn"
              onClick={() => setActiveTab('map')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'map'
                  ? 'bg-white text-slate-900 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <Navigation className="w-4 h-4 text-emerald-600" />
              Map Explorer
            </button>

            <button
              id="nav-analytics-btn"
              onClick={() => setActiveTab('analytics')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'analytics'
                  ? 'bg-white text-slate-900 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <BarChart2 className="w-4 h-4 text-sky-600" />
              Dashboards
            </button>

            <button
              id="nav-leaderboard-btn"
              onClick={() => setActiveTab('leaderboard')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'leaderboard'
                  ? 'bg-white text-slate-900 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <Trophy className="w-4 h-4 text-amber-500" />
              Leaderboard
            </button>

            {isAdmin && (
              <button
                id="nav-admin-users-btn"
                onClick={() => setActiveTab('users')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  activeTab === 'users'
                    ? 'bg-indigo-900 text-white shadow-xs font-bold'
                    : 'text-indigo-900 font-semibold hover:bg-indigo-50'
                }`}
              >
                <Users className="w-4 h-4 text-amber-400" />
                User Directory
              </button>
            )}

            {isAuthenticated && (
              <button
                id="nav-profile-btn"
                onClick={() => setActiveTab('profile')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  activeTab === 'profile'
                    ? 'bg-white text-slate-900 shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                }`}
              >
                <UserIcon className="w-4 h-4 text-emerald-600" />
                My Profile
              </button>
            )}
          </nav>

          {/* Action Buttons, Language Selector & User Menu */}
          <div className="flex items-center gap-2.5">
            {/* Language Dropdown */}
            <div className="relative flex items-center bg-slate-100 rounded-xl px-2 py-1 border border-slate-200">
              <Globe className="w-3.5 h-3.5 text-slate-500 mr-1" />
              <select
                id="language-selector"
                value={selectedLanguage}
                onChange={(e) => onChangeLanguage(e.target.value)}
                className="bg-transparent text-xs font-semibold text-slate-700 outline-hidden cursor-pointer"
              >
                <option value="en">English (EN)</option>
                <option value="es">Español (ES)</option>
                <option value="fr">Français (FR)</option>
                <option value="hi">हिंदी (HI)</option>
              </select>
            </div>

            <button
              id="post-idea-btn"
              onClick={() => {
                if (!isAuthenticated) {
                  onOpenAuthModal();
                } else {
                  onOpenPostModal();
                }
              }}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-medium text-sm shadow-sm shadow-emerald-600/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <Plus className="w-4.5 h-4.5 stroke-[2.5]" />
              <span className="hidden sm:inline">Report Issue / Idea</span>
              <span className="sm:hidden">Report</span>
            </button>

            {isAuthenticated && user ? (
              <div className="relative">
                <button
                  id="user-menu-btn"
                  onClick={() => setShowDropdown(!showDropdown)}
                  className="flex items-center gap-2.5 p-1 rounded-xl hover:bg-slate-100 transition-colors border border-slate-200/80"
                >
                  <img
                    src={user.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250'}
                    alt={user.name}
                    className="w-8 h-8 rounded-lg object-cover ring-2 ring-emerald-500/20"
                  />
                  <div className="hidden lg:flex flex-col text-left">
                    <span className="font-semibold text-xs text-slate-800 max-w-[110px] truncate leading-tight">
                      {user.name}
                    </span>
                    <span className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded-full w-fit leading-none uppercase tracking-wider flex items-center gap-1 border ${badge.color}`}>
                      {badge.label}
                    </span>
                  </div>
                </button>

                {showDropdown && (
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-100 p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                    <div className="px-3 py-2 border-b border-slate-100">
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <p className="font-semibold text-sm text-slate-900 truncate">{user.name}</p>
                        <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider border ${badge.color}`}>
                          {badge.label}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 truncate">{user.email}</p>
                      {user.department && (
                        <p className="text-[11px] font-medium text-sky-700 mt-1 flex items-center gap-1">
                          <Building2 className="w-3 h-3" />
                          {user.department}
                        </p>
                      )}
                    </div>

                    <button
                      id="dropdown-profile-link"
                      onClick={() => {
                        setActiveTab('profile');
                        setShowDropdown(false);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 rounded-xl transition-colors text-left mt-1"
                    >
                      <UserIcon className="w-4 h-4 text-emerald-600" />
                      View Profile & Points ({user.points || 0} pts)
                    </button>

                    <button
                      id="dropdown-analytics-link"
                      onClick={() => {
                        setActiveTab('analytics');
                        setShowDropdown(false);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 rounded-xl transition-colors text-left"
                    >
                      <BarChart2 className="w-4 h-4 text-sky-600" />
                      Civic Analytics Dashboard
                    </button>

                    <button
                      id="dropdown-leaderboard-link"
                      onClick={() => {
                        setActiveTab('leaderboard');
                        setShowDropdown(false);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 rounded-xl transition-colors text-left"
                    >
                      <Trophy className="w-4 h-4 text-amber-500" />
                      Community Leaderboard
                    </button>

                    {isAdmin && (
                      <button
                        id="dropdown-users-link"
                        onClick={() => {
                          setActiveTab('users');
                          setShowDropdown(false);
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-indigo-900 font-bold hover:bg-indigo-50 rounded-xl transition-colors text-left"
                      >
                        <Users className="w-4 h-4 text-amber-500" />
                        User Directory & Accounts
                      </button>
                    )}

                    <button
                      id="dropdown-schema-link"
                      onClick={() => {
                        setActiveTab('schema');
                        setShowDropdown(false);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 rounded-xl transition-colors text-left"
                    >
                      <Database className="w-4 h-4 text-cyan-600" />
                      PostGIS SQL Schema
                    </button>

                    <div className="my-1 border-t border-slate-100" />

                    <button
                      id="logout-btn"
                      onClick={() => {
                        logout();
                        setShowDropdown(false);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-rose-600 hover:bg-rose-50 rounded-xl transition-colors text-left font-medium"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                id="sign-in-btn"
                onClick={onOpenAuthModal}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-slate-700 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 text-sm font-semibold transition-all"
              >
                <Sparkles className="w-4 h-4 text-emerald-600" />
                Sign In / Register
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

