/* ===========================================================
   crew. — Utils (DOM-Helpers + Text + Geo)
   ===========================================================
   Wird VOR fx.js und VOR dem inline app-script geladen.
   Alle Funktionen werden auf window exportiert damit der
   bestehende IIFE-Code sie ohne Änderung nutzen kann.
   =========================================================== */
(function(){
  'use strict';

  /* Document-Selektoren */
  const $  = id  => document.getElementById(id);
  const $$ = sel => document.querySelectorAll(sel);

  /* HTML-Escaping (XSS-Schutz beim String-Templating) */
  const esc = s => String(s||'').replace(/[&<>"']/g, c => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  })[c]);

  /* "Jan Schmidt" → "JS"; "Jan" → "JA"; null → "?" */
  const initials = name => {
    if (!name) return '?';
    const p = name.trim().split(/\s+/);
    if (p.length >= 2) return (p[0][0] + p[1][0]).toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  /* "vor 2m / 3h / 5d / jetzt" Format */
  const timeAgo = ts => {
    const d = (Date.now() - new Date(ts).getTime()) / 1000;
    if (d < 60)    return 'jetzt';
    if (d < 3600)  return Math.round(d/60)    + 'm';
    if (d < 86400) return Math.round(d/3600)  + 'h';
    return Math.round(d/86400) + 'd';
  };

  /* Distanz auf Erdkugel in km zwischen zwei Lat/Lng-Punkten */
  const haversine = (lat1, lng1, lat2, lng2) => {
    const R = 6371, toRad = d => d * Math.PI / 180;
    const dLat = toRad(lat2 - lat1), dLng = toRad(lng2 - lng1);
    const a = Math.sin(dLat/2)**2 +
              Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
              Math.sin(dLng/2)**2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  };

  /* Globals (für IIFE-Scope-Kompatibilität) */
  window.$         = $;
  window.$$        = $$;
  window.esc       = esc;
  window.initials  = initials;
  window.timeAgo   = timeAgo;
  window.haversine = haversine;
})();
