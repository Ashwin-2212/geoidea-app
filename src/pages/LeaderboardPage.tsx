import React, { useEffect, useState } from 'react';
import { api } from '../api/client';
import { LeaderboardUser } from '../types';
import { Trophy, Medal, Award, CheckCircle2, AlertCircle, Sparkles, Shield, User as UserIcon, RefreshCw } from 'lucide-react';

export const LeaderboardPage: React.FC = () => {
  const [users, setUsers] = useState<LeaderboardUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchLeaderboard = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await api.getLeaderboard();
      setUsers(data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load community leaderboard.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] py-12">
        <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm font-semibold text-slate-600">Loading Community Civic Champions...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center bg-rose-50 border border-rose-200 rounded-3xl my-6 max-w-2xl mx-auto">
        <AlertCircle className="w-10 h-10 text-rose-600 mx-auto mb-3" />
        <h2 className="text-lg font-bold text-rose-900 mb-1">Leaderboard Error</h2>
        <p className="text-xs text-rose-700 mb-4">{error}</p>
        <button
          onClick={fetchLeaderboard}
          className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl transition-all"
        >
          Retry
        </button>
      </div>
    );
  }

  const topThree = users.slice(0, 3);
  const remaining = users.slice(3);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Hero Banner */}
      <div className="bg-gradient-to-r from-amber-900 via-amber-800 to-slate-900 p-6 sm:p-8 rounded-3xl text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-amber-400/20 via-transparent to-transparent pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-1 bg-amber-400/20 border border-amber-400/30 text-amber-300 font-extrabold text-xs rounded-full uppercase tracking-wider flex items-center gap-1.5">
                <Trophy className="w-3.5 h-3.5" /> Civic Champions
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Civic Engagement & Community Leaderboard
            </h1>
            <p className="text-xs sm:text-sm text-amber-100 mt-1 max-w-2xl">
              Honoring citizens, moderators, and officials who active geotag issues, verify ground truth, and drive neighborhood transformation.
            </p>
          </div>

          <button
            onClick={fetchLeaderboard}
            className="flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white font-semibold text-xs rounded-xl backdrop-blur-md border border-white/20 transition-all self-start md:self-auto shrink-0"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Top 3 Podium Cards */}
      {topThree.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* 1st Place Gold */}
          {topThree[0] && (
            <div className="bg-gradient-to-b from-amber-50 to-white p-6 rounded-3xl border-2 border-amber-300 shadow-md relative order-1 md:order-2 transform md:-translate-y-2 flex flex-col items-center text-center">
              <div className="absolute -top-4 bg-amber-400 text-amber-950 font-black px-4 py-1 rounded-full text-xs shadow-md flex items-center gap-1">
                <Trophy className="w-4 h-4 fill-amber-950" /> 1st Place Gold Champion
              </div>

              <img
                src={topThree[0].avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250'}
                alt={topThree[0].name}
                className="w-20 h-20 rounded-2xl object-cover ring-4 ring-amber-400 shadow-md mt-2 mb-3"
              />

              <h3 className="font-extrabold text-slate-900 text-lg">{topThree[0].name}</h3>
              <span className="text-xs font-bold text-amber-800 bg-amber-100 px-3 py-0.5 rounded-full uppercase mt-1 mb-3">
                {topThree[0].role}
              </span>

              <div className="text-2xl font-black text-amber-600 mb-2">
                {topThree[0].points || 0} <span className="text-xs text-slate-500 font-semibold">Civic Pts</span>
              </div>

              <div className="flex items-center justify-center gap-3 text-xs text-slate-600 border-t border-amber-200/80 pt-3 w-full">
                <div>
                  <span className="font-bold text-slate-900 block">{topThree[0].ideasCount || 0}</span>
                  <span className="text-[10px] text-slate-500">Reports</span>
                </div>
                <div className="h-6 w-px bg-amber-200" />
                <div>
                  <span className="font-bold text-slate-900 block">{topThree[0].verificationsCount || 0}</span>
                  <span className="text-[10px] text-slate-500">Verifications</span>
                </div>
              </div>
            </div>
          )}

          {/* 2nd Place Silver */}
          {topThree[1] && (
            <div className="bg-gradient-to-b from-slate-50 to-white p-6 rounded-3xl border border-slate-300 shadow-xs relative order-2 md:order-1 flex flex-col items-center text-center">
              <div className="absolute -top-3 bg-slate-300 text-slate-800 font-black px-3.5 py-0.5 rounded-full text-xs flex items-center gap-1">
                <Medal className="w-3.5 h-3.5" /> 2nd Place Silver
              </div>

              <img
                src={topThree[1].avatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=250'}
                alt={topThree[1].name}
                className="w-16 h-16 rounded-2xl object-cover ring-4 ring-slate-200 shadow-xs mt-2 mb-3"
              />

              <h3 className="font-bold text-slate-900 text-base">{topThree[1].name}</h3>
              <span className="text-[10px] font-bold text-slate-700 bg-slate-200 px-2.5 py-0.5 rounded-full uppercase mt-1 mb-2">
                {topThree[1].role}
              </span>

              <div className="text-xl font-extrabold text-slate-700 mb-2">
                {topThree[1].points || 0} <span className="text-xs text-slate-400 font-medium">Pts</span>
              </div>

              <div className="flex items-center justify-center gap-3 text-xs text-slate-600 border-t border-slate-100 pt-3 w-full">
                <div>
                  <span className="font-bold text-slate-900 block">{topThree[1].ideasCount || 0}</span>
                  <span className="text-[10px] text-slate-500">Reports</span>
                </div>
                <div className="h-6 w-px bg-slate-200" />
                <div>
                  <span className="font-bold text-slate-900 block">{topThree[1].verificationsCount || 0}</span>
                  <span className="text-[10px] text-slate-500">Verifications</span>
                </div>
              </div>
            </div>
          )}

          {/* 3rd Place Bronze */}
          {topThree[2] && (
            <div className="bg-gradient-to-b from-amber-50/50 to-white p-6 rounded-3xl border border-amber-200 shadow-xs relative order-3 flex flex-col items-center text-center">
              <div className="absolute -top-3 bg-amber-700 text-amber-100 font-black px-3.5 py-0.5 rounded-full text-xs flex items-center gap-1">
                <Award className="w-3.5 h-3.5" /> 3rd Place Bronze
              </div>

              <img
                src={topThree[2].avatar || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=250'}
                alt={topThree[2].name}
                className="w-16 h-16 rounded-2xl object-cover ring-4 ring-amber-200 shadow-xs mt-2 mb-3"
              />

              <h3 className="font-bold text-slate-900 text-base">{topThree[2].name}</h3>
              <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded-full uppercase mt-1 mb-2">
                {topThree[2].role}
              </span>

              <div className="text-xl font-extrabold text-amber-800 mb-2">
                {topThree[2].points || 0} <span className="text-xs text-slate-400 font-medium">Pts</span>
              </div>

              <div className="flex items-center justify-center gap-3 text-xs text-slate-600 border-t border-slate-100 pt-3 w-full">
                <div>
                  <span className="font-bold text-slate-900 block">{topThree[2].ideasCount || 0}</span>
                  <span className="text-[10px] text-slate-500">Reports</span>
                </div>
                <div className="h-6 w-px bg-slate-200" />
                <div>
                  <span className="font-bold text-slate-900 block">{topThree[2].verificationsCount || 0}</span>
                  <span className="text-[10px] text-slate-500">Verifications</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Leaderboard Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-bold text-slate-900 text-lg flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-500" />
            Full Leaderboard Ranking
          </h2>
          <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
            {users.length} Active Contributors
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase font-bold border-b border-slate-100">
              <tr>
                <th className="px-4 py-3 text-center">Rank</th>
                <th className="px-4 py-3">Citizen / Official</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3 text-center">Reports Posted</th>
                <th className="px-4 py-3 text-center">Ground Verifications</th>
                <th className="px-4 py-3 text-right">Civic Points</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((u, index) => (
                <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-4 py-3 font-black text-center text-slate-700">
                    {index === 0 && '🥇 1'}
                    {index === 1 && '🥈 2'}
                    {index === 2 && '🥉 3'}
                    {index > 2 && `#${index + 1}`}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <img
                        src={u.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250'}
                        alt={u.name}
                        className="w-8 h-8 rounded-xl object-cover border border-slate-200"
                      />
                      <div>
                        <span className="font-bold text-slate-900 block">{u.name}</span>
                        {u.badges && u.badges.length > 0 && (
                          <div className="flex items-center gap-1 mt-0.5">
                            {u.badges.map((b, i) => (
                              <span
                                key={i}
                                className="text-[9px] bg-emerald-50 text-emerald-800 border border-emerald-200 px-1.5 py-0.2 rounded-md font-semibold"
                              >
                                {b}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 uppercase font-extrabold text-[10px]">
                    <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-full border border-slate-200">
                      {u.role}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center font-bold text-slate-800">{u.ideasCount || 0}</td>
                  <td className="px-4 py-3 text-center font-bold text-emerald-700">
                    <span className="inline-flex items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-100">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      {u.verificationsCount || 0}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="text-sm font-black text-amber-600 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-xl">
                      {u.points || 0} pts
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Point Rules Card */}
      <div className="bg-emerald-50 p-6 rounded-3xl border border-emerald-200 text-xs space-y-3">
        <h3 className="font-bold text-emerald-900 text-sm flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-emerald-600" />
          How Do Citizens Earn Civic Points & Rank Up?
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 text-slate-700">
          <div className="bg-white p-3 rounded-2xl border border-emerald-100 space-y-1">
            <span className="font-bold text-emerald-800 block">📝 Post Geo Report</span>
            <p className="text-[11px] text-slate-600">+20 Points for every geotagged civic issue or smart city idea published</p>
          </div>
          <div className="bg-white p-3 rounded-2xl border border-emerald-100 space-y-1">
            <span className="font-bold text-blue-800 block">✅ Ground Verification</span>
            <p className="text-[11px] text-slate-600">+15 Points when visiting a site and verifying ground truth for neighbors</p>
          </div>
          <div className="bg-white p-3 rounded-2xl border border-emerald-100 space-y-1">
            <span className="font-bold text-amber-800 block">👍 Community Upvotes</span>
            <p className="text-[11px] text-slate-600">+5 Points whenever another citizen upvotes your reported issue</p>
          </div>
        </div>
      </div>
    </div>
  );
};
