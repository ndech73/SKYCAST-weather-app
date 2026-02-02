import { useState, useEffect } from 'react';

/**
 * Custom hook to get user's geolocation and city name
 * @returns {Object} { city, coordinates, error, loading }
 */
export const useGeolocation = () => {
  const [city, setCity] = useState(null);
  const [coordinates, setCoordinates] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if geolocation is supported
    if (! navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      setLoading(false);
      return;
    }

    // Get user's position
    navigator.geolocation. getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position. coords;
        setCoordinates({ latitude, longitude });

        // Reverse geocode to get city name
        try {
          const response = await fetch(
            `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
          );
          const data = await response.json();
          
          const cityName = data.city || data.locality || data.principalSubdivision || 'Unknown';
          setCity(cityName);
        } catch (err) {
          console.error('Error fetching city name:', err);
          setError('Could not determine city name');
        } finally {
          setLoading(false);
        }
      },
      (err) => {
        console.error('Geolocation error:', err);
        setError(err.message);
        setLoading(false);
        
        // Fallback to default city
        setCity('Nairobi');
      },
      {
        enableHighAccuracy: false,
        timeout: 5000,
        maximumAge:  300000 // Cache for 5 minutes
      }
    );
  }, []);

  return { city, coordinates, error, loading };
};

export default useGeolocation;