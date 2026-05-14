/* crew. — Native-Bridge (Capacitor)
 *
 * Detect-on-load: in the native iOS app, window.Capacitor is auto-injected
 * by the Capacitor runtime BEFORE this script runs. In the web-PWA on
 * partycrew.app there is no Capacitor — every helper here no-ops gracefully.
 *
 * Exports a global crew.native namespace with safe wrappers:
 *   crew.native.isApp                 → bool, true if running inside the native shell
 *   crew.native.platform              → 'ios' | 'android' | 'web'
 *   crew.native.haptic('light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error')
 *   crew.native.setStatusBarStyle('dark' | 'light')
 *   crew.native.hideSplash()
 *   crew.native.registerPush()        → returns token string (saves to Supabase device_tokens)
 *   crew.native.openUrl(url)          → uses native In-App browser if app, else window.open
 *   crew.native.share({title,text,url})
 *
 * Loaded in clean.html via:
 *   <script type="module" src="src/native.js"></script>
 *
 * Plugins required (declared in native/package.json):
 *   @capacitor/haptics, @capacitor/status-bar, @capacitor/splash-screen,
 *   @capacitor/push-notifications, @capacitor/app, @capacitor/preferences
 */
(function (global) {
  'use strict';

  const cap = global.Capacitor;
  const isApp = !!(cap && cap.isNativePlatform && cap.isNativePlatform());
  const platform = cap && cap.getPlatform ? cap.getPlatform() : 'web';

  // Plugin shortcuts (only present when running native)
  const Plugins = (cap && cap.Plugins) || {};
  const Haptics = Plugins.Haptics;
  const StatusBar = Plugins.StatusBar;
  const SplashScreen = Plugins.SplashScreen;
  const PushNotifications = Plugins.PushNotifications;
  const App = Plugins.App;
  const Browser = Plugins.Browser;
  const Share = Plugins.Share;
  const Preferences = Plugins.Preferences;
  const BiometricAuth = Plugins.BiometricAuth;
  const SignInWithApple = Plugins.SignInWithApple;

  /* -------------------------------------------------------------------- */
  /* Haptics — silent no-op on web                                        */
  /* -------------------------------------------------------------------- */
  async function haptic(kind) {
    if (!isApp || !Haptics) return;
    try {
      switch (kind) {
        case 'light':   return Haptics.impact({ style: 'LIGHT' });
        case 'medium':  return Haptics.impact({ style: 'MEDIUM' });
        case 'heavy':   return Haptics.impact({ style: 'HEAVY' });
        case 'success': return Haptics.notification({ type: 'SUCCESS' });
        case 'warning': return Haptics.notification({ type: 'WARNING' });
        case 'error':   return Haptics.notification({ type: 'ERROR' });
        default:        return Haptics.selectionStart();
      }
    } catch (e) { /* no-op */ }
  }

  /* -------------------------------------------------------------------- */
  /* Status-Bar control                                                   */
  /* -------------------------------------------------------------------- */
  async function setStatusBarStyle(style /* 'dark' | 'light' */) {
    if (!isApp || !StatusBar) return;
    try {
      await StatusBar.setStyle({ style: style === 'light' ? 'LIGHT' : 'DARK' });
    } catch (e) { /* no-op */ }
  }

  async function hideSplash() {
    if (!isApp || !SplashScreen) return;
    try { await SplashScreen.hide({ fadeOutDuration: 300 }); } catch (e) { /* no-op */ }
  }

  /* -------------------------------------------------------------------- */
  /* Push Notifications — registers token + saves to Supabase             */
  /* -------------------------------------------------------------------- */
  async function registerPush(supabase, userId) {
    if (!isApp || !PushNotifications) return null;
    if (!supabase || !userId) {
      console.warn('[native.registerPush] missing supabase client or userId');
      return null;
    }
    try {
      const perm = await PushNotifications.checkPermissions();
      let granted = perm.receive === 'granted';
      if (!granted) {
        const req = await PushNotifications.requestPermissions();
        granted = req.receive === 'granted';
      }
      if (!granted) return null;

      await PushNotifications.register();

      return await new Promise((resolve, reject) => {
        const tokenSub = PushNotifications.addListener('registration', async (token) => {
          tokenSub.remove();
          try {
            const { error } = await supabase
              .from('device_tokens')
              .upsert(
                {
                  user_id: userId,
                  token: token.value,
                  platform: platform,
                  updated_at: new Date().toISOString(),
                },
                { onConflict: 'token' }
              );
            if (error) console.error('[native.registerPush] supabase error', error);
            resolve(token.value);
          } catch (e) {
            reject(e);
          }
        });
        const errSub = PushNotifications.addListener('registrationError', (err) => {
          errSub.remove();
          console.error('[native.registerPush] registrationError', err);
          resolve(null);
        });
      });
    } catch (e) {
      console.error('[native.registerPush] failed', e);
      return null;
    }
  }

  function onPushReceived(handler) {
    if (!isApp || !PushNotifications) return () => {};
    const sub = PushNotifications.addListener('pushNotificationReceived', handler);
    return () => sub.remove();
  }

  function onPushTapped(handler) {
    if (!isApp || !PushNotifications) return () => {};
    const sub = PushNotifications.addListener('pushNotificationActionPerformed', handler);
    return () => sub.remove();
  }

  /* -------------------------------------------------------------------- */
  /* Browser + Share                                                      */
  /* -------------------------------------------------------------------- */
  async function openUrl(url) {
    if (isApp && Browser && Browser.open) {
      try { return Browser.open({ url, presentationStyle: 'popover' }); }
      catch (e) { /* fall through */ }
    }
    global.open(url, '_blank', 'noopener,noreferrer');
  }

  async function share(payload) {
    if (isApp && Share && Share.share) {
      try { return Share.share(payload); } catch (e) { /* fall through */ }
    }
    if (global.navigator && global.navigator.share) {
      try { return global.navigator.share(payload); } catch (e) { /* user cancelled */ }
    }
  }

  /* -------------------------------------------------------------------- */
  /* Quick-Auth: Face ID / Touch ID + PIN-Fallback                        */
  /*                                                                      */
  /* Storage:                                                             */
  /*   crew_pin_hash      : SHA-256 hex of (pin + salt)                   */
  /*   crew_pin_salt      : 16 random bytes hex                           */
  /*   crew_pin_enabled   : '1' if user has set up PIN                    */
  /*   crew_biometric_on  : '1' if user opted into Face/Touch ID          */
  /*                                                                      */
  /* Web fallback uses localStorage (less secure but no crash on PWA).    */
  /* Native uses Capacitor Preferences (Keychain on iOS).                 */
  /* -------------------------------------------------------------------- */

  // ----- Storage abstraction -----
  async function prefSet(key, value) {
    if (Preferences) return Preferences.set({ key, value });
    try { localStorage.setItem(key, value); } catch (_) {}
  }
  async function prefGet(key) {
    if (Preferences) {
      const r = await Preferences.get({ key });
      return r && r.value;
    }
    try { return localStorage.getItem(key); } catch (_) { return null; }
  }
  async function prefRemove(key) {
    if (Preferences) return Preferences.remove({ key });
    try { localStorage.removeItem(key); } catch (_) {}
  }

  // ----- PIN hashing (Web Crypto, available in WKWebView) -----
  async function hashPin(pin, saltHex) {
    if (!global.crypto || !global.crypto.subtle) throw new Error('Web Crypto unavailable');
    const enc = new TextEncoder().encode(pin + ':' + saltHex);
    const buf = await global.crypto.subtle.digest('SHA-256', enc);
    return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
  }
  function randomSalt() {
    const a = new Uint8Array(16);
    if (global.crypto && global.crypto.getRandomValues) global.crypto.getRandomValues(a);
    else for (let i = 0; i < a.length; i++) a[i] = Math.floor(Math.random() * 256);
    return Array.from(a).map(b => b.toString(16).padStart(2, '0')).join('');
  }

  async function pinIsEnabled() {
    return (await prefGet('crew_pin_enabled')) === '1';
  }

  async function pinSetup(pin) {
    if (!/^\d{4}$/.test(pin)) throw new Error('PIN muss genau 4 Ziffern haben');
    const salt = randomSalt();
    const hash = await hashPin(pin, salt);
    await prefSet('crew_pin_salt', salt);
    await prefSet('crew_pin_hash', hash);
    await prefSet('crew_pin_enabled', '1');
    return true;
  }

  async function pinVerify(pin) {
    if (!/^\d{4}$/.test(pin)) return false;
    const salt = await prefGet('crew_pin_salt');
    const expected = await prefGet('crew_pin_hash');
    if (!salt || !expected) return false;
    const got = await hashPin(pin, salt);
    return got === expected;
  }

  async function pinDisable() {
    await prefRemove('crew_pin_enabled');
    await prefRemove('crew_pin_hash');
    await prefRemove('crew_pin_salt');
    await prefRemove('crew_biometric_on');
  }

  // ----- Biometric (Face ID / Touch ID, native-only) -----
  /* @aparajita/capacitor-biometric-auth liefert biometryType als enum Number:
     0=none, 1=touchId, 2=faceId, 3=fingerprint, 4=faceAuth, 5=iris.
     Wir mappen auf einen lesbaren String für die UI. */
  const BIO_LABELS = {
    0: null,
    1: 'Touch ID',
    2: 'Face ID',
    3: 'Fingerabdruck',
    4: 'Face Unlock',
    5: 'Iris-Scan',
  };
  async function biometricAvailable() {
    if (!isApp || !BiometricAuth) return { available: false, reason: 'not-native' };
    try {
      const r = await BiometricAuth.checkBiometry();
      // r: { isAvailable, biometryType (enum), reason, deviceIsSecure, ... }
      const typeNum = r && typeof r.biometryType === 'number' ? r.biometryType : 0;
      return {
        available: !!(r && r.isAvailable),
        biometryType: BIO_LABELS[typeNum] || null,
        biometryTypeRaw: typeNum,
        deviceIsSecure: !!(r && r.deviceIsSecure),
        reason: r && r.reason,
      };
    } catch (e) {
      return { available: false, reason: e && e.message };
    }
  }

  async function biometricEnable() {
    const a = await biometricAvailable();
    if (!a.available) return false;
    await prefSet('crew_biometric_on', '1');
    return true;
  }

  async function biometricDisable() {
    await prefRemove('crew_biometric_on');
  }

  async function biometricIsOptedIn() {
    return (await prefGet('crew_biometric_on')) === '1';
  }

  /**
   * Verify the user via Face ID / Touch ID. Returns true on success.
   * Falls back to false on any error — caller should show the PIN screen.
   */
  async function biometricVerify(reason) {
    if (!isApp || !BiometricAuth) return false;
    if (!(await biometricIsOptedIn())) return false;
    try {
      await BiometricAuth.authenticate({
        reason: reason || 'crew. entsperren',
        cancelTitle: 'Mit PIN entsperren',
        allowDeviceCredential: false,
        iosFallbackTitle: 'PIN verwenden',
      });
      return true; // No throw = success
    } catch (e) {
      // user-cancelled, biometry-not-enrolled, biometry-locked, etc.
      return false;
    }
  }

  /* -------------------------------------------------------------------- */
  /* Sign in with Apple — gibt identityToken + rawNonce für Supabase     */
  /*                                                                      */
  /* Flow:                                                                */
  /*   1. Erzeuge zufälligen rawNonce (32 Bytes hex)                      */
  /*   2. SHA-256-Hash davon → an Apple schicken                          */
  /*   3. Apple liefert identityToken (JWT) — das enthält den hashedNonce */
  /*   4. Wir geben {identityToken, rawNonce} zurück                      */
  /*   5. Caller ruft supabase.auth.signInWithIdToken({                  */
  /*        provider:'apple', token:identityToken, nonce:rawNonce })      */
  /*                                                                      */
  /* Bundle-ID + redirectURI sind im native-iOS-Flow nicht relevant       */
  /* (Apple validiert gegen App-Entitlements), aber das Plugin braucht    */
  /* sie als Parameter. Für die Web-PWA muss eine echte Service-ID +      */
  /* Return-URL bei Apple registriert sein.                               */
  /* -------------------------------------------------------------------- */
  function _hexFromBytes(bytes) {
    return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
  }
  async function _sha256Hex(text) {
    const enc = new TextEncoder().encode(text);
    const buf = await global.crypto.subtle.digest('SHA-256', enc);
    return _hexFromBytes(new Uint8Array(buf));
  }
  function _randomNonce(byteLen) {
    const a = new Uint8Array(byteLen || 32);
    if (global.crypto && global.crypto.getRandomValues) global.crypto.getRandomValues(a);
    else for (let i = 0; i < a.length; i++) a[i] = Math.floor(Math.random() * 256);
    return _hexFromBytes(a);
  }

  async function appleSignInAvailable() {
    return !!SignInWithApple;
  }

  /**
   * Trigger the native "Sign in with Apple" sheet.
   * Returns null on user-cancel or unavailable, otherwise:
   *   { identityToken, rawNonce, email, givenName, familyName, user }
   *
   * @param {Object} opts
   * @param {string} opts.clientId    iOS: Bundle-ID; Web: Service-ID
   * @param {string} opts.redirectURI Web only — must match Apple Service config
   */
  async function signInWithApple(opts) {
    if (!SignInWithApple) {
      throw new Error('Sign in with Apple plugin not available');
    }
    opts = opts || {};
    const rawNonce = _randomNonce(32);
    const hashedNonce = await _sha256Hex(rawNonce);
    try {
      const r = await SignInWithApple.authorize({
        clientId: opts.clientId || 'com.butterbread.synclulu',
        redirectURI: opts.redirectURI || '',
        scopes: opts.scopes || 'email name',
        state: opts.state || _randomNonce(8),
        nonce: hashedNonce,
      });
      const res = (r && r.response) || {};
      if (!res.identityToken) return null;
      return {
        identityToken: res.identityToken,
        authorizationCode: res.authorizationCode || null,
        rawNonce: rawNonce,
        email: res.email || null,
        givenName: res.givenName || null,
        familyName: res.familyName || null,
        user: res.user || null,
      };
    } catch (e) {
      // user cancelled or system error — surface as null, not throw
      console.warn('[apple-sign-in]', e);
      return null;
    }
  }

  /* -------------------------------------------------------------------- */
  /* App-State events (background / foreground)                           */
  /* -------------------------------------------------------------------- */
  function onAppState(handler /* (isActive: bool) => void */) {
    if (!isApp || !App) return () => {};
    const sub = App.addListener('appStateChange', (state) => handler(!!state.isActive));
    return () => sub.remove();
  }

  /* -------------------------------------------------------------------- */
  /* Native-only CSS-Polish (injected at boot, no clean.html mutation)    */
  /* -------------------------------------------------------------------- */
  function injectNativeStyles() {
    const css = [
      '/* Native iOS polish — only active when running inside the Capacitor shell */',
      '.cap-ios body, .cap-android body { overscroll-behavior: none; -webkit-touch-callout: none; }',
      '.cap-ios { -webkit-tap-highlight-color: transparent; }',
      '/* Re-allow text selection inside actual text inputs */',
      '.cap-ios input, .cap-ios textarea, .cap-ios [contenteditable="true"] { -webkit-user-select: text; user-select: text; -webkit-touch-callout: default; }',
      '/* Hide PWA-only UI when running native (no "Install App" banner inside the app) */',
      '.cap-app .pwa-install-banner, .cap-app .pwa-install-prompt, .cap-app [data-pwa-only] { display: none !important; }',
      '/* Subtle press feedback (replaces missing :hover on touch) */',
      '.cap-ios button:active, .cap-ios a:active, .cap-ios [role="button"]:active { transform: scale(.97); transition: transform .08s ease-out; }',
      '/* Bottom-Padding für Home-Indicator wenn Bottom-Nav vorhanden */',
      '.cap-ios .bottom-nav, .cap-ios [data-bottom-nav] { padding-bottom: calc(8px + env(safe-area-inset-bottom, 0px)); }',
    ].join('\n');
    const style = document.createElement('style');
    style.id = 'cap-native-polish';
    style.textContent = css;
    document.head.appendChild(style);
  }

  /* -------------------------------------------------------------------- */
  /* Quick Actions Bridge                                                 */
  /* AppDelegate.swift fires `window.dispatchEvent('crew:quickAction')`   */
  /* when the user long-presses the home-screen icon and picks an item.   */
  /* We re-dispatch into a stable namespaced API so clean.html stays      */
  /* unaware of native-vs-web specifics.                                  */
  /* -------------------------------------------------------------------- */
  const quickActionHandlers = new Set();
  function onQuickAction(handler) {
    quickActionHandlers.add(handler);
    return () => quickActionHandlers.delete(handler);
  }
  global.addEventListener('crew:quickAction', (e) => {
    const action = (e && e.detail && e.detail.action) || null;
    if (!action) return;
    haptic('medium'); // small tactile confirmation
    quickActionHandlers.forEach((fn) => {
      try { fn(action); } catch (err) { console.warn('[quickAction handler]', err); }
    });
  });

  /* -------------------------------------------------------------------- */
  /* Auto-Wire Haptics — any element with [data-haptic] gets feedback     */
  /* on tap. Use: <button data-haptic="medium">Heimweg starten</button>   */
  /* -------------------------------------------------------------------- */
  function wireAutoHaptics() {
    document.addEventListener('click', (e) => {
      const target = e.target && e.target.closest && e.target.closest('[data-haptic]');
      if (target) haptic(target.getAttribute('data-haptic') || 'medium');
    }, { passive: true, capture: true });
  }

  /* -------------------------------------------------------------------- */
  /* Boot — auto-hide splash + apply Capacitor-only body classes          */
  /* -------------------------------------------------------------------- */
  function applyClass(cls) {
    document.documentElement.classList.add(cls);
    if (document.body) document.body.classList.add(cls);
    else document.addEventListener('DOMContentLoaded', () => document.body && document.body.classList.add(cls));
  }

  if (isApp) {
    applyClass('cap-app');
    applyClass(`cap-${platform}`);
    applyClass('mode-native');
    setStatusBarStyle('dark');
    injectNativeStyles();
    wireAutoHaptics();
    // Auto-hide splash after first paint + idle (~1s)
    if (document.readyState === 'complete') {
      setTimeout(hideSplash, 800);
    } else {
      global.addEventListener('load', () => setTimeout(hideSplash, 800));
    }
  } else {
    /* Default für Web/PWA: mode-web. Stellt sicher dass die App-Auth-UI
       sauber gegated ist (siehe clean.html .web-only / .app-only CSS). */
    applyClass('mode-web');
  }

  /* -------------------------------------------------------------------- */
  /* TODO for next iteration:                                             */
  /* In the auth-flow (after successful login or Supabase                 */
  /* onAuthStateChange === 'SIGNED_IN'), call:                            */
  /*                                                                      */
  /*   crew.native.registerPush(sb, user.id);                             */
  /*                                                                      */
  /* This silently no-ops on web — only fires Push-Permission and saves   */
  /* the device-token to Supabase device_tokens when running native.      */
  /* -------------------------------------------------------------------- */

  /* -------------------------------------------------------------------- */
  /* Location-Service v2 — Single-State-Model                             */
  /*                                                                      */
  /* States (matched mit DB profiles.state):                              */
  /*   'home'    🏠 Daheim — Crew sieht "daheim", keine genaue Pos        */
  /*   'out'     🚶 Unterwegs — Crew sieht live position                  */
  /*   'open'    💬 Offen — Friends sehen + Spot-Crew sieht + Sag-Hi geht */
  /*   'private' 🤫 Privat — niemand sieht, nicht auf Karte               */
  /*                                                                      */
  /* API:                                                                 */
  /*   crew.location.start(supabase)         → watch + DB-sync starten   */
  /*   crew.location.stop()                                              */
  /*   crew.location.getCurrent()            → {lat,lng,accuracy} | null */
  /*   crew.location.getState()              → 'home'|'out'|'open'|'private' */
  /*   crew.location.setState(newState)      → schreibt via write_my_state RPC */
  /*   crew.location.onChange(handler)       → fixes + state-changes     */
  /*   crew.location.boostForHeimweg(true)   → 10s-Sync statt 30s        */
  /* -------------------------------------------------------------------- */
  const VALID_STATES = ['home', 'out', 'open', 'private'];
  let locState = {
    watchId: null,
    lastLat: null,
    lastLng: null,
    lastAccuracy: null,
    lastFix: 0,
    lastDbWrite: 0,
    state: 'home',              // sync mit DB profiles.state
    boosted: false,             // 10s-DB-Write im Heimweg-Mode
    sb: null,
    handlers: new Set(),
    onAppStateUnsub: null,
  };

  function _locFireChange(payload) {
    locState.handlers.forEach(fn => {
      try { fn(payload); } catch (e) { console.warn('[location.onChange]', e); }
    });
  }

  function _locDist(lat1, lng1, lat2, lng2) {
    if (lat1 == null || lat2 == null) return Infinity;
    const R = 6371000;
    const toRad = d => d * Math.PI / 180;
    const dLat = toRad(lat2 - lat1), dLng = toRad(lng2 - lng1);
    const a = Math.sin(dLat / 2) ** 2 +
              Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(a));
  }

  async function _locSyncToDb() {
    if (!locState.sb || locState.lastLat == null) return;
    const now = Date.now();
    const minInterval = locState.boosted ? 10000 : 30000;
    if (now - locState.lastDbWrite < minInterval) return;
    try {
      await locState.sb.rpc('write_my_location', {
        p_lat: locState.lastLat,
        p_lng: locState.lastLng,
        p_accuracy: locState.lastAccuracy || 0,
      });
      locState.lastDbWrite = now;
    } catch (e) {
      console.warn('[location.dbSync]', e);
    }
  }

  function locStart(supabase) {
    if (!global.navigator || !global.navigator.geolocation) {
      console.warn('[location.start] geolocation not available');
      return;
    }
    if (locState.watchId !== null) return; // bereits aktiv
    locState.sb = supabase || locState.sb;

    locState.watchId = global.navigator.geolocation.watchPosition(
      (p) => {
        const lat = p.coords.latitude;
        const lng = p.coords.longitude;
        const accuracy = p.coords.accuracy;
        const moved = _locDist(locState.lastLat, locState.lastLng, lat, lng);

        const significantMove = moved > 50; // 50m threshold
        locState.lastLat = lat;
        locState.lastLng = lng;
        locState.lastAccuracy = accuracy;
        locState.lastFix = Date.now();

        // localStorage Cache (TTL via clean.html lese-logik)
        try {
          localStorage.setItem('crew_last_loc', JSON.stringify({
            lat, lng, source: 'gps', t: Date.now()
          }));
        } catch (_) {}

        if (significantMove || moved === Infinity /* first fix */) {
          _locFireChange({ lat, lng, accuracy, mode: locState.mode, kind: 'fix' });
        }
        _locSyncToDb();
      },
      (err) => {
        console.warn('[location.watchPosition error]', err && err.message);
      },
      {
        enableHighAccuracy: true,
        maximumAge: 5000,
        timeout: 15000,
      }
    );

    // Sync stop bei Background, start bei Foreground (Battery-Spar)
    if (!locState.onAppStateUnsub) {
      locState.onAppStateUnsub = onAppState((isActive) => {
        if (isActive && locState.watchId === null) {
          locStart(locState.sb); // re-start nach Foreground
        } else if (!isActive && locState.watchId !== null) {
          // Bei Background pausieren — Heimweg-Modus überschreibt das per backround-task
          if (!locState.boosted) locStop();
        }
      });
    }
  }

  function locStop() {
    if (locState.watchId !== null && global.navigator && global.navigator.geolocation) {
      global.navigator.geolocation.clearWatch(locState.watchId);
    }
    locState.watchId = null;
  }

  function locGetCurrent() {
    if (locState.lastLat == null) return null;
    return {
      lat: locState.lastLat,
      lng: locState.lastLng,
      accuracy: locState.lastAccuracy,
      fixAge: Date.now() - locState.lastFix,
    };
  }

  function locGetState() { return locState.state; }

  /** State im DB + Lokal setzen. Fired onChange event. */
  async function locSetState(newState) {
    if (!VALID_STATES.includes(newState)) {
      console.warn('[location.setState] invalid:', newState);
      return false;
    }
    if (locState.state === newState) return true;
    const prev = locState.state;
    locState.state = newState;
    try { localStorage.setItem('crew_loc_state', newState); } catch (_) {}
    // DB-Write (best-effort, fail-soft)
    if (locState.sb) {
      try {
        await locState.sb.rpc('write_my_state', { p_state: newState });
      } catch (e) {
        console.warn('[location.setState DB]', e);
      }
    }
    _locFireChange({ state: newState, prev, kind: 'state' });
    return true;
  }

  /** Initial-State aus dem geladenen Profile übernehmen. */
  function locHydrateFromProfile(profile) {
    if (profile && VALID_STATES.includes(profile.state)) {
      locState.state = profile.state;
      _locFireChange({ state: profile.state, kind: 'state' });
    }
  }

  function locOnChange(fn) {
    locState.handlers.add(fn);
    return () => locState.handlers.delete(fn);
  }

  function locBoost(on) {
    locState.boosted = !!on;
  }

  // State-Preference aus localStorage als sofortiger Fallback (vor Profile-Load)
  try {
    const savedState = localStorage.getItem('crew_loc_state');
    if (VALID_STATES.includes(savedState)) locState.state = savedState;
  } catch (_) {}

  /* -------------------------------------------------------------------- */
  /* Public namespace                                                     */
  /* -------------------------------------------------------------------- */
  global.crew = global.crew || {};
  global.crew.native = {
    isApp: isApp,
    platform: platform,
    haptic: haptic,
    setStatusBarStyle: setStatusBarStyle,
    hideSplash: hideSplash,
    registerPush: registerPush,
    onPushReceived: onPushReceived,
    onPushTapped: onPushTapped,
    openUrl: openUrl,
    share: share,
    onAppState: onAppState,
    onQuickAction: onQuickAction,
    // Quick-Auth
    pinIsEnabled: pinIsEnabled,
    pinSetup: pinSetup,
    pinVerify: pinVerify,
    pinDisable: pinDisable,
    biometricAvailable: biometricAvailable,
    biometricEnable: biometricEnable,
    biometricDisable: biometricDisable,
    biometricIsOptedIn: biometricIsOptedIn,
    biometricVerify: biometricVerify,
    // Sign in with Apple
    appleSignInAvailable: appleSignInAvailable,
    signInWithApple: signInWithApple,
  };

  /* Location-Service v2 (state-based, kein Mode-Toggle mehr) */
  global.crew.location = {
    start: locStart,
    stop: locStop,
    getCurrent: locGetCurrent,
    getState: locGetState,
    setState: locSetState,
    hydrateFromProfile: locHydrateFromProfile,
    onChange: locOnChange,
    boostForHeimweg: locBoost,
    STATES: VALID_STATES,
  };

  if (isApp) {
    console.log('[crew.native] running on', platform);
  }
})(typeof window !== 'undefined' ? window : globalThis);
