
import './style.css';

import React, {useState} from 'react';

import {loadTripFromFirebase, saveTripToFirebase} from './firebaseService';
import MapComponent from './MapComponent';
import {hashPassword} from './utils';

export default function App() {
  const [screen, setScreen] = useState('home');
  const [tripName, setTripName] = useState('');
  const [tripPassword, setTripPassword] = useState('');
  const [steps, setSteps] = useState([]);
  const [currentTripKey, setCurrentTripKey] = useState('');
  const [commentInput, setCommentInput] = useState('');
  const [editingIndex, setEditingIndex] = useState(null);

  const updateComment = () => {
    const updatedSteps = [...steps];
    updatedSteps[editingIndex].comment = commentInput;
    setSteps(updatedSteps);
    saveTripToFirebase(currentTripKey, {steps: updatedSteps});
    setCommentInput('');
    setEditingIndex(null);
  };

  const loadTrip = async () => {
    const hash = await hashPassword(tripPassword);
    const key = `${tripName}_${hash}`;
    const data = await loadTripFromFirebase(key);
    setSteps(data.steps);
    setCurrentTripKey(key);
    setScreen('trip');
  };

  const addStep = (step) => {
    const newSteps = [...steps, step];
    setSteps(newSteps);
    saveTripToFirebase(currentTripKey, {steps: newSteps});
  };

  return (
    <div>
      {screen === 'home' && (
        <div>
          <h1>Welcome to Road Trip Planner</h1>
          <button onClick={() => setScreen('auth')}>Create a Trip</button>
          <button onClick={() => setScreen('auth')}>Join a Trip</button>
        </div>
      )}

      {screen === 'auth' && (
        <div>
          <input value={tripName} onChange={(e) => setTripName(e.target.value)} placeholder='Trip name' />
          <input type='password' value={tripPassword} onChange={(e) => setTripPassword(e.target.value)} placeholder='Password' />
          <button onClick={loadTrip}>Continue</button>
        </div>
      )}

      {screen === 'trip' && (
        <div>
          <h2>Itinerary</h2>
          <ul>
            {steps.map((s, i) => (
              <li key={i} onClick={() => { setCommentInput(s.comment); setEditingIndex(i); }}>
                {`${i + 1}: (${s.lat.toFixed(4)}, ${s.lon.toFixed(4)}) - ${s.comment}`}
              </li>
            ))}
          </ul>
          <div>
            <input value={commentInput} onChange={(e) => setCommentInput(e.target.value)} placeholder="Comment" />
            <button onClick={updateComment}>Update</button>
          </div>
          <button onClick={() => setScreen('map')}>Show Map</button>
        </div>
      )
}

{
  screen === 'map' &&
      (<div>
       <MapComponent steps = {steps} onAddStep =
        {
          addStep
        } />
          <button onClick={() => setScreen('trip')}>Back to Itinerary</button>
       </div>
      )}
    </div>);
}