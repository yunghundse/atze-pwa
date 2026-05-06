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
  /* App-State events (background / foreground)                           */
  /* -------------------------------------------------------------------- */
  function onAppState(handler /* (isActive: bool) => void */) {
    if (!isApp || !App) return () => {};
    const sub = App.addListener('appStateChange', (state) => handler(!!state.isActive));
    return () => sub.remove();
  }

  /* -------------------------------------------------------------------- */
  /* Boot — auto-hide splash + apply Capacitor-only body class            */
  /* -------------------------------------------------------------------- */
  if (isApp) {
    document.documentElement.classList.add('cap-app');
    document.documentElement.classList.add(`cap-${platform}`);
    setStatusBarStyle('dark');
    // Auto-hide splash after first paint + idle (~1s)
    if (document.readyState === 'complete') {
      setTimeout(hideSplash, 800);
    } else {
      global.addEventListener('load', () => setTimeout(hideSplash, 800));
    }
  }

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
  };

  if (isApp) {
    console.log('[crew.native] running on', platform);
  }
})(typeof window !== 'undefined' ? window : globalThis);
