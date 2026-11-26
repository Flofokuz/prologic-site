/* =====================================================================
   "BRING THIS UP" — pin any part of the site into the Pull Up form.
   ---------------------------------------------------------------------
   • A small pin button appears on every card, quest, list item and any
     element with a data-ref attribute.
       data-ref="Custom title"   pin it with that title
       data-ref-section="Name"   override the section name
       data-noref                never put a pin on this element
   • Pinned items go in a tray (bottom right) with a count badge. The tray
     lives in this browser's storage, so it survives page changes.
   • On the home page's Pull Up form, pinned items fill a "This is about:"
     list with links, and a hidden field carries them in the message.
   ===================================================================== */
(function () {
  if (window.BringUp) return;
  var KEY = 'prologic.bringup.v1';
  var AUTO = '[data-ref], article, .card, details, .notices li, .realms li, .steps li, .meet, .quest';
  var SKIP = '[data-noref], nav, header, footer, form, #pullup, .bu-tray, .bu-panel, .topbar';

  /* ---------- storage ---------- */
  var mem = [];
  function load() {
    try { var v = JSON.parse(localStorage.getItem(KEY) || '[]'); return Array.isArray(v) ? v : []; }
    catch (e) { return mem; }
  }
  function save(items) {
    mem = items;
    try { localStorage.setItem(KEY, JSON.stringify(items)); } catch (e) {}
    refresh();
  }
  function has(url) { return load().some(function (i) { return i.u === url; }); }
  function add(item) { var a = load(); if (!a.some(function (i) { return i.u === item.u; })) { a.push(item); save(a); } }
  function remove(url) { save(load().filter(function (i) { return i.u !== url; })); }

  /* ---------- helpers ---------- */
  function clean(s) { return String(s || '').replace(/\s+/g, ' ').trim(); }
  function clip(s, n) { s = clean(s); return s.length > n ? s.slice(0, n - 1) + '…' : s; }
  function slug(s) { return clean(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 48) || 'item'; }
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function pageName() { return clean(document.title.split('·')[0]) || 'Home'; }

  function titleOf(el) {
    var r = el.getAttribute('data-ref');
    if (r) return clean(r);
    var h = el.querySelector('h1,h2,h3,h4,.lore,summary,strong,b');
    var t = h ? h.textContent : el.textContent;
    var real = el.querySelector('.real');
    if (real && h && real !== h) t = clean(real.textContent) + ': ' + clean(t);
    return clip(t, 70);
  }
  function sectionOf(el) {
    var s = el.closest('[data-ref-section]');
    if (s) return clean(s.getAttribute('data-ref-section'));
    var sec = el.parentElement && el.parentElement.closest('section');
    while (sec) {
      // nearest heading above this element inside the section
      var hs = sec.querySelectorAll('h2'), h = null;
      for (var k = 0; k < hs.length; k++) {
        if (!el.contains(hs[k]) && (hs[k].compareDocumentPosition(el) & 4)) h = hs[k];
      }
      if (h) return clip(h.textContent, 50) + ' · ' + pageName();
      var lab = sec.getAttribute('aria-labelledby'), lh = lab && document.getElementById(lab);
      if (lh && !el.contains(lh)) return clip(lh.textContent, 50) + ' · ' + pageName();
      if (sec.getAttribute('aria-label')) return clean(sec.getAttribute('aria-label')) + ' · ' + pageName();
      sec = sec.parentElement && sec.parentElement.closest('section');
    }
    return pageName();
  }
  function ensureId(el, title) {
    if (el.id) return el.id;
    var base = 'ref-' + slug(title), id = base, n = 2;
    while (document.getElementById(id)) id = base + '-' + n++;
    el.id = id;
    return id;
  }

  /* ---------- pins ---------- */
  var PIN_SVG = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14.5 2.5l7 7-2.1.7-3.6 3.6.6 4.6-1.4 1.4-4.2-4.2L5 21.4 3.6 20l5.8-5.8-4.2-4.2 1.4-1.4 4.6.6 3.6-3.6z"/></svg>';

  function scan(rootEl) {
    var els = (rootEl || document).querySelectorAll(AUTO);
    Array.prototype.forEach.call(els, function (el) {
      if (el.__bu) return;
      if (el.closest(SKIP)) return;
      // skip if an ancestor already has a pin (keeps one pin per block)
      var p = el.parentElement;
      while (p) { if (p.__bu) return; p = p.parentElement; }
      if (!clean(el.textContent)) return;
      el.__bu = true;
      var title = titleOf(el);
      var id = ensureId(el, title);
      if (getComputedStyle(el).position === 'static') el.style.position = 'relative';
      el.classList.add('bu-host');
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'bu-pin';
      b.innerHTML = PIN_SVG + '<span class="bu-sr"></span>';
      b.__item = function () {
        return { t: title, s: sectionOf(el), u: location.origin + location.pathname + '#' + id };
      };
      b.addEventListener('click', function (e) {
        e.preventDefault(); e.stopPropagation();
        var it = b.__item();
        if (has(it.u)) { remove(it.u); toast('Removed from your list'); }
        else { add(it); toast('Added: ' + clip(it.t, 40)); bump(); }
      });
      el.appendChild(b);
      paint(b);
    });
  }
  function paint(b) {
    var on = has(b.__item().u);
    b.setAttribute('aria-pressed', on ? 'true' : 'false');
    b.setAttribute('aria-label', (on ? 'Remove from' : 'Bring this up:') + ' ' + b.__item().t);
    b.title = on ? 'Pinned. Tap to remove' : 'Bring this up';
    b.querySelector('.bu-sr').textContent = on ? 'Pinned' : 'Pin';
  }

  /* ---------- tray ---------- */
  var tray, panel, count, toastEl;
  function buildTray() {
    tray = document.createElement('button');
    tray.type = 'button';
    tray.className = 'bu-tray';
    tray.setAttribute('aria-haspopup', 'dialog');
    tray.innerHTML = PIN_SVG + '<span class="bu-tray-label">Bring this up</span><span class="bu-count">0</span>';
    count = tray.querySelector('.bu-count');
    panel = document.createElement('div');
    panel.className = 'bu-panel';
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-label', 'Your pinned items');
    panel.hidden = true;
    tray.addEventListener('click', function () { panel.hidden = !panel.hidden; if (!panel.hidden) panel.querySelector('button,a').focus(); });
    panel.addEventListener('click', function (e) {
      var x = e.target.closest('[data-bu-remove]');
      if (x) { remove(x.getAttribute('data-bu-remove')); return; }
      if (e.target.closest('[data-bu-clear]')) { save([]); return; }
      if (e.target.closest('[data-bu-close]')) { panel.hidden = true; tray.focus(); return; }
      if (e.target.closest('[data-bu-go]') && document.getElementById('pu-form')) { panel.hidden = true; }
    });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !panel.hidden) { panel.hidden = true; tray.focus(); } });
    toastEl = document.createElement('div');
    toastEl.className = 'bu-toast';
    toastEl.setAttribute('role', 'status');
    document.body.appendChild(panel);
    document.body.appendChild(tray);
    document.body.appendChild(toastEl);
  }
  function linkList(items, removable) {
    return items.map(function (i) {
      return '<li><a href="' + esc(i.u) + '">' + esc(i.t) + '</a><small>' + esc(i.s) + '</small>' +
        (removable ? '<button type="button" class="bu-x" data-bu-remove="' + esc(i.u) + '" aria-label="Remove ' + esc(i.t) + '">&times;</button>' : '') + '</li>';
    }).join('');
  }
  function refresh() {
    var items = load();
    if (tray) {
      count.textContent = items.length;
      tray.hidden = items.length === 0;
      document.body.classList.toggle('bu-has', items.length > 0);
      if (!items.length) panel.hidden = true;
      panel.innerHTML =
        '<div class="bu-head"><b>Bring this up</b><button type="button" class="bu-x" data-bu-close aria-label="Close">&times;</button></div>' +
        '<p class="bu-note">Everything you pin lands in your message, with links straight back to it.</p>' +
        '<ul class="bu-list">' + linkList(items, true) + '</ul>' +
        '<div class="bu-actions"><a class="bu-go" data-bu-go href="/#pullup">Send these in a message</a><button type="button" class="bu-clear" data-bu-clear>Clear all</button></div>';
    }
    Array.prototype.forEach.call(document.querySelectorAll('.bu-pin'), paint);
    syncForm(items);
  }
  function bump() { if (!tray) return; tray.classList.remove('bu-bump'); void tray.offsetWidth; tray.classList.add('bu-bump'); }
  var tt;
  function toast(msg) { if (!toastEl) return; toastEl.textContent = msg; toastEl.classList.add('on'); clearTimeout(tt); tt = setTimeout(function () { toastEl.classList.remove('on'); }, 1800); }

  /* ---------- the Pull Up form ---------- */
  var box, hidden;
  function hookForm() {
    var f = document.getElementById('pu-form');
    if (!f) return;
    hidden = document.createElement('input');
    hidden.type = 'hidden';
    hidden.name = 'This is about';
    f.appendChild(hidden);
    box = document.createElement('fieldset');
    box.className = 'bu-about';
    box.hidden = true;
    var msg = f.querySelector('textarea[name="Message"]');
    var anchor = msg ? msg.closest('label') : f.querySelector('.pu-send');
    f.insertBefore(box, anchor);
    box.addEventListener('click', function (e) {
      var x = e.target.closest('[data-bu-remove]');
      if (x) { e.preventDefault(); remove(x.getAttribute('data-bu-remove')); }
    });
    // after a real send, empty the tray (runs after the form's own checks)
    f.addEventListener('submit', function (e) {
      if (!e.defaultPrevented) { try { localStorage.removeItem(KEY); } catch (er) {} }
    });
  }
  function syncForm(items) {
    if (!box) return;
    box.hidden = items.length === 0;
    box.innerHTML = '<legend>This is about:</legend><ul class="bu-list">' + linkList(items, true) + '</ul>' +
      '<p class="pu-note">These links come through with your message. Tap &times; to drop one.</p>';
    hidden.value = items.map(function (i, n) { return (n + 1) + '. ' + i.t + ' (' + i.s + ') ' + i.u; }).join('\n');
  }

  /* ---------- styles ---------- */
  function css() {
    var s = document.createElement('style');
    s.textContent =
      'li.bu-host{padding-right:50px!important}.bu-host:not(li)>.bu-pin{top:-16px;right:14px;opacity:1;background:#000}'+
      'body.bu-has{padding-bottom:84px}' +
      '.bu-pin{position:absolute;top:8px;right:8px;z-index:3;width:34px;height:34px;display:grid;place-items:center;border-radius:50%;border:1px solid rgba(254,252,143,.55);background:rgba(0,0,0,.72);color:#fefc8f;cursor:pointer;opacity:.78;transition:opacity .15s,transform .15s,background .15s;padding:0}' +
      '.bu-pin svg{width:17px;height:17px;fill:currentColor}' +
      '.bu-host:hover>.bu-pin,.bu-pin:focus-visible{opacity:1}' +
      '.bu-pin:hover{transform:scale(1.08)}' +
      '.bu-pin[aria-pressed=true]{background:#51bf57;color:#000;border-color:#000;opacity:1}' +
      '.bu-pin:focus-visible{outline:3px solid #fefc8f;outline-offset:2px}' +
      '.bu-sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0)}' +
      '.bu-tray{position:fixed;right:16px;bottom:16px;z-index:60;display:flex;align-items:center;gap:8px;padding:10px 14px 10px 12px;border-radius:999px;border:2px solid #000;background:#fefc8f;color:#000;font:600 15px/1 "Playfair Display",Georgia,serif;cursor:pointer;box-shadow:0 0 0 2px #fefc8f,0 8px 20px rgba(0,0,0,.5)}' +
      '.bu-tray[hidden]{display:none}' +
      '.bu-tray svg{width:18px;height:18px;fill:currentColor}' +
      '.bu-count{min-width:24px;height:24px;padding:0 6px;border-radius:999px;background:#000;color:#fefc8f;display:grid;place-items:center;font:700 13px/1 system-ui,sans-serif}' +
      '.bu-bump{animation:buBump .35s ease}@keyframes buBump{50%{transform:scale(1.12)}}' +
      '.bu-panel{position:fixed;right:16px;bottom:76px;z-index:61;width:min(380px,calc(100vw - 32px));max-height:min(70vh,520px);overflow:auto;background:#0e0e0e;color:#fff;border:1px solid rgba(254,252,143,.5);border-radius:15px;padding:14px 16px;box-shadow:0 14px 40px rgba(0,0,0,.6);font-family:"Playfair Display",Georgia,serif}' +
      '.bu-panel[hidden]{display:none}' +
      '.bu-head{display:flex;justify-content:space-between;align-items:center}.bu-head b{font:300 1.3rem "Oswald",sans-serif;color:#fefc8f;letter-spacing:.03em}' +
      '.bu-note{margin:4px 0 10px;color:#d2d2d2;font-size:.9rem}' +
      '.bu-list{list-style:none;margin:0;padding:0;display:grid;gap:8px}' +
      '.bu-list li{display:grid;grid-template-columns:1fr auto;gap:0 10px;align-items:center;background:#000;border:1px solid #2b2b2b;border-radius:10px;padding:8px 10px}' +
      '.bu-list li a{color:#fefc8f;font-weight:600;word-break:break-word}.bu-list li small{grid-column:1;color:#aaa;font-size:.8rem}' +
      '.bu-list li .bu-x{grid-row:1/span 2;grid-column:2}' +
      '.bu-x{width:32px;height:32px;border-radius:50%;border:1px solid #444;background:transparent;color:#fff;font-size:20px;line-height:1;cursor:pointer}.bu-x:hover{border-color:#fefc8f;color:#fefc8f}' +
      '.bu-actions{display:flex;gap:10px;align-items:center;justify-content:space-between;margin-top:12px;flex-wrap:wrap}' +
      '.bu-go{background:#fefc8f;color:#000;border:2px solid #000;box-shadow:0 0 0 2px #fefc8f;border-radius:10px;padding:9px 14px;font-weight:600;text-decoration:none}' +
      '.bu-clear{background:none;border:0;color:#d2d2d2;text-decoration:underline;cursor:pointer;font:inherit}' +
      '.bu-toast{position:fixed;left:50%;top:120px;z-index:62;transform:translate(-50%,-10px);background:#51bf57;color:#000;padding:9px 16px;border-radius:999px;font:600 14px system-ui,sans-serif;opacity:0;pointer-events:none;transition:opacity .2s,transform .2s;max-width:calc(100vw - 32px)}' +
      '.bu-toast.on{opacity:1;transform:translate(-50%,0)}' +
      '.bu-about{border:2px solid #51bf57!important;background:rgba(81,191,87,.06)}.bu-about legend{color:#7be07f}.bu-about[hidden]{display:none}' +
      '.bu-flash{animation:buFlash 2.2s ease}@keyframes buFlash{0%,40%{box-shadow:0 0 0 4px #fefc8f}100%{box-shadow:0 0 0 0 transparent}}' +
      '@media (prefers-reduced-motion:reduce){.bu-pin,.bu-tray,.bu-toast{transition:none}.bu-bump,.bu-flash{animation:none}}' +
      '@media print{.bu-pin,.bu-tray,.bu-panel,.bu-toast{display:none!important}}';
    document.head.appendChild(s);
  }

  /* ---------- start ---------- */
  function start() {
    css();
    buildTray();
    hookForm();
    scan();
    refresh();
    // highlight the spot a pinned link points to
    var target = location.hash && document.getElementById(location.hash.slice(1));
    if (target && target.classList.contains('bu-host')) { target.scrollIntoView({ block: 'center' }); target.classList.add('bu-flash'); }
    window.addEventListener('storage', function (e) { if (e.key === KEY) refresh(); });
    window.addEventListener('pageshow', refresh);
  }
  window.BringUp = { scan: function (el) { scan(el); refresh(); }, items: load, clear: function () { save([]); } };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
