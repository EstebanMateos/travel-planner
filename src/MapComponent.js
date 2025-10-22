import 'leaflet/dist/leaflet.css';

import L from 'leaflet';
import React, {useEffect, useRef, useState} from 'react';

const LOCAL_STORAGE_KEY = 'osrm_route_cache';

function loadRouteCache() {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY)) || {};
  } catch {
    return {};
  }
}

function saveRouteCache(cache) {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(cache));
  } catch {
  }
}

export default function MapComponent(
    {steps, searchPoint, onDurationsUpdate, setLoading, onReorderFromMap}) {
  const mapRef = useRef(null);
  const layerRef = useRef(null);
  const [routes, setRoutes] = useState([]);
  const [segmentDurations, setSegmentDurations] = useState([]);
  const [segmentDistances, setSegmentDistances] = useState([]);
  const [totalDistanceKm, setTotalDistanceKm] = useState(0);
  const routeCache = useRef(loadRouteCache());

  useEffect(() => {
    async function fetchRoutesAndDurations() {
      if (steps.length < 2) {
        setRoutes([]);
        if (onDurationsUpdate) onDurationsUpdate([]);
        return;
      }

      if (setLoading) setLoading(true);

      const routesTmp = Array(steps.length - 1).fill([]);
      const durationsTmp = Array(steps.length - 1).fill(null);
      const distancesTmp = Array(steps.length - 1).fill(null);

      for (let i = 0; i < steps.length - 1; i++) {
        const from = steps[i];
        const to = steps[i + 1];
        const cacheKey = `${from.lat},${from.lon}-${to.lat},${to.lon}`;

        if (routeCache.current[cacheKey]) {
          const cached = routeCache.current[cacheKey];
          routesTmp[i] = cached.route;
          durationsTmp[i] = cached.duration;
          distancesTmp[i] = cached.distance;
        } else {
          const url = `https://router.project-osrm.org/route/v1/driving/${
              from.lon},${from.lat};${to.lon},${
              to.lat}?overview=full&geometries=geojson`;

          try {
            const res = await fetch(url);
            const json = await res.json();

            if (json.routes && json.routes.length > 0) {
              const coords = json.routes[0].geometry.coordinates.map(
                  ([lon, lat]) => [lat, lon]);
              const duration = json.routes[0].duration;
              const distance = json.routes[0].distance;

              routesTmp[i] = coords;
              durationsTmp[i] = duration;
              distancesTmp[i] = distance;

              routeCache
                  .current[cacheKey] = {route: coords, duration, distance};
              saveRouteCache(routeCache.current);
            } else {
              routesTmp[i] = [];
              durationsTmp[i] = null;
              distancesTmp[i] = null;
            }
          } catch {
            routesTmp[i] = [];
            durationsTmp[i] = null;
            distancesTmp[i] = null;
          }

          await new Promise(r => setTimeout(r, 600));
        }

        setRoutes([...routesTmp]);
        setSegmentDurations([...durationsTmp]);
        setSegmentDistances([...distancesTmp]);

        if (onDurationsUpdate) onDurationsUpdate([...durationsTmp]);
      }

      const totalDistance = distancesTmp.reduce((acc, d) => acc + (d || 0), 0);
      setTotalDistanceKm((totalDistance / 1000).toFixed(2));

      if (setLoading) setLoading(false);
    }

    fetchRoutesAndDurations();
  }, [JSON.stringify(steps)]);

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

      const popupDiv = L.DomUtil.create('div');
      popupDiv.innerHTML = `
        <div>
          <b>${i + 1}: ${s.comment || '(No comment)'}</b><br/>
          <label>Déplacer vers : </label>
          <select id="select-pos-${i}">
            ${
          steps
              .map(
                  (_, idx) => `<option value="${idx}" ${
                      idx === i ? 'selected' : ''}>${idx + 1}</option>`)
              .join('')}
          </select>
          <button id="btn-move-${i}">OK</button>
        </div>
      `;

      marker.bindPopup(popupDiv);

      marker.on('popupopen', () => {
        const btn = document.getElementById(`btn-move-${i}`);
        const select = document.getElementById(`select-pos-${i}`);
        if (btn && select && typeof onReorderFromMap === 'function') {
          btn.addEventListener('click', () => {
            const newIndex = parseInt(select.value, 10);
            if (!isNaN(newIndex) && newIndex >= 0 && newIndex < steps.length &&
                newIndex !== i) {
              onReorderFromMap(i, newIndex);
              marker.closePopup();
            }
          });
        }
      });
    });

    if (searchPoint) {
      const marker = L.marker([searchPoint.lat, searchPoint.lon], {
                        opacity: 0.6,
                      }).addTo(layerRef.current);
      marker.bindPopup(`📍 ${searchPoint.comment || 'Search result'}`)
          .openPopup();
    }

    routes.forEach((route) => {
      if (route.length > 0) {
        L.polyline(route, {color: 'blue'}).addTo(layerRef.current);
      }
    });
  }, [steps, searchPoint, routes, onReorderFromMap]);

  return (
    <div>
      <div style={{
    padding: '10px', fontWeight: 'bold' }}>
        Itinerary – Total Distance: {totalDistanceKm} km
      </div>
      <div id="map" style={{ height: '80vh' }}></div>
      <div style={{
    padding: '10px' }}>
        {segmentDurations.map((duration, idx) => {
      const distance = segmentDistances[idx];
      const durationMin = duration != null ? Math.round(duration / 60) : 'N/A';
      const distanceKm =
          distance != null ? (distance / 1000).toFixed(1) : 'N/A';
          return (
            <div key={idx}>
              Segment {idx + 1}: {durationMin} min – {distanceKm} km
            </div>
          );
        })}
      </div>
    </div>
  );
}
