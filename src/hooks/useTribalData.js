import { useState, useEffect } from 'react';

const TRIBAL_DATA_URL = '/data/tribes-pnw.min.geojson';

export default function useTribalData() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const controller = new AbortController();

    async function fetchData() {
      try {
        setLoading(true);
        const response = await fetch(TRIBAL_DATA_URL, {
          signal: controller.signal
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch tribal data: ${response.status}`);
        }

        const geojson = await response.json();
        setData(geojson);
        setError(null);
      } catch (err) {
        if (err.name !== 'AbortError') {
          setError(err.message);
          console.error('Error fetching tribal data:', err);
        }
      } finally {
        setLoading(false);
      }
    }

    fetchData();

    return () => controller.abort();
  }, []);

  return { data, loading, error };
}
