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
