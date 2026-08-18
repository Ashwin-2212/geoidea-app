import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { GeoIdea, IdeaCategory } from '../types';
import { Layers, Locate, MapPin as PinIcon, ExternalLink, ThumbsUp, MessageSquare, Compass } from 'lucide-react';

interface MapViewProps {
  ideas: GeoIdea[];
  selectedIdea: GeoIdea | null;
  onSelectIdea: (idea: GeoIdea) => void;
  userLat?: number;
  userLng?: number;
  radiusKm?: number;
  onLocationPick?: (lat: number, lng: number) => void;
  isPickingLocation?: boolean;
}

const CATEGORY_COLORS: Record<string, { bg: string; border: string; hex: string }> = {
  'Community': { bg: '#6366f1', border: '#4338ca', hex: '#6366f1' },
  'Green & Eco': { bg: '#10b981', border: '#047857', hex: '#10b981' },
  'Smart City': { bg: '#06b6d4', border: '#0e7490', hex: '#06b6d4' },
  'Tech & Innovation': { bg: '#8b5cf6', border: '#6d28d9', hex: '#8b5cf6' },
  'Transport': { bg: '#f59e0b', border: '#b45309', hex: '#f59e0b' },
  'Culture & Art': { bg: '#ec4899', border: '#be185d', hex: '#ec4899' },
  'Local Business': { bg: '#3b82f6', border: '#1d4ed8', hex: '#3b82f6' },
  'Sanitation & Waste': { bg: '#84cc16', border: '#4d7c0f', hex: '#84cc16' },
  'Traffic & Transit': { bg: '#ea580c', border: '#9a3412', hex: '#ea580c' },
  'Roads & Potholes': { bg: '#f43f5e', border: '#be123c', hex: '#f43f5e' },
  'Water & Drainage': { bg: '#0284c7', border: '#0369a1', hex: '#0284c7' },
  'Streetlights & Energy': { bg: '#eab308', border: '#a16207', hex: '#eab308' },
  'Public Safety': { bg: '#dc2626', border: '#991b1b', hex: '#dc2626' },
  'Parks & Recreation': { bg: '#14b8a6', border: '#0f766e', hex: '#14b8a6' },
  'Civic Proposal': { bg: '#7c3aed', border: '#5b21b6', hex: '#7c3aed' },
  'Other': { bg: '#64748b', border: '#334155', hex: '#64748b' }
};

