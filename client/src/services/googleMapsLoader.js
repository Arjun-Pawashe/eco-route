let googleMapsPromise = null;

export function loadGoogleMapsScript(apiKey) {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('Window is unavailable'));
  }

  if (window.google?.maps) {
    return Promise.resolve(window.google.maps);
  }

  if (!apiKey) {
    return Promise.reject(
      new Error('VITE_GOOGLE_MAPS_API_KEY is not configured in client/.env')
    );
  }

  if (googleMapsPromise) {
    return googleMapsPromise;
  }

  googleMapsPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector('script[data-google-maps-loader]');
    if (existing) {
      existing.addEventListener('load', () => resolve(window.google.maps));
      existing.addEventListener('error', () =>
        reject(new Error('Failed to load Google Maps JavaScript API'))
      );
      return;
    }

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(
      apiKey
    )}&libraries=places,geometry&v=weekly`;
    script.async = true;
    script.defer = true;
    script.dataset.googleMapsLoader = 'true';

    script.onload = () => {
      if (window.google?.maps) {
        resolve(window.google.maps);
      } else {
        reject(new Error('Google Maps initialized without window.google.maps'));
      }
    };

    script.onerror = () => {
      googleMapsPromise = null;
      reject(
        new Error(
          'Failed to load Google Maps JavaScript API. Check VITE_GOOGLE_MAPS_API_KEY and billing.'
        )
      );
    };

    document.head.appendChild(script);
  });

  return googleMapsPromise;
}
