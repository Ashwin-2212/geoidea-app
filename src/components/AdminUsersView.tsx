import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { UserRole, GeoIdea } from '../types';
import { Shield, GraduationCap, Users, Search, Mail, Calendar, MapPin, MessageSquare, ThumbsUp, RefreshCw, UserCheck, Eye, X, Sparkles, Lightbulb, Filter, Key, CheckCircle2 } from 'lucide-react';

interface UserDirectoryItem {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  bio?: string;
  createdAt: string;
  ideasCount: number;
  totalUpvotesEarned?: number;
  commentsCount: number;
}

export const AdminUsersView: React.FC = () => {
  // Primary Navigation Tab: 'logins' vs 'ideas'
  const [activeTab, setActiveTab] = useState<'logins' | 'ideas'>('logins');

  // Users State
  const [users, setUsers] = useState<UserDirectoryItem[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState<'all' | 'student' | 'admin'>('all');

  // All Ideas State
  const [allIdeas, setAllIdeas] = useState<GeoIdea[]>([]);
  const [loadingIdeas, setLoadingIdeas] = useState(true);
  const [ideaSearchQuery, setIdeaSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Modal inspector state for inspecting specific user's ideas
  const [inspectingUser, setInspectingUser] = useState<UserDirectoryItem | null>(null);
  const [userIdeas, setUserIdeas] = useState<GeoIdea[]>([]);
  const [loadingUserIdeas, setLoadingUserIdeas] = useState(false);

  const fetchUsers = async () => {
    try {
      setLoadingUsers(true);
      const data = await api.getAllUsers();
      setUsers(data);
    } catch (err) {
      console.error('Failed fetching user directory:', err);
    } finally {
      setLoadingUsers(false);
    }
  };

  const fetchAllIdeas = async () => {
    try {
      setLoadingIdeas(true);
      const data = await api.getIdeas({});
      setAllIdeas(data);
    } catch (err) {
      console.error('Failed fetching all ideas:', err);
    } finally {
      setLoadingIdeas(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchAllIdeas();
  }, []);

  const handleInspectUser = async (u: UserDirectoryItem) => {
    setInspectingUser(u);
    try {
      setLoadingUserIdeas(true);
      const ideas = await api.getIdeas({ userId: u.id });
      setUserIdeas(ideas);
    } catch (err) {
      console.error('Failed loading user ideas:', err);
      setUserIdeas([]);
    } finally {
      setLoadingUserIdeas(false);
    }
  };

  // Filtered Users
  const filteredUsers = users.filter((u) => {
    const matchesRole = selectedRole === 'all' || u.role === selectedRole;
    const matchesSearch =
      u.name.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
      (u.bio && u.bio.toLowerCase().includes(userSearchQuery.toLowerCase()));
    return matchesRole && matchesSearch;
  });

  // Filtered Ideas
  const filteredIdeas = allIdeas.filter((idea) => {
    const matchesCategory = selectedCategory === 'all' || idea.category.toLowerCase() === selectedCategory.toLowerCase();
    const matchesSearch =
      idea.title.toLowerCase().includes(ideaSearchQuery.toLowerCase()) ||
      idea.description.toLowerCase().includes(ideaSearchQuery.toLowerCase()) ||
      (idea.authorName && idea.authorName.toLowerCase().includes(ideaSearchQuery.toLowerCase())) ||
      (idea.address && idea.address.toLowerCase().includes(ideaSearchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const studentsCount = users.filter((u) => u.role === 'student').length;
  const adminsCount = users.filter((u) => u.role === 'admin').length;
  const totalIdeasCount = allIdeas.length;

  const categoriesList = Array.from(new Set(allIdeas.map((i) => i.category)));

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Admin Dashboard Header Banner */}
      <div className="bg-gradient-to-r from-indigo-950 via-slate-900 to-indigo-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-indigo-800">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold border border-amber-500/30 uppercase tracking-widest flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-amber-400" />
                Administrator Portal
              </span>
              <span className="px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-200 text-xs font-bold border border-indigo-500/30">
                Chennai Smart City Governance
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Administrator Management Center
            </h1>
            <p className="text-xs sm:text-sm text-indigo-200/90 max-w-2xl leading-relaxed">
              Oversee registered student innovators and administrators, monitor user login credentials, and review all posted geo proposals across Chennai campuses.
            </p>
          </div>

          <button
            onClick={() => {
              fetchUsers();
              fetchAllIdeas();
            }}
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-md transition-all shrink-0"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loadingUsers || loadingIdeas ? 'animate-spin' : ''}`} />
            Refresh All Data
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-indigo-800/80">
          <div className="bg-indigo-900/50 p-3.5 rounded-2xl border border-indigo-700/50">
            <p className="text-xs text-indigo-300 font-medium">Total Registered Users</p>
            <p className="text-2xl font-black text-white mt-0.5">{users.length}</p>
          </div>

          <div className="bg-indigo-900/50 p-3.5 rounded-2xl border border-indigo-700/50">
            <p className="text-xs text-indigo-300 font-medium">Student Accounts</p>
            <p className="text-2xl font-black text-emerald-400 mt-0.5">{studentsCount}</p>
          </div>

          <div className="bg-indigo-900/50 p-3.5 rounded-2xl border border-indigo-700/50">
            <p className="text-xs text-indigo-300 font-medium">Admin Accounts</p>
            <p className="text-2xl font-black text-amber-400 mt-0.5">{adminsCount}</p>
          </div>

          <div className="bg-indigo-900/50 p-3.5 rounded-2xl border border-indigo-700/50">
            <p className="text-xs text-indigo-300 font-medium">Total Ideas Contributed</p>
            <p className="text-2xl font-black text-cyan-300 mt-0.5">{totalIdeasCount}</p>
          </div>
        </div>
      </div>

      {/* SEPARATE BUTTONS FOR LOGINS & IDEAS POSTS */}
      <div className="flex flex-col sm:flex-row items-center justify-between bg-white p-2 rounded-3xl border border-slate-200/90 shadow-sm gap-2">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            id="admin-logins-tab-btn"
            onClick={() => setActiveTab('logins')}
            className={`flex-1 sm:flex-initial px-5 py-3 rounded-2xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 ${
              activeTab === 'logins'
                ? 'bg-indigo-900 text-white shadow-md shadow-indigo-900/20 ring-2 ring-indigo-700'
                : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
            }`}
          >
            <Key className={`w-4 h-4 ${activeTab === 'logins' ? 'text-amber-400' : 'text-indigo-600'}`} />
            <span>User Logins & Accounts</span>
            <span className={`ml-1 px-2 py-0.5 text-[10px] font-black rounded-full ${
              activeTab === 'logins' ? 'bg-amber-400 text-slate-950' : 'bg-slate-200 text-slate-700'
            }`}>
              {users.length}
            </span>
          </button>

          <button
            id="admin-ideas-tab-btn"
            onClick={() => setActiveTab('ideas')}
            className={`flex-1 sm:flex-initial px-5 py-3 rounded-2xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 ${
              activeTab === 'ideas'
                ? 'bg-indigo-900 text-white shadow-md shadow-indigo-900/20 ring-2 ring-indigo-700'
                : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
            }`}
          >
            <Lightbulb className={`w-4 h-4 ${activeTab === 'ideas' ? 'text-amber-400' : 'text-amber-600'}`} />
            <span>Posted Geo Ideas</span>
            <span className={`ml-1 px-2 py-0.5 text-[10px] font-black rounded-full ${
              activeTab === 'ideas' ? 'bg-amber-400 text-slate-950' : 'bg-slate-200 text-slate-700'
            }`}>
              {allIdeas.length}
            </span>
          </button>
        </div>

        <span className="text-xs text-slate-400 font-medium px-3 hidden md:inline">
          {activeTab === 'logins' ? 'Showing user login emails & roles' : 'Showing all submitted geo proposals'}
        </span>
      </div>

      {/* VIEW 1: USER LOGINS & ACCOUNTS INFORMATION */}
      {activeTab === 'logins' && (
        <div className="space-y-4">
          {/* Controls Bar for Logins */}
          <div className="bg-white rounded-3xl p-4 sm:p-5 shadow-sm border border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="relative w-full sm:max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by name, login email, or bio..."
                value={userSearchQuery}
                onChange={(e) => setUserSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium"
              />
            </div>

            <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
              <button
                onClick={() => setSelectedRole('all')}
                className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all ${
                  selectedRole === 'all'
                    ? 'bg-indigo-900 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                All Accounts ({users.length})
              </button>

              <button
                onClick={() => setSelectedRole('student')}
                className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 ${
                  selectedRole === 'student'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                }`}
              >
                <GraduationCap className="w-3.5 h-3.5" />
                Students ({studentsCount})
              </button>

              <button
                onClick={() => setSelectedRole('admin')}
                className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 ${
                  selectedRole === 'admin'
                    ? 'bg-amber-600 text-white shadow-sm'
                    : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
                }`}
              >
                <Shield className="w-3.5 h-3.5" />
                Admins ({adminsCount})
              </button>
            </div>
          </div>

          {/* User Logins Grid */}
          {loadingUsers ? (
            <div className="py-16 text-center text-xs text-slate-400 animate-pulse space-y-2">
              <Users className="w-8 h-8 mx-auto text-indigo-400" />
              <p>Loading registered user accounts...</p>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 text-sm text-slate-500 space-y-2">
              <UserCheck className="w-10 h-10 text-slate-300 mx-auto" />
              <p className="font-semibold text-slate-800">No user logins found</p>
              <p className="text-xs">Try adjusting your search or role filter.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredUsers.map((u) => {
                const isStudent = u.role === 'student';
                const dateStr = new Date(u.createdAt).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric'
                });

                return (
                  <div
                    key={u.id}
                    className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200/90 hover:shadow-md transition-all flex flex-col justify-between space-y-4 relative overflow-hidden"
                  >
                    {/* Role Header */}
                    <div className="flex items-center justify-between">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold uppercase tracking-wider ${
                          isStudent
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : 'bg-indigo-100 text-indigo-900 border border-indigo-200'
                        }`}
                      >
                        {isStudent ? (
                          <>
                            <GraduationCap className="w-3 h-3 text-emerald-600" />
                            Student Account
                          </>
                        ) : (
                          <>
                            <Shield className="w-3 h-3 text-indigo-600" />
                            Administrator
                          </>
                        )}
                      </span>

                      <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        Joined {dateStr}
                      </span>
                    </div>

                    {/* Identity Details */}
                    <div className="flex items-start gap-3.5">
                      <img
                        src={
                          u.avatar ||
                          'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250'
                        }
                        alt={u.name}
                        className={`w-14 h-14 rounded-2xl object-cover ring-2 ${
                          isStudent ? 'ring-emerald-500/20' : 'ring-indigo-500/30'
                        } shadow-xs shrink-0`}
                      />

                      <div className="space-y-1 min-w-0">
                        <h3 className="font-bold text-slate-900 text-sm truncate">{u.name}</h3>
                        <p className="text-xs text-indigo-900 font-bold flex items-center gap-1 font-mono truncate bg-indigo-50 px-2 py-0.5 rounded-lg border border-indigo-100 w-fit">
                          <Mail className="w-3 h-3 text-indigo-600 shrink-0" />
                          {u.email}
                        </p>
                        <p className="text-[10px] text-slate-400 font-mono">
                          User ID: <span className="bg-slate-100 px-1 py-0.5 rounded">{u.id}</span>
                        </p>
                      </div>
                    </div>

                    {/* Bio */}
                    {u.bio && (
                      <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-2xl border border-slate-100 italic line-clamp-2">
                        "{u.bio}"
                      </p>
                    )}

                    {/* User Activity Stats & Inspect Button */}
                    <div className="space-y-3 pt-2 border-t border-slate-100">
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
                          <p className="text-xs font-black text-slate-900">{u.ideasCount}</p>
                          <p className="text-[10px] font-semibold text-slate-500">Ideas</p>
                        </div>

                        <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
                          <p className="text-xs font-black text-slate-900">{u.totalUpvotesEarned ?? 0}</p>
                          <p className="text-[10px] font-semibold text-slate-500">Upvotes</p>
                        </div>

                        <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
                          <p className="text-xs font-black text-slate-900">{u.commentsCount}</p>
                          <p className="text-[10px] font-semibold text-slate-500">Comments</p>
                        </div>
                      </div>

                      <button
                        onClick={() => handleInspectUser(u)}
                        className="w-full py-2 px-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-900 border border-indigo-200 font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5"
                      >
                        <Eye className="w-3.5 h-3.5 text-indigo-600" />
                        Inspect {u.name}'s Ideas ({u.ideasCount})
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* VIEW 2: POSTED GEO IDEAS INFORMATION */}
      {activeTab === 'ideas' && (
        <div className="space-y-4">
          {/* Controls Bar for Ideas */}
          <div className="bg-white rounded-3xl p-4 sm:p-5 shadow-sm border border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="relative w-full sm:max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search idea titles, author names, or locations..."
                value={ideaSearchQuery}
                onChange={(e) => setIdeaSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
              <Filter className="w-4 h-4 text-slate-400 shrink-0" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none"
              >
                <option value="all">All Categories ({allIdeas.length})</option>
                {categoriesList.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* All Ideas List */}
          {loadingIdeas ? (
            <div className="py-16 text-center text-xs text-slate-400 animate-pulse space-y-2">
              <Lightbulb className="w-8 h-8 mx-auto text-amber-500" />
              <p>Loading all submitted geo ideas...</p>
            </div>
          ) : filteredIdeas.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 text-sm text-slate-500 space-y-2">
              <Lightbulb className="w-10 h-10 text-slate-300 mx-auto" />
              <p className="font-semibold text-slate-800">No geo ideas found</p>
              <p className="text-xs">Try clearing the search or category filter.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredIdeas.map((idea) => {
                const dateStr = new Date(idea.createdAt).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric'
                });

                return (
                  <div
                    key={idea.id}
                    className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200/90 hover:shadow-md transition-all flex flex-col md:flex-row items-start gap-4 justify-between"
                  >
                    {/* Optional Thumbnail */}
                    {idea.imageUrl && (
                      <img
                        src={idea.imageUrl}
                        alt={idea.title}
                        className="w-full md:w-36 h-32 rounded-2xl object-cover border border-slate-200 shrink-0"
                      />
                    )}

                    {/* Idea Information */}
                    <div className="space-y-2 flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 text-[11px] font-bold rounded-lg border border-emerald-200">
                          {idea.category}
                        </span>

                        <span className="px-2 py-0.5 bg-slate-100 text-slate-700 text-[10px] font-bold rounded-md">
                          Status: {idea.status || 'Published'}
                        </span>

                        <span className="text-[11px] text-slate-400 font-mono ml-auto">
                          {dateStr}
                        </span>
                      </div>

                      <h3 className="font-bold text-slate-900 text-base leading-snug">{idea.title}</h3>
                      <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">{idea.description}</p>

                      {/* Location & Author Strip */}
                      <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
                        <span className="flex items-center gap-1 text-slate-700 font-medium">
                          <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          {idea.address || `Lat: ${idea.latitude.toFixed(4)}, Lng: ${idea.longitude.toFixed(4)}`}
                        </span>

                        <div className="flex items-center gap-2">
                          <span className="text-slate-400">Posted by:</span>
                          <img
                            src={idea.authorAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250'}
                            alt={idea.authorName}
                            className="w-5 h-5 rounded-full object-cover"
                          />
                          <span className="font-bold text-slate-800">{idea.authorName || 'Student'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Upvotes & Comments */}
                    <div className="flex md:flex-col items-center justify-between w-full md:w-auto gap-3 shrink-0 pt-3 md:pt-0 border-t md:border-t-0 border-slate-100">
                      <div className="bg-emerald-50 border border-emerald-200 px-3 py-2 rounded-2xl text-center min-w-[90px]">
                        <div className="flex items-center justify-center gap-1 text-emerald-800 font-black text-sm">
                          <ThumbsUp className="w-4 h-4 text-emerald-600" />
                          {idea.likesCount || 0}
                        </div>
                        <p className="text-[10px] font-bold text-emerald-700">Upvotes</p>
                      </div>

                      <div className="bg-slate-50 border border-slate-200 px-3 py-2 rounded-2xl text-center min-w-[90px]">
                        <div className="flex items-center justify-center gap-1 text-slate-800 font-black text-sm">
                          <MessageSquare className="w-4 h-4 text-slate-500" />
                          {idea.commentsCount || 0}
                        </div>
                        <p className="text-[10px] font-bold text-slate-500">Comments</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* INSPECT USER SPECIFIC IDEAS MODAL */}
      {inspectingUser && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
          <div className="relative bg-white w-full max-w-3xl rounded-3xl shadow-2xl border border-slate-100 overflow-hidden max-h-[90vh] flex flex-col my-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-indigo-800 bg-indigo-950 text-white">
              <div className="flex items-center gap-3">
                <img
                  src={
                    inspectingUser.avatar ||
                    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250'
                  }
                  alt={inspectingUser.name}
                  className="w-10 h-10 rounded-xl object-cover ring-2 ring-amber-400"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-base text-white">{inspectingUser.name}</h3>
                    <span className="px-2 py-0.5 bg-amber-500 text-slate-950 text-[10px] font-extrabold rounded-md uppercase">
                      {inspectingUser.role}
                    </span>
                  </div>
                  <p className="text-xs text-indigo-200 font-mono">{inspectingUser.email}</p>
                </div>
              </div>

              <button
                onClick={() => setInspectingUser(null)}
                className="p-1.5 text-indigo-300 hover:text-white hover:bg-white/10 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content - Ideas list */}
            <div className="p-6 overflow-y-auto space-y-4 flex-1">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  Submitted Geo Ideas ({userIdeas.length})
                </h4>
                <span className="text-xs text-slate-500">
                  Total Upvotes Received: <strong className="text-slate-900">{inspectingUser.totalUpvotesEarned || 0}</strong>
                </span>
              </div>

              {loadingUserIdeas ? (
                <div className="py-12 text-center text-xs text-slate-400 animate-pulse space-y-2">
                  <RefreshCw className="w-6 h-6 animate-spin mx-auto text-indigo-500" />
                  <p>Fetching user's submitted geo ideas...</p>
                </div>
              ) : userIdeas.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-500">
                  This user has not posted any geo ideas yet.
                </div>
              ) : (
                <div className="space-y-3">
                  {userIdeas.map((idea) => (
                    <div
                      key={idea.id}
                      className="p-4 bg-slate-50 hover:bg-indigo-50/40 rounded-2xl border border-slate-200 transition-all flex flex-col sm:flex-row gap-4 justify-between items-start"
                    >
                      {idea.imageUrl && (
                        <img
                          src={idea.imageUrl}
                          alt={idea.title}
                          className="w-full sm:w-28 h-24 rounded-xl object-cover border border-slate-200 shrink-0"
                        />
                      )}

                      <div className="space-y-1.5 flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-md">
                            {idea.category}
                          </span>
                          <span className="text-[11px] text-slate-500 flex items-center gap-1 truncate">
                            <MapPin className="w-3 h-3 text-slate-400" />
                            {idea.address || `Lat: ${idea.latitude.toFixed(4)}, Lng: ${idea.longitude.toFixed(4)}`}
                          </span>
                        </div>

                        <h5 className="font-bold text-sm text-slate-900 leading-snug">{idea.title}</h5>
                        <p className="text-xs text-slate-600 line-clamp-2">{idea.description}</p>
                      </div>

                      <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto gap-2 shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-200">
                        <div className="flex items-center gap-3 text-xs font-bold text-slate-700">
                          <span className="flex items-center gap-1 text-emerald-700">
                            <ThumbsUp className="w-3.5 h-3.5" />
                            {idea.likesCount || 0} upvotes
                          </span>
                          <span className="flex items-center gap-1 text-slate-600">
                            <MessageSquare className="w-3.5 h-3.5 text-slate-400" />
                            {idea.commentsCount || 0}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setInspectingUser(null)}
                className="px-5 py-2 bg-slate-900 text-white font-bold text-xs rounded-xl hover:bg-slate-800 transition-colors"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
