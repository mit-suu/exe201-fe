import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { initializeGA, trackPageView } from '../utils/analytics.js';

function AnalyticsTracker() {
  const location = useLocation();

  useEffect(() => {
    initializeGA();
  }, []);

  useEffect(() => {
    trackPageView(`${location.pathname}${location.search}`);
  }, [location.pathname, location.search]);

  return null;
}

export default AnalyticsTracker;
