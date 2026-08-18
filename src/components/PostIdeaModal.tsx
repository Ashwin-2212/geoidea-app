import React, { useState } from 'react';
import { IdeaCategory, IssueSeverity, GeoIdea } from '../types';
import { api } from '../api/client';
import { X, MapPin, Compass, Image as ImageIcon, Sparkles, AlertCircle, Check, ShieldAlert, Bot, Layers } from 'lucide-react';

interface PostIdeaModalProps {
  onClose: () => void;
  onCreated: (idea: GeoIdea) => void;
  initialLat?: number;
  initialLng?: number;
  onStartMapPick?: () => void;
}

const CATEGORIES: IdeaCategory[] = [
  'Community',
  'Green & Eco',
  'Smart City',
  'Tech & Innovation',
  'Transport',
  'Culture & Art',
  'Local Business'
];

export const PostIdeaModal: React.FC<PostIdeaModalProps> = ({
  onClose,
  onCreated,
  initialLat = 13.0827,
  initialLng = 80.2707,
  onStartMapPick,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<IdeaCategory>('Community');
  const [severity, setSeverity] = useState<IssueSeverity>('medium');
  const [latitude, setLatitude] = useState<number>(initialLat);
  const [longitude, setLongitude] = useState<number>(initialLng);
  const [address, setAddress] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [gettingLocation, setGettingLocation] = useState(false);

  // AI & Duplicate states
  const [isAnalyzingAi, setIsAnalyzingAi] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<{
    category: IdeaCategory;
    severity: IssueSeverity;
    department: string;
    confidenceScore: number;
    detectedTags: string[];
    summary: string;
  } | null>(null);
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);

  const handleUseGeolocation = () => {
    if (!navigator.geolocation) {
      setErrorMsg('Geolocation is not supported by your browser.');
      return;
    }

    setGettingLocation(true);
    setErrorMsg('');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLatitude(pos.coords.latitude);
        setLongitude(pos.coords.longitude);
        setAddress(`Coordinates: ${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`);
        setGettingLocation(false);
      },
      (err) => {
        setErrorMsg('Could not fetch location. Please enter coordinates or pick on map.');
        setGettingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  const handleAiAutoCategorize = async () => {
    if (!title.trim() || !description.trim()) {
      setErrorMsg('Please type a title and description before running AI analysis.');
      return;
    }

    try {
      setIsAnalyzingAi(true);
      setErrorMsg('');

      // Run AI analysis and Duplicate check in parallel
      const [aiRes, dupRes] = await Promise.all([
        api.predictAi({ title, description }),
        api.checkDuplicate({ title, description })
      ]);

      setAiAnalysis(aiRes);
      if (aiRes.category) setCategory(aiRes.category);
      if (aiRes.severity) setSeverity(aiRes.severity);

      if (dupRes.isDuplicate) {
        setDuplicateWarning(`Possible Duplicate Detected (${dupRes.similarityScore}% match). Consider upvoting existing reports to avoid clutter!`);
      } else {
        setDuplicateWarning(null);
      }
    } catch (e: any) {
      setErrorMsg('AI analysis failed or server fallback used.');
    } finally {
      setIsAnalyzingAi(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !description.trim()) {
      setErrorMsg('Title and description are required.');
      return;
    }

    if (isNaN(latitude) || isNaN(longitude)) {
      setErrorMsg('Please specify valid latitude and longitude coordinates.');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMsg('');

      const created = await api.createIdea({
        title: title.trim(),
        description: description.trim(),
        category,
        severity,
        latitude,
        longitude,
        address: address.trim() || `Location (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`,
        imageUrl: imageUrl.trim() || undefined
      });

      onCreated(created);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to post report.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      <div className="relative bg-white w-full max-w-xl rounded-3xl shadow-2xl border border-slate-100 overflow-hidden my-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-transparent">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-sm">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-slate-900 text-lg">Submit Civic Issue / Idea</h2>
              <p className="text-xs text-slate-500">Geotag civic issues, smart city proposals, or public improvements</p>
            </div>
          </div>

          <button
            id="close-post-modal-btn"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Issue / Idea Title *
            </label>
            <input
              id="idea-title-input"
              type="text"
              required
              placeholder="e.g., Deep Pothole on Anna Salai Main Road"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium"
            />
          </div>

          {/* Description */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Detailed Description *
              </label>
              <button
                type="button"
                id="ai-auto-tag-btn"
                onClick={handleAiAutoCategorize}
                disabled={isAnalyzingAi}
                className="text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded-lg border border-emerald-200 flex items-center gap-1 transition-colors"
              >
                <Bot className={`w-3.5 h-3.5 text-emerald-600 ${isAnalyzingAi ? 'animate-spin' : ''}`} />
                {isAnalyzingAi ? 'Analyzing...' : 'AI Smart Auto-Classify'}
              </button>
            </div>
            <textarea
              id="idea-description-input"
              required
              rows={3}
              placeholder="Describe the issue, hazardous conditions, or civic improvement details..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
            />
          </div>

          {/* AI Analysis & Duplicate Alert */}
          {aiAnalysis && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs space-y-1">
              <div className="flex items-center justify-between font-bold text-emerald-900">
                <span className="flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                  AI Suggested Category & Severity ({aiAnalysis.confidenceScore}% confidence)
                </span>
                <span className="text-[10px] bg-emerald-200 text-emerald-800 px-2 py-0.5 rounded-full uppercase">
                  Dept: {aiAnalysis.department}
                </span>
              </div>
              <p className="text-slate-600 text-[11px]">{aiAnalysis.summary}</p>
            </div>
          )}

          {duplicateWarning && (
            <div className="p-3 bg-amber-50 border border-amber-300 text-amber-900 text-xs rounded-2xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>{duplicateWarning}</span>
            </div>
          )}

          {/* Category & Severity Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Category *
              </label>
              <select
                id="post-category-select"
                value={category}
                onChange={(e) => setCategory(e.target.value as IdeaCategory)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold bg-white focus:border-emerald-500 outline-none"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Severity Level *
              </label>
              <select
                id="post-severity-select"
                value={severity}
                onChange={(e) => setSeverity(e.target.value as IssueSeverity)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold bg-white focus:border-emerald-500 outline-none"
              >
                <option value="low">Low - Routine Maintenance 🌱</option>
                <option value="medium">Medium - Standard Issue ⚡</option>
                <option value="high">High - Urgent Attention Needed ⚠️</option>
                <option value="critical">Critical - Emergency Safety Hazard 🔥</option>
              </select>
            </div>
          </div>

          {/* Location Picker Section */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-emerald-600" />
                Geographic Coordinates *
              </span>

              <div className="flex items-center gap-2">
                <button
                  id="use-my-location-btn"
                  type="button"
                  onClick={handleUseGeolocation}
                  disabled={gettingLocation}
                  className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg border border-slate-200 flex items-center gap-1 transition-colors"
                >
                  <Compass className={`w-3.5 h-3.5 text-emerald-600 ${gettingLocation ? 'animate-spin' : ''}`} />
                  {gettingLocation ? 'Locating...' : 'Use My GPS'}
                </button>

                {onStartMapPick && (
                  <button
                    id="pick-on-map-btn"
                    type="button"
                    onClick={() => {
                      onStartMapPick();
                      onClose();
                    }}
                    className="px-2.5 py-1 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 text-xs font-semibold rounded-lg border border-emerald-200 flex items-center gap-1 transition-colors"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-emerald-700" />
                    Click on Map
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase">Latitude</label>
                <input
                  id="idea-latitude-input"
                  type="number"
                  step="any"
                  value={latitude}
                  onChange={(e) => setLatitude(parseFloat(e.target.value))}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-mono bg-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase">Longitude</label>
                <input
                  id="idea-longitude-input"
                  type="number"
                  step="any"
                  value={longitude}
                  onChange={(e) => setLongitude(parseFloat(e.target.value))}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-mono bg-white focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                Address / Street Landmark Name
              </label>
              <input
                id="idea-address-input"
                type="text"
                placeholder="e.g., Anna Salai Road Near Metro Station, Chennai"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs bg-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Image Banner URL */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center justify-between">
              <span>Photo / Image Evidence URL (Optional)</span>
              <ImageIcon className="w-3.5 h-3.5 text-slate-400" />
            </label>
            <input
              id="idea-image-input"
              type="url"
              placeholder="https://images.unsplash.com/photo-..."
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              className="w-full px-4 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-mono"
            />
          </div>

          {/* Submit */}
          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              id="cancel-post-btn"
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              id="submit-post-idea-btn"
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 disabled:opacity-50 text-white font-bold text-sm rounded-xl shadow-md shadow-emerald-600/20 transition-all flex items-center gap-2"
            >
              <Check className="w-4 h-4" />
              {isSubmitting ? 'Publishing Report...' : 'Publish Civic Report'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

