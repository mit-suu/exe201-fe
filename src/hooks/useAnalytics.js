import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import api from '../services/api.js';

const queue = [];
let isProcessing = false;

const processQueue = async () => {
  if (isProcessing || queue.length === 0) return;
  isProcessing = true;
  
  const events = [...queue];
  queue.length = 0;
  
  for (const event of events) {
    try {
      await api.post('/platform/logs', event);
    } catch (e) {
      console.error('Failed to log event', e);
    }
  }
  
  isProcessing = false;
  if (queue.length > 0) processQueue();
};

export const trackEvent = (action, description, metadata = {}) => {
  queue.push({ action, description, metadata });
  processQueue();
};

export const usePageTracking = () => {
  const location = useLocation();

  useEffect(() => {
    trackEvent('PAGE_VIEW', `Truy cập trang: ${location.pathname}`, { path: location.pathname, search: location.search });
  }, [location.pathname, location.search]);
};
