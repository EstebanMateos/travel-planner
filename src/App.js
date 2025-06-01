import './style.css';

import {DragDropContext, Draggable, Droppable} from '@hello-pangea/dnd';
import React, {useEffect, useState} from 'react';

import {loadTripFromFirebase, saveTripToFirebase} from './firebaseService';
import ItineraryView from './ItineraryView';
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
  const [searchText, setSearchText] = useState('');
  const [searchResult, setSearchResult] = useState(null);

  useEffect(() => {
    const savedKey = localStorage.getItem('tripKey');
    if (savedKey) {
      (async () => {
        const data = await loadTripFromFirebase(savedKey);
        if (data) {
          setSteps(data.steps);
          setCurrentTripKey(savedKey);
          setScreen('trip');
        }
      })();
    }
  }, []);

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
    localStorage.setItem('tripKey', key);
    setScreen('trip');
  };

  const addStep = (step) => {
    const newSteps = [...steps, step];
    setSteps(newSteps);
    saveTripToFirebase(currentTripKey, {steps: newSteps});
  };

  const deleteStep = (index) => {
    const newSteps = steps.filter((_, i) => i !== index);
    setSteps(newSteps);
    saveTripToFirebase(currentTripKey, {steps: newSteps});
  };

  const onDragEnd = (result) => {
    if (!result.destination) return;
    const reordered = Array.from(steps);
    const [removed] = reordered.splice(result.source.index, 1);
    reordered.splice(result.destination.index, 0, removed);
    setSteps(reordered);
    saveTripToFirebase(currentTripKey, {steps: reordered});
  };

  const searchLocation = async () => {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${
        encodeURIComponent(searchText)}`;
    const res = await fetch(url);
    const results = await res.json();
    if (results.length > 0) {
      const {lat, lon, display_name} = results[0];
      setSearchResult(
          {lat: parseFloat(lat), lon: parseFloat(lon), comment: display_name});
    } else {
      alert('No location found.');
      setSearchResult(null);
    }
  };

  const confirmAddSearchResult = () => {
    if (searchResult) {
      addStep(searchResult);
      setSearchResult(null);
      setSearchText('');
    }
  };

  const resetTrip = () => {
    localStorage.removeItem('tripKey');
    setTripName('');
    setTripPassword('');
    setSteps([]);
    setCurrentTripKey('');
    setScreen('home');
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
        <div className='trip-container'>
          <div className='trip-list'>
            <h2>Itinerary</h2>
            <DragDropContext onDragEnd={onDragEnd}>
              <Droppable droppableId='steps'>
                {(provided) => (
                  <ul {...provided.droppableProps} ref={provided.innerRef} className='step-list'>
                    {steps.map((s, i) => (
                      <Draggable key={i} draggableId={`step-${i}`} index={i}>
                        {(provided, snapshot) => (
                          <li
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className={`step-item ${snapshot.isDragging ? 'dragging' : ''}`}
                          >
                            <div>
                              {editingIndex === i ? (
                                <input
                                  value={commentInput}
                                  autoFocus
                                  onChange={(e) => setCommentInput(e.target.value)}
                                  onBlur={() => updateComment()}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') updateComment();
                                  }}
                                />
                              ) : (
                                <span onClick={() => {
    setCommentInput(s.comment);
    setEditingIndex(i); }}>
                                  {`${i + 1}: ${s.comment}`}
                                </span>
                              )}
                            </div>
                            <div className='reorder-buttons'>
                              <button onClick={() => deleteStep(i)}>🗑️</button>
                            </div>
                          </li>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </ul>
                )}
              </Droppable>
            </DragDropContext>
            <div style={{ marginTop: '1rem' }}>
              <button onClick={() => setScreen('view')}>View Itinerary</button>
              <button onClick={resetTrip} style={{
    marginLeft: '1rem' }}>Choose Another Trip</button>
            </div>
          </div>

          <div className='trip-map'>
            <MapComponent steps={steps} onAddStep={addStep} searchPoint={searchResult} drawPath={true} />
            <div className='search-area'>
              <input
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                placeholder='Search a place'
              />
              <button onClick={searchLocation}>Locate</button>
              <button onClick={confirmAddSearchResult} disabled={!searchResult}>Add to Itinerary</button>
            </div>
            <button onClick={() => setScreen('home')}>Back to Home</button>
          </div>
        </div>
      )
}

{
  screen === 'view' &&
      (<ItineraryView steps = {steps} onBack = {
            () => setScreen('trip')} drawPath = {
        true
      } />
      )}
    </div>);
}
