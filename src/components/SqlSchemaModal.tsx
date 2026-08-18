import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { Database, Copy, Check, Terminal, Server, Code, Layers, FileCode } from 'lucide-react';

export const SqlSchemaModal: React.FC = () => {
  const [sqlContent, setSqlContent] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadSql() {
      try {
        const sql = await api.getSqlSchema();
        setSqlContent(sql);
      } catch (err) {
        console.error('Failed fetching SQL schema:', err);
      } finally {
        setLoading(false);
      }
    }
    loadSql();
  }, []);

  const handleCopy = () => {
    navigator.clipboard.writeText(sqlContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-800">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center">
            <Database className="w-5 h-5" />
          </div>
          <span className="text-xs font-bold tracking-widest uppercase bg-emerald-500/20 text-emerald-300 px-3 py-1 rounded-full border border-emerald-500/30">
            Database & REST API Blueprint
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-2">Supabase (PostgreSQL) Schema & REST API Spec</h1>
        <p className="text-sm text-slate-300 max-w-3xl leading-relaxed">
          GeoIdea App includes a complete REST API backend with Express, Haversine geospatial distance calculations, JWT Auth, and PostgreSQL/Supabase table definitions.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: SQL DDL Viewer */}
        <div className="lg:col-span-2 bg-slate-900 text-slate-100 rounded-3xl p-6 shadow-xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Terminal className="w-5 h-5 text-emerald-400" />
              <h2 className="font-bold text-base text-white">schema.sql DDL Script</h2>
            </div>

            <button
              id="copy-sql-btn"
              onClick={handleCopy}
              className="flex items-center gap-2 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl shadow-sm transition-all"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied to Clipboard!' : 'Copy SQL Script'}</span>
            </button>
          </div>

          {loading ? (
            <div className="py-12 text-center text-xs text-slate-500 animate-pulse">
              Loading PostgreSQL schema DDL...
            </div>
          ) : (
            <pre className="p-4 bg-slate-950 rounded-2xl text-xs font-mono text-emerald-300/90 overflow-x-auto border border-slate-800/80 max-h-[500px] leading-relaxed">
              {sqlContent}
            </pre>
          )}
        </div>

        {/* Right 1 Col: API Route Reference */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/80 space-y-5">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Server className="w-5 h-5 text-cyan-600" />
            <h2 className="font-bold text-slate-900 text-base">Clean REST API Routes</h2>
          </div>

          <div className="space-y-3 text-xs">
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
              <span className="font-bold text-emerald-700 uppercase">Authentication</span>
              <ul className="mt-1.5 space-y-1 font-mono text-slate-700">
                <li><span className="text-emerald-600 font-bold">POST</span> /api/auth/register</li>
                <li><span className="text-emerald-600 font-bold">POST</span> /api/auth/login</li>
                <li><span className="text-blue-600 font-bold">GET</span> /api/auth/me</li>
              </ul>
            </div>

            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
              <span className="font-bold text-indigo-700 uppercase">Geo Ideas</span>
              <ul className="mt-1.5 space-y-1 font-mono text-slate-700">
                <li><span className="text-blue-600 font-bold">GET</span> /api/ideas</li>
                <li><span className="text-emerald-600 font-bold">POST</span> /api/ideas</li>
                <li><span className="text-amber-600 font-bold">PUT</span> /api/ideas/:id</li>
                <li><span className="text-rose-600 font-bold">DELETE</span> /api/ideas/:id</li>
                <li><span className="text-emerald-600 font-bold">POST</span> /api/ideas/:id/like</li>
              </ul>
            </div>

            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
              <span className="font-bold text-cyan-700 uppercase">Comments & Users</span>
              <ul className="mt-1.5 space-y-1 font-mono text-slate-700">
                <li><span className="text-blue-600 font-bold">GET</span> /api/comments/idea/:ideaId</li>
                <li><span className="text-emerald-600 font-bold">POST</span> /api/comments/idea/:ideaId</li>
                <li><span className="text-rose-600 font-bold">DELETE</span> /api/comments/:id</li>
                <li><span className="text-blue-600 font-bold">GET</span> /api/users/:id/profile</li>
              </ul>
            </div>

            <div className="p-3.5 bg-emerald-50/60 rounded-2xl border border-emerald-200/80 text-emerald-900 space-y-1">
              <p className="font-bold flex items-center gap-1.5 text-xs">
                <Code className="w-4 h-4 text-emerald-600" />
                Connecting External Supabase
              </p>
              <p className="text-[11px] leading-relaxed text-emerald-800">
                Add <code className="bg-emerald-100 px-1 py-0.5 rounded text-emerald-900 font-mono">SUPABASE_URL</code> and <code className="bg-emerald-100 px-1 py-0.5 rounded text-emerald-900 font-mono">SUPABASE_ANON_KEY</code> to your environment settings to auto-switch from local persistence to live cloud Supabase.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
