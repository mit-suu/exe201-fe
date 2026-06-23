# Google Analytics 4

BuildLab uses the official `gtag.js` integration for Google Analytics 4 with measurement ID `G-7HLSMMFSMM`.

## Setup overview

Analytics is implemented in `src/utils/analytics.js` and loaded by `src/components/AnalyticsTracker.jsx`.

- `initializeGA()` injects the official `gtag.js` script.
- `trackPageView(url)` sends GA4 `page_view` events.
- `trackEvent(eventName, params)` sends custom interaction events.
- Analytics runs only when `import.meta.env.PROD` is true and the app is not served from `localhost`, `127.0.0.1`, or `::1`.
- React Router navigation is tracked automatically from `AnalyticsTracker`.

The GA4 config disables the default page view by setting `send_page_view: false`, then sends route-aware page views from React Router. This prevents duplicate initial page views.

## Event naming conventions

Use lowercase `snake_case` event names. Keep names action-oriented and stable after release because GA4 reports depend on consistent naming.

Supported BuildLab events:

- `view_product`
- `search_product`
- `apply_filter`
- `click_rent`
- `submit_booking`
- `click_chat`
- `login`
- `signup`
- `submit_feedback`

Prefer parameter names in lowercase `snake_case`, such as `product_id`, `product_name`, `category`, `query`, `filter_name`, and `booking_id`.

## How to track events

Import `trackEvent` and optionally `ANALYTICS_EVENTS` from the analytics utility.

```js
import { ANALYTICS_EVENTS, trackEvent } from '../utils/analytics.js';

trackEvent(ANALYTICS_EVENTS.CLICK_RENT, {
  product_id: product.id,
  product_name: product.name,
});
```

More examples:

```js
trackEvent(ANALYTICS_EVENTS.VIEW_PRODUCT, {
  product_id: product.id,
  product_name: product.name,
});

trackEvent(ANALYTICS_EVENTS.SEARCH_PRODUCT, {
  query: searchTerm,
  results_count: products.length,
});

trackEvent(ANALYTICS_EVENTS.APPLY_FILTER, {
  filter_name: 'category',
  filter_value: selectedCategory,
});

trackEvent(ANALYTICS_EVENTS.SUBMIT_BOOKING, {
  booking_id: booking.id,
  product_id: product.id,
  value: booking.total,
  currency: 'VND',
});

trackEvent(ANALYTICS_EVENTS.CLICK_CHAT, {
  product_id: product.id,
});

trackEvent(ANALYTICS_EVENTS.LOGIN, {
  method: 'email',
});

trackEvent(ANALYTICS_EVENTS.SIGNUP, {
  method: 'email',
});

trackEvent(ANALYTICS_EVENTS.SUBMIT_FEEDBACK, {
  rating,
});
```

## How to add new events

1. Add the event name to `ANALYTICS_EVENTS` in `src/utils/analytics.js`.
2. Use `trackEvent(ANALYTICS_EVENTS.YOUR_EVENT, params)` in the relevant component or service.
3. Document the event name and expected parameters in this file.
4. Keep personally identifiable information out of event parameters.

## Verify tracking

Analytics is disabled in local development, so verify it from a production build or deployed production environment.

1. Build the frontend:

```bash
npm run build
```

2. Serve or deploy the production build from a non-localhost domain.
3. Open Google Analytics and go to **Reports > Realtime**.
4. Visit BuildLab pages and navigate between routes.
5. Confirm `page_view` events appear.
6. Trigger interactions that call `trackEvent`, then confirm the custom event names appear in Realtime.

For a deployed site, browser DevTools can also confirm requests to `https://www.google-analytics.com/g/collect`.
