import 'leaflet/dist/leaflet.css';

import L from 'leaflet';
import React, {useEffect, useRef} from 'react';

export default function ItineraryView({steps, onBack}) {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);

  useEffect(() => {
    if (!mapRef.current && mapContainerRef.current) {
      mapRef.current = L.map(mapContainerRef.current, {
                          zoomControl: false
                        }).setView([43.3, -1.5], 6);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png')
          .addTo(mapRef.current);
    }

    if (!mapRef.current) return;

    mapRef.current.eachLayer((layer) => {
      if (!(layer instanceof L.TileLayer)) mapRef.current.removeLayer(layer);
    });

    const markers = [];
    const latlngs = [];

    steps.forEach((s, i) => {
      const pos = [s.lat, s.lon];
      latlngs.push(pos);
      const marker = L.marker(pos).addTo(mapRef.current);
      marker.bindTooltip(
          `${i + 1}`,
          {permanent: true, direction: 'center', className: 'step-label'});
      markers.push(marker);
    });

    if (latlngs.length > 1) {
      L.polyline(latlngs, {color: 'blue'}).addTo(mapRef.current);
    }

    if (latlngs.length > 0) {
      mapRef.current.fitBounds(L.latLngBounds(latlngs), {padding: [50, 50]});
    }
  }, [steps]);

  return (<div><div id = 'map' ref = {mapContainerRef} style = {
    {
      height: '80vh', margin: '1rem'
    }
  }></div>
      <div style={{ textAlign: 'center' }}>
        <button onClick={onBack}>Back</button>
          </div>
    </div>);
}
