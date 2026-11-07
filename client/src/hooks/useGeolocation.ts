import { useState, useCallback } from 'react';

export interface GeoLocation {
  lat: number;
  lng: number;
  accuracy: number;
  displayName?: string;
}

export function useGeolocation() {
  const [location, setLocation] = useState<GeoLocation | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getLocation = useCallback(async () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      return null;
    }

    setLoading(true);
    setError(null);

    return new Promise<GeoLocation | null>((resolve) => {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude, accuracy } = position.coords;
          const geo: GeoLocation = { lat: latitude, lng: longitude, accuracy };

          // Reverse geocode using free Nominatim API
          try {
            const res = await fetch(
              `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&accept-language=hi`,
              { headers: { 'Accept-Language': 'hi,en' } }
            );
            const data = await res.json();
            const addr = data.address ?? {};

            // Build a readable location name in Indian context
            const parts = [
              addr.road ?? addr.pedestrian ?? addr.footway,
              addr.suburb ?? addr.neighbourhood ?? addr.village,
              addr.city ?? addr.town ?? addr.county,
              addr.state_district ?? addr.state,
            ].filter(Boolean);

            geo.displayName = parts.slice(0, 3).join(', ') || data.display_name?.split(',').slice(0, 3).join(',') || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
          } catch {
            geo.displayName = `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
          }

          setLocation(geo);
          setLoading(false);
          resolve(geo);
        },
        (err) => {
          const msg =
            err.code === 1 ? 'Location access denied — please allow location permission'
            : err.code === 2 ? 'Location unavailable'
            : 'Location request timed out';
          setError(msg);
          setLoading(false);
          resolve(null);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    });
  }, []);

  return { location, loading, error, getLocation };
}
