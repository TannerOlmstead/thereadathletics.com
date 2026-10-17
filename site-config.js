/* THE READ Athletics - one switch for sample-data / demo / preview labels.
   SHOW_SAMPLE_LABELS = false  -> labels are hidden or stripped at page load (owner is the only user; site is not public).
   SHOW_SAMPLE_LABELS = true   -> every label is shown exactly as written in the page source and coach.js.
   PRE-LAUNCH: set this to true (or replace all sample data with real data) before publishing. See ROADMAP.md.
   Elements hidden by this script get data-sample-label="hidden" and the class hide-sample-labels is set on <html>. */
(function () {
  'use strict';
  window.SITE_CONFIG = window.SITE_CONFIG || {};
  // Demo route guard (account.js): workspace pages redirect to sign-in.html unless signed in or in owner preview mode. Set false to turn the guard off.
  if (typeof window.SITE_CONFIG.REQUIRE_SIGN_IN === 'undefined') window.SITE_CONFIG.REQUIRE_SIGN_IN = true;
  if (typeof window.SITE_CONFIG.SHOW_SAMPLE_LABELS === 'undefined') window.SITE_CONFIG.SHOW_SAMPLE_LABELS = false;
  if (window.SITE_CONFIG.SHOW_SAMPLE_LABELS) return;
  var root = document.documentElement;
  root.classList.add('hide-sample-labels');

  // Whole-element disclaimers: hidden when the note STARTS with a label word or is the standard sample label.
  var NOTE_SEL = 'p, li, .read-label, .h2h-ai-tag, .msg-banner, .coach-note, .notice, .hint, .price-note, .pill, .tag, .rd-fiction, small';
  var STARTS = /^\W*(demo|sample data|sample event|sample message|fictional|status:\s*(workflow|these|everything|screens)?.*(fictional|demonstration)|preview of|this is a demo|nothing here is real|athlete preview)/i;
  var WHOLE = /(made up for demonstration|demo only|demo seeds|is a demo|a labeled demo|labeled demo|static demonstration|are fictional|is fictional|data is fictional|guardian demo page|demo calendar|demo inbox|sample data\s*\/\s*fictional example|generated from sample data|not a live ai|fictional demonstration|fictional sample)/i;
  // Phrase clean-ups inside text (order matters).
  var STRIPS = [
    [/\s*\([^()]*\b(?:fictional|sample|demo|invented)\b[^()]*\)/gi, ''],
    [/\s+(?:\u00b7\s*)?DEMO\b/g, ''],
    [/\bguardian demo page\b/gi, 'guardian page'],
    [/\s*ALL DATA IS FICTIONAL\.?/gi, ''],
    [/Coach Workspace preview/g, 'Coach Workspace'],
    [/\bStaff names are \.?/g, ''],
    [/\s*(?:[\u2014\u2013-]\s*)?SAMPLE DATA\s*\/\s*FICTIONAL EXAMPLE\.?/gi, ''],
    [/\s*AI Preview\s*[\u2014\u2013-]*\s*Generated From Sample Data/gi, ' AI'],
    [/\s*Preview Of THE READ AI\s*[\u2014\u2013-]*\s*Generated From Sample Data/gi, ''],
    [/\s*[\u2014\u2013-]\s*Generated From Sample Data/gi, ''],
    [/\s*\((?:Fictional|Sample|Demo|demo|sample date|Sample message|sample)\)/g, ''],
    [/\s*\((?:demo|Demo)[^)]*\)/g, ''],
    [/Demo Controls(?: \(preview only\))?/gi, 'Role Switcher'],
    [/\bdemo\s+(inbox|calendar|data)\b/gi, function (m, w) { return w; }],
    [/Reset (inbox|calendar)/g, function (m) { return m; }],
    [/Not linked in demo/g, 'Not linked'],
    [/\bFictional (?=[A-Z])/g, ''],
    [/\b(?:Sample|SAMPLE) (?=Questionnaire|Program Coach)/g, ''],
    [/this page\u2019s fictional data: /gi, 'this page: '],
    [/\bfictional\s+/gi, ''],
    [/\bsample (players|database|schools|events|program|staff|prospects)\b/gi, function (m, w) { return w; }],
    [/\s*Preview\b(?=\s*$)/g, ''],
    [/\bsample\b\s*/gi, '']
  ];
  var LABELW = /fictional|\bdemo\b|sample|made up|invented|demonstration|labeled/i, KEEP = /request a demo|product preview|sample-?\s*(size)/i;
  var dropSent = function (s) {
    if (s.length < 25 || !LABELW.test(s) || KEEP.test(s)) return s;
    var parts = s.split(/(?<=[.!?])\s+/), kept = parts.filter(function (x) { return !LABELW.test(x); });
    return kept.length === parts.length ? s : kept.join(' ');
  };
  var strip = function (s) { var o = s; STRIPS.forEach(function (r) { o = o.replace(r[0], r[1]); }); return o; };
  var needs = /sample|fictional|demo|preview/i;
  var SKIP = { SCRIPT: 1, STYLE: 1, TEXTAREA: 1, NOSCRIPT: 1, TITLE: 1 };

  var sweep = function (scope) {
    if (!scope || scope.nodeType !== 1) return;
    if (SKIP[scope.tagName]) return;
    // 1) hide whole disclaimer elements (decided on the original text)
    var notes = scope.matches && scope.matches(NOTE_SEL) ? [scope] : [];
    Array.prototype.push.apply(notes, scope.querySelectorAll(NOTE_SEL));
    notes.forEach(function (el) {
      if (el.getAttribute('data-sample-label')) return;
      var t = (el.textContent || '').trim();
      if (!t) return;
      if ((STARTS.test(t) || WHOLE.test(t)) && t.length < 520 && !el.querySelector('input,select,button,textarea,table,a')) { el.setAttribute('data-sample-label', 'hidden'); el.hidden = true; }
    });
    // 2) clean remaining text nodes and attributes
    var w = document.createTreeWalker(scope, NodeFilter.SHOW_TEXT, null), n, list = [];
    while ((n = w.nextNode())) { if (n.parentNode && !SKIP[n.parentNode.tagName] && needs.test(n.nodeValue) && !(n.parentNode.closest && n.parentNode.closest('[data-sample-label]'))) list.push(n); }
    list.forEach(function (tn) { var pt = tn.parentNode.tagName, v = strip(/^(P|LI|STRONG|EM|SPAN|DIV|SMALL|B)$/.test(pt) ? dropSent(tn.nodeValue) : tn.nodeValue); if (v !== tn.nodeValue) tn.nodeValue = v; });
    var attrs = scope.querySelectorAll('[aria-label],[title],[placeholder]');
    Array.prototype.forEach.call(attrs, function (el) {
      ['aria-label', 'title', 'placeholder'].forEach(function (a) { var v = el.getAttribute(a); if (v && needs.test(v)) { var s2 = strip(v); if (s2 !== v) el.setAttribute(a, s2); } });
    });
    // 3) hide label elements left empty after cleaning
    Array.prototype.forEach.call(scope.querySelectorAll('.read-label, .h2h-ai-tag, .msg-banner, .coach-note, .notice, .hint, .pill, .tag'), function (el) {
      if (!el.getAttribute('data-sample-label') && !(el.textContent || '').replace(/[\s.\u2014\u2013-]/g, '') && !el.querySelector('img,svg,input,select,button')) { el.setAttribute('data-sample-label', 'hidden'); el.hidden = true; }
    });
  };
  var timer = null, running = false;
  var run = function () { if (running) return; running = true; try { sweep(document.body); } finally { running = false; } };
  var start = function () {
    run();
    new MutationObserver(function () { clearTimeout(timer); timer = setTimeout(run, 30); }).observe(document.body, { childList: true, subtree: true, characterData: false });
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
