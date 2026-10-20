'use client';

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Pickup: white dot ringed in black. Drop-off: black square with a yellow centre.
const pickupIcon = L.divIcon({
  className: '',
  html: '<div style="width:22px;height:22px;border-radius:50%;background:#fff;border:6px solid #1C1C1C;box-shadow:0 2px 6px rgba(0,0,0,.35)"></div>',
  iconSize: [22, 22],
  iconAnchor: [11, 11],
  popupAnchor: [0, -12],
});

const dropoffIcon = L.divIcon({
  className: '',
  html: '<div style="width:22px;height:22px;border-radius:4px;background:#1C1C1C;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 6px rgba(0,0,0,.35)"><div style="width:9px;height:9px;border-radius:1.5px;background:#FFC629"></div></div>',
  iconSize: [22, 22],
  iconAnchor: [11, 11],
  popupAnchor: [0, -12],
});

// Addresses come from user input / Nominatim, so escape before putting them in popup HTML
const escapeHtml = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export default function RideMap({
  pickup,
  dropoff,
  pickupCoords,
  dropoffCoords,
  routeGeometry,
  onMapClick,
  onPickupDrag,
  onDropoffDrag,
  className = 'h-[420px]',
  bottomPadding = 40,
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const layerGroupRef = useRef(null);

  // Keep latest callbacks in refs so marker/map listeners never call stale versions
  const onMapClickRef = useRef(onMapClick);
  const onPickupDragRef = useRef(onPickupDrag);
  const onDropoffDragRef = useRef(onDropoffDrag);
  useEffect(() => {
    onMapClickRef.current = onMapClick;
    onPickupDragRef.current = onPickupDrag;
    onDropoffDragRef.current = onDropoffDrag;
  });

  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    // Default centre: Ulhasnagar / Kalyan / MMR region
    const map = L.map(mapContainerRef.current, { zoomControl: false }).setView([19.2215, 73.1645], 13);

    // CARTO Voyager tiles (OpenStreetMap data) — cleaner, app-like basemap
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
      subdomains: 'abcd',
      maxZoom: 19,
    }).addTo(map);

    layerGroupRef.current = L.layerGroup().addTo(map);
    mapInstanceRef.current = map;

    map.on('click', (e) => {
      if (onMapClickRef.current) onMapClickRef.current([e.latlng.lat, e.latlng.lng]);
    });

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapInstanceRef.current;
    const layerGroup = layerGroupRef.current;
    if (!map || !layerGroup) return;

    layerGroup.clearLayers();
    const fitOpts = { paddingTopLeft: [40, 70], paddingBottomRight: [40, bottomPadding] };

    if (pickupCoords) {
      const pMarker = L.marker(pickupCoords, { icon: pickupIcon, draggable: true })
        .bindPopup(`<b>Pickup:</b> ${escapeHtml(pickup || 'Selected location')}`)
        .addTo(layerGroup);
      pMarker.on('dragend', (e) => {
        const pos = e.target.getLatLng();
        if (onPickupDragRef.current) onPickupDragRef.current([pos.lat, pos.lng]);
      });
    }

    if (dropoffCoords) {
      const dMarker = L.marker(dropoffCoords, { icon: dropoffIcon, draggable: true })
        .bindPopup(`<b>Drop-off:</b> ${escapeHtml(dropoff || 'Selected destination')}`)
        .addTo(layerGroup);
      dMarker.on('dragend', (e) => {
        const pos = e.target.getLatLng();
        if (onDropoffDragRef.current) onDropoffDragRef.current([pos.lat, pos.lng]);
      });
    }

    // Draw real driving route if available, otherwise a dashed straight line
    if (routeGeometry && routeGeometry.length > 0) {
      L.polyline(routeGeometry, { color: '#1C1C1C', weight: 6, opacity: 0.9 }).addTo(layerGroup);
      L.polyline(routeGeometry, { color: '#FFC629', weight: 2, dashArray: '6 8' }).addTo(layerGroup);
      map.fitBounds(L.latLngBounds(routeGeometry), fitOpts);
    } else if (pickupCoords && dropoffCoords) {
      L.polyline([pickupCoords, dropoffCoords], { color: '#1C1C1C', weight: 3, dashArray: '8, 8' }).addTo(layerGroup);
      map.fitBounds(L.latLngBounds([pickupCoords, dropoffCoords]), fitOpts);
    } else if (pickupCoords) {
      map.setView(pickupCoords, 16);
    } else if (dropoffCoords) {
      map.setView(dropoffCoords, 16);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pickupCoords, dropoffCoords, routeGeometry]);

  return <div ref={mapContainerRef} className={`isolate w-full cursor-crosshair ${className}`} />;
}
