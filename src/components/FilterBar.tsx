import React from 'react';
import { IdeaCategory } from '../types';
import { Search, SlidersHorizontal, MapPin, Compass, Sparkles, LayoutList, Map as MapIcon, RotateCcw, ThumbsUp, MessageSquare } from 'lucide-react';

interface FilterBarProps {
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  selectedCategory: string;
  setSelectedCategory: (cat: string) => void;
  selectedSeverity?: string;
  setSelectedSeverity?: (sev: string) => void;
  selectedStatus?: string;
  setSelectedStatus?: (st: string) => void;
  radiusKm: number;
  setRadiusKm: (r: number) => void;
  sortBy: string;
  setSortBy: (s: string) => void;
  viewMode: 'split' | 'map' | 'list';
  setViewMode: (v: 'split' | 'map' | 'list') => void;
  userHasLocation: boolean;
  onRequestLocation: () => void;
  onResetFilters: () => void;
  ideasCount: number;
}

const CATEGORIES: string[] = [
  'All',
  'Community',
  'Green & Eco',
  'Smart City',
  'Tech & Innovation',
  'Transport',
  'Culture & Art',
  'Local Business'
];

export const FilterBar: React.FC<FilterBarProps> = ({
  searchQuery,
  setSearchQuery,
  selectedCategory,
  setSelectedCategory,
  selectedSeverity = 'All',
  setSelectedSeverity,
  selectedStatus = 'All',
  setSelectedStatus,
  radiusKm,
  setRadiusKm,
  sortBy,
  setSortBy,
  viewMode,
  setViewMode,
  userHasLocation,
  onRequestLocation,
  onResetFilters,
  ideasCount
}) => {
  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200/80 space-y-3">
      {/* Top Controls: Search Input, View Mode Switcher & Sort */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search Bar */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            id="search-ideas-input"
            type="text"
            placeholder="Search geo ideas by keyword, topic, or location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium"
          />
        </div>

        {/* View Mode & Sort Selector */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Quick Sort Buttons */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 gap-1 overflow-x-auto no-scrollbar">
            <button
              id="sort-latest-btn"
              onClick={() => setSortBy('recent')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 ${
                sortBy === 'recent' || sortBy === 'latest'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Latest Posted</span>
            </button>

            <button
              id="sort-nearest-btn"
              onClick={() => setSortBy('nearest')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 ${
                sortBy === 'nearest'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <MapPin className="w-3.5 h-3.5" />
              <span>Nearest</span>
            </button>

            <button
              id="sort-top-btn"
              onClick={() => setSortBy('top')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 ${
                sortBy === 'top'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <ThumbsUp className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Most Upvoted</span>
              <span className="sm:hidden">Top</span>
            </button>

            <button
              id="sort-comments-btn"
              onClick={() => setSortBy('comments')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 ${
                sortBy === 'comments'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Discussed</span>
            </button>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              id="view-split-btn"
              onClick={() => setViewMode('split')}
              className={`p-1.5 rounded-lg text-xs font-medium transition-all ${
                viewMode === 'split' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
              }`}
              title="Split View (Map + Cards)"
            >
              <span className="hidden sm:inline px-1">Split</span>
              <span className="sm:hidden">Split</span>
            </button>
            <button
              id="view-map-btn"
              onClick={() => setViewMode('map')}
              className={`p-1.5 rounded-lg text-xs font-medium transition-all ${
                viewMode === 'map' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
              }`}
              title="Full Map View"
            >
              <MapIcon className="w-4 h-4" />
            </button>
            <button
              id="view-list-btn"
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-lg text-xs font-medium transition-all ${
                viewMode === 'list' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
              }`}
              title="List View Only"
            >
              <LayoutList className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Dedicated Distance Range Bar & Preset Buttons */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 bg-slate-50/90 p-2.5 rounded-xl border border-slate-200/90">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <SlidersHorizontal className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="text-xs font-extrabold text-slate-800 shrink-0">
            Distance Range:
          </span>

          <input
            id="radius-slider"
            type="range"
            min="0"
            max="50"
            step="1"
            value={radiusKm}
            onChange={(e) => setRadiusKm(Number(e.target.value))}
            className="w-28 sm:w-36 accent-emerald-600 cursor-pointer"
          />

          <span className="px-2.5 py-0.5 rounded-md text-xs font-black bg-emerald-100 text-emerald-800 border border-emerald-200 min-w-[70px] text-center">
            {radiusKm === 0 ? 'Any distance' : `< ${radiusKm} km`}
          </span>
        </div>

        {/* Quick Range Presets */}
        <div className="flex items-center gap-1 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 no-scrollbar">
          <span className="text-[10px] font-bold text-slate-400 mr-1 hidden lg:inline">Presets:</span>
          {[
            { label: 'Any', value: 0 },
            { label: '5 km', value: 5 },
            { label: '10 km', value: 10 },
            { label: '15 km', value: 15 },
            { label: '25 km', value: 25 },
            { label: '50 km', value: 50 }
          ].map((preset) => (
            <button
              key={preset.value}
              id={`preset-dist-${preset.value}`}
              onClick={() => setRadiusKm(preset.value)}
              className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all shrink-0 ${
                radiusKm === preset.value
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      {/* Category, Severity & Status Filter Bar */}
      <div className="flex items-center justify-between gap-2 flex-wrap pt-1 border-t border-slate-100">
        <div className="flex items-center gap-1.5 overflow-x-auto py-1 no-scrollbar flex-1">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              id={`cat-pill-${cat.toLowerCase().replace(/\s+/g, '-')}`}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Severity & Status Dropdowns */}
        <div className="flex items-center gap-2">
          {setSelectedSeverity && (
            <select
              id="severity-filter"
              value={selectedSeverity}
              onChange={(e) => setSelectedSeverity(e.target.value)}
              className="bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl px-2.5 py-1 outline-none cursor-pointer"
            >
              <option value="All">Severity: All</option>
              <option value="critical">Critical 🔥</option>
              <option value="high">High ⚠️</option>
              <option value="medium">Medium ⚡</option>
              <option value="low">Low 🌱</option>
            </select>
          )}

          {setSelectedStatus && (
            <select
              id="status-filter"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl px-2.5 py-1 outline-none cursor-pointer"
            >
              <option value="All">Status: All</option>
              <option value="submitted">Submitted 📝</option>
              <option value="verified">Verified ✅</option>
              <option value="under_review">Under Review 🔍</option>
              <option value="assigned">Assigned 🏛️</option>
              <option value="in_progress">In Progress 🚧</option>
              <option value="resolved">Resolved 🎉</option>
            </select>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {!userHasLocation && (
            <button
              id="enable-location-btn"
              onClick={onRequestLocation}
              className="text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded-lg border border-emerald-200 flex items-center gap-1 transition-colors"
            >
              <Compass className="w-3.5 h-3.5" />
              <span>Enable GPS</span>
            </button>
          )}

          {(searchQuery || selectedCategory !== 'All' || radiusKm > 0 || sortBy !== 'recent') && (
            <button
              id="reset-filters-btn"
              onClick={onResetFilters}
              className="text-xs font-medium text-slate-500 hover:text-slate-800 flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-slate-100 transition-colors"
              title="Reset search & filters"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset</span>
            </button>
          )}

          <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg">
            {ideasCount} {ideasCount === 1 ? 'Idea' : 'Ideas'}
          </span>
        </div>
      </div>
    </div>
  );
};
