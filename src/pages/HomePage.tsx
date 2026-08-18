import React, { useState, useEffect } from 'react';
import { GeoIdea } from '../types';
import { api } from '../api/client';
import { MapView } from '../components/MapView';
import { FilterBar } from '../components/FilterBar';
import { IdeaCard } from '../components/IdeaCard';
import { PostIdeaModal } from '../components/PostIdeaModal';
import { IdeaDetailModal } from '../components/IdeaDetailModal';
import { AuthModal } from '../components/AuthModal';
import { useAuth } from '../context/AuthContext';
import { MapPin, Plus, Sparkles, AlertCircle, Compass } from 'lucide-react';

interface HomePageProps {
  onOpenAuthModal: () => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onOpenAuthModal }) => {
  const { isAuthenticated } = useAuth();

  // Filter & Search states
  const [ideas, setIdeas] = useState<GeoIdea[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedSeverity, setSelectedSeverity] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [radiusKm, setRadiusKm] = useState<number>(0);
  const [sortBy, setSortBy] = useState('recent');
  const [viewMode, setViewMode] = useState<'split' | 'map' | 'list'>('split');

  // User location states - Default to Chennai Center (13.0827, 80.2707)
  const [userLat, setUserLat] = useState<number>(13.0827);
  const [userLng, setUserLng] = useState<number>(80.2707);
  const [userHasLocation, setUserHasLocation] = useState(false);

  // Modal & Selection states
  const [selectedIdea, setSelectedIdea] = useState<GeoIdea | null>(null);
  const [showPostModal, setShowPostModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isPickingLocation, setIsPickingLocation] = useState(false);
  const [pickedLat, setPickedLat] = useState<number | undefined>(undefined);
  const [pickedLng, setPickedLng] = useState<number | undefined>(undefined);

  // 1. Helper to calculate Haversine distance in KM
  const calculateDistanceKm = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c * 10) / 10;
  };

  // 2. Request Browser Geolocation on mount
  const handleGetLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          // Check if user is near Chennai ideas cluster (within 200km)
          const distToDefault = calculateDistanceKm(pos.coords.latitude, pos.coords.longitude, 13.0827, 80.2707);
          if (distToDefault < 200) {
            setUserLat(pos.coords.latitude);
            setUserLng(pos.coords.longitude);
            setUserHasLocation(true);
            fetchIdeas({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          } else {
            console.log('GPS is outside idea region, defaulting search center to Chennai hub.');
          }
        },
        (err) => {
          console.warn('Geolocation denied or unavailable:', err);
        },
        { enableHighAccuracy: true, timeout: 8000 }
      );
    }
  };

  useEffect(() => {
    handleGetLocation();
  }, []);

  // 3. Fetch Ideas with optional overrides
  const fetchIdeas = async (overrideParams?: {
    sortBy?: string;
    radiusKm?: number;
    lat?: number;
    lng?: number;
    category?: string;
    severity?: string;
    status?: string;
    search?: string;
  }) => {
    try {
      setLoading(true);
      const activeSort = overrideParams?.sortBy !== undefined ? overrideParams.sortBy : sortBy;
      const activeRadius = overrideParams?.radiusKm !== undefined ? overrideParams.radiusKm : radiusKm;
      const activeLat = overrideParams?.lat !== undefined ? overrideParams.lat : userLat;
      const activeLng = overrideParams?.lng !== undefined ? overrideParams.lng : userLng;
      const activeCategory = overrideParams?.category !== undefined ? overrideParams.category : selectedCategory;
      const activeSeverity = overrideParams?.severity !== undefined ? overrideParams.severity : selectedSeverity;
      const activeStatus = overrideParams?.status !== undefined ? overrideParams.status : selectedStatus;
      const activeSearch = overrideParams?.search !== undefined ? overrideParams.search : searchQuery;

      const data = await api.getIdeas({
        lat: activeLat,
        lng: activeLng,
        radius: activeRadius,
        category: activeCategory,
        severity: activeSeverity,
        status: activeStatus,
        search: activeSearch,
        sortBy: activeSort
      });

      // Filter locally if needed
      let filtered = [...data];
      if (activeSeverity && activeSeverity !== 'All') {
        filtered = filtered.filter((i) => i.severity === activeSeverity);
      }
      if (activeStatus && activeStatus !== 'All') {
        filtered = filtered.filter((i) => i.status === activeStatus);
      }

      // Ensure data is properly sorted
      const sortedData = sortIdeasArray(filtered, activeSort);
      setIdeas(sortedData);
    } catch (err) {
      console.error('Failed fetching geo ideas:', err);
    } finally {
      setLoading(false);
    }
  };

  const sortIdeasArray = (list: GeoIdea[], sortMode: string): GeoIdea[] => {
    const copy = [...list];
    if (sortMode === 'nearest') {
      return copy.sort((a, b) => (a.distanceKm || 0) - (b.distanceKm || 0));
    } else if (sortMode === 'top') {
      return copy.sort((a, b) => b.likesCount - a.likesCount);
    } else if (sortMode === 'comments') {
      return copy.sort((a, b) => b.commentsCount - a.commentsCount);
    } else {
      // recent / latest posted
      return copy.sort((a, b) => {
        const timeB = new Date(b.createdAt).getTime() || 0;
        const timeA = new Date(a.createdAt).getTime() || 0;
        return timeB - timeA;
      });
    }
  };

  useEffect(() => {
    fetchIdeas();
  }, [userLat, userLng, radiusKm, selectedCategory, selectedSeverity, selectedStatus, searchQuery, sortBy]);

  const handleVerifyToggle = async (targetIdea: GeoIdea) => {
    if (!isAuthenticated) {
      onOpenAuthModal();
      return;
    }

    try {
      const res = await api.verifyIdea(targetIdea.id);
      setIdeas((prev) =>
        prev.map((i) =>
          i.id === targetIdea.id
            ? {
                ...i,
                isVerifiedByUser: res.isVerifiedByUser,
                verificationsCount: res.verificationsCount,
                status: res.currentStatus
              }
            : i
        )
      );

      if (selectedIdea && selectedIdea.id === targetIdea.id) {
        setSelectedIdea((prev) =>
          prev
            ? {
                ...prev,
                isVerifiedByUser: res.isVerifiedByUser,
                verificationsCount: res.verificationsCount,
                status: res.currentStatus
              }
            : null
        );
      }
    } catch (err) {
      console.error('Failed verifying report:', err);
    }
  };

  // Handlers for instant updates
  const handleSortChange = (newSort: string) => {
    setSortBy(newSort);
    setIdeas((prev) => sortIdeasArray(prev, newSort));
    fetchIdeas({ sortBy: newSort });
  };

  const handleRadiusChange = (newRadius: number) => {
    setRadiusKm(newRadius);
    fetchIdeas({ radiusKm: newRadius });
  };

  // 3. Like Toggle Handler
  const handleLikeToggle = async (targetIdea: GeoIdea) => {
    if (!isAuthenticated) {
      onOpenAuthModal();
      return;
    }

    try {
      const res = await api.toggleLike(targetIdea.id);
      setIdeas((prev) =>
        prev.map((i) =>
          i.id === targetIdea.id
            ? { ...i, isLikedByUser: res.isLikedByUser, likesCount: res.likesCount }
            : i
        )
      );

      if (selectedIdea && selectedIdea.id === targetIdea.id) {
        setSelectedIdea((prev) =>
          prev ? { ...prev, isLikedByUser: res.isLikedByUser, likesCount: res.likesCount } : null
        );
      }
    } catch (err) {
      console.error('Failed toggling upvote:', err);
    }
  };

  // 4. Map Location Pick Listener
  const handleMapLocationPick = (lat: number, lng: number) => {
    if (isPickingLocation) {
      setPickedLat(lat);
      setPickedLng(lng);
      setIsPickingLocation(false);
      setShowPostModal(true);
    }
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('All');
    setRadiusKm(0);
    setSortBy('recent');
  };

  return (
    <div className="space-y-4 max-w-7xl mx-auto">
      {/* Top Filter & Search Control Bar */}
      <FilterBar
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
        selectedSeverity={selectedSeverity}
        setSelectedSeverity={setSelectedSeverity}
        selectedStatus={selectedStatus}
        setSelectedStatus={setSelectedStatus}
        radiusKm={radiusKm}
        setRadiusKm={handleRadiusChange}
        sortBy={sortBy}
        setSortBy={handleSortChange}
        viewMode={viewMode}
        setViewMode={setViewMode}
        userHasLocation={userHasLocation}
        onRequestLocation={handleGetLocation}
        onResetFilters={handleResetFilters}
        ideasCount={ideas.length}
      />

      {/* Main View Area (Split, Map-Only, or List-Only) */}
      {viewMode === 'map' ? (
        <div className="h-[calc(100vh-210px)] min-h-[500px]">
          <MapView
            ideas={ideas}
            selectedIdea={selectedIdea}
            onSelectIdea={(idea) => setSelectedIdea(idea)}
            userLat={userLat}
            userLng={userLng}
            radiusKm={radiusKm}
            onLocationPick={handleMapLocationPick}
            isPickingLocation={isPickingLocation}
          />
        </div>
      ) : viewMode === 'list' ? (
        <div>
          {loading ? (
            <div className="py-20 text-center text-xs text-slate-400 animate-pulse">
              Loading geo ideas...
            </div>
          ) : ideas.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-3xl border border-slate-200/80 text-sm text-slate-500 space-y-3">
              <MapPin className="w-10 h-10 text-slate-300 mx-auto" />
              <p className="font-semibold text-slate-800">No geo ideas matched your active filters</p>
              <p className="text-xs text-slate-500">Try widening your radius or clearing the search keyword.</p>
              <button
                onClick={handleResetFilters}
                className="px-4 py-2 bg-slate-900 text-white font-medium text-xs rounded-xl shadow-xs"
              >
                Reset Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {ideas.map((idea) => (
                <IdeaCard
                  key={idea.id}
                  idea={idea}
                  onSelect={(i) => setSelectedIdea(i)}
                  onLikeToggle={handleLikeToggle}
                  onVerify={handleVerifyToggle}
                  isSelected={selectedIdea?.id === idea.id}
                />
              ))}
            </div>
          )}
        </div>
      ) : (
        /* Split View (Interactive Map + Scrollable Idea Sidebar) */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 h-[calc(100vh-220px)] min-h-[600px]">
          {/* Map Column */}
          <div className="lg:col-span-7 h-[350px] lg:h-full">
            <MapView
              ideas={ideas}
              selectedIdea={selectedIdea}
              onSelectIdea={(idea) => setSelectedIdea(idea)}
              userLat={userLat}
              userLng={userLng}
              radiusKm={radiusKm}
              onLocationPick={handleMapLocationPick}
              isPickingLocation={isPickingLocation}
            />
          </div>

          {/* Cards List Column */}
          <div className="lg:col-span-5 h-[300px] lg:h-full overflow-y-auto space-y-3 pr-1">
            {loading ? (
              <div className="py-16 text-center text-xs text-slate-400 animate-pulse">
                Fetching geo ideas...
              </div>
            ) : ideas.length === 0 ? (
              <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-xs text-slate-500 space-y-2">
                <MapPin className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="font-semibold text-slate-800">No ideas found in this region</p>
                <p>Adjust your distance radius slider or search query.</p>
                <button
                  onClick={handleResetFilters}
                  className="px-3 py-1.5 bg-slate-900 text-white font-medium text-xs rounded-lg"
                >
                  Reset Filters
                </button>
              </div>
            ) : (
              ideas.map((idea) => (
                <IdeaCard
                  key={idea.id}
                  idea={idea}
                  onSelect={(i) => setSelectedIdea(i)}
                  onLikeToggle={handleLikeToggle}
                  onVerify={handleVerifyToggle}
                  isSelected={selectedIdea?.id === idea.id}
                />
              ))
            )}
          </div>
        </div>
      )}

      {/* Post Idea Modal */}
      {showPostModal && (
        <PostIdeaModal
          onClose={() => setShowPostModal(false)}
          onCreated={(newIdea) => {
            handleSortChange('recent');
            setIdeas((prev) => [newIdea, ...prev.filter((i) => i.id !== newIdea.id)]);
            setSelectedIdea(newIdea);
            fetchIdeas({ sortBy: 'recent' });
          }}
          initialLat={pickedLat || userLat || 13.0827}
          initialLng={pickedLng || userLng || 80.2707}
          onStartMapPick={() => {
            setIsPickingLocation(true);
            setViewMode('split');
          }}
        />
      )}

      {/* Idea Detail Modal */}
      {selectedIdea && (
        <IdeaDetailModal
          idea={selectedIdea}
          onClose={() => setSelectedIdea(null)}
          onLikeToggle={handleLikeToggle}
          onRequireAuth={onOpenAuthModal}
          onCenterOnMap={(idea) => {
            setViewMode('split');
            setSelectedIdea(idea);
          }}
        />
      )}

      {/* Auth Modal */}
      {showAuthModal && (
        <AuthModal onClose={() => setShowAuthModal(false)} />
      )}
    </div>
  );
};
