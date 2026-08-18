import React, { useEffect, useState } from 'react';
import { api } from '../api/client';
import {
  BarChart2,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Layers,
  Building2,
  TrendingUp,
  RefreshCw,
  ShieldAlert,
  Activity,
  Award
} from 'lucide-react';

interface AnalyticsData {
  totalIssues: number;
  resolvedCount: number;
  inProgressCount: number;
  pendingCount: number;
  resolutionRatePercent: number;
  categoriesMap: Record<string, number>;
  severityMap: Record<string, number>;
  departmentMap: Record<string, number>;
  recentActivityCount: number;
}

export const AnalyticsPage: React.FC = () => {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await api.getAnalytics();
      setData(res as any);
    } catch (err: any) {
      setError(err.message || 'Failed to load civic analytics dashboard.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] py-12">
        <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm font-semibold text-slate-600">Loading Smart City Analytics & Dashboards...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-8 text-center bg-rose-50 border border-rose-200 rounded-3xl my-6 max-w-2xl mx-auto">
        <AlertTriangle className="w-10 h-10 text-rose-600 mx-auto mb-3" />
        <h2 className="text-lg font-bold text-rose-900 mb-1">Analytics Unavailable</h2>
        <p className="text-xs text-rose-700 mb-4">{error || 'Could not fetch data.'}</p>
        <button
          onClick={fetchAnalytics}
          className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl transition-all"
        >
          Retry
        </button>
      </div>
    );
  }

  const catValues = Object.values(data.categoriesMap || {}) as number[];
  const maxCategoryCount = Math.max(...(catValues.length > 0 ? catValues : [1]), 1);

  const deptValues = Object.values(data.departmentMap || {}) as number[];
  const maxDeptCount = Math.max(...(deptValues.length > 0 ? deptValues : [1]), 1);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-teal-950 p-6 sm:p-8 rounded-3xl text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-emerald-500/20 via-transparent to-transparent pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-1 bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 font-extrabold text-xs rounded-full uppercase tracking-wider flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5" /> Real-time Civic Pulse
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              City Civic Analytics & Performance Dashboard
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl">
              Transparent, real-time monitoring of reported infrastructure issues, departmental response rates, and community impact.
            </p>
          </div>

          <button
            onClick={fetchAnalytics}
            className="flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white font-semibold text-xs rounded-xl backdrop-blur-md border border-white/20 transition-all self-start md:self-auto shrink-0"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh Data
          </button>
        </div>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Issues */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Reports</span>
            <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700">
              <Layers className="w-5 h-5" />
            </div>
          </div>
          <div>
            <span className="text-3xl font-black text-slate-900">{data.totalIssues}</span>
            <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-600" /> Across Chennai Municipal Zones
            </p>
          </div>
        </div>

        {/* Resolved */}
        <div className="bg-white p-5 rounded-2xl border border-emerald-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">Resolved & Fixed</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-700">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-emerald-900">{data.resolvedCount}</span>
              <span className="text-xs font-bold text-emerald-600">({data.resolutionRatePercent}% Rate)</span>
            </div>
            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mt-2">
              <div
                className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${data.resolutionRatePercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* In Progress */}
        <div className="bg-white p-5 rounded-2xl border border-amber-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-amber-700 uppercase tracking-wider">Work In Progress</span>
            <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center text-amber-700">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div>
            <span className="text-3xl font-black text-amber-900">{data.inProgressCount}</span>
            <p className="text-[11px] text-amber-700 mt-1">Assigned to official municipal crews</p>
          </div>
        </div>

        {/* Pending Triage */}
        <div className="bg-white p-5 rounded-2xl border border-sky-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-sky-700 uppercase tracking-wider">Under Review</span>
            <div className="w-9 h-9 rounded-xl bg-sky-100 flex items-center justify-center text-sky-700">
              <Activity className="w-5 h-5" />
            </div>
          </div>
          <div>
            <span className="text-3xl font-black text-sky-900">{data.pendingCount}</span>
            <p className="text-[11px] text-sky-700 mt-1">Awaiting ground verification</p>
          </div>
        </div>
      </div>

      {/* Analytics Breakdown Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Category Breakdown (2 Cols) */}
        <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-bold text-slate-900 text-lg flex items-center gap-2">
                <BarChart2 className="w-5 h-5 text-emerald-600" />
                Category Distribution Breakdown
              </h2>
              <p className="text-xs text-slate-500">Volume of reports categorized by civic domain</p>
            </div>
            <span className="text-xs font-bold text-slate-400 bg-slate-100 px-3 py-1 rounded-full">
              {Object.keys(data.categoriesMap || {}).length} Domains Active
            </span>
          </div>

          <div className="space-y-3 pt-2">
            {Object.entries(data.categoriesMap || {}).map(([cat, count]) => {
              const cNum = Number(count) || 0;
              const percentage = Math.round((cNum / (data.totalIssues || 1)) * 100);
              const barWidth = Math.round((cNum / maxCategoryCount) * 100);

              return (
                <div key={cat} className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                    <span>{cat}</span>
                    <span className="text-slate-500">
                      {count} reports ({percentage}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 h-3 rounded-xl overflow-hidden flex">
                    <div
                      className="bg-gradient-to-r from-emerald-500 to-teal-600 h-full rounded-xl transition-all duration-500"
                      style={{ width: `${barWidth}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Severity Risk Matrix */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4 flex flex-col justify-between">
          <div>
            <h2 className="font-bold text-slate-900 text-lg flex items-center gap-2 mb-1">
              <ShieldAlert className="w-5 h-5 text-rose-600" />
              Severity Risk Matrix
            </h2>
            <p className="text-xs text-slate-500 mb-4">Urgency & safety hazard levels across reported issues</p>

            <div className="space-y-3">
              {/* Critical */}
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl flex items-center justify-between">
                <div>
                  <span className="font-black text-xs text-rose-900 uppercase">🔥 Critical Safety Hazard</span>
                  <p className="text-[10px] text-rose-700">Immediate public danger</p>
                </div>
                <span className="text-2xl font-black text-rose-900">{data.severityMap?.critical || 0}</span>
              </div>

              {/* High */}
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl flex items-center justify-between">
                <div>
                  <span className="font-black text-xs text-amber-900 uppercase">⚠️ High Urgency</span>
                  <p className="text-[10px] text-amber-700">Major inconvenience or disruption</p>
                </div>
                <span className="text-2xl font-black text-amber-900">{data.severityMap?.high || 0}</span>
              </div>

              {/* Medium */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between">
                <div>
                  <span className="font-black text-xs text-slate-800 uppercase">⚡ Medium Impact</span>
                  <p className="text-[10px] text-slate-500">Standard civic repair required</p>
                </div>
                <span className="text-2xl font-black text-slate-800">{data.severityMap?.medium || 0}</span>
              </div>

              {/* Low */}
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between">
                <div>
                  <span className="font-black text-xs text-emerald-900 uppercase">🌱 Low / Routine</span>
                  <p className="text-[10px] text-emerald-700">Minor aesthetic or long-term plan</p>
                </div>
                <span className="text-2xl font-black text-emerald-900">{data.severityMap?.low || 0}</span>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Community Activity Logs</span>
            <span className="font-bold text-slate-900 bg-slate-100 px-2.5 py-0.5 rounded-full">
              {data.recentActivityCount} Interactions
            </span>
          </div>
        </div>
      </div>

      {/* Department Workload Allocation */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-bold text-slate-900 text-lg flex items-center gap-2">
              <Building2 className="w-5 h-5 text-sky-700" />
              Departmental Workload & Assignment Allocation
            </h2>
            <p className="text-xs text-slate-500">How civic issues are routed to municipal bodies</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
          {Object.entries(data.departmentMap || {}).map(([dept, count]) => {
            const dNum = Number(count) || 0;
            const width = Math.round((dNum / maxDeptCount) * 100);
            return (
              <div key={dept} className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 text-xs truncate max-w-[180px]">{dept}</span>
                  <span className="text-xs font-black text-sky-800 bg-sky-100 px-2 py-0.5 rounded-full">
                    {count} assigned
                  </span>
                </div>
                <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                  <div className="bg-sky-600 h-full rounded-full" style={{ width: `${width}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
