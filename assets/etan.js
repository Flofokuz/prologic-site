/* ETAN page builder. One template for every affiliate page plus the hub.
   You should not need to edit this file; edit /assets/etan-data.js instead. */
(function () {
  var list = window.ETAN || [];
  var root = document.getElementById('etan-root');
  if (!root) return;

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function safeUrl(u) { return /^https:\/\//i.test(u || '') ? u : ''; }
  function fullName(a) { return a.alias ? a.name + ' “' + a.alias + '”' : a.name; }

  var topbar =
    '<div class="topbar"><div class="wrap"><header class="top">' +
    '<div class="brand"><a href="/"><img src="/assets/falcon-64.png" alt="" width="30" height="30"><span class="bt">PROLOGIC <span>STRATEGIES</span></span></a></div>' +
    '<nav class="sitenav" aria-label="Site"><a href="/">Home</a><a href="/xtrahype/">The show</a><a href="/about/">About</a><a href="/#tools">Free tools</a><a href="/quests/" class="qlink" aria-current="page">Quest Board</a><a href="/GroundLevel/" class="hire">Join the team</a><a href="/#pullup">Pull up</a></nav>' +
    '</header></div></div>';

  var wave = '<svg class="wave" viewBox="0 0 2400 110" preserveAspectRatio="none" aria-hidden="true"><path class="w1" d="M0 46 Q150 0 300 46 T600 46 T900 46 T1200 46 T1500 46 T1800 46 T2100 46 T2400 46 V110 H0Z"/><path class="w2" d="M0 76 Q150 34 300 76 T600 76 T900 76 T1200 76 T1500 76 T1800 76 T2100 76 T2400 76 V110 H0Z"/></svg>';

  var foot = '<footer>&copy; ' + new Date().getFullYear() + ' Prologic Strategies LLC &middot; Bronx, New York &middot; <a href="/etan/">Extended Team Affiliates Network</a></footer>';

  function bookBtn(a, cls) {
    var u = safeUrl(a.calLink);
    return u
      ? '<a class="btn solid ' + (cls || '') + '" href="' + esc(u) + '" target="_blank" rel="noopener">Book a time</a>'
      : '<span class="btn solid is-off ' + (cls || '') + '" aria-disabled="true">Booking opens soon</span>';
  }
  function payBtn(a) {
    var u = safeUrl(a.payLink);
    return u ? '<a class="btn ghost" href="' + esc(u) + '" target="_blank" rel="noopener">' + esc(a.payLabel || ('Pay ' + a.name)) + '</a>' : '';
  }

  /* ---------- one affiliate's own page ---------- */
  function renderAffiliate(a) {
    document.title = a.lore + ' · ' + a.name + ' · Extended Team · Prologic Strategies';
    var offers = (a.offers || []).map(function (o) { return '<li>' + esc(o) + '</li>'; }).join('');
    var hasPay = !!safeUrl(a.payLink);
    root.innerHTML =
      topbar +
      '<div class="page-head parch"><div class="wrap"><div class="title">' +
      '<p class="etan-kicker"><a href="/etan/">&larr; The Extended Team</a></p>' +
      '<h1 class="amark"><span class="ps">' + esc(a.lore) + '</span><span class="ff">' + esc(a.name.toUpperCase()) + '</span></h1>' +
      (a.alias ? '<p class="etan-alias">aka ' + esc(a.alias) + '</p>' : '') +
      '<p class="qlead">' + esc(a.tagline) + '</p>' +
      '</div></div>' + wave + '</div>' +
      '<div class="wrap">' +
      (a.draft ? '<p class="etan-draft">This page is in progress. Details are being finalized with ' + esc(a.name) + '.</p>' : '') +
      '<section aria-labelledby="h-offer"><div class="board etan-one">' +
      '<article class="quest" id="offer" data-ref="' + esc(a.name + ': what they offer') + '"><p class="real">What ' + esc(a.name) + ' offers</p><h2 class="lore" id="h-offer">' + esc(a.lore) + '</h2>' +
      '<ul class="etan-offers">' + offers + '</ul>' +
      '<dl><dt>Where</dt><dd>' + esc(a.area || 'To be confirmed') + '</dd><dt>With</dt><dd>' + esc(fullName(a)) + '</dd></dl>' +
      '<div class="btns">' + bookBtn(a) + payBtn(a) + '</div></article>' +
      '</div></section>' +
      (a.about ? '<section aria-labelledby="h-about"><h2 id="h-about">About ' + esc(a.name) + '</h2><p class="lead">' + esc(a.about) + '</p></section>' : '') +
      '<section aria-labelledby="h-how"><h2 id="h-how">How it works</h2><ol class="steps">' +
      '<li data-ref="' + esc(a.name + ': pick a time') + '" id="step-book">Pick a time that works on ' + esc(a.name) + '&rsquo;s calendar.</li>' +
      '<li data-ref="' + esc(a.name + ': meet up') + '" id="step-meet">Meet by phone, video or in person, whatever you set up together.</li>' +
      '<li data-ref="' + esc(a.name + ': paying') + '" id="step-pay">' + (hasPay ? 'Pay ' + esc(a.name) + ' directly. The money goes straight to them.' : 'Settle up with ' + esc(a.name) + ' directly. The money goes straight to them.') + '</li>' +
      '</ol></section>' +
      '<p class="etan-keep">Your page, your clients, yours to keep.</p>' +
      foot + '</div>';
  }

  /* ---------- the hub ---------- */
  function renderHub() {
    var cards = list.map(function (a) {
      return '<article class="quest" id="aff-' + esc(a.id) + '" data-ref="' + esc('Affiliate: ' + fullName(a)) + '">' +
        '<p class="real">' + esc(fullName(a)) + '</p><h3 class="lore">' + esc(a.lore) + '</h3>' +
        '<p>' + esc(a.tagline) + '</p>' +
        '<dl><dt>Where</dt><dd>' + esc(a.area || 'To be confirmed') + '</dd><dt>Booking</dt><dd>' + (safeUrl(a.calLink) ? 'Open now' : 'Opens soon') + '</dd></dl>' +
        '<div class="btns"><a class="btn ghost" href="/etan/' + esc(a.id) + '/">See their page</a>' + bookBtn(a) + '</div></article>';
    }).join('');
    cards += '<article class="quest" id="aff-you" data-ref="Joining the Extended Team"><p class="real">Open seat</p><h3 class="lore">Your Name Here</h3>' +
      '<p>Got a skill or a service people in the network need? Get your own page and booking link. Your clients stay yours.</p>' +
      '<div class="btns"><a class="btn solid" href="/#pullup">Pull up and ask</a></div></article>';

    root.innerHTML =
      topbar +
      '<div class="page-head parch"><div class="wrap"><div class="title">' +
      '<h1 class="amark"><span class="ps">The Extended</span><span class="ff">TEAM</span></h1>' +
      '<p class="qlead">The Extended Team Affiliates Network: people in our circle you can book directly. Each one has their own page, their own calendar and their own way to get paid.</p>' +
      '</div></div>' + wave + '</div>' +
      '<div class="wrap"><section aria-labelledby="h-aff"><h2 class="crier-h" id="h-aff">Affiliates</h2>' +
      '<div class="board">' + cards + '</div></section>' +
      '<p class="etan-keep">Your page, your clients, yours to keep.</p>' + foot + '</div>';
  }

  var id = document.body.dataset.affiliate;
  if (id) {
    var a = list.filter(function (x) { return x.id === id; })[0];
    if (a) renderAffiliate(a);
    else root.innerHTML = topbar + '<div class="wrap"><section><h2>Page not found</h2><p class="lead">This affiliate page has not been set up yet. <a href="/etan/">See the Extended Team</a>.</p></section>' + foot + '</div>';
  } else {
    renderHub();
  }
})();
