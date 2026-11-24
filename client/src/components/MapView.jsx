import { useEffect, useRef, useState } from 'react';
import { Layers, AlertCircle } from 'lucide-react';
import { loadGoogleMapsScript } from '../services/googleMapsLoader';

const DEFAULT_CENTER = { lat: 18.5204, lng: 73.8567 };

function MapView({
  apiKey,
  origin,
  destination,
  routes = [],
  selectedRouteIndex = 0,
  onSelectRoute,
  ecoRouteIndex = null
}) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const trafficLayerRef = useRef(null);
  const markersRef = useRef([]);
  const polylinesRef = useRef([]);
  const infoWindowsRef = useRef([]);

  const [isLoaded, setIsLoaded] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [showTraffic, setShowTraffic] = useState(true);

  useEffect(() => {
    if (!apiKey) {
      setIsLoaded(false);
      return;
    }

    let active = true;
    setLoadError('');

    loadGoogleMapsScript(apiKey)
      .then((maps) => {
        if (!active || !containerRef.current) return;

        const map = new maps.Map(containerRef.current, {
          center: DEFAULT_CENTER,
          zoom: 12,
          mapTypeControl: false,
          streetViewControl: true,
          fullscreenControl: true,
          zoomControl: true,
          gestureHandling: 'greedy'
        });

        const trafficLayer = new maps.TrafficLayer();
        trafficLayer.setMap(map);

        mapRef.current = map;
        trafficLayerRef.current = trafficLayer;
        setIsLoaded(true);
      })
      .catch((err) => {
        if (active) {
          setLoadError(err.message || 'Could not load Google Maps');
        }
      });

    return () => {
      active = false;
      if (trafficLayerRef.current) {
        trafficLayerRef.current.setMap(null);
        trafficLayerRef.current = null;
      }
      mapRef.current = null;
      setIsLoaded(false);
    };
  }, [apiKey]);

  // Toggle live Google Traffic Layer
  useEffect(() => {
    if (!trafficLayerRef.current || !mapRef.current) return;
    trafficLayerRef.current.setMap(showTraffic ? mapRef.current : null);
  }, [showTraffic, isLoaded]);

  // Render origin/destination markers and multiple clickable routes
  useEffect(() => {
    const map = mapRef.current;
    const maps = window.google?.maps;
    if (!map || !maps || !isLoaded) return;

    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = [];

    polylinesRef.current.forEach((p) => p.setMap(null));
    polylinesRef.current = [];

    infoWindowsRef.current.forEach((iw) => iw.close());
    infoWindowsRef.current = [];

    if (origin) {
      const originMarker = new maps.Marker({
        map,
        position: { lat: origin.lat, lng: origin.lon },
        title: `Origin: ${origin.name}`,
        icon: {
          path: maps.SymbolPath.CIRCLE,
          scale: 8,
          fillColor: '#1A73E8',
          fillOpacity: 1,
          strokeColor: '#FFFFFF',
          strokeWeight: 3
        }
      });
      markersRef.current.push(originMarker);
    }

    if (destination) {
      const destMarker = new maps.Marker({
        map,
        position: { lat: destination.lat, lng: destination.lon },
        title: `Destination: ${destination.name}`
      });
      markersRef.current.push(destMarker);
    }

    const bounds = new maps.LatLngBounds();
    let hasBounds = false;

    if (origin) {
      bounds.extend({ lat: origin.lat, lng: origin.lon });
      hasBounds = true;
    }
    if (destination) {
      bounds.extend({ lat: destination.lat, lng: destination.lon });
      hasBounds = true;
    }

    // Draw unselected routes first, then selected route on top
    const orderedIndices = routes
      .map((_, idx) => idx)
      .sort((a, b) =>
        a === selectedRouteIndex ? 1 : b === selectedRouteIndex ? -1 : 0
      );

    orderedIndices.forEach((idx) => {
      const route = routes[idx];
      const path = route?.coordinates || [];
      if (path.length === 0) return;

      path.forEach((pt) => bounds.extend(pt));
      hasBounds = true;

      const isSelected = idx === selectedRouteIndex;
      const isEco = idx === ecoRouteIndex;
      const strokeColor = isSelected
        ? isEco
          ? '#188038'
          : '#1A73E8'
        : '#9AA0A6';

      // Outer casing for Google Maps crisp polyline look
      const casing = new maps.Polyline({
        map,
        path,
        strokeColor: isSelected ? '#FFFFFF' : '#5F6368',
        strokeOpacity: isSelected ? 0.95 : 0.45,
        strokeWeight: isSelected ? 9 : 6,
        zIndex: isSelected ? 10 : 2,
        clickable: true
      });

      const line = new maps.Polyline({
        map,
        path,
        strokeColor,
        strokeOpacity: isSelected ? 0.95 : 0.75,
        strokeWeight: isSelected ? 6 : 4,
        zIndex: isSelected ? 11 : 3,
        clickable: true
      });

      const handleClick = () => {
        if (typeof onSelectRoute === 'function') {
          onSelectRoute(idx);
        }
      };

      casing.addListener('click', handleClick);
      line.addListener('click', handleClick);

      polylinesRef.current.push(casing, line);

      // Show floating Google Maps style route label on midpoint
      if (path.length > 2) {
        const midPoint = path[Math.floor(path.length / 2)];
        const ecoBadge = isEco
          ? `<span style="color:#188038;font-weight:700;">🌿 Eco</span> · `
          : '';
        const infoWindow = new maps.InfoWindow({
          position: midPoint,
          disableAutoPan: true,
          content: `<div style="font-family:Inter,sans-serif;font-size:12px;line-height:1.3;padding:2px 4px;color:#202124;">
            ${ecoBadge}<strong>${route.duration} min</strong>
            <span style="color:#5F6368;"> (${route.distance} km)</span>
          </div>`
        });
        if (isSelected) {
          infoWindow.open(map);
          infoWindowsRef.current.push(infoWindow);
        }
      }
    });

    if (hasBounds) {
      if (origin && !destination && routes.length === 0) {
        map.setCenter({ lat: origin.lat, lng: origin.lon });
        map.setZoom(14);
      } else if (destination && !origin && routes.length === 0) {
        map.setCenter({ lat: destination.lat, lng: destination.lon });
        map.setZoom(14);
      } else {
        map.fitBounds(bounds, { top: 48, right: 48, bottom: 48, left: 48 });
      }
    }
  }, [isLoaded, origin, destination, routes, selectedRouteIndex, ecoRouteIndex, onSelectRoute]);

  return (
    <div className="relative w-full h-full min-h-[420px] bg-[#E8EAED] overflow-hidden">
      <div ref={containerRef} className="w-full h-full" />

      {/* Live Traffic Toggle Pill */}
      {isLoaded && (
        <button
          type="button"
          onClick={() => setShowTraffic((prev) => !prev)}
          className={`absolute top-4 right-4 z-10 inline-flex items-center gap-2 px-3.5 py-2 rounded-full text-xs font-semibold shadow-md border transition cursor-pointer ${
            showTraffic
              ? 'bg-[#1A73E8] text-white border-[#1A73E8]'
              : 'bg-white text-[#3C4043] border-[#DADCE0] hover:bg-[#F8F9FA]'
          }`}
        >
          <Layers size={15} />
          <span>Live Traffic: {showTraffic ? 'ON' : 'OFF'}</span>
        </button>
      )}

      {/* Missing API Key / Load Error State (No dummy map) */}
      {(!apiKey || loadError) && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#F8F9FA] p-6 text-center">
          <div className="max-w-md bg-white border border-[#DADCE0] rounded-2xl p-6 shadow-sm">
            <div className="w-11 h-11 rounded-full bg-[#FCE8E6] text-[#D93025] flex items-center justify-center mx-auto mb-3">
              <AlertCircle size={22} />
            </div>
            <h3 className="text-base font-semibold text-[#202124]">
              Google Maps API Key Required
            </h3>
            <p className="text-sm text-[#5F6368] mt-2">
              {loadError ||
                'Add VITE_GOOGLE_MAPS_API_KEY to client/.env to display live Google Maps, traffic overlays, and interactive multi-route navigation.'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default MapView;