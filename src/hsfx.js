/* ===========================================================
   crew. — Hotspot-FX (3D-Emoji-Resolver für Hotspots)
   ===========================================================
   Mappt kind + subcategory eines Hotspots auf das passende
   3D-Emoji (über window.FX) und auf einen lesbaren deutschen
   Label. Zentral damit Map-Pins, Listen-Tags und Hotspot-Detail
   immer die gleichen Icons + Worte zeigen.

   Lädt nach: fx.js, utils.js
   =========================================================== */
(function(){
  'use strict';

  /* Welcher FX-Key für welchen Top-Level-Kind */
  const HS_KIND_FX = {
    party:        'disco',
    safe:         'shield',
    trust:        'handshake',
    live:         'satellite',
    watch:        'eye',
    community:    'hug',
    safehaven:    'folded',
    help_point:   'sosbtn',
    partner_spot: 'crown'
  };

  /* Welcher FX-Key pro Subkategorie (fein-granular) */
  const HS_SUB_FX = {
    police:           'police',
    hospital:         'hospital',
    pharmacy:         'pill',
    fire_station:     'fire',
    helpline:         'phone',
    counseling:       'speech',
    women_shelter:    'female',
    lgbtq_center:     'rainbowfl',
    youth_center:     'backpack',
    addiction_help:   'purpheart',
    train_station:    'train',
    gas_station_24h:  'fuel',
    embassy:          'globe',
    community_center: 'hug',
    restaurant:       'fork',
    bar:              'cocktail',
    club:             'disco',
    hotel:            'hotel',
    cafe:             'coffee',
    other:            'pin'
  };

  /* Liefert die 3D-Emoji-URL für einen Hotspot. Subkategorie hat
     Priorität über kind, Fallback auf "pin". */
  function hsFx(kind, subcategory){
    const FX = window.FX || {};
    const sub = subcategory && HS_SUB_FX[subcategory];
    if (sub && FX[sub]) return FX[sub];
    const k = kind && HS_KIND_FX[kind];
    if (k && FX[k]) return FX[k];
    return FX.pin || '';
  }

  /* Liefert deutschen Label. */
  function hsLabel(kind, subcategory){
    const subLabels = {
      police:'Polizei', hospital:'Krankenhaus', pharmacy:'Apotheke',
      fire_station:'Feuerwehr', helpline:'Hotline', counseling:'Beratung',
      women_shelter:'Frauenhaus', lgbtq_center:'LGBTQ+ Zentrum',
      youth_center:'Jugendzentrum', addiction_help:'Suchthilfe',
      train_station:'Bahnhof', gas_station_24h:'Tankstelle 24h',
      embassy:'Botschaft', community_center:'Bürgerhaus',
      restaurant:'Restaurant', bar:'Bar', club:'Club',
      hotel:'Hotel', cafe:'Café', other:'Anlaufstelle'
    };
    if (subcategory && subLabels[subcategory]) return subLabels[subcategory];
    const kindLabels = {
      party:'Party', safe:'Safe-Spot', trust:'Trust',
      live:'Live', watch:'Watch', community:'Community',
      safehaven:'Schutzort', help_point:'Hilfe', partner_spot:'Partner'
    };
    return kindLabels[kind] || 'Spot';
  }

  /* Label als HTML mit Inline-3D-Emoji für Tags/Listen-Headers. */
  function hsLabelHtml(kind, subcategory, size){
    const px = size || 14;
    const url = hsFx(kind, subcategory);
    const text = hsLabel(kind, subcategory);
    const escFn = window.esc || (s => s);
    return '<img class="emo3d" style="width:' + px + 'px;height:' + px +
           'px;vertical-align:-2px;margin-right:4px" src="' + url +
           '" alt=""/>' + escFn(text);
  }

  /* Kompakter Code-Tag für Pins z.B. "PW" / "FW" / "KH" */
  function hsShortCode(subcategory){
    const codes = {
      police: 'PW', fire_station: 'FW', hospital: 'KH', pharmacy: 'AP',
      helpline: 'HL', counseling: 'BS', women_shelter: 'FH', lgbtq_center: 'LG',
      youth_center: 'JH', addiction_help: 'SH', train_station: 'BHF',
      gas_station_24h: '24H', community_center: 'BÜZ',
      restaurant: 'REST', bar: 'BAR', club: 'CLUB', hotel: 'HOT', cafe: 'CAF'
    };
    return codes[subcategory] || null;
  }

  /* Inline-3D-Emoji-HTML aus FX-Key (für emojiless Templates) */
  function emo3d(name, size){
    const FX = window.FX || {};
    const url = FX[name] || FX.sparkles || '';
    return '<img class="emo3d ' + (size || '') + '" src="' + url +
           '" alt="" loading="lazy"/>';
  }

  /* Globals */
  window.HS_KIND_FX  = HS_KIND_FX;
  window.HS_SUB_FX   = HS_SUB_FX;
  window.hsFx        = hsFx;
  window.hsLabel     = hsLabel;
  window.hsLabelHtml = hsLabelHtml;
  window.hsShortCode = hsShortCode;
  window.emo3d       = emo3d;
})();
