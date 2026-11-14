import React, { useState, useMemo, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

import {
  CAMPUS_CENTER,
  getPlacesByCategory,
  allMockPlaces,
} from '../data/mappingData';

const METERS_PER_MILE = 1609.34;
const MIN_MILES = 1;
const MAX_MILES = 13;

function makeIcon(place, selected) {
  let color = '#2563eb';
  let emoji = '🏠';

  if (place.category === 'hub') {
    color = '#7c3aed'; // Purple badge for food plazas/hubs
    emoji = '🏬';
  } else if (place.category === 'food') {
    color = '#d97706'; // Amber for standalone food
    emoji = '🍔';
  } else if (place.tier === 'Gold Standard') {
    color = '#ca8a04'; // Gold accent
    emoji = '⭐';
  } else if (place.tier === 'Green Standard') {
    color = '#15803d'; // Green accent
    emoji = '🌿';
  }

  const size = selected ? 38 : 30;
  return L.divIcon({
    className: '',
    html: `<div style="
      width:${size}px;height:${size}px;border-radius:50%;
      background:${color};border:2px solid ${selected ? '#000' : '#fff'};
      box-shadow:0 2px 6px rgba(0,0,0,.45);
      display:flex;align-items:center;justify-content:center;
      font-size:${selected ? 18 : 14}px;">${emoji}</div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2],
  });
}

function MapController({ radiusMiles, selectedSpot }) {
  const map = useMap();

  useEffect(() => {
    // Fits strictly within the boundary circle to avoid out-of-bounds pins
    const bounds = L.latLng(CAMPUS_CENTER.lat, CAMPUS_CENTER.lng).toBounds(
      radiusMiles * METERS_PER_MILE * 2
    );
    map.fitBounds(bounds, { animate: true, padding: [20, 20] });
  }, [radiusMiles, map]);

  useEffect(() => {
    if (selectedSpot) {
      map.flyTo([selectedSpot.lat, selectedSpot.lng], Math.max(map.getZoom(), 15), {
        duration: 0.5,
      });
    }
  }, [selectedSpot, map]);

  return null;
}

export default function HousingMap({ onNavigateBack }) {
  const [radiusMiles, setRadiusMiles] = useState(5);
  const [filterType, setFilterType] = useState('all');
  const [selectedSpot, setSelectedSpot] = useState(null);

  // Instant local data retrieval via mappingData helper
  const places = useMemo(() => {
    return getPlacesByCategory(filterType, radiusMiles).sort(
      (a, b) => a.distanceMiles - b.distanceMiles
    );
  }, [filterType, radiusMiles]);

  // Aggregate badge counts across the active radius
  const counts = useMemo(() => {
    const inRadius = allMockPlaces.filter((p) => p.distanceMiles <= radiusMiles);
    return {
      all: inRadius.length,
      gold: inRadius.filter((p) => p.category === 'housing' && p.tier === 'Gold Standard').length,
      green: inRadius.filter((p) => p.category === 'housing' && p.tier === 'Green Standard').length,
      housing: inRadius.filter((p) => p.category === 'housing').length,
      food: inRadius.filter((p) => p.category === 'hub' || p.category === 'food').length,
    };
  }, [radiusMiles]);

  // Clear selection if filtered out of view
  useEffect(() => {
    if (selectedSpot && selectedSpot.distanceMiles > radiusMiles) {
      setSelectedSpot(null);
    }
  }, [radiusMiles, selectedSpot]);

  const milesLabel = (n) => `${n} ${n === 1 ? 'mile' : 'miles'}`;

  return (
    <main style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <header style={{ marginBottom: '16px' }}>
        <button
          type="button"
          onClick={onNavigateBack}
          style={{ marginBottom: '8px', cursor: 'pointer' }}
        >
          &larr; Back to Home
        </button>
        <h1>UniVerse Campus, Housing &amp; Food Explorer</h1>
        <p>Verified off-campus living and dining hubs within {milesLabel(radiusMiles)} of UNC Charlotte.</p>
      </header>

      {/* Control Bar */}
      <section
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '12px',
          alignItems: 'center',
          background: '#0b3d2e',
          color: '#fff',
          padding: '12px 18px',
          borderRadius: '8px',
          marginBottom: '16px',
        }}
      >
        <label htmlFor="radius">
          Radius: <strong>{milesLabel(radiusMiles)}</strong>
        </label>
        <input
          id="radius"
          type="range"
          min={MIN_MILES}
          max={MAX_MILES}
          value={radiusMiles}
          onChange={(e) => setRadiusMiles(Number(e.target.value))}
          style={{ cursor: 'pointer' }}
        />

        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {[
            { id: 'all', label: `All (${counts.all})` },
            { id: 'gold', label: `Gold Standard (${counts.gold})` },
            { id: 'green', label: `Green Standard (${counts.green})` },
            { id: 'housing', label: `All Housing (${counts.housing})` },
            { id: 'food', label: `Dining & Hubs (${counts.food})` },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                setFilterType(tab.id);
                setSelectedSpot(null);
              }}
              style={{
                padding: '5px 12px',
                borderRadius: '4px',
                border: 'none',
                background: filterType === tab.id ? '#d4af37' : '#fff',
                color: '#000',
                fontWeight: filterType === tab.id ? 'bold' : 'normal',
                cursor: 'pointer',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <span style={{ marginLeft: 'auto', fontSize: '0.9rem' }}>
          {places.length} locations visible
        </span>
      </section>

      {/* Map & Inspector Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: '16px', height: '620px' }}>
        <div
          style={{
            position: 'relative',
            height: '100%',
            borderRadius: '8px',
            overflow: 'hidden',
            border: '1px solid #ccc',
          }}
        >
          <MapContainer
            center={[CAMPUS_CENTER.lat, CAMPUS_CENTER.lng]}
            zoom={13}
            scrollWheelZoom
            style={{ height: '100%', width: '100%' }}
          >
            <TileLayer
              attribution='Tiles &copy; Esri &mdash; Source: Esri, HERE, Garmin, OpenStreetMap contributors'
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}"
              maxZoom={19}
            />
            <MapController radiusMiles={radiusMiles} selectedSpot={selectedSpot} />

            <Circle
              center={[CAMPUS_CENTER.lat, CAMPUS_CENTER.lng]}
              radius={radiusMiles * METERS_PER_MILE}
              pathOptions={{ color: '#0b3d2e', fillColor: '#0b3d2e', fillOpacity: 0.05 }}
            />

            <Marker position={[CAMPUS_CENTER.lat, CAMPUS_CENTER.lng]}>
              <Popup>UNC Charlotte Main Campus (Student Union)</Popup>
            </Marker>

            {places.map((place) => (
              <Marker
                key={place.id}
                position={[place.lat, place.lng]}
                icon={makeIcon(place, selectedSpot?.id === place.id)}
                eventHandlers={{ click: () => setSelectedSpot(place) }}
              >
                <Popup>
                  <strong>{place.name}</strong>
                  <br />
                  <span>
                    {place.category === 'hub'
                      ? 'Dining Plaza / Hub'
                      : place.tier || 'Food & Dining'}
                  </span>
                  <br />
                  <small>{place.distanceMiles.toFixed(2)} mi from campus</small>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>

        {/* Spot Details Panel */}
        <aside
          style={{
            border: '1px solid #ddd',
            borderRadius: '8px',
            padding: '16px',
            background: '#fafafa',
            overflowY: 'auto',
          }}
        >
          <h2 style={{ marginTop: 0, fontSize: '1.25rem' }}>Spot Inspector</h2>

          {selectedSpot ? (
            <div style={{ marginBottom: '16px' }}>
              <h3 style={{ margin: '4px 0' }}>{selectedSpot.name}</h3>

              {selectedSpot.category === 'housing' && (
                <div style={{ margin: '6px 0 10px' }}>
                  <span
                    style={{
                      display: 'inline-block',
                      padding: '3px 8px',
                      borderRadius: '4px',
                      fontSize: '0.75rem',
                      fontWeight: 'bold',
                      color: '#fff',
                      background:
                        selectedSpot.tier === 'Gold Standard'
                          ? '#ca8a04'
                          : selectedSpot.tier === 'Green Standard'
                          ? '#15803d'
                          : '#2563eb',
                    }}
                  >
                    UNCC {selectedSpot.tier}
                  </span>
                  {selectedSpot.walkable && (
                    <span
                      style={{
                        display: 'inline-block',
                        marginLeft: '6px',
                        padding: '3px 8px',
                        borderRadius: '4px',
                        fontSize: '0.75rem',
                        fontWeight: 'bold',
                        color: '#0b3d2e',
                        background: '#e0ece4',
                      }}
                    >
                      Walkable to Class
                    </span>
                  )}
                </div>
              )}

              {selectedSpot.category === 'hub' && (
                <div style={{ margin: '6px 0 10px' }}>
                  <span
                    style={{
                      display: 'inline-block',
                      padding: '3px 8px',
                      borderRadius: '4px',
                      fontSize: '0.75rem',
                      fontWeight: 'bold',
                      color: '#fff',
                      background: '#7c3aed',
                    }}
                  >
                    Commercial Food Hub ({selectedSpot.tenants.length} Spots)
                  </span>
                </div>
              )}

              <p style={{ margin: '4px 0', fontSize: '0.9rem' }}>
                <strong>Distance:</strong> {selectedSpot.distanceMiles.toFixed(2)} mi from campus
              </p>
              <p style={{ margin: '4px 0', fontSize: '0.9rem' }}>
                <strong>Address:</strong> {selectedSpot.address}
              </p>

              {selectedSpot.summary && (
                <p style={{ margin: '8px 0', fontSize: '0.85rem', color: '#444' }}>
                  {selectedSpot.summary}
                </p>
              )}

              {selectedSpot.description && (
                <p style={{ margin: '8px 0', fontSize: '0.85rem', color: '#444' }}>
                  {selectedSpot.description}
                </p>
              )}

              {/* Renders multi-tenant list for food plazas */}
              {selectedSpot.category === 'hub' && selectedSpot.tenants && (
                <div style={{ marginTop: '12px' }}>
                  <h4 style={{ margin: '0 0 6px 0', fontSize: '0.95rem' }}>Eateries &amp; Shops Inside:</h4>
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                    {selectedSpot.tenants.map((tenant, idx) => (
                      <li
                        key={idx}
                        style={{
                          padding: '6px 8px',
                          marginBottom: '4px',
                          background: '#fff',
                          border: '1px solid #e5e5e5',
                          borderRadius: '4px',
                          fontSize: '0.85rem',
                        }}
                      >
                        <strong>{tenant.name}</strong>
                        <br />
                        <span style={{ color: '#666' }}>{tenant.cuisine}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {selectedSpot.category === 'food' && (
                <p style={{ margin: '4px 0', fontSize: '0.9rem' }}>
                  <strong>Cuisine:</strong> {selectedSpot.cuisine}
                </p>
              )}
            </div>
          ) : (
            <p style={{ color: '#666', fontSize: '0.9rem' }}>
              Click any tack pin on the map or pick from the list below.
            </p>
          )}

          <h4 style={{ borderTop: '1px solid #ddd', paddingTop: '12px', marginTop: '12px' }}>
            Locations in View ({places.length})
          </h4>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {places.map((place) => (
              <li key={place.id}>
                <button
                  type="button"
                  onClick={() => setSelectedSpot(place)}
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    padding: '8px 6px',
                    border: 'none',
                    borderBottom: '1px solid #eee',
                    background: selectedSpot?.id === place.id ? '#e8f1ec' : 'transparent',
                    cursor: 'pointer',
                    fontSize: '0.85rem',
                  }}
                >
                  <span>
                    {place.category === 'hub'
                      ? '🏬 '
                      : place.tier === 'Gold Standard'
                      ? '⭐ '
                      : place.tier === 'Green Standard'
                      ? '🌿 '
                      : place.category === 'food'
                      ? '🍔 '
                      : '🏠 '}
                    <strong>{place.name}</strong>
                  </span>
                  <span style={{ float: 'right', color: '#666' }}>
                    {place.distanceMiles.toFixed(2)} mi
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </aside>
      </div>
    </main>
  );
}