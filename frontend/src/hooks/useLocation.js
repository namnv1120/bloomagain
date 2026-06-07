import { useState, useEffect } from 'react';

// Programmatic navigation function that changes browser URL and triggers location changes
export const navigate = (to) => {
  window.history.pushState(null, '', to);
  window.dispatchEvent(new Event('pushstate'));
  window.dispatchEvent(new Event('locationchange'));
};

export function useLocation() {
  const [location, setLocation] = useState(window.location.pathname);

  useEffect(() => {
    const handleLocationChange = () => {
      setLocation(window.location.pathname);
    };

    window.addEventListener('popstate', handleLocationChange);
    window.addEventListener('pushstate', handleLocationChange);
    window.addEventListener('locationchange', handleLocationChange);

    return () => {
      window.removeEventListener('popstate', handleLocationChange);
      window.removeEventListener('pushstate', handleLocationChange);
      window.removeEventListener('locationchange', handleLocationChange);
    };
  }, []);

  return [location, navigate];
}
