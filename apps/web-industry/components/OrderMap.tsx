/**
 * Composant carte pour afficher le trajet d'une commande
 * Utilise Leaflet avec 2 marqueurs (chargement et livraison)
 */

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface OrderMapProps {
  pickupLat?: number;
  pickupLon?: number;
  pickupCity?: string;
  deliveryLat?: number;
  deliveryLon?: number;
  deliveryCity?: string;
}

// Fix for default marker icons in Leaflet with webpack
const pickupIcon = L.divIcon({
  className: 'custom-marker',
  html: `<div style="
    width: 32px;
    height: 32px;
    background: #22c55e;
    border-radius: 50% 50% 50% 0;
    transform: rotate(-45deg);
    display: flex;
    align-items: center;
    justify-content: center;
    border: 3px solid white;
    box-shadow: 0 2px 8px rgba(0,0,0,0.3);
  ">
    <span style="transform: rotate(45deg); font-size: 14px;">📦</span>
  </div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
});

const deliveryIcon = L.divIcon({
  className: 'custom-marker',
  html: `<div style="
    width: 32px;
    height: 32px;
    background: #3b82f6;
    border-radius: 50% 50% 50% 0;
    transform: rotate(-45deg);
    display: flex;
    align-items: center;
    justify-content: center;
    border: 3px solid white;
    box-shadow: 0 2px 8px rgba(0,0,0,0.3);
  ">
    <span style="transform: rotate(45deg); font-size: 14px;">🎯</span>
  </div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
});

export default function OrderMap({
  pickupLat,
  pickupLon,
  pickupCity,
  deliveryLat,
  deliveryLon,
  deliveryCity,
}: OrderMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    // Create map
    const map = L.map(mapRef.current, {
      scrollWheelZoom: false,
      zoomControl: true,
    });

    mapInstanceRef.current = map;

    // Add tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);

    // Add markers if coordinates are available
    if (pickupLat && pickupLon && deliveryLat && deliveryLon) {
      // Pickup marker
      const pickupMarker = L.marker([pickupLat, pickupLon], { icon: pickupIcon }).addTo(map);
      pickupMarker.bindPopup(`<strong>📦 Enlèvement</strong><br/>${pickupCity || 'Point de chargement'}`);

      // Delivery marker
      const deliveryMarker = L.marker([deliveryLat, deliveryLon], { icon: deliveryIcon }).addTo(map);
      deliveryMarker.bindPopup(`<strong>🎯 Livraison</strong><br/>${deliveryCity || 'Point de livraison'}`);

      // Draw line between points
      const line = L.polyline(
        [
          [pickupLat, pickupLon],
          [deliveryLat, deliveryLon],
        ],
        {
          color: '#667eea',
          weight: 3,
          opacity: 0.7,
          dashArray: '10, 10',
        }
      ).addTo(map);

      // Fit bounds to show both markers
      const bounds = L.latLngBounds(
        [pickupLat, pickupLon],
        [deliveryLat, deliveryLon]
      );
      map.fitBounds(bounds, { padding: [50, 50] });
    } else if (pickupLat && pickupLon) {
      // Only pickup
      L.marker([pickupLat, pickupLon], { icon: pickupIcon }).addTo(map);
      map.setView([pickupLat, pickupLon], 10);
    } else {
      // Default view (France)
      map.setView([46.603354, 1.888334], 5);
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [pickupLat, pickupLon, pickupCity, deliveryLat, deliveryLon, deliveryCity]);

  return (
    <div
      ref={mapRef}
      style={{
        width: '100%',
        height: '250px',
        borderRadius: '0',
      }}
    />
  );
}
