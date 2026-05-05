/* ===========================================================
   crew. — Telemetry (Sentry + PostHog) — Sprint S-1
   ===========================================================
   Migriert aus app.html (Sprint 26 + 35).

   - Sentry: aktiv mit DSN, PII-Filter (lat/lng/phone/email/etc.
     werden auf [REDACTED] gesetzt), tracesSampleRate 0.1
   - PostHog: nur aktiv wenn POSTHOG_KEY gesetzt ist (kein Default)
   - Beides: läd nicht in localhost / ?debug=1 (gleiche Logik wie
     QW-3 Console-Silencer)
   - DSGVO: EU-Server (Sentry ingest.de, PostHog eu.i.posthog.com),
     PII-Scrub vor Send

   API:
     window.crewTelemetry.captureError(err, ctx?)
     window.crewTelemetry.captureEvent(name, props?)
     window.crewTelemetry.identify(userId)
     window.crewTelemetry.isActive()

   Lädt nach: keine Abhängigkeiten
   =========================================================== */
(function(){
  'use strict';

  /* Config — DSN + Keys.
     Sentry-DSN steht hier hardcoded (ist eh public, keine Secrets).
     PostHog-Key bleibt 'phc_PLACEHOLDER' — Jan setzt ihn später wenn
     ein PostHog-Account aktiv ist. */
  const SENTRY_DSN = 'https://0e1d29bcc7f230bbae46a0f8084a0860@o4511327202181120.ingest.de.sentry.io/4511327219351632';
  const POSTHOG_KEY = 'phc_PLACEHOLDER';
  const POSTHOG_HOST = 'https://eu.i.posthog.com';

  /* PII-Blacklist: diese Keys werden auf [REDACTED] gesetzt vor Send */
  const PII_BLACKLIST = [
    'lat', 'lng', 'latitude', 'longitude',
    'phone', 'email', 'tel', 'mobile',
    'endpoint', 'p256dh_key', 'auth_key',
    'code', 'password', 'token', 'session',
    'photo_url', 'avatar_url', 'home_address'
  ];

  /* Skip in development + debug mode (gleiche Logik wie Console-Silencer) */
  const isDev = location.hostname === 'localhost'
             || location.hostname === '127.0.0.1'
             || location.search.includes('debug=1');

  let sentryReady = false;
  let posthogReady = false;
  let pendingErrors = [];

  /* ---------- PII-Scrubber ---------- */
  function scrubObject(obj, depth) {
    if (!obj || typeof obj !== 'object' || depth > 5) return obj;
    for (const k in obj) {
      if (PII_BLACKLIST.indexOf(k.toLowerCase()) >= 0) {
        obj[k] = '[REDACTED]';
      } else if (typeof obj[k] === 'object') {
        scrubObject(obj[k], (depth || 0) + 1);
      }
    }
    return obj;
  }

  /* ---------- Sentry ---------- */
  function loadSentry() {
    if (isDev) return;
    if (window.Sentry || sentryReady) return;
    if (!SENTRY_DSN) return;

    const s = document.createElement('script');
    s.src = 'https://browser.sentry-cdn.com/8.31.0/bundle.min.js';
    s.crossOrigin = 'anonymous';
    s.async = true;
    s.onload = function() {
      try {
        window.Sentry.init({
          dsn: SENTRY_DSN,
          tracesSampleRate: 0.1,
          replaysSessionSampleRate: 0,
          replaysOnErrorSampleRate: 1.0,
          environment: location.hostname.indexOf('partycrew.app') >= 0 ? 'production' : 'staging',
          release: 'crew-clean-v2',
          beforeSend: function(event) {
            try {
              scrubObject(event.contexts);
              scrubObject(event.extra);
              scrubObject(event.breadcrumbs);
              scrubObject(event.request);
              scrubObject(event.user);
            } catch(_) {}
            return event;
          }
        });
        sentryReady = true;
        /* Pending errors flushen */
        pendingErrors.forEach(function(p) {
          try { window.Sentry.captureException(p.err, { extra: p.ctx || {} }); } catch(_){}
        });
        pendingErrors = [];
      } catch(e) {
        /* silent fail */
      }
    };
    s.onerror = function() { /* CDN-Block, silent fail */ };
    document.head.appendChild(s);
  }

  /* ---------- PostHog ---------- */
  function loadPostHog() {
    if (isDev) return;
    if (POSTHOG_KEY === 'phc_PLACEHOLDER') return;  /* nicht konfiguriert */
    if (window.posthog || posthogReady) return;

    /* Standard PostHog snippet (compressed) */
    !function(t,e){var o,n,p,r;e.__SV||(window.posthog=e,e._i=[],e.init=function(i,s,a){function g(t,e){var o=e.split(".");2==o.length&&(t=t[o[0]],e=o[1]),t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}}(p=t.createElement("script")).type="text/javascript",p.async=!0,p.src=s.api_host+"/static/array.js",(r=t.getElementsByTagName("script")[0]).parentNode.insertBefore(p,r);var u=e;for(void 0!==a?u=e[a]=[]:a="posthog",u.people=u.people||[],u.toString=function(t){var e="posthog";return"posthog"!==a&&(e+="."+a),t||(e+=" (stub)"),e},u.people.toString=function(){return u.toString(1)+".people (stub)"},o="capture identify alias people.set people.set_once set_config register register_once unregister opt_out_capturing has_opted_out_capturing opt_in_capturing reset isFeatureEnabled onFeatureFlags getFeatureFlag getFeatureFlagPayload reloadFeatureFlags group updateEarlyAccessFeatureEnrollment getEarlyAccessFeatures getActiveMatchingSurveys getSurveys getNextSurveyStep onSessionId".split(" "),n=0;n<o.length;n++)g(u,o[n]);e._i.push([i,s,a])},e.__SV=1)}(document, window.posthog || []);

    posthog.init(POSTHOG_KEY, {
      api_host: POSTHOG_HOST,
      autocapture: false,
      capture_pageview: true,
      persistence: 'localStorage',
      sanitize_properties: function(props) {
        scrubObject(props);
        return props;
      }
    });
    posthogReady = true;
  }

  /* ---------- Public API ---------- */
  function captureError(err, ctx) {
    if (isDev) { console.__error__ ? console.__error__(err, ctx) : console.error(err); return; }
    if (sentryReady && window.Sentry) {
      try { window.Sentry.captureException(err, { extra: ctx || {} }); } catch(_){}
    } else {
      pendingErrors.push({ err: err, ctx: ctx });
    }
  }

  function captureEvent(name, props) {
    if (isDev) return;
    if (posthogReady && window.posthog) {
      try { window.posthog.capture(name, scrubObject(props || {})); } catch(_){}
    }
    if (sentryReady && window.Sentry) {
      try {
        window.Sentry.addBreadcrumb({
          category: 'app',
          message: name,
          level: 'info',
          data: scrubObject(props || {})
        });
      } catch(_){}
    }
  }

  function identify(userId) {
    if (!userId) return;
    if (sentryReady && window.Sentry) {
      try { window.Sentry.setUser({ id: userId }); } catch(_){}
    }
    if (posthogReady && window.posthog) {
      try { window.posthog.identify(userId); } catch(_){}
    }
  }

  function isActive() {
    return sentryReady || posthogReady;
  }

  /* ---------- Global Error Handlers ---------- */
  function wrapErrorHandlers() {
    if (isDev) return;
    const origErr = window.onerror;
    window.onerror = function(msg, src, line, col, err) {
      try {
        if (err) captureError(err);
      } catch(_) {}
      if (typeof origErr === 'function') return origErr.apply(this, arguments);
      return false;
    };
    window.addEventListener('unhandledrejection', function(e) {
      try {
        if (e.reason) captureError(e.reason);
      } catch(_){}
    });
  }

  /* ---------- Boot ---------- */
  if (!isDev) {
    /* Lazy-load 1.5s nach DOMContentLoaded um First-Paint nicht zu blocken */
    function boot() {
      setTimeout(function() {
        loadSentry();
        loadPostHog();
        wrapErrorHandlers();
      }, 1500);
    }
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', boot);
    } else {
      boot();
    }
  }

  /* ---------- Globals ---------- */
  window.crewTelemetry = {
    captureError: captureError,
    captureEvent: captureEvent,
    identify: identify,
    isActive: isActive
  };
})();
