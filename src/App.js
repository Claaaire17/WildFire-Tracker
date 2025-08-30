// src/App.js
import { useEffect, useState } from 'react';
import Map from './components/Map';
import Loader from './components/Loader'; // or replace with <div>Loading...</div>

const NASA_KEY = process.env.REACT_APP_NASA_API_KEY;

const EONET_URL = `https://eonet.gsfc.nasa.gov/api/v3/events?status=open&category=wildfires&api_key=${NASA_KEY}`;

// ArcGIS Living Atlas: USA Wildfires (GeoJSON) — valid GeoJSON response
const ARCGIS_URL =
  'https://services3.arcgis.com/T4QMspbfLg3qTGWY/arcgis/rest/services/USA_Wildfires_v1/FeatureServer/0/query?where=1%3D1&outFields=IncidentName&f=geojson';

// Last-resort local demo list so the map is never empty
const DEMO_EVENTS = [
  [-124.2, 43.4], [-123.1, 44.1], [-122.6, 45.2], [-121.9, 44.9], [-121.5, 43.8],
  [-121.5, 38.6], [-120.9, 39.2], [-120.3, 38.9], [-119.8, 38.5],
  [-115.8, 46.5], [-114.6, 45.7], [-114.2, 47.1], [-113.7, 46.2],
  [-110.9, 43.6], [-111.9, 40.7], [-106.8, 39.7],
  [-106.6, 35.1], [-111.8, 34.3],
  [-123.9, 48.1], [-123.2, 47.5],
].map((c, i) => ({
  id: `demo-${i}`,
  title: 'Demo Wildfire',
  categories: [{ id: 'wildfires' }],
  geometry: [{ coordinates: c }], // [lng, lat]
}));

function fetchWithTimeout(url, ms = 8000) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  return fetch(url, { signal: ctrl.signal }).finally(() => clearTimeout(t));
}

export default function App() {
  const [eventData, setEventData] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // ------------------------------
    // 🚧 DEMO (ONE MARKER) — quick sanity check.
    // Uncomment to force exactly one marker, then re-comment to use live data.
    //
    // setEventData([
    //   {
    //     id: 'demo-single',
    //     title: 'Demo Fire (OR)',
    //     categories: [{ id: 'wildfires' }],
    //     geometry: [{ coordinates: [-122.8756, 42.3265] }], // [lng, lat]
    //   },
    // ]);
    // return;
    // ------------------------------

    const load = async () => {
      setLoading(true);

      // 1) NASA EONET (v3) with API key
      try {
        const res = await fetchWithTimeout(EONET_URL, 8000);
        if (!res.ok) throw new Error(`EONET HTTP ${res.status}`);
        const data = await res.json();
        if (Array.isArray(data?.events) && data.events.length > 0) {
          console.log('EONET events:', data.events.length);
          setEventData(data.events); // v3 shape: [{ id, categories:[{id:'wildfires'}], geometry:[{coordinates:[lng,lat]}] }]
          setLoading(false);
          return;
        }
        throw new Error('EONET returned no events');
      } catch (err) {
        console.warn('EONET failed/timed out. Falling back to ArcGIS…', err);
      }

      // 2) ArcGIS fallback (normalize to EONET-like shape)
      try {
        const res2 = await fetchWithTimeout(ARCGIS_URL, 8000);
        if (!res2.ok) throw new Error(`ArcGIS HTTP ${res2.status}`);
        const gj = await res2.json(); // FeatureCollection
        const eventsLike = (gj.features || [])
          .filter(f => f?.geometry?.type === 'Point' && Array.isArray(f.geometry.coordinates))
          .map((f, i) => {
            const [lng, lat] = f.geometry.coordinates; // [lng, lat]
            return {
              id: `arcgis-${f.id ?? i}`,
              title: f.properties?.IncidentName || 'Wildfire',
              categories: [{ id: 'wildfires' }],
              geometry: [{ coordinates: [lng, lat] }],
            };
          });

        if (eventsLike.length > 0) {
          console.log('ArcGIS events (fallback):', eventsLike.length);
          setEventData(eventsLike);
          setLoading(false);
          return;
        }
        throw new Error('ArcGIS returned no point features');
      } catch (e2) {
        console.error('ArcGIS fallback failed:', e2);
      }

      // 3) Last resort: built-in demo list
      console.warn('Using built-in demo events (offline fallback).');
      setEventData(DEMO_EVENTS);
      setLoading(false);
    };

    load();
  }, []);

  if (loading) {
    return <Loader />; // or: return <div style={{ padding: 16 }}>Loading…</div>;
  }

  return <Map eventData={eventData} />;
}
