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

      for (let i = 0; i < steps.length - 1; i++) {
        const from = steps[i];
        const to = steps[i + 1];
        const cacheKey = `${from.lat},${from.lon}-${to.lat},${to.lon}`;

        if (routeCache.current[cacheKey]) {
          const cached = routeCache.current[cacheKey];
          routesTmp[i] = cached.route;
          durationsTmp[i] = cached.duration;
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

              routesTmp[i] = coords;
              durationsTmp[i] = duration;

              routeCache.current[cacheKey] = {route: coords, duration};
              saveRouteCache(routeCache.current);
            } else {
              routesTmp[i] = [];
              durationsTmp[i] = null;
            }
          } catch {
            routesTmp[i] = [];
            durationsTmp[i] = null;
          }

          await new Promise(r => setTimeout(r, 600));
        }

        setRoutes([...routesTmp]);
        if (onDurationsUpdate) onDurationsUpdate([...durationsTmp]);
      }

      if (setLoading) setLoading(false);
    }

    fetchRoutesAndDurations();

    // Only rerun when steps *actually* change
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
  }, [steps, searchPoint, routes, onReorderFromMap]);

  return <div id = 'map' style = {
           {
             height: '80vh'
           }
         }>< /div>;
}
