/* Master Signs & Prints — site.js
   Small, dependency-free. Nav, one page-load reveal, form handling. */
(function () {
  'use strict';

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---- mobile nav ---- */
  var burger = document.querySelector('.burger');
  var mnav = document.getElementById('mnav');
  if (burger && mnav) {
    burger.addEventListener('click', function () {
      var open = burger.getAttribute('aria-expanded') === 'true';
      burger.setAttribute('aria-expanded', String(!open));
      mnav.classList.toggle('open', !open);
    });
    mnav.addEventListener('click', function (e) {
      if (e.target.closest('a')) {
        burger.setAttribute('aria-expanded', 'false');
        mnav.classList.remove('open');
      }
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && mnav.classList.contains('open')) {
        burger.setAttribute('aria-expanded', 'false');
        mnav.classList.remove('open');
        burger.focus();
      }
    });
  }

  /* ---- hero film ----
     It autoplays from the markup so it still works without JS. When the
     viewer has asked for reduced motion we drop the element entirely, which
     stops the decode and the download; CSS shows the still frame instead. */
  var film = document.querySelector('.hero__film video');
  if (film && reduced) {
    film.pause();
    film.removeAttribute('autoplay');
    film.remove();
  } else if (film) {
    var played = film.play();
    if (played && typeof played.catch === 'function') {
      played.catch(function () {
        /* autoplay refused — show the settled frame instead of freezing
           on the opening one, which is the clip's most crowded */
        film.closest('.hero__film').classList.add('is-still');
      });
    }
  }

  /* ---- hero scroll expansion ----
     Pulls the film forward and out to fill the screen while the copy fades.
     The scale and offset needed to go from the docked square to a full
     viewport are measured once per resize and handed to CSS as custom
     properties; the scroll handler then only writes --h. Gated to the width
     where the film is actually docked beside the copy, and skipped entirely
     under reduced motion -- in both cases the hero stays one screen tall. */
  var heroEl = document.querySelector('.hero');
  var heroFilm = heroEl && heroEl.querySelector('.hero__film');
  var heroWide = window.matchMedia('(min-width: 1200px)');

  if (heroEl && heroFilm && !reduced && heroWide.matches) {
    heroEl.classList.add('hero--scroll');

    var hQueued = false;
    var wasPast = false;

    var measure = function () {
      var vw = window.innerWidth, vh = window.innerHeight;
      var side = heroFilm.offsetWidth;          /* layout width, transforms excluded */
      if (!side) { return; }
      /* docked centre sits at (vw - side/2, vh/2); bring it to the middle */
      heroEl.style.setProperty('--fx', (side / 2 - vw / 2).toFixed(2) + 'px');
      /* square must cover the longest viewport edge, with a little margin */
      heroEl.style.setProperty('--fk', ((Math.max(vw, vh) / side) * 1.06).toFixed(4));
    };

    var drawHero = function () {
      hQueued = false;
      var r = heroEl.getBoundingClientRect();
      var vh = window.innerHeight;
      /* Reach full screen at 78% of the pinned travel, then hold there while
         the rest scrolls by, so the full-bleed state is a beat rather than a
         single frame before the section releases. The 0.78 also absorbs the
         sticky header's offset, which otherwise left --h short of 1. */
      var span = (r.height - vh) * 0.78;
      var h = span > 0 ? -r.top / span : 0;
      h = h < 0 ? 0 : (h > 1 ? 1 : h);
      heroEl.style.setProperty('--h', h.toFixed(4));
      var past = h > 0.42;   /* copy has fully faded by here */
      if (past !== wasPast) { heroEl.classList.toggle('is-past', past); wasPast = past; }
    };

    var requestHero = function () {
      if (!hQueued) { hQueued = true; window.requestAnimationFrame(drawHero); }
    };

    var syncHero = function () {
      if (heroWide.matches) { measure(); requestHero(); }
      else {
        heroEl.classList.remove('hero--scroll', 'is-past');
        heroEl.style.removeProperty('--h');
        wasPast = false;
      }
    };

    window.addEventListener('scroll', function () {
      if (heroEl.classList.contains('hero--scroll')) { requestHero(); }
    }, { passive: true });
    window.addEventListener('resize', syncHero);
    syncHero();
  }

  /* ---- scroll build ----
     Drives --p (0..1) across the section while it is on screen. CSS does
     the rest. Left alone under reduced motion, where the stylesheet's
     default of 1 already shows the finished, lit sign. */
  var build = document.querySelector('.build');
  /* Only scrub where the stage is actually pinned beside the steps. Narrower
     than that it is not sticky, so scrubbing would animate it off-screen —
     there it just stays at the stylesheet default: finished and lit. */
  var wide = window.matchMedia('(min-width: 1000px)');
  if (build && !reduced && wide.matches) {
    var phaseEl = build.querySelector('.build__phase');
    var PHASES = [
      [0.00, 'Layout'],
      [0.14, 'Returns'],
      [0.44, 'Faces'],
      [0.54, 'Mounted'],
      [0.82, 'Powered']
    ];
    var queued = false;
    var lastPhase = '';

    var draw = function () {
      queued = false;
      var steps = build.querySelector('.build__steps');
      var r = (steps || build).getBoundingClientRect();
      var vh = window.innerHeight || document.documentElement.clientHeight;
      /* progress across exactly the stretch where the stage is pinned */
      var span = r.height - vh * 0.55;
      var p = span > 0 ? (vh * 0.35 - r.top) / span : 1;
      p = p < 0 ? 0 : (p > 1 ? 1 : p);
      build.style.setProperty('--p', p.toFixed(4));

      var name = PHASES[0][1];
      for (var i = 0; i < PHASES.length; i++) {
        if (p >= PHASES[i][0]) name = PHASES[i][1];
      }
      if (phaseEl && name !== lastPhase) { phaseEl.textContent = name; lastPhase = name; }
    };

    var request = function () {
      if (!queued) { queued = true; window.requestAnimationFrame(draw); }
    };

    var sync = function () {
      if (wide.matches) { request(); }
      else { build.style.removeProperty('--p'); lastPhase = ''; }
    };
    window.addEventListener('scroll', function () { if (wide.matches) request(); }, { passive: true });
    window.addEventListener('resize', sync);
    sync();
  }

  /* ---- project brief form ---- */
  var form = document.getElementById('briefForm');
  if (!form) return;

  /* Wire this to the CRM endpoint when it exists. While it is empty the form
     falls back to a pre-filled email so no lead is ever silently dropped. */
  var ENDPOINT = '';
  var FALLBACK_EMAIL = 'ricky@mastersignsandprint.com';

  /* preselect the service from ?type= on the trigger links */
  var params = new URLSearchParams(window.location.search);
  var type = params.get('type');
  if (type) {
    var trig = form.querySelector('[name="trigger"]');
    if (trig) {
      Array.prototype.forEach.call(trig.options, function (o) {
        if (o.value === type) { trig.value = type; }
      });
    }
  }

  function fieldError(input, msg) {
    var box = input.closest('.f');
    var err = box && box.querySelector('.err');
    input.setAttribute('aria-invalid', msg ? 'true' : 'false');
    if (err) { err.textContent = msg || ''; }
  }

  function validate(input) {
    var v = (input.value || '').trim();
    if (input.required && !v) { fieldError(input, 'Required.'); return false; }
    if (input.type === 'email' && v && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) {
      fieldError(input, 'Check the email address.'); return false;
    }
    if (input.type === 'tel' && v && v.replace(/\D/g, '').length < 10) {
      fieldError(input, 'Include the area code.'); return false;
    }
    fieldError(input, '');
    return true;
  }

  Array.prototype.forEach.call(form.querySelectorAll('input,select,textarea'), function (el) {
    el.addEventListener('blur', function () { if (el.value.trim() || el.required) validate(el); });
    el.addEventListener('input', function () {
      if (el.getAttribute('aria-invalid') === 'true') validate(el);
    });
  });

  var status = document.getElementById('formStatus');
  function say(msg) {
    if (!status) return;
    status.hidden = false;
    status.textContent = msg;
  }

  function summarise(data) {
    var lines = [];
    data.forEach(function (value, key) {
      if (key === 'company_website') return; /* honeypot */
      if (String(value).trim()) lines.push(key.replace(/_/g, ' ') + ': ' + value);
    });
    return lines.join('\n');
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();

    /* honeypot */
    var hp = form.querySelector('[name="company_website"]');
    if (hp && hp.value) return;

    var ok = true, first = null;
    Array.prototype.forEach.call(form.querySelectorAll('[required]'), function (el) {
      if (!validate(el)) { ok = false; if (!first) first = el; }
    });
    if (!ok) {
      say('A few fields still need an answer — they are marked below.');
      if (first) { first.focus(); first.scrollIntoView({ block: 'center', behavior: reduced ? 'auto' : 'smooth' }); }
      return;
    }

    var data = new FormData(form);
    var btn = form.querySelector('button[type="submit"]');
    if (btn) { btn.disabled = true; btn.textContent = 'Sending…'; }

    var done = function (sent) {
      if (btn) { btn.disabled = false; btn.textContent = 'Send project brief'; }
      if (sent) {
        say('Brief received. Ricky reviews these himself — expect a reply or a question about the file within one business day.');
        form.reset();
      } else {
        var body = encodeURIComponent(summarise(data));
        var subj = encodeURIComponent('Project brief — ' + (data.get('business') || data.get('name') || 'new enquiry'));
        say('Opening your email app with the brief filled in. If nothing opens, call 754-299-9514.');
        window.location.href = 'mailto:' + FALLBACK_EMAIL + '?subject=' + subj + '&body=' + body;
      }
    };

    if (!ENDPOINT) { done(false); return; }

    fetch(ENDPOINT, { method: 'POST', body: data })
      .then(function (r) { done(r.ok); })
      .catch(function () { done(false); });
  });
})();
