import React from 'react';
import { GeoIdea, IdeaCategory } from '../types';
import { MapPin, ThumbsUp, MessageSquare, Clock, Trash2, CheckCircle2, ShieldAlert, Building2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface IdeaCardProps {
  idea: GeoIdea;
  onSelect: (idea: GeoIdea) => void;
  onLikeToggle?: (idea: GeoIdea) => void;
  onVerify?: (idea: GeoIdea) => void;
  onDelete?: (idea: GeoIdea) => void;
  isSelected?: boolean;
}

const CATEGORY_STYLES: Record<string, { badge: string; dot: string }> = {
  'Community': { badge: 'bg-indigo-50 text-indigo-700 border-indigo-200', dot: 'bg-indigo-500' },
  'Green & Eco': { badge: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
  'Smart City': { badge: 'bg-cyan-50 text-cyan-700 border-cyan-200', dot: 'bg-cyan-500' },
  'Tech & Innovation': { badge: 'bg-purple-50 text-purple-700 border-purple-200', dot: 'bg-purple-500' },
  'Transport': { badge: 'bg-amber-50 text-amber-700 border-amber-200', dot: 'bg-amber-500' },
  'Culture & Art': { badge: 'bg-pink-50 text-pink-700 border-pink-200', dot: 'bg-pink-500' },
  'Local Business': { badge: 'bg-blue-50 text-blue-700 border-blue-200', dot: 'bg-blue-500' },
  'Sanitation & Waste': { badge: 'bg-lime-50 text-lime-800 border-lime-300', dot: 'bg-lime-600' },
  'Traffic & Transit': { badge: 'bg-orange-50 text-orange-800 border-orange-300', dot: 'bg-orange-600' },
  'Roads & Potholes': { badge: 'bg-rose-50 text-rose-800 border-rose-300', dot: 'bg-rose-600' },
  'Water & Drainage': { badge: 'bg-sky-50 text-sky-800 border-sky-300', dot: 'bg-sky-600' },
  'Streetlights & Energy': { badge: 'bg-yellow-50 text-yellow-800 border-yellow-300', dot: 'bg-yellow-600' },
  'Public Safety': { badge: 'bg-red-50 text-red-800 border-red-300', dot: 'bg-red-600' },
  'Parks & Recreation': { badge: 'bg-teal-50 text-teal-800 border-teal-300', dot: 'bg-teal-600' },
  'Civic Proposal': { badge: 'bg-violet-50 text-violet-800 border-violet-300', dot: 'bg-violet-600' },
  'Other': { badge: 'bg-slate-100 text-slate-700 border-slate-300', dot: 'bg-slate-500' }
};

const SEVERITY_BADGES = {
  critical: 'bg-rose-100 text-rose-800 border-rose-300 font-extrabold',
  high: 'bg-amber-100 text-amber-800 border-amber-300 font-bold',
  medium: 'bg-slate-100 text-slate-800 border-slate-300 font-medium',
  low: 'bg-emerald-100 text-emerald-800 border-emerald-300 font-medium'
};

const STATUS_BADGES = {
  submitted: 'bg-slate-100 text-slate-700 border-slate-200',
  verified: 'bg-sky-100 text-sky-800 border-sky-300',
  under_review: 'bg-purple-100 text-purple-800 border-purple-300',
  assigned: 'bg-blue-100 text-blue-800 border-blue-300',
  in_progress: 'bg-amber-100 text-amber-800 border-amber-300',
  resolved: 'bg-emerald-100 text-emerald-800 border-emerald-300',
  closed: 'bg-slate-200 text-slate-700 border-slate-300'
};

export const IdeaCard: React.FC<IdeaCardProps> = ({
  idea,
  onSelect,
  onLikeToggle,
  onVerify,
  onDelete,
  isSelected = false
}) => {
  const { user } = useAuth();
  const isOwner = user?.id === idea.userId || user?.role === 'admin';
  const style = CATEGORY_STYLES[idea.category] || CATEGORY_STYLES['Community'];

  const formatDate = (isoStr: string) => {
    try {
      if (!isoStr) return 'Recently';
      const timeMs = new Date(isoStr).getTime();
      if (isNaN(timeMs)) return 'Recently';
      
      const diffMs = Date.now() - timeMs;
      const diffMins = Math.floor(diffMs / 60000);
      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours}h ago`;
      const diffDays = Math.floor(diffHours / 24);
      if (diffDays < 7) return `${diffDays}d ago`;
      return new Date(isoStr).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    } catch (e) {
      return 'Recently';
    }
  };

  return (
    <div
      id={`idea-card-${idea.id}`}
      onClick={() => onSelect(idea)}
      className={`group relative bg-white rounded-2xl p-4 border transition-all duration-200 cursor-pointer ${
        isSelected
          ? 'border-emerald-500 ring-2 ring-emerald-500/20 shadow-md bg-emerald-50/20'
          : 'border-slate-200/80 hover:border-slate-300 hover:shadow-md'
      }`}
    >
      {/* Category, Severity & Status Row */}
      <div className="flex items-center justify-between gap-1.5 mb-2.5 flex-wrap">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${style.badge}`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
            {idea.category}
          </span>

          {idea.severity && (
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] uppercase tracking-wider border ${SEVERITY_BADGES[idea.severity] || SEVERITY_BADGES.medium}`}>
              <ShieldAlert className="w-3 h-3" />
              {idea.severity}
            </span>
          )}

          {idea.status && (
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] uppercase font-extrabold tracking-wider border ${STATUS_BADGES[idea.status] || STATUS_BADGES.submitted}`}>
              {idea.status.replace('_', ' ')}
            </span>
          )}
        </div>

        {idea.distanceKm !== undefined && (
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-full">
            <MapPin className="w-3 h-3 text-emerald-600" />
            {idea.distanceKm} km
          </span>
        )}
      </div>

      {/* Idea Title */}
      <h3 className="text-base font-bold text-slate-900 group-hover:text-emerald-700 transition-colors leading-snug mb-1.5 line-clamp-2">
        {idea.title}
      </h3>

      {/* Description Excerpt */}
      <p className="text-xs text-slate-600 leading-relaxed mb-3 line-clamp-2">{idea.description}</p>

      {/* Department assigned & Address */}
      <div className="space-y-1 mb-3">
        {idea.departmentAssigned && (
          <div className="flex items-center gap-1 text-xs font-semibold text-sky-800 bg-sky-50 px-2 py-0.5 rounded-lg w-fit border border-sky-100">
            <Building2 className="w-3.5 h-3.5 text-sky-600" />
            <span>Assigned: {idea.departmentAssigned}</span>
          </div>
        )}

        {idea.address && (
          <div className="flex items-center gap-1 text-xs text-slate-500 truncate">
            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="truncate">{idea.address}</span>
          </div>
        )}
      </div>

      {/* Footer: User Info & Like/Verify/Comment Counters */}
      <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs text-slate-500">
        <div className="flex items-center gap-2">
          <img
            src={idea.userAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250'}
            alt={idea.userName}
            className="w-5 h-5 rounded-full object-cover ring-1 ring-slate-200"
          />
          <span className="font-medium text-slate-700 truncate max-w-[100px]">{idea.userName}</span>
          <span className="text-slate-300">•</span>
          <span className="text-slate-400 flex items-center gap-1">
            <Clock className="w-3 h-3 text-slate-400" />
            {formatDate(idea.createdAt)}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Like Button */}
          <button
            id={`like-btn-${idea.id}`}
            onClick={(e) => {
              e.stopPropagation();
              if (onLikeToggle) onLikeToggle(idea);
            }}
            className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold transition-all ${
              idea.isLikedByUser
                ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
            title="Upvote idea"
          >
            <ThumbsUp className={`w-3.5 h-3.5 ${idea.isLikedByUser ? 'fill-emerald-600 stroke-emerald-600' : ''}`} />
            <span>{idea.likesCount}</span>
          </button>

          {/* Verification Button */}
          <button
            id={`verify-btn-${idea.id}`}
            onClick={(e) => {
              e.stopPropagation();
              if (onVerify) onVerify(idea);
            }}
            className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold transition-all ${
              idea.isVerifiedByUser
                ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
            title="Verify issue on ground"
          >
            <CheckCircle2 className={`w-3.5 h-3.5 ${idea.isVerifiedByUser ? 'fill-blue-600 text-white' : ''}`} />
            <span>{idea.verificationsCount || 0}</span>
          </button>

          {/* Comment Count */}
          <div className="flex items-center gap-1 text-slate-600 font-medium px-2 py-1 bg-slate-100 rounded-lg">
            <MessageSquare className="w-3.5 h-3.5 text-slate-500" />
            <span>{idea.commentsCount}</span>
          </div>

          {/* Delete Option if Owner */}
          {isOwner && onDelete && (
            <button
              id={`delete-idea-btn-${idea.id}`}
              onClick={(e) => {
                e.stopPropagation();
                onDelete(idea);
              }}
              className="p-1 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-lg transition-colors ml-1"
              title="Delete your report"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

