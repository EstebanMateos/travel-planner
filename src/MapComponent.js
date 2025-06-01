import 'leaflet/dist/leaflet.css';

import L from 'leaflet';
import React, {useEffect, useRef, useState} from 'react';

export default function MapComponent({steps, searchPoint, onDurationsUpdate}) {
  const mapRef = useRef(null);
  const layerRef = useRef(null);
  const [routes, setRoutes] = useState([]);

  useEffect(() => {
    async function fetchRoutesAndDurations() {
      if (steps.length < 2) {
        setRoutes([]);
        if (onDurationsUpdate) onDurationsUpdate([]);
        return;
      }

      const routesTmp = [];
      const durationsTmp = [];

      for (let i = 0; i < steps.length - 1; i++) {
        const from = steps[i];
        const to = steps[i + 1];
        const url =
            `https://router.project-osrm.org/route/v1/driving/${from.lon},${
                from.lat};${to.lon},${to.lat}?overview=full&geometries=geojson`;

        try {
          const res = await fetch(url);
          const json = await res.json();

          if (json.routes && json.routes.length > 0) {
            routesTmp.push(json.routes[0].geometry.coordinates.map(
                ([lon, lat]) => [lat, lon]));
            durationsTmp.push(json.routes[0].duration);
          } else {
            routesTmp.push([]);
            durationsTmp.push(null);
          }
        } catch {
          routesTmp.push([]);
          durationsTmp.push(null);
        }
      }

      setRoutes(routesTmp);
      if (onDurationsUpdate) onDurationsUpdate(durationsTmp);
    }

    fetchRoutesAndDurations();
  }, [steps, onDurationsUpdate]);

  useEffect(() => {
    if (!mapRef.current) {
      mapRef.current = L.map('map').setView([43.3, -1.5], 6);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png')
          .addTo(mapRef.current);
    }

    if (layerRef.current) {
      layerRef.current.clearLayers();
    } else {
      layerRef.current = L.layerGroup().addTo(mapRef.current);
    }

    steps.forEach((s, i) => {
      const marker = L.marker([s.lat, s.lon]).addTo(layerRef.current);
      marker.bindPopup(`#${i + 1}: ${s.comment || '(No comment)'}`);
    });

    if (searchPoint) {
      const marker = L.marker([searchPoint.lat, searchPoint.lon], {
                        opacity: 0.6
                      }).addTo(layerRef.current);
      marker.bindPopup(`📍 ${searchPoint.comment || 'Search result'}`)
          .openPopup();
    }

    routes.forEach((route) => {
      if (route.length > 0) {
        L.polyline(route, {color: 'blue'}).addTo(layerRef.current);
      }
    });
  }, [steps, searchPoint, routes]);

  return <div id = 'map' style = {
           {
             height: '80vh'
           }
         }>< /div>;
}
