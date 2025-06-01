import 'leaflet/dist/leaflet.css';

import L from 'leaflet';
import React, {useEffect} from 'react';

export default function MapComponent({steps, onAddStep}) {
  useEffect(() => {
    const map = L.map('map').setView([43.3, -1.5], 6);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png')
        .addTo(map);
    map.on('click', (e) => {
      onAddStep({lat: e.latlng.lat, lon: e.latlng.lng, comment: ''});
    });
    steps.forEach((s, i) => {
      const marker = L.marker([s.lat, s.lon]).addTo(map);
      marker.bindPopup(`#${i + 1}: ${s.comment || '(No comment)'}`);
    });
  }, [steps, onAddStep]);

  return <div id = 'map' style = {
           {
             height: '80vh'
           }
         }>< /div>;
}
