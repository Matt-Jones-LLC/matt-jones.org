/* Flash Is Dead: shared page script (the arcade side still answers to CMG, for Cool Matt Games).
   Jobs: float a few decorative bubbles across the sky, play the games' sounds, and show the visit counter.
   The counter asks this site's own /api/visit. Game scores and saves still live in this browser only. */
(function () {
  'use strict';

  function store(key, value) {
    try {
      if (value === undefined) return window.localStorage.getItem(key);
      window.localStorage.setItem(key, String(value));
    } catch (e) { /* private mode or blocked storage: the page still works */ }
    return null;
  }

  // Shared with the games: window.CMG.plays() reads, window.CMG.countPlay() adds one.
  window.CMG = {
    store: store,
    plays: function () { return parseInt(store('cmg:plays') || '0', 10) || 0; },
    countPlay: function () { store('cmg:plays', window.CMG.plays() + 1); }
  };

  // Recorded sound effects for the games. Files live in /assets/sounds/ and are fetched after the
  // first tap. play() returns false when a sound is not ready, so each game can fall back to its
  // own synthesized beep. Credits for every recording are on /credits/.
  var sfxCtx = null, sfxBuffers = {}, sfxAsked = {}, sfxFails = {}, sfxLive = [], sfxLast = {};
  function sfxContext() {
    if (!sfxCtx) { var AC = window.AudioContext || window.webkitAudioContext; if (AC) { try { sfxCtx = new AC(); } catch (e) { sfxCtx = null; } } }
    // Anything but "running" needs a nudge: "suspended" before the first tap, and Safari's
    // "interrupted" after a phone call or a trip to the background.
    if (sfxCtx && sfxCtx.state !== 'running') { try { sfxCtx.resume(); } catch (e) { /* stays silent */ } }
    return sfxCtx;
  }
  function sfxLoad(name) {
    var ctx = sfxCtx;
    if (!ctx || sfxAsked[name] || !window.fetch) return;
    sfxAsked[name] = true;
    var settled = false;   // a missing or unreadable file is final; a dropped connection gets two more tries
    window.fetch('/assets/sounds/' + name + '.mp3')
      .then(function (r) { if (!r.ok) { settled = true; throw new Error('missing'); } return r.arrayBuffer(); })
      .then(function (data) { settled = true; return new Promise(function (ok, fail) { ctx.decodeAudioData(data, ok, fail); }); })
      .then(function (buffer) { sfxBuffers[name] = buffer; })
      .catch(function () {
        sfxBuffers[name] = null;
        if (!settled) { sfxFails[name] = (sfxFails[name] || 0) + 1; if (sfxFails[name] < 3) sfxAsked[name] = false; }
      });
  }
  // stop('name') stops that sound; stop() stops everything that is playing.
  function sfxStop(name) {
    sfxLive = sfxLive.filter(function (live) {
      if (name && live.name !== name) return true;
      live.src.onended = null;
      try { live.src.stop(0); } catch (e) { /* already finished */ }
      return false;
    });
  }
  window.CMG.sfx = {
    // Call from a tap or click: browsers only allow sound to start from a user action.
    wake: function (names) { if (sfxContext()) (names || []).forEach(sfxLoad); },
    // opts: rate (speed), volume, offset (seconds to skip at the start of the file),
    // solo (stop any earlier copy of this sound first).
    play: function (name, opts) {
      var buffer = sfxBuffers[name];
      if (!sfxCtx || !buffer) return false;
      opts = opts || {};
      var key = name + '@' + (opts.rate || 1), now = sfxCtx.currentTime;
      // sfxLast[key] starts undefined, and NaN < 0.03 is false, so the first play always goes through.
      if (now - sfxLast[key] < 0.03) return true;   // the same sound just started; stacking copies only distorts
      sfxLast[key] = now;
      if (opts.solo) sfxStop(name);
      var src = sfxCtx.createBufferSource(), gain = sfxCtx.createGain();
      src.buffer = buffer; src.playbackRate.value = opts.rate || 1;
      gain.gain.value = opts.volume == null ? 0.5 : opts.volume;
      var live = { name: name, src: src };
      src.onended = function () { var i = sfxLive.indexOf(live); if (i >= 0) sfxLive.splice(i, 1); };
      sfxLive.push(live);
      src.connect(gain); gain.connect(sfxCtx.destination);
      src.start(0, opts.offset || 0);
      return true;
    },
    stop: sfxStop,
    ready: function (name) { return !!sfxBuffers[name]; }
  };

  var sky = document.querySelector('.sky-bubbles');
  if (sky) {
    var count = window.innerWidth < 600 ? 6 : 10;
    for (var i = 0; i < count; i++) {
      var b = document.createElement('span');
      var size = 26 + Math.round(Math.random() * 70);
      b.style.setProperty('--s', size + 'px');
      b.style.setProperty('--x', Math.round(Math.random() * 96) + '%');
      b.style.setProperty('--d', (22 + Math.random() * 26).toFixed(1) + 's');
      b.style.setProperty('--delay', (-Math.random() * 40).toFixed(1) + 's');
      b.style.setProperty('--sway', Math.round(Math.random() * 120 - 60) + 'px');
      b.style.setProperty('--rest', Math.round(10 + Math.random() * 75) + '%');
      sky.appendChild(b);
    }
  }

  // A link that points at, or inside, a closed <details> opens it (the Starfighters' roster on /cast/).
  function openLinked() {
    var id = '';
    try { id = decodeURIComponent(window.location.hash.slice(1)); } catch (e) { return; }
    var target = id && document.getElementById(id);
    if (!target) return;
    var box = (target.closest && target.closest('details')) || target.querySelector('details[data-open-on-link]');
    if (box && !box.open) { box.open = true; target.scrollIntoView(); }
  }
  openLinked();
  window.addEventListener('hashchange', openLinked);

  // The visit counter in the status bar. One count per browser session; the number is the whole site's.
  var counter = document.querySelector('[data-visits]');
  if (counter && window.fetch) {
    var firstPage = false;
    try {
      firstPage = !window.sessionStorage.getItem('fid:visited');
      if (firstPage) window.sessionStorage.setItem('fid:visited', '1');
    } catch (e) { /* storage blocked: every page view counts as a visit */ }
    window.fetch('/api/visit' + (firstPage ? '?new=1' : ''), { cache: 'no-store' })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (d) {
        if (!d || typeof d.visits !== 'number') return;
        var n = String(d.visits);
        // Six digits, like an old hit counter.
        while (n.length < 6) n = '0' + n;
        counter.textContent = n;
      })
      .catch(function () { /* offline or blocked: the zeros stay */ });
  }
})();
