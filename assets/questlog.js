/* =====================================================================
   QUEST LOG: a visitor's own list of things to work on with Prologic.
   ---------------------------------------------------------------------
   • A small pin button appears on every card, quest, list item and any
     element with a data-ref attribute. Tapping it adds that spot to the
     visitor's Quest Log.
       data-ref="Custom title"   add it with that title
       data-ref-section="Name"   override the section name
       data-noref                never put a pin on this element
   • The Quest Log button (bottom right) is always there. It opens the log:
       - "Start here, free": the free Tech Help Assessment and the free
         bill check, each with a Book link and an Add button
       - the visitor's list, including quests they type in themselves
       - "Send my Quest Log", which goes to the Pull Up form
   • The log lives in this browser's storage, so it survives page changes.
   • On the home page's Pull Up form, the log fills a "From your Quest
     Log:" box with links, and a hidden field carries it in the message.
   ===================================================================== */
(function () {
  if (window.QuestLog) return;
  var KEY = 'prologic.questlog.v1';
  var AUTO = '[data-ref], article, .card, details, .notices li, .realms li, .steps li, .meet, .quest';
  var SKIP = '[data-noref], nav, header, footer, form, #pullup, .ql-tray, .ql-panel, .topbar';
  var FREE = [
    { k: 'assess', t: 'Free Tech Help Assessment', d: '30 minutes for your phone, tablet or computer. No cost.', u: 'https://cal.com/flo-fokuz-yriw4c/tech-help' },
    { k: 'bill', t: 'Free bill check', d: '30 minutes on your internet or phone bill. Bring a recent bill.', u: 'https://cal.com/flo-fokuz-yriw4c/free-telecom-audit' }
  ];
  var START = 'Start here, free';
  var OWN = 'Added by you';

  /* ---------- storage ---------- */
  var mem = [];
  function load() {
    try { var v = JSON.parse(localStorage.getItem(KEY) || '[]'); return Array.isArray(v) ? v : []; }
    catch (e) { return mem.slice(); }
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
  function isLink(u) { return /^https?:\/\//.test(u); }

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
  var LOG_SVG = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 2h10l4 4v16H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2zm9 1.5V7h3.5zM8 10v2h8v-2zm0 4v2h8v-2zm0-8v2h4V6z"/></svg>';

  function scan(rootEl) {
    var els = (rootEl || document).querySelectorAll(AUTO);
    Array.prototype.forEach.call(els, function (el) {
      if (el.__ql) return;
      if (el.closest(SKIP)) return;
      // skip if an ancestor already has a pin (keeps one pin per block)
      var p = el.parentElement;
      while (p) { if (p.__ql) return; p = p.parentElement; }
      if (!clean(el.textContent)) return;
      el.__ql = true;
      var title = titleOf(el);
      var id = ensureId(el, title);
      if (getComputedStyle(el).position === 'static') el.style.position = 'relative';
      el.classList.add('ql-host');
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'ql-pin';
      b.innerHTML = PIN_SVG + '<span class="ql-sr"></span>';
      b.__item = function () {
        return { t: title, s: sectionOf(el), u: location.origin + location.pathname + '#' + id };
      };
      b.addEventListener('click', function (e) {
        e.preventDefault(); e.stopPropagation();
        var it = b.__item();
        if (has(it.u)) { remove(it.u); toast('Removed from your Quest Log'); }
        else { add(it); toast('Added to your Quest Log: ' + clip(it.t, 36)); bump(); }
      });
      el.appendChild(b);
      paint(b);
    });
  }
  function paint(b) {
    var on = has(b.__item().u);
    b.setAttribute('aria-pressed', on ? 'true' : 'false');
    b.setAttribute('aria-label', (on ? 'Remove from your Quest Log:' : 'Add to your Quest Log:') + ' ' + b.__item().t);
    b.title = on ? 'In your Quest Log. Tap to remove' : 'Add to my Quest Log';
    b.querySelector('.ql-sr').textContent = on ? 'In your Quest Log' : 'Add to Quest Log';
  }

  /* ---------- tray and panel ---------- */
  var tray, panel, count, freeEl, listEl, emptyEl, ownForm, ownInput, toastEl;
  function buildTray() {
    tray = document.createElement('button');
    tray.type = 'button';
    tray.className = 'ql-tray';
    tray.setAttribute('aria-haspopup', 'dialog');
    tray.setAttribute('aria-expanded', 'false');
    tray.innerHTML = LOG_SVG + '<span class="ql-tray-label">Quest Log</span><span class="ql-count" hidden>0</span>';
    count = tray.querySelector('.ql-count');

    panel = document.createElement('div');
    panel.className = 'ql-panel';
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-label', 'Your Quest Log');
    panel.hidden = true;
    panel.innerHTML =
      '<div class="ql-head"><b>Your Quest Log</b><button type="button" class="ql-x" data-ql-close aria-label="Close">&times;</button></div>' +
      '<p class="ql-note">Make your own list of what you want help with. Pin anything on the site, add your own, then send it to me.</p>' +
      '<h3 class="ql-sub">' + START + '</h3>' +
      '<ul class="ql-free"></ul>' +
      '<h3 class="ql-sub">Your quests</h3>' +
      '<p class="ql-empty">Nothing here yet. Tap the pin on any quest or card, or add your own below.</p>' +
      '<ul class="ql-list"></ul>' +
      '<form class="ql-own" autocomplete="off"><label class="ql-sr" for="ql-own-input">Add your own quest</label>' +
      '<input id="ql-own-input" type="text" maxlength="120" placeholder="Add your own, like: set up my new phone">' +
      '<button type="submit">Add</button></form>' +
      '<div class="ql-actions"><a class="ql-go" data-ql-go href="/#pullup">Send my Quest Log</a><button type="button" class="ql-clear" data-ql-clear>Clear all</button></div>';
    freeEl = panel.querySelector('.ql-free');
    listEl = panel.querySelector('.ql-list');
    emptyEl = panel.querySelector('.ql-empty');
    ownForm = panel.querySelector('.ql-own');
    ownInput = panel.querySelector('#ql-own-input');

    tray.addEventListener('click', function () {
      panel.hidden = !panel.hidden;
      tray.setAttribute('aria-expanded', panel.hidden ? 'false' : 'true');
      if (!panel.hidden) panel.querySelector('[data-ql-close]').focus();
    });
    panel.addEventListener('click', function (e) {
      var x = e.target.closest('[data-ql-remove]');
      if (x) { remove(x.getAttribute('data-ql-remove')); return; }
      var a = e.target.closest('[data-ql-add]');
      if (a) {
        var f = FREE.filter(function (q) { return q.k === a.getAttribute('data-ql-add'); })[0];
        if (f) { add({ t: f.t, s: START, u: f.u }); toast('Added to your Quest Log: ' + f.t); bump(); }
        return;
      }
      if (e.target.closest('[data-ql-clear]')) { save([]); return; }
      if (e.target.closest('[data-ql-close]')) { close(); return; }
      if (e.target.closest('[data-ql-go]') && document.getElementById('pu-form')) { close(false); }
    });
    ownForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var t = clip(ownInput.value, 120);
      if (!t) { ownInput.focus(); return; }
      add({ t: t, s: OWN, u: 'own:' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6) });
      ownInput.value = '';
      toast('Added to your Quest Log');
      bump();
      ownInput.focus();
    });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !panel.hidden) close(); });

    toastEl = document.createElement('div');
    toastEl.className = 'ql-toast';
    toastEl.setAttribute('role', 'status');
    document.body.appendChild(panel);
    document.body.appendChild(tray);
    document.body.appendChild(toastEl);
    document.body.classList.add('ql-on');
    if (document.querySelector('.sticky')) document.body.classList.add('ql-lift');
  }
  function close(refocus) {
    panel.hidden = true;
    tray.setAttribute('aria-expanded', 'false');
    if (refocus !== false) tray.focus();
  }
  function linkList(items) {
    return items.map(function (i) {
      var name = isLink(i.u) ? '<a href="' + esc(i.u) + '"' + (/^https?:\/\/cal\.com\//.test(i.u) ? ' target="_blank" rel="noopener"' : '') + '>' + esc(i.t) + '</a>' : '<span class="ql-own-t">' + esc(i.t) + '</span>';
      return '<li>' + name + '<small>' + esc(i.s) + '</small>' +
        '<button type="button" class="ql-x" data-ql-remove="' + esc(i.u) + '" aria-label="Remove ' + esc(i.t) + '">&times;</button></li>';
    }).join('');
  }
  function freeList() {
    return FREE.map(function (q) {
      var on = has(q.u);
      return '<li><b>' + esc(q.t) + '</b><small>' + esc(q.d) + '</small>' +
        '<span class="ql-free-btns"><a class="ql-book" href="' + esc(q.u) + '" target="_blank" rel="noopener">Book it</a>' +
        (on ? '<span class="ql-in">In your log</span>' : '<button type="button" class="ql-add" data-ql-add="' + q.k + '">Add to my log</button>') +
        '</span></li>';
    }).join('');
  }
  function refresh() {
    var items = load();
    if (tray) {
      count.textContent = items.length;
      count.hidden = items.length === 0;
      tray.setAttribute('aria-label', 'Quest Log, ' + items.length + (items.length === 1 ? ' item' : ' items'));
      freeEl.innerHTML = freeList();
      listEl.innerHTML = linkList(items);
      emptyEl.hidden = items.length > 0;
      panel.querySelector('[data-ql-clear]').hidden = items.length === 0;
    }
    Array.prototype.forEach.call(document.querySelectorAll('.ql-pin'), paint);
    syncForm(items);
  }
  function bump() { if (!tray) return; tray.classList.remove('ql-bump'); void tray.offsetWidth; tray.classList.add('ql-bump'); }
  var tt;
  function toast(msg) { if (!toastEl) return; toastEl.textContent = msg; toastEl.classList.add('on'); clearTimeout(tt); tt = setTimeout(function () { toastEl.classList.remove('on'); }, 1800); }

  /* ---------- the Pull Up form ---------- */
  var box, hidden;
  function hookForm() {
    var f = document.getElementById('pu-form');
    if (!f) return;
    hidden = document.createElement('input');
    hidden.type = 'hidden';
    hidden.name = 'Quest Log';
    f.appendChild(hidden);
    box = document.createElement('fieldset');
    box.className = 'ql-about';
    box.hidden = true;
    var msg = f.querySelector('textarea[name="Message"]');
    var anchor = msg ? msg.closest('label') : f.querySelector('.pu-send');
    f.insertBefore(box, anchor);
    box.addEventListener('click', function (e) {
      var x = e.target.closest('[data-ql-remove]');
      if (x) { e.preventDefault(); remove(x.getAttribute('data-ql-remove')); }
    });
    // after a real send, empty the log (runs after the form's own checks)
    f.addEventListener('submit', function (e) {
      if (!e.defaultPrevented) { try { localStorage.removeItem(KEY); } catch (er) {} }
    });
  }
  function syncForm(items) {
    if (!box) return;
    box.hidden = items.length === 0;
    box.innerHTML = '<legend>From your Quest Log:</legend><ul class="ql-list">' + linkList(items) + '</ul>' +
      '<p class="pu-note">Your Quest Log comes through with your message. Tap &times; to drop one.</p>';
    hidden.value = items.map(function (i, n) {
      return (n + 1) + '. ' + i.t + ' (' + i.s + ')' + (isLink(i.u) ? ' ' + i.u : '');
    }).join('\n');
  }

  /* ---------- styles ---------- */
  function css() {
    var s = document.createElement('style');
    s.textContent =
      'li.ql-host{padding-right:50px!important}.ql-host:not(li)>.ql-pin{top:-16px;right:14px;opacity:1;background:#000}' +
      'body.ql-on{padding-bottom:84px}' +
      '.ql-pin{position:absolute;top:8px;right:8px;z-index:3;width:34px;height:34px;display:grid;place-items:center;border-radius:50%;border:1px solid rgba(254,252,143,.55);background:rgba(0,0,0,.72);color:#fefc8f;cursor:pointer;opacity:.78;transition:opacity .15s,transform .15s,background .15s;padding:0}' +
      '.ql-pin svg{width:17px;height:17px;fill:currentColor}' +
      '.ql-host:hover>.ql-pin,.ql-pin:focus-visible{opacity:1}' +
      '.ql-pin:hover{transform:scale(1.08)}' +
      '.ql-pin[aria-pressed=true]{background:#51bf57;color:#000;border-color:#000;opacity:1}' +
      '.ql-pin:focus-visible{outline:3px solid #fefc8f;outline-offset:2px}' +
      '.ql-sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0)}' +
      '.ql-tray{position:fixed;right:16px;bottom:16px;z-index:60;display:flex;align-items:center;gap:8px;padding:10px 14px 10px 12px;border-radius:999px;border:2px solid #000;background:#fefc8f;color:#000;font:600 15px/1 "Playfair Display",Georgia,serif;cursor:pointer;box-shadow:0 0 0 2px #fefc8f,0 8px 20px rgba(0,0,0,.5)}' +
      '.ql-tray svg{width:18px;height:18px;fill:currentColor}' +
      '.ql-count{min-width:24px;height:24px;padding:0 6px;border-radius:999px;background:#000;color:#fefc8f;display:grid;place-items:center;font:700 13px/1 system-ui,sans-serif}.ql-count[hidden]{display:none}' +
      '.ql-bump{animation:qlBump .35s ease}@keyframes qlBump{50%{transform:scale(1.12)}}' +
      '.ql-panel{position:fixed;right:16px;bottom:76px;z-index:61;width:min(390px,calc(100vw - 32px));max-height:min(75vh,600px);overflow:auto;background:#0e0e0e;color:#fff;border:1px solid rgba(254,252,143,.5);border-radius:15px;padding:14px 16px;box-shadow:0 14px 40px rgba(0,0,0,.6);font-family:"Playfair Display",Georgia,serif;text-align:left}' +
      '.ql-panel[hidden]{display:none}' +
      '.ql-head{display:flex;justify-content:space-between;align-items:center}.ql-head b{font:300 1.35rem "Oswald",sans-serif;color:#fefc8f;letter-spacing:.03em}' +
      '.ql-note{margin:4px 0 10px;color:#d2d2d2;font-size:.9rem}' +
      '.ql-sub{margin:12px 0 6px;font:600 .8rem/1 system-ui,sans-serif;letter-spacing:.08em;text-transform:uppercase;color:#7be07f}' +
      '.ql-empty{margin:0 0 8px;color:#aaa;font-size:.88rem}.ql-empty[hidden]{display:none}' +
      '.ql-list,.ql-free{list-style:none;margin:0;padding:0;display:grid;gap:8px}' +
      '.ql-list li{display:grid;grid-template-columns:1fr auto;gap:0 10px;align-items:center;background:#000;border:1px solid #2b2b2b;border-radius:10px;padding:8px 10px}' +
      '.ql-list li a,.ql-list li .ql-own-t{color:#fefc8f;font-weight:600;word-break:break-word}.ql-list li small{grid-column:1;color:#aaa;font-size:.8rem}' +
      '.ql-list li .ql-x{grid-row:1/span 2;grid-column:2}' +
      '.ql-free li{display:grid;gap:4px;background:rgba(81,191,87,.07);border:1px solid rgba(81,191,87,.45);border-radius:10px;padding:10px}' +
      '.ql-free li b{color:#fff;font-weight:600}.ql-free li small{color:#cfcfcf;font-size:.82rem}' +
      '.ql-free-btns{display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-top:4px}' +
      '.ql-book{background:#51bf57;color:#000;border-radius:8px;padding:7px 12px;font:600 14px system-ui,sans-serif;text-decoration:none}' +
      '.ql-add{background:none;border:1px solid #51bf57;color:#7be07f;border-radius:8px;padding:6px 11px;font:600 14px system-ui,sans-serif;cursor:pointer}' +
      '.ql-in{color:#7be07f;font:600 13px system-ui,sans-serif}' +
      '.ql-x{width:32px;height:32px;border-radius:50%;border:1px solid #444;background:transparent;color:#fff;font-size:20px;line-height:1;cursor:pointer}.ql-x:hover{border-color:#fefc8f;color:#fefc8f}' +
      '.ql-own{display:flex;gap:8px;margin-top:10px}' +
      '.ql-own input{flex:1;min-width:0;font:16px system-ui,sans-serif;color:#fff;background:#000;border:1px solid #444;border-radius:10px;padding:10px}' +
      '.ql-own input:focus{outline:2px solid #fefc8f;outline-offset:1px}' +
      '.ql-own button{background:#000;color:#fefc8f;border:1px solid #fefc8f;border-radius:10px;padding:0 14px;font:600 15px system-ui,sans-serif;cursor:pointer}' +
      '.ql-actions{display:flex;gap:10px;align-items:center;justify-content:space-between;margin-top:14px;flex-wrap:wrap}' +
      '.ql-go{background:#fefc8f;color:#000;border:2px solid #000;box-shadow:0 0 0 2px #fefc8f;border-radius:10px;padding:9px 14px;font-weight:600;text-decoration:none}' +
      '.ql-clear{background:none;border:0;color:#d2d2d2;text-decoration:underline;cursor:pointer;font:inherit}.ql-clear[hidden]{display:none}' +
      '.ql-toast{position:fixed;left:50%;top:120px;z-index:62;transform:translate(-50%,-10px);background:#51bf57;color:#000;padding:9px 16px;border-radius:999px;font:600 14px system-ui,sans-serif;opacity:0;pointer-events:none;transition:opacity .2s,transform .2s;max-width:calc(100vw - 32px)}' +
      '.ql-toast.on{opacity:1;transform:translate(-50%,0)}' +
      '.ql-about{border:2px solid #51bf57!important;background:rgba(81,191,87,.06)}.ql-about legend{color:#7be07f}.ql-about[hidden]{display:none}' +
      '.ql-flash{animation:qlFlash 2.2s ease}@keyframes qlFlash{0%,40%{box-shadow:0 0 0 4px #fefc8f}100%{box-shadow:0 0 0 0 transparent}}' +
      '@media (max-width:640px){body.ql-lift .ql-tray{bottom:78px}body.ql-lift .ql-panel{bottom:138px;max-height:calc(100vh - 170px)}body.ql-lift.ql-on{padding-bottom:146px}}' +
      '@media (prefers-reduced-motion:reduce){.ql-pin,.ql-tray,.ql-toast{transition:none}.ql-bump,.ql-flash{animation:none}}' +
      '@media print{.ql-pin,.ql-tray,.ql-panel,.ql-toast{display:none!important}}';
    document.head.appendChild(s);
  }

  /* ---------- start ---------- */
  function start() {
    css();
    buildTray();
    hookForm();
    scan();
    refresh();
    // highlight the spot a Quest Log link points to
    var target = location.hash && document.getElementById(location.hash.slice(1));
    if (target && target.classList.contains('ql-host')) { target.scrollIntoView({ block: 'center' }); target.classList.add('ql-flash'); }
    window.addEventListener('storage', function (e) { if (e.key === KEY) refresh(); });
    window.addEventListener('pageshow', refresh);
  }
  window.QuestLog = { scan: function (el) { scan(el); refresh(); }, items: load, clear: function () { save([]); } };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
