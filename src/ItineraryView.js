import React from 'react';

import MapComponent from './MapComponent';

export default function ItineraryView({steps, routes, onBack}) {
  return (
    <div style={{
    height: '100vh', width: '100vw', position: 'relative' }}>
      <MapComponent
  steps = {steps} routes = {routes} searchPoint = {null} onDurationsUpdate =
  {
    () => {}
  } setLoading =
  {
    () => {}
  } onReorderFromMap =
  {
    null
  } />
      <button
        onClick={onBack}
        style={{
          position: 'absolute',
          top: '20px',
          left: '20px',
          zIndex: 1000,
          padding: '10px',
        }}
      >
        Back
      </button >
      < /div>
  );
}
