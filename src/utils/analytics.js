export const GA_MEASUREMENT_ID = 'G-7HLSMMFSMM';

export const ANALYTICS_EVENTS = {
  VIEW_PRODUCT: 'view_product',
  SEARCH_PRODUCT: 'search_product',
  APPLY_FILTER: 'apply_filter',
  CLICK_RENT: 'click_rent',
  SUBMIT_BOOKING: 'submit_booking',
  CLICK_CHAT: 'click_chat',
  LOGIN: 'login',
  SIGNUP: 'signup',
  SUBMIT_FEEDBACK: 'submit_feedback',
};

const isBrowser = typeof window !== 'undefined';
const isLocalhost = () =>
  isBrowser &&
  ['localhost', '127.0.0.1', '::1'].includes(window.location.hostname);

export const isAnalyticsEnabled = () => import.meta.env.PROD && !isLocalhost();

export function initializeGA() {
  if (!isAnalyticsEnabled() || !isBrowser || window.gtag) {
    return;
  }

  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag() {
    window.dataLayer.push(arguments);
  };

  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
  document.head.appendChild(script);

  window.gtag('js', new Date());
  window.gtag('config', GA_MEASUREMENT_ID, {
    send_page_view: false,
  });
}

export function trackPageView(url) {
  if (!isAnalyticsEnabled() || !isBrowser || !window.gtag) {
    return;
  }

  window.gtag('event', 'page_view', {
    page_path: url,
    page_location: window.location.href,
    page_title: document.title,
  });
}

export function trackEvent(eventName, params = {}) {
  if (!isAnalyticsEnabled() || !isBrowser || !window.gtag) {
    return;
  }

  window.gtag('event', eventName, params);
}
