import { useEffect, useRef, useState } from 'react';
import { mappls } from 'mappls-web-maps';

const mapplsClassObject = new mappls();

function MapView({ accessToken, origin, destination, routeCoordinates }) {
  const mapRef = useRef(null);
  const markersRef = useRef([]);
  const polylineRef = useRef(null);
  const [isMapLoaded, setIsMapLoaded] = useState(false);

  // Initialize Mappls Web Map
  useEffect(() => {
    if (!accessToken) return;

    let isMounted = true;
    const loadObject = {
      map: true,
      version: '3.0'
    };

    mapplsClassObject.initialize(accessToken, loadObject, () => {
      if (!isMounted) return;

      const newMap = mapplsClassObject.Map({
        id: 'mappls-map',
        properties: {
          center: [18.4635, 73.8677], // Pune default
          zoom: 13,
          zoomControl: true
        }
      });

      newMap.on('load', () => {
        if (isMounted) setIsMapLoaded(true);
      });

      mapRef.current = newMap;
    });

    return () => {
      isMounted = false;
      setIsMapLoaded(false);
      if (mapRef.current && typeof mapRef.current.remove === 'function') {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [accessToken]);

  // Update markers, polyline, and map bounds
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !isMapLoaded) return;

    // Clear previous markers
    markersRef.current.forEach((marker) => {
      if (marker && typeof marker.remove === 'function') {
        marker.remove();
      }
    });
    markersRef.current = [];

    // Clear previous polyline
    if (polylineRef.current && typeof polylineRef.current.remove === 'function') {
      polylineRef.current.remove();
      polylineRef.current = null;
    }

    if (origin) {
      const originMarker = mapplsClassObject.Marker({
        map,
        position: { lat: origin.lat, lng: origin.lon },
        popupHtml: `<div><strong>Origin:</strong> ${origin.name}</div>`
      });
      markersRef.current.push(originMarker);
    }

    if (destination) {
      const destMarker = mapplsClassObject.Marker({
        map,
        position: { lat: destination.lat, lng: destination.lon },
        popupHtml: `<div><strong>Destination:</strong> ${destination.name}</div>`
      });
      markersRef.current.push(destMarker);
    }

    if (routeCoordinates.length > 0) {
      polylineRef.current = mapplsClassObject.Polyline({
        map,
        path: routeCoordinates,
        strokeColor: '#644DFF',
        strokeOpacity: 0.9,
        strokeWeight: 6
      });
    }

    // Fit map view to route or selected markers
    if (origin && destination && typeof map.fitBounds === 'function') {
      const pts =
        routeCoordinates.length > 0
          ? routeCoordinates
          : [
              { lat: origin.lat, lng: origin.lon },
              { lat: destination.lat, lng: destination.lon }
            ];

      const lats = pts.map((p) => p.lat);
      const lngs = pts.map((p) => p.lng);
      map.fitBounds(
        [
          [Math.min(...lngs), Math.min(...lats)],
          [Math.max(...lngs), Math.max(...lats)]
        ],
        { padding: 50 }
      );
    } else if (origin && typeof map.setCenter === 'function') {
      map.setCenter([origin.lon, origin.lat]);
      if (typeof map.setZoom === 'function') map.setZoom(14);
    } else if (destination && typeof map.setCenter === 'function') {
      map.setCenter([destination.lon, destination.lat]);
      if (typeof map.setZoom === 'function') map.setZoom(14);
    }
  }, [isMapLoaded, origin, destination, routeCoordinates]);

  return (
    <div className="w-full h-125 rounded-2xl overflow-hidden border border-[#E4E1F2] shadow-sm relative bg-[#ECEAF3]">
      <div id="mappls-map" className="w-full h-full" />
      {!accessToken && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#FFFFFF]/90 p-6 text-center">
          <p className="text-sm text-[#6E6B7B]">
            Waiting for Mappls access token from backend (<code>/api/mappls/token</code>)...
          </p>
        </div>
      )}
    </div>
  );
}

export default MapView;