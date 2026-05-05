/* ===========================================================
   crew. — Mood-System (Konstanten)
   ===========================================================
   Definiert die acht Stimmungs-Kategorien die Hero-Mood-Bubble,
   Crew-Liste und Mood-Picker anzeigen. Jeder Mood referenziert
   einen FX-Key (siehe fx.js) und einen deutschen Label.

   Lädt nach: fx.js
   =========================================================== */
(function(){
  'use strict';

  const MOODS = [
    { id: 'party',   t: 'Party',   fx: 'disco' },
    { id: 'chill',   t: 'Chill',   fx: 'sunglasses' },
    { id: 'easy',    t: 'Easy',    fx: 'smile' },
    { id: 'down',    t: 'Down',    fx: 'sad' },
    { id: 'lost',    t: 'Lost',    fx: 'confused' },
    { id: 'help',    t: 'Hilfe',   fx: 'sosbtn' },
    { id: 'home',    t: 'Daheim',  fx: 'house' },
    { id: 'healthy', t: 'Healthy', fx: 'flex' }
  ];

  /* Globals (für IIFE-Scope-Kompatibilität) */
  window.MOODS = MOODS;
})();
