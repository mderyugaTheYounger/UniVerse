import React, { useState, useEffect, useMemo, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

const CAMPUS_CENTER = { lat: 35.3071, lng: -80.7352 };
const METERS_PER_MILE = 1609.34;
const MIN_MILES = 1;
const MAX_MILES = 20;
const FETCH_TIMEOUT_MS = 10000;

// High-availability Overpass mirrors supporting GET queries
const OVERPASS_ENDPOINTS = [
  'https://overpass-api.de/api/interpreter?data=',
  'https://overpass.kumi.systems/api/interpreter?data=',
];

// UNCC Standard Housing lookup dictionary
const UNCC_HOUSING_STANDARDS = {
  // Gold Standard
  'university crossings': { tier: 'Gold Standard', status: 'Approved' },
  'university walk': { tier: 'Gold Standard', status: 'Approved' },
  'rush student living': { tier: 'Gold Standard', status: 'Approved' },
  'rush': { tier: 'Gold Standard', status: 'Approved' },
  'university village': { tier: 'Gold Standard', status: 'Approved' },
  'university townhomes at charlotte': { tier: 'Gold Standard', status: 'Approved' },
  'townhomes at 49 north': { tier: 'Gold Standard', status: 'Approved' },
  'the drake': { tier: 'Gold Standard', status: 'Approved' },
  'east village': { tier: 'Gold Standard', status: 'Approved' },
  'millennium one': { tier: 'Gold Standard', status: 'Approved' },
  'junction 49': { tier: 'Gold Standard', status: 'Approved' },
  'boulevard 98': { tier: 'Gold Standard', status: 'Approved' },
  'arcadia': { tier: 'Gold Standard', status: 'Approved' },
  'arcadia student living': { tier: 'Gold Standard', status: 'Approved' },
  'aspen heights': { tier: 'Gold Standard', status: 'Approved' },
  'aspen heights university city': { tier: 'Gold Standard', status: 'Approved' },

  // Green Standard
  'belle haven': { tier: 'Green Standard', status: 'Approved' },
  'belle haven apartments': { tier: 'Green Standard', status: 'Approved' },
  'walden station': { tier: 'Green Standard', status: 'Approved' },
  'yugo charlotte college downs': { tier: 'Green Standard', status: 'Approved' },
  'college downs': { tier: 'Green Standard', status: 'Approved' },
};

// Seed dataset to guarantee the map has real points even if OSM is congested
const SEED_CAMPUS_PLACES = [
  { id: 'seed-g1', name: 'University Crossings', category: 'housing', tier: 'Gold Standard', lat: 35.3117, lng: -80.7381, address: '9201 University City Blvd', distance: 0.4 },
  { id: 'seed-g2', name: 'University Walk', category: 'housing', tier: 'Gold Standard', lat: 35.3028, lng: -80.7342, address: '9005 University Walk Cir', distance: 0.3 },
  { id: 'seed-g3', name: 'Rush Student Living', category: 'housing', tier: 'Gold Standard', lat: 35.3015, lng: -80.7360, address: '9200 University Walk Cir', distance: 0.4 },
  { id: 'seed-g4', name: 'University Village', category: 'housing', tier: 'Gold Standard', lat: 35.3168, lng: -80.7289, address: '9915 University Terrace Dr', distance: 0.8 },
  { id: 'seed-g5', name: 'The Drake', category: 'housing', tier: 'Gold Standard', lat: 35.3061, lng: -80.7225, address: '404 John Kirk Dr', distance: 0.7 },
  { id: 'seed-g6', name: 'Millennium One', category: 'housing', tier: 'Gold Standard', lat: 35.3180, lng: -80.7250, address: '10005 University City Blvd', distance: 0.9 },
  { id: 'seed-g7', name: 'Boulevard 98', category: 'housing', tier: 'Gold Standard', lat: 35.3005, lng: -80.7495, address: '9815 N Tryon St', distance: 1.1 },
  { id: 'seed-g8', name: 'Arcadia Student Living', category: 'housing', tier: 'Gold Standard', lat: 35.3262, lng: -80.7108, address: '2120 Arcadia Village Dr', distance: 2.0 },
  { id: 'seed-g9', name: 'Aspen Heights University City', category: 'housing', tier: 'Gold Standard', lat: 35.3288, lng: -80.7072, address: '11025 Aspen Heights Dr', distance: 2.3 },
  { id: 'seed-gr1', name: 'Belle Haven Apartments', category: 'housing', tier: 'Green Standard', lat: 35.3201, lng: -80.7512, address: '8920 Sandburg Ave', distance: 1.3 },
  { id: 'seed-gr2', name: 'Walden Station', category: 'housing', tier: 'Green Standard', lat: 35.3045, lng: -80.7302, address: '320 E Mallard Creek Church Rd', distance: 0.3 },
  { id: 'seed-gr3', name: 'Yugo Charlotte College Downs', category: 'housing', tier: 'Green Standard', lat: 35.3022, lng: -80.7265, address: '1205 College Downs Dr', distance: 0.6 },
  { id: 'seed-f1', name: 'Boardwalk Billy’s', category: 'food', tier: null, cuisine: 'BBQ & Seafood', lat: 35.3106, lng: -80.7497, address: '9005 JM Keynes Dr', distance: 0.9 },
  { id: 'seed-f2', name: 'Passage to India', category: 'food', tier: null, cuisine: 'Indian', lat: 35.3142, lng: -80.7431, address: '9510 University Terrace Dr', distance: 0.6 },
  { id: 'seed-f3', name: 'Cook Out', category: 'food', tier: null, cuisine: 'Burgers & Shakes', lat: 35.2954, lng: -80.7588, address: '9601 N Tryon St', distance: 1.5 },
  { id: 'seed-f4', name: 'Cava', category: 'food', tier: null, cuisine: 'Mediterranean', lat: 35.3101, lng: -80.7479, address: '8936 JM Keynes Dr', distance: 0.8 },
  { id: 'seed-f5', name: 'Optimist Hall', category: 'food', tier: null, cuisine: 'Food Hall', lat: 35.2341, lng: -80.8285, address: '1115 N Brevard St', distance: 7.4 },
];

function getStandardStatus(name) {
  if (!name) return { tier: 'General Housing', status: null };
  const cleaned = name.toLowerCase().trim();
  for (const [key, val] of Object.entries(UNCC_HOUSING_STANDARDS)) {
    if (cleaned.includes(key)) {
      return val;
    }
  }
  return { tier: 'General Housing', status: null };
}

function makeIcon(category, tier, selected) {
  let color = '#2563eb';
  let emoji = '🏠';

  if (category === 'food') {
    color = '#d97706';
    emoji = '🍔';
  } else if (tier === 'Gold Standard') {
    color = '#ca8a04';
    emoji = '⭐';
  } else if (tier === 'Green Standard') {
    color = '#15803d';
    emoji = '🌿';
  }

  const size = selected ? 38 : 30;
  return L.divIcon({
    className: '',
    html: `<div style="
      width:${size}px;height:${size}px;border-radius:50%;
      background:${color};border:2px solid ${selected ? '#000' : '#fff'};
      box-shadow:0 2px 6px rgba(0,0,0,.4);
      display:flex;align-items:center;justify-content:center;
      font-size:${selected ? 18 : 14}px;">${emoji}</div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2],
  });
}

function haversineMiles(lat1, lng1, lat2, lng2) {
  const R = 3958.8;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

// Bounded query for high-speed response
function buildQuery(radiusMeters) {
  const around = `(around:${radiusMeters},${CAMPUS_CENTER.lat},${CAMPUS_CENTER.lng})`;
  return `[out:json][timeout:10];(node["amenity"~"restaurant|fast_food|cafe"]["name"]${around};node["building"~"apartments|dormitory"]["name"]${around};);out 150;`;
}

async function queryOverpass(query, outerSignal) {
  const controllers = OVERPASS_ENDPOINTS.map(() => new AbortController());
  const cancelAll = () => controllers.forEach((c) => c.abort());
  outerSignal.addEventListener('abort', cancelAll);
  const timeoutId = setTimeout(cancelAll, FETCH_TIMEOUT_MS);

  const attempts = OVERPASS_ENDPOINTS.map(async (baseUrl, i) => {
    try {
      const res = await fetch(`${baseUrl}${encodeURIComponent(query)}`, {
        method: 'GET',
        signal: controllers[i].signal,
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (!data.elements || data.elements.length === 0) throw new Error('No data');
      return data;
    } catch (err) {
      if (err.name === 'AbortError') throw new Error('Timeout');
      throw err;
    }
  });

  try {
    return await Promise.any(attempts);
  } finally {
    clearTimeout(timeoutId);
    cancelAll();
    outerSignal.removeEventListener('abort', cancelAll);
  }
}

function parseElements(elements) {
  const seen = new Set();
  const out = [];

  for (const el of elements) {
    const tags = el.tags || {};
    if (!tags.name) continue;

    const lat = el.lat ?? el.center?.lat;
    const lng = el.lon ?? el.center?.lon;
    if (lat == null || lng == null) continue;

    const isFood = ['restaurant', 'fast_food', 'cafe'].includes(tags.amenity);
    const category = isFood ? 'food' : 'housing';
    const standardInfo = isFood ? null : getStandardStatus(tags.name);

    const dedupeKey = `${category}-${tags.name.toLowerCase().trim()}`;
    if (seen.has(dedupeKey)) continue;
    seen.add(dedupeKey);

    out.push({
      id: `${el.type}-${el.id}`,
      name: tags.name,
      category,
      tier: standardInfo ? standardInfo.tier : null,
      status: standardInfo ? standardInfo.status : null,
      lat,
      lng,
      address: tags['addr:street']
        ? `${tags['addr:housenumber'] || ''} ${tags['addr:street']}`.trim()
        : 'Charlotte Area',
      cuisine: tags.cuisine ? tags.cuisine.replace(/;/g, ', ') : null,
      distance: haversineMiles(CAMPUS_CENTER.lat, CAMPUS_CENTER.lng, lat, lng),
    });
  }

  return out.sort((a, b) => a.distance - b.distance);
}

function MapController({ radiusMiles, selectedSpot }) {
  const map = useMap();

  useEffect(() => {
    const bounds = L.latLng(CAMPUS_CENTER.lat, CAMPUS_CENTER.lng).toBounds(
      radiusMiles * METERS_PER_MILE * 2
    );
    map.fitBounds(bounds, { animate: true, padding: [20, 20] });
  }, [radiusMiles, map]);

  useEffect(() => {
    if (selectedSpot) {
      map.flyTo([selectedSpot.lat, selectedSpot.lng], Math.max(map.getZoom(), 15), { duration: 0.6 });
    }
  }, [selectedSpot, map]);

  return null;
}

export default function HousingMap({ onNavigateBack }) {
  const [sliderMiles, setSliderMiles] = useState(5);
  const [radiusMiles, setRadiusMiles] = useState(5);
  const [filterType, setFilterType] = useState('all');
  const [allPlaces, setAllPlaces] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedSpot, setSelectedSpot] = useState(null);
  const cacheRef = useRef(new Map());

  // Debounce slider updates
  useEffect(() => {
    const timer = setTimeout(() => setRadiusMiles(sliderMiles), 500);
    return () => clearTimeout(timer);
  }, [sliderMiles]);

  // Fetch dynamically on radius changes
  useEffect(() => {
    if (cacheRef.current.has(radiusMiles)) {
      setAllPlaces(cacheRef.current.get(radiusMiles));
      return;
    }

    const controller = new AbortController();

    (async () => {
      setLoading(true);
      try {
        const query = buildQuery(Math.round(radiusMiles * METERS_PER_MILE));
        const data = await queryOverpass(query, controller.signal);
        let parsed = parseElements(data.elements || []);

        if (parsed.length === 0) {
          throw new Error('Zero live results');
        }

        cacheRef.current.set(radiusMiles, parsed);
        setAllPlaces(parsed);
      } catch (err) {
        if (err.name !== 'AbortError') {
          // Merge dynamic fallback with radius bounds
          const fallback = SEED_CAMPUS_PLACES.filter((p) => p.distance <= radiusMiles);
          setAllPlaces(fallback);
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    })();

    return () => controller.abort();
  }, [radiusMiles]);

  // Client-side filtering
  const filteredPlaces = useMemo(() => {
    return allPlaces.filter((p) => {
      if (filterType === 'all') return true;
      if (filterType === 'food') return p.category === 'food';
      if (filterType === 'housing') return p.category === 'housing';
      if (filterType === 'gold') return p.tier === 'Gold Standard';
      if (filterType === 'green') return p.tier === 'Green Standard';
      return true;
    });
  }, [allPlaces, filterType]);

  const counts = useMemo(
    () => ({
      gold: allPlaces.filter((p) => p.tier === 'Gold Standard').length,
      green: allPlaces.filter((p) => p.tier === 'Green Standard').length,
      generalHousing: allPlaces.filter((p) => p.category === 'housing' && p.tier === 'General Housing').length,
      food: allPlaces.filter((p) => p.category === 'food').length,
    }),
    [allPlaces]
  );

  return (
    <main style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <header style={{ marginBottom: '16px' }}>
        <button type="button" onClick={onNavigateBack} style={{ marginBottom: '8px', cursor: 'pointer' }}>
          &larr; Back to Home
        </button>
        <h1>UniVerse Dynamic Campus, Housing &amp; Food Explorer</h1>
        <p>Live map tack view within {radiusMiles} miles of UNC Charlotte with Gold &amp; Green Standard tagging.</p>
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
          Radius: <strong>{sliderMiles} miles</strong>
        </label>
        <input
          id="radius"
          type="range"
          min={MIN_MILES}
          max={MAX_MILES}
          value={sliderMiles}
          onChange={(e) => setSliderMiles(Number(e.target.value))}
          style={{ cursor: 'pointer' }}
        />

        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {[
            { id: 'all', label: 'All' },
            { id: 'gold', label: `Gold Standard (${counts.gold})` },
            { id: 'green', label: `Green Standard (${counts.green})` },
            { id: 'housing', label: `All Housing (${counts.gold + counts.green + counts.generalHousing})` },
            { id: 'food', label: `Food (${counts.food})` },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilterType(tab.id)}
              style={{
                padding: '4px 10px',
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

        <span style={{ marginLeft: 'auto', fontSize: '0.85rem' }}>
          {loading ? 'Fetching dynamic places...' : `${filteredPlaces.length} locations visible`}
        </span>
      </section>

      {/* Map + Sidebar Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '16px', height: '620px' }}>
        <div style={{ position: 'relative', height: '100%', borderRadius: '8px', overflow: 'hidden', border: '1px solid #ccc' }}>
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
              <Popup>UNC Charlotte Main Campus</Popup>
            </Marker>

            {filteredPlaces.map((spot) => (
              <Marker
                key={spot.id}
                position={[spot.lat, spot.lng]}
                icon={makeIcon(spot.category, spot.tier, selectedSpot?.id === spot.id)}
                eventHandlers={{ click: () => setSelectedSpot(spot) }}
              >
                <Popup>
                  <strong>{spot.name}</strong>
                  <br />
                  <span>{spot.tier || (spot.category === 'food' ? 'Dining' : 'Housing')}</span>
                  <br />
                  <small>{spot.distance.toFixed(1)} mi from campus</small>
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
          <h2 style={{ marginTop: 0 }}>Spot Inspector</h2>
          {selectedSpot ? (
            <div style={{ marginBottom: '16px' }}>
              <h3>{selectedSpot.name}</h3>

              {selectedSpot.tier && selectedSpot.tier !== 'General Housing' && (
                <span
                  style={{
                    display: 'inline-block',
                    padding: '3px 8px',
                    borderRadius: '4px',
                    fontSize: '0.8rem',
                    fontWeight: 'bold',
                    color: '#fff',
                    background: selectedSpot.tier === 'Gold Standard' ? '#ca8a04' : '#15803d',
                    marginBottom: '8px',
                  }}
                >
                  UNCC {selectedSpot.tier}
                </span>
              )}

              <p><strong>Distance:</strong> {selectedSpot.distance.toFixed(1)} miles from campus</p>
              <p><strong>Address:</strong> {selectedSpot.address}</p>
              {selectedSpot.cuisine && <p><strong>Cuisine:</strong> {selectedSpot.cuisine}</p>}
            </div>
          ) : (
            <p style={{ color: '#666' }}>Click any tack on the map or select from the list below.</p>
          )}

          <h4 style={{ borderTop: '1px solid #ddd', paddingTop: '12px' }}>Places in Radius ({filteredPlaces.length})</h4>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {filteredPlaces.slice(0, 50).map((spot) => (
              <li key={spot.id}>
                <button
                  type="button"
                  onClick={() => setSelectedSpot(spot)}
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    padding: '6px 4px',
                    border: 'none',
                    borderBottom: '1px solid #eee',
                    background: selectedSpot?.id === spot.id ? '#e8f1ec' : 'transparent',
                    cursor: 'pointer',
                  }}
                >
                  <span>
                    {spot.tier === 'Gold Standard' ? '⭐ ' : spot.tier === 'Green Standard' ? '🌿 ' : spot.category === 'food' ? '🍔 ' : '🏠 '}
                    {spot.name}
                  </span>
                  <span style={{ float: 'right', color: '#666' }}>{spot.distance.toFixed(1)} mi</span>
                </button>
              </li>
            ))}
          </ul>
        </aside>
      </div>
    </main>
  );
}