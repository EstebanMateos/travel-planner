import 'leaflet/dist/leaflet.css';

import L from 'leaflet';
import React, {useEffect} from 'react';

let mapInstance = null;

export default function MapComponent({steps, searchPoint, drawPath}) {
  useEffect(() => {
    const mapContainer = document.getElementById('map');
    if (mapContainer && mapContainer._leaflet_id) {
      mapContainer._leaflet_id = null;
    }

    if (!mapInstance) {
      mapInstance = L.map('map').setView([43.3, -1.5], 6);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png')
          .addTo(mapInstance);
    }

    return () => {
      if (mapInstance) {
        mapInstance.off();
        mapInstance.remove();
        mapInstance = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!mapInstance) return;

    mapInstance.eachLayer((layer) => {
      if (layer instanceof L.Marker || layer instanceof L.Polyline) {
        mapInstance.removeLayer(layer);
      }
    });

    if (steps && steps.length > 0) {
      steps.forEach((s, i) => {
        const marker = L.marker([s.lat, s.lon]).addTo(mapInstance);
        marker.bindPopup(`#${i + 1}: ${s.comment || '(No comment)'}`);
      });

      if (drawPath && steps.length > 1) {
        const latlngs = steps.map((s) => [s.lat, s.lon]);
        L.polyline(latlngs, {color: 'blue'}).addTo(mapInstance);
      }
    }

    if (searchPoint) {
      const marker =
          L.marker([searchPoint.lat, searchPoint.lon], {
             icon: L.icon({
               iconUrl: 'https://cdn-icons-png.flaticon.com/512/684/684908.png',
               iconSize: [25, 41],
               iconAnchor: [12, 41],
               popupAnchor: [0, -41],
             }),
           }).addTo(mapInstance);
      marker.bindPopup(`Search result: ${searchPoint.comment || 'Location'}`)
          .openPopup();
      mapInstance.setView([searchPoint.lat, searchPoint.lon], 10);
    }
  }, [steps, searchPoint, drawPath]);

  return < div id = 'map' style = {
    {
      height: '80vh', width: '100%'
    }
  } />;
}