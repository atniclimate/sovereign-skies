import { useState, useEffect } from 'react';

const TRIBAL_DATA_URL = '/data/tribes-pnw.min.geojson';

// BC OpenMaps WFS endpoint for Indian Reserves (First Nations lands)
// Request in WGS84 (EPSG:4326) for Leaflet compatibility
const BC_FIRST_NATIONS_WFS = 'https://openmaps.gov.bc.ca/geo/pub/ows?service=WFS&version=2.0.0&request=GetFeature&typeName=pub:WHSE_ADMIN_BOUNDARIES.CLAB_INDIAN_RESERVES&outputFormat=application/json&srsName=EPSG:4326';

// Convert reserve name to band name
// e.g., "NESKONLITH INDIAN RESERVE NO. 2" → "Neskonlith Indian Band"
function formatBandName(reserveName) {
  if (!reserveName) return 'Unknown';

  // Remove common suffixes like "INDIAN RESERVE NO. 2", "NO 2", "IR 2", etc.
  let name = reserveName
    .replace(/\s*(INDIAN\s+)?RESERVE\s*(NO\.?\s*\d+[A-Z]?)?$/i, '')
    .replace(/\s*NO\.?\s*\d+[A-Z]?$/i, '')
    .replace(/\s*I\.?R\.?\s*\d+[A-Z]?$/i, '')
    .replace(/\s*\d+[A-Z]?$/i, '')
    .trim();

  // Convert to title case
  name = name.toLowerCase().replace(/\b\w/g, c => c.toUpperCase());

  // Fix common patterns
  name = name
    .replace(/\bIr\b/gi, 'IR')
    .replace(/\bNo\b/gi, 'No.');

  return name;
}

// Transform BC WFS response to match our data structure
function transformBCFirstNations(geojson) {
  if (!geojson || !geojson.features) return null;

  return {
    type: 'FeatureCollection',
    features: geojson.features.map(f => {
      const rawName = f.properties.ENGLISH_NAME || 'Unknown';
      const bandName = formatBandName(rawName);

      return {
        type: 'Feature',
        properties: {
          NAME: bandName,
          name: bandName,
          NAMELSAD: `${bandName} First Nation`,
          RESERVE_NAME: rawName,
          TYPE: 'First Nation',
          PROVINCE: 'BC',
          CLAB_ID: f.properties.CLAB_ID,
          isCanadian: true
        },
        geometry: f.geometry
      };
    }).filter(f => f.geometry)
  };
}

export default function useTribalData(includeCanada = true) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const controller = new AbortController();

    async function fetchData() {
      try {
        setLoading(true);

        // Fetch US Tribal data
        const usResponse = await fetch(TRIBAL_DATA_URL, {
          signal: controller.signal
        });

        if (!usResponse.ok) {
          throw new Error(`Failed to fetch Tribal data: ${usResponse.status}`);
        }

        const usGeojson = await usResponse.json();

        // Mark US features
        usGeojson.features = usGeojson.features.map(f => ({
          ...f,
          properties: { ...f.properties, isCanadian: false }
        }));

        // Fetch BC First Nations data if enabled
        if (includeCanada) {
          try {
            const fnResponse = await fetch(BC_FIRST_NATIONS_WFS, {
              signal: controller.signal
            });

            if (fnResponse.ok) {
              const fnData = await fnResponse.json();
              const fnGeojson = transformBCFirstNations(fnData);

              if (fnGeojson && fnGeojson.features.length > 0) {
                console.log(`Loaded ${fnGeojson.features.length} BC First Nations reserves`);
                // Merge US and Canadian data
                usGeojson.features = [
                  ...usGeojson.features,
                  ...fnGeojson.features
                ];
              }
            }
          } catch (fnErr) {
            console.warn('Could not fetch BC First Nations data:', fnErr.message);
            // Continue with US data only
          }
        }

        setData(usGeojson);
        setError(null);
      } catch (err) {
        if (err.name !== 'AbortError') {
          setError(err.message);
          console.error('Error fetching Tribal data:', err);
        }
      } finally {
        setLoading(false);
      }
    }

    fetchData();

    return () => controller.abort();
  }, [includeCanada]);

  return { data, loading, error };
}
