import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import { GeoIdea, User } from '../types';
import { IdeaCard } from '../components/IdeaCard';
import { User as UserIcon, MapPin, ThumbsUp, MessageSquare, Calendar, ShieldCheck, Mail, LogOut, Sparkles, Shield, GraduationCap } from 'lucide-react';

interface ProfilePageProps {
  onSelectIdea: (idea: GeoIdea) => void;
  onLikeToggle: (idea: GeoIdea) => void;
  onRequireAuth: () => void;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({
  onSelectIdea,
  onLikeToggle,
  onRequireAuth
}) => {
  const { user, logout } = useAuth();
  const [profileData, setProfileData] = useState<{
    user: User;
    stats: { ideasCount: number; totalUpvotesEarned: number; commentsWrittenCount: number };
  } | null>(null);
  const [myIdeas, setMyIdeas] = useState<GeoIdea[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProfile() {
      if (!user) return;
      try {
        setLoading(true);
        const p = await api.getUserProfile(user.id);
        setProfileData(p);

        const ideas = await api.getIdeas({ userId: user.id });
        setMyIdeas(ideas);
      } catch (err) {
        console.error('Failed loading profile:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchProfile();
  }, [user]);

  const handleDeleteIdea = async (idea: GeoIdea) => {
    if (!window.confirm(`Are you sure you want to delete "${idea.title}"?`)) return;
    try {
      await api.deleteIdea(idea.id);
      setMyIdeas((prev) => prev.filter((i) => i.id !== idea.id));
      if (profileData) {
        setProfileData({
          ...profileData,
          stats: {
            ...profileData.stats,
            ideasCount: Math.max(0, profileData.stats.ideasCount - 1)
          }
        });
      }
    } catch (err) {
      console.error('Failed deleting idea:', err);
    }
  };

  if (!user) {
    return (
      <div className="max-w-md mx-auto my-12 p-8 bg-white rounded-3xl shadow-sm border border-slate-200 text-center space-y-4">
        <UserIcon className="w-12 h-12 text-slate-400 mx-auto" />
        <h2 className="text-xl font-bold text-slate-900">Sign In Required</h2>
        <p className="text-sm text-slate-500">Please sign in to view your profile, manage posted geo ideas, and track upvotes.</p>
        <button
          onClick={onRequireAuth}
          className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl shadow-md"
        >
          Sign In / Register
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Profile Header Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200/80 space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
          <div className="flex items-center gap-4">
            <img
              src={user.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250'}
              alt={user.name}
              className={`w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover ring-4 shadow-md ${
                user.role === 'admin' ? 'ring-indigo-600/30' : 'ring-emerald-500/20'
              }`}
            />
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900">{user.name}</h1>
                {user.role === 'admin' ? (
                  <span className="px-3.5 py-1 bg-indigo-950 text-amber-300 text-xs font-black rounded-full border border-indigo-700 flex items-center gap-1.5 shadow-sm uppercase tracking-wider">
                    <Shield className="w-3.5 h-3.5 text-amber-400" />
                    ADMINISTRATOR
                  </span>
                ) : (
                  <span className="px-3.5 py-1 bg-emerald-100 text-emerald-800 text-xs font-black rounded-full border border-emerald-200 flex items-center gap-1.5 uppercase tracking-wider">
                    <GraduationCap className="w-3.5 h-3.5 text-emerald-600" />
                    STUDENT
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-1">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                {user.email}
              </p>
              {user.bio && <p className="text-xs text-slate-600 mt-2 max-w-xl italic">"{user.bio}"</p>}
            </div>
          </div>

          <button
            id="profile-logout-btn"
            onClick={logout}
            className="flex items-center gap-2 px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold text-xs rounded-xl border border-rose-200 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-emerald-50/60 p-4 rounded-2xl border border-emerald-100 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <p className="text-2xl font-extrabold text-slate-900">{profileData?.stats.ideasCount ?? 0}</p>
              <p className="text-xs font-semibold text-emerald-800">Ideas Mapped</p>
            </div>
          </div>

          <div className="bg-teal-50/60 p-4 rounded-2xl border border-teal-100 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-600 text-white flex items-center justify-center font-bold">
              <ThumbsUp className="w-5 h-5" />
            </div>
            <div>
              <p className="text-2xl font-extrabold text-slate-900">{profileData?.stats.totalUpvotesEarned ?? 0}</p>
              <p className="text-xs font-semibold text-teal-800">Total Upvotes Received</p>
            </div>
          </div>

          <div className="bg-cyan-50/60 p-4 rounded-2xl border border-cyan-100 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-600 text-white flex items-center justify-center font-bold">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <p className="text-2xl font-extrabold text-slate-900">{profileData?.stats.commentsWrittenCount ?? 0}</p>
              <p className="text-xs font-semibold text-cyan-800">Comments Contributed</p>
            </div>
          </div>
        </div>
      </div>

      {/* Posted Ideas Section */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-emerald-600" />
          My Geo Ideas ({myIdeas.length})
        </h2>

        {loading ? (
          <div className="py-12 text-center text-xs text-slate-400 animate-pulse">
            Loading your posted ideas...
          </div>
        ) : myIdeas.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-3xl border border-slate-200/80 text-sm text-slate-500">
            You haven't posted any geo ideas yet. Click "Share Geo Idea" in the top bar to place your first innovation on the map!
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {myIdeas.map((idea) => (
              <IdeaCard
                key={idea.id}
                idea={idea}
                onSelect={onSelectIdea}
                onLikeToggle={onLikeToggle}
                onDelete={handleDeleteIdea}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
