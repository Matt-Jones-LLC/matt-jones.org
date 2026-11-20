/* Shared Matt Jones LLC browser monitoring. Public RUM credentials only.
   No SDK download or telemetry until the visitor opts in. */
(() => {
  'use strict';
  const config = window.MJ_MONITORING || {};
  const key = 'mj:monitoring-consent';
  const blocked = navigator.globalPrivacyControl === true || navigator.doNotTrack === '1';
  const allowedHost = (config.hosts || []).includes(location.hostname);
  const configured = !!(config.applicationId && config.clientToken && config.sdkUrl && config.site);
  let consent = false, loading = false, ready = false, failed = false;
  try { consent = localStorage.getItem(key) === 'granted'; } catch (_) { /* session-only choice */ }
  if (blocked) consent = false;
  const state = { enabled: false, reason: 'not configured' };
  let label, button;
  function paint() {
    state.enabled = ready && consent && !blocked;
    state.reason = !configured ? 'not configured' : !allowedHost ? 'preview' : blocked ? 'browser preference' : failed ? 'unavailable' : loading && !ready ? 'loading' : consent ? 'enabled' : 'no consent';
    if (!label) return;
    label.textContent = !configured ? 'Optional site diagnostics are not configured yet. ' : blocked ? 'Site diagnostics are off to respect your browser preference. ' : failed ? 'Site diagnostics could not load; the site still works. ' : state.enabled ? 'Optional performance and error diagnostics are on (Datadog). No session replay. ' : 'Optional performance and error diagnostics are off. Enabling shares page visits, device details, errors, and game-start counts with Datadog. No session replay. ';
    button.textContent = consent ? 'Turn diagnostics off' : 'Enable diagnostics';
    button.hidden = !configured || !allowedHost || blocked;
    button.setAttribute('aria-pressed', String(consent));
  }
  function cleanURL(value) {
    if (typeof value !== 'string') return value;
    try { const url = new URL(value); return url.origin + url.pathname; } catch (_) { return ''; }
  }
  function beforeSend(event) {
    if (!consent || blocked) return false;
    if (event.view) {
      event.view.url = cleanURL(event.view.url);
      if (event.view.referrer) event.view.referrer = cleanURL(event.view.referrer);
    }
    if (event.resource) event.resource.url = cleanURL(event.resource.url);
    if (event.error && event.error.resource) event.error.resource.url = cleanURL(event.error.resource.url);
    return true;
  }
  function load() {
    if (!configured || !allowedHost || blocked || loading || ready || !consent) return;
    loading = true; failed = false;
    const script = document.createElement('script');
    script.src = config.sdkUrl; script.async = true; script.crossOrigin = 'anonymous';
    script.onload = () => {
      try {
        window.DD_RUM.init({applicationId: config.applicationId, clientToken: config.clientToken,
          site: config.site, service: config.service, env: config.env, version: config.version,
          sessionSampleRate: 100, sessionReplaySampleRate: 0, trackUserInteractions: false,
          trackAnonymousUser: false, trackResources: true, trackLongTasks: true,
          defaultPrivacyLevel: 'mask', useSecureSessionCookie: true,
          trackingConsent: consent ? 'granted' : 'not-granted', beforeSend});
        window.DD_RUM.setGlobalContextProperty('website', config.website);
        ready = true; loading = false; paint();
      } catch (_) { loading = false; failed = true; paint(); }
    };
    script.onerror = () => { loading = false; failed = true; paint(); };
    document.head.appendChild(script);
  }
  function setConsent(value) {
    consent = value === true && !blocked && configured && allowedHost;
    try { localStorage.setItem(key, consent ? 'granted' : 'not-granted'); } catch (_) { /* no persistence */ }
    if (ready) window.DD_RUM.setTrackingConsent(consent ? 'granted' : 'not-granted');
    if (consent) load();
    paint();
  }
  function track(name, value) {
    if (!state.enabled) return;
    const context = {};
    if (name === 'game_start') {
      const match = /\/games\/([a-z0-9-]+)\//.exec(location.pathname);
      if (!match) return;
      context.game = match[1];
    } else if (name === 'background_change' && ['midnight','ocean','ember'].includes(value)) {
      context.background = value;
    } else if (name === 'renderer_change' && ['css','canvas','plain'].includes(value)) {
      context.renderer = value;
    } else return;
    window.DD_RUM.addAction(name, context);
  }
  window.MJTelemetry = {state, setConsent, track};
  const bar = document.createElement('aside');
  bar.setAttribute('aria-label', 'Site diagnostics');
  bar.style.cssText = 'position:relative;max-width:1100px;margin:24px auto;padding:16px 24px;font:14px/1.6 system-ui,sans-serif;border-top:1px solid currentColor;opacity:.9';
  label = document.createElement('span');
  button = document.createElement('button'); button.type = 'button';
  button.style.cssText = 'font:inherit;color:inherit;background:transparent;border:1px solid currentColor;border-radius:4px;padding:5px 10px;margin:6px;cursor:pointer';
  button.addEventListener('click', () => setConsent(!consent));
  bar.appendChild(label); bar.appendChild(button); document.body.appendChild(bar);
  if (window.CMG && typeof window.CMG.countPlay === 'function') {
    const original = window.CMG.countPlay;
    window.CMG.countPlay = function (...args) { const result = original.apply(this, args); track('game_start'); return result; };
  }
  for (const [id, name] of [['theme','background_change'], ['renderer','renderer_change']]) {
    const input = document.getElementById(id);
    if (input) input.addEventListener('change', () => track(name, input.value));
  }
  load(); paint();
})();