export const MapView: React.FC<MapViewProps> = ({
  ideas,
  selectedIdea,
  onSelectIdea,
  userLat,
  userLng,
  radiusKm = 0,
  onLocationPick,
  isPickingLocation = false
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);
  const radiusCircleRef = useRef<L.Circle | null>(null);
  const [tileStyle, setTileStyle] = useState<'light' | 'osm' | 'dark'>('light');

  const tileUrls = {
    light: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
    osm: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    dark: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
  };

  const tileLayerRef = useRef<L.TileLayer | null>(null);

  // 1. Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    // Default center: Chennai, Tamil Nadu, India or user location
    const initLat = userLat || 13.0827;
    const initLng = userLng || 80.2707;

    const map = L.map(mapContainerRef.current, {
      center: [initLat, initLng],
      zoom: 12,
      zoomControl: false
    });

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    const tileLayer = L.tileLayer(tileUrls[tileStyle], {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap &copy; CARTO'
    }).addTo(map);

    tileLayerRef.current = tileLayer;

    const markersGroup = L.layerGroup().addTo(map);
    markersLayerRef.current = markersGroup;

    mapInstanceRef.current = map;

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // 2. Handle Tile Layer Switch
  useEffect(() => {
    if (mapInstanceRef.current && tileLayerRef.current) {
      tileLayerRef.current.setUrl(tileUrls[tileStyle]);
    }
  }, [tileStyle]);

  // 3. Handle Map Clicks for Location Selection
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const handleMapClick = (e: L.LeafletMouseEvent) => {
      if (onLocationPick) {
        onLocationPick(e.latlng.lat, e.latlng.lng);
      }
    };

    map.on('click', handleMapClick);
    return () => {
      map.off('click', handleMapClick);
    };
  }, [onLocationPick]);

  // 4. Update Idea Markers
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markersGroup = markersLayerRef.current;
    if (!map || !markersGroup) return;

    markersGroup.clearLayers();

    ideas.forEach((idea) => {
      const color = CATEGORY_COLORS[idea.category] || CATEGORY_COLORS['Community'];
      const isSelected = selectedIdea?.id === idea.id;

      const markerHtml = `
        <div class="relative group cursor-pointer transform transition-transform duration-200 hover:scale-125 ${isSelected ? 'scale-125 z-50' : 'z-10'}">
          <div class="w-9 h-9 rounded-full shadow-lg flex items-center justify-center text-white border-2 border-white ring-2 ring-slate-900/10" style="background-color: ${color.bg};">
            <svg class="w-4 h-4 fill-current text-white" viewBox="0 0 24 24">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
            </svg>
          </div>
          ${isSelected ? `<div class="absolute -inset-1 rounded-full animate-ping opacity-75" style="background-color: ${color.bg};"></div>` : ''}
        </div>
      `;

      const customIcon = L.divIcon({
        html: markerHtml,
        className: 'custom-leaflet-marker',
        iconSize: [36, 36],
        iconAnchor: [18, 36],
        popupAnchor: [0, -32]
      });

      const marker = L.marker([idea.latitude, idea.longitude], { icon: customIcon });

      const statusColors: Record<string, string> = {
        submitted: '#64748b',
        verified: '#3b82f6',
        under_review: '#8b5cf6',
        assigned: '#06b6d4',
        in_progress: '#f59e0b',
        resolved: '#10b981',
        closed: '#475569'
      };

      const popupContent = `
        <div class="p-3 max-w-[260px]">
          <div class="flex items-center gap-1.5 mb-1.5 flex-wrap">
            <span class="inline-block px-2 py-0.5 text-[10px] font-bold tracking-wide uppercase rounded-full text-white" style="background-color: ${color.bg};">
              ${idea.category}
            </span>
            ${idea.severity ? `
              <span class="inline-block px-2 py-0.5 text-[10px] font-extrabold tracking-wide uppercase rounded-full text-white ${
                idea.severity === 'critical' ? 'bg-rose-600' :
                idea.severity === 'high' ? 'bg-amber-600' : 'bg-slate-500'
              }">
                ${idea.severity}
              </span>
            ` : ''}
            ${idea.status ? `
              <span class="inline-block px-2 py-0.5 text-[10px] font-extrabold tracking-wide uppercase rounded-full text-white" style="background-color: ${statusColors[idea.status] || '#10b981'};">
                ${idea.status.replace('_', ' ')}
              </span>
            ` : ''}
          </div>
          <h4 class="font-bold text-sm text-slate-900 leading-snug mb-1 line-clamp-2">${idea.title}</h4>
          <p class="text-xs text-slate-600 mb-2 line-clamp-2">${idea.description}</p>

          <div class="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100 mb-2.5">
            <span class="flex items-center gap-1 text-emerald-600 font-semibold">
              👍 ${idea.likesCount}
            </span>
            <span class="flex items-center gap-1 text-blue-600 font-semibold">
              ✅ ${idea.verificationsCount || 0}
            </span>
            <span class="flex items-center gap-1 text-slate-600">
              💬 ${idea.commentsCount}
            </span>
            ${idea.distanceKm !== undefined ? `<span class="text-xs text-slate-600 font-medium">📍 ${idea.distanceKm} km</span>` : ''}
          </div>

          <button id="view-idea-${idea.id}" class="w-full text-center py-1.5 px-3 bg-slate-900 hover:bg-emerald-600 text-white font-medium text-xs rounded-lg transition-colors shadow-xs">
            View Idea Details →
          </button>
        </div>
      `;

      marker.bindPopup(popupContent);

      marker.on('click', () => {
        onSelectIdea(idea);
      });

      // Bind button click inside popup
      marker.on('popupopen', () => {
        const btn = document.getElementById(`view-idea-${idea.id}`);
        if (btn) {
          btn.addEventListener('click', () => {
            onSelectIdea(idea);
          });
        }
      });

      markersGroup.addLayer(marker);
    });
  }, [ideas, selectedIdea]);

  // 5. Handle User Location Marker
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (userLat !== undefined && userLng !== undefined) {
      if (userMarkerRef.current) {
        userMarkerRef.current.setLatLng([userLat, userLng]);
      } else {
        const userIcon = L.divIcon({
          html: `
            <div class="relative flex items-center justify-center">
              <div class="w-6 h-6 rounded-full bg-cyan-500 border-2 border-white ring-4 ring-cyan-500/30 shadow-lg animate-pulse"></div>
              <div class="w-2.5 h-2.5 bg-white rounded-full absolute"></div>
            </div>
          `,
          className: 'user-location-marker',
          iconSize: [24, 24],
          iconAnchor: [12, 12]
        });

        userMarkerRef.current = L.marker([userLat, userLng], { icon: userIcon })
          .addTo(map)
          .bindTooltip('Location Reference Point', { permanent: false });
      }
    }
  }, [userLat, userLng]);

  // 6. Render Distance Radius Circle Layer
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (radiusCircleRef.current) {
      radiusCircleRef.current.remove();
      radiusCircleRef.current = null;
    }

    if (radiusKm && radiusKm > 0 && userLat !== undefined && userLng !== undefined) {
      const circle = L.circle([userLat, userLng], {
        radius: radiusKm * 1000,
        color: '#059669',
        fillColor: '#10b981',
        fillOpacity: 0.12,
        weight: 2,
        dashArray: '6, 6'
      }).addTo(map);

      radiusCircleRef.current = circle;
    }
  }, [radiusKm, userLat, userLng]);

  // 6. Fly to selected idea
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (map && selectedIdea) {
      map.flyTo([selectedIdea.latitude, selectedIdea.longitude], 14, { duration: 1.2 });
    }
  }, [selectedIdea]);

  const recenterToUser = () => {
    if (mapInstanceRef.current && userLat !== undefined && userLng !== undefined) {
      mapInstanceRef.current.flyTo([userLat, userLng], 13);
    } else if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.flyTo([pos.coords.latitude, pos.coords.longitude], 13);
        }
      });
    }
  };

  return (
    <div className="relative w-full h-full min-h-[400px] lg:min-h-[600px] rounded-2xl overflow-hidden shadow-inner border border-slate-200">
      {/* Map Container */}
      <div id="leaflet-map-container" ref={mapContainerRef} className="w-full h-full z-0" />

      {/* Picking Location Overlay Banner */}
      {isPickingLocation && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 bg-slate-900/90 text-white backdrop-blur-md px-5 py-2.5 rounded-full shadow-xl border border-emerald-500/40 flex items-center gap-2.5 animate-bounce">
          <Compass className="w-4 h-4 text-emerald-400 animate-spin" />
          <span className="text-xs font-semibold tracking-wide">
            Click anywhere on the map to set your idea location!
          </span>
        </div>
      )}

      {/* Map Layer Switcher & Recenter Controls */}
      <div className="absolute top-4 right-4 z-20 flex flex-col gap-2">
        <div className="bg-white/90 backdrop-blur-md p-1.5 rounded-xl shadow-md border border-slate-200/80 flex items-center gap-1">
          <button
            id="tile-light-btn"
            onClick={() => setTileStyle('light')}
            className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all ${
              tileStyle === 'light' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Voyager
          </button>
          <button
            id="tile-osm-btn"
            onClick={() => setTileStyle('osm')}
            className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all ${
              tileStyle === 'osm' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            OSM
          </button>
          <button
            id="tile-dark-btn"
            onClick={() => setTileStyle('dark')}
            className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all ${
              tileStyle === 'dark' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Dark
          </button>
        </div>

        <button
          id="recenter-map-btn"
          onClick={recenterToUser}
          className="self-end bg-white/90 hover:bg-white text-slate-700 hover:text-emerald-600 p-2.5 rounded-xl shadow-md border border-slate-200/80 transition-all flex items-center gap-1.5 text-xs font-semibold"
          title="Recenter Map to My Location"
        >
          <Locate className="w-4 h-4 text-emerald-600" />
          <span className="hidden sm:inline">My Location</span>
        </button>
      </div>
    </div>
  );
};
