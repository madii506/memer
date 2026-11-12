// memer: turn any stock into a meme. every stock is a green key in pixel shades, dressed by today's real move.
(() => {
  const CONFIG = { ca: '', x: '' };   // set the coin's CA and X link here when they exist; the pill shows only then
  const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches, HOVER = matchMedia('(hover: hover)').matches;
  const html = document.documentElement;
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const TILE = ['#3f6bff', '#f4ecd9', '#ffad33', '#8f6dff', '#ff6b8b', '#26c6c6'];
  const FIT = i => `/assets/img/fits/${i % 8}.webp`;
  // ticker, name, groups
  const STOCKS = [
    ['NVDA', 'NVIDIA', 'tech'], ['TSLA', 'Tesla', 'tech meme'], ['SPCX', 'SpaceX', 'tech meme'], ['AAPL', 'Apple', 'tech'], ['MSFT', 'Microsoft', 'tech'],
    ['AMZN', 'Amazon', 'tech'], ['GOOGL', 'Alphabet', 'tech'], ['META', 'Meta', 'tech'], ['NFLX', 'Netflix', 'tech'], ['AMD', 'AMD', 'tech'],
    ['AVGO', 'Broadcom', 'tech'], ['PLTR', 'Palantir', 'tech meme'], ['ORCL', 'Oracle', 'tech'], ['INTC', 'Intel', 'tech'], ['IBM', 'IBM', 'tech classic'],
    ['CRM', 'Salesforce', 'tech'], ['CRWD', 'CrowdStrike', 'tech'], ['APP', 'AppLovin', 'tech'], ['COIN', 'Coinbase', 'crypto'], ['MSTR', 'Strategy', 'crypto meme'],
    ['HOOD', 'Robinhood', 'crypto meme'], ['CRCL', 'Circle', 'crypto'], ['DFDV', 'DFDV', 'crypto'], ['GME', 'GameStop', 'meme'], ['OPEN', 'Opendoor', 'meme'],
    ['SPY', 'S&P 500', 'funds'], ['QQQ', 'Nasdaq 100', 'funds'], ['TQQQ', 'Nasdaq 100 3x', 'funds meme'], ['GLD', 'Gold', 'funds'], ['BRK.B', 'Berkshire', 'classic'],
    ['JPM', 'JPMorgan', 'classic'], ['V', 'Visa', 'classic'], ['WMT', 'Walmart', 'classic'], ['MCD', "McDonald's", 'classic meme'], ['KO', 'Coca-Cola', 'classic'],
    ['PEP', 'PepsiCo', 'classic'], ['XOM', 'Exxon', 'classic'], ['LLY', 'Eli Lilly', 'classic'], ['UNH', 'UnitedHealth', 'classic'], ['NVO', 'Novo Nordisk', 'classic'],
  ];
  const NAME = Object.fromEntries(STOCKS.map(s => [s[0], s[1]])), GROUP = Object.fromEntries(STOCKS.map(s => [s[0], s[2]]));
  const SYMS = STOCKS.map(s => s[0]);
  const GLABEL = { tech: 'tech', crypto: 'crypto', funds: 'fund', classic: 'blue chip', meme: 'meme stock' };
  const LINES = {
    up: ['the shades stay on.', 'green day. same face.', 'unbothered. moisturized. up.', 'not even surprised.', 'the crown fits.', 'pressed the green key.', 'told you. wearing shades.'],
    down: ["it's a dip. the shades stay on.", 'red day. still in shades.', 'down bad. dressed well.', 'beanie on. shades on.', 'pressing the same key again.', 'cold out there. still cool.'],
    flat: ['nothing happened. the shades stay on.', 'flat day. flat face.', 'the market took a nap.'],
  };
  const pick = a => a[Math.floor(Math.random() * a.length)];
  const store = { get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch { return d; } }, set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} } };
  let toastT; function toast(t) { const e = $('#toast'); e.textContent = t; e.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(() => e.classList.remove('show'), 2000); }

  // ---------------------------------------------------------------- live prices: our cached read of jupiter, one request for every stock
  const Q = {};
  async function loadQuotes() {
    for (let t = 0; t < 3; t++) {
      try {
        const r = await fetch('/api/prices', { cache: 'no-store' });
        if (r.ok) { const j = await r.json(); if (j && j.ok && j.q) { for (const s of SYMS) if (j.q[s]) Q[s] = j.q[s]; return Object.keys(Q).length > 0; } }
      } catch {}
      await sleep(900 * (t + 1));
    }
    return Object.keys(Q).length > 0;
  }
  const firstLoad = loadQuotes();
  const has = s => Q[s] && Q[s].chg != null;
  const mood = s => { if (!has(s)) return null; return Math.abs(Q[s].chg) < .3 ? 'flat' : Q[s].chg > 0 ? 'up' : 'down'; };
  const keyImg = (s, m) => `/assets/img/keys/${s}-${m === 'down' ? 'down' : 'up'}.webp?v=3`;
  const LOGO = s => `/api/logo?s=${encodeURIComponent(s)}`;
  const logoTag = (s, cls) => `<span class="logo${cls ? ' ' + cls : ''}" style="--l:url('${LOGO(s)}')"></span>`;
  const pct = c => (c > 0 ? '+' : c < 0 ? '−' : '') + Math.abs(c).toFixed(2) + '%';
  const usd = p => p == null ? '—' : '$' + (p >= 1000 ? p.toLocaleString('en-US', { maximumFractionDigits: 0 }) : p >= 1 ? p.toFixed(2) : p.toPrecision(3));
  const short = v => v == null ? '—' : v >= 1e9 ? '$' + (v / 1e9).toFixed(2) + 'B' : v >= 1e6 ? '$' + (v / 1e6).toFixed(2) + 'M' : v >= 1e3 ? '$' + (v / 1e3).toFixed(1) + 'K' : '$' + v.toFixed(0);
  const int = v => v == null ? '—' : Math.round(v).toLocaleString('en-US');
  const tileOf = s => TILE[SYMS.indexOf(s) % 6];
  const cls = c => c == null ? '' : c < 0 ? 'dn' : 'up';
  const lk = (s, m, bd) => `<span class="lg-big" style="--l:url('${LOGO(s)}')"></span><i class="kk" style="--k:url(${keyImg(s, m)})${bd ? ';--bd:' + bd : ''}"></i>`;
  const wears = m => m === 'down' ? 'beanie on' : m === 'flat' ? 'a flat day' : m ? 'crown on' : 'no move yet';
  let FAV = store.get('memer:fav', []).filter(s => SYMS.includes(s));
  const isFav = s => FAV.includes(s);
  function toggleFav(s) { FAV = isFav(s) ? FAV.filter(x => x !== s) : [...FAV, s]; store.set('memer:fav', FAV); toast(isFav(s) ? `$${s} is on your list` : `$${s} is off your list`); drawStocks(); if (DR === s) fillDrawer(); }

  // ---------------------------------------------------------------- the opening: a 3D keyboard of real stocks. no words.
  function intro() {
    const el = $('#intro'), ready = () => html.classList.add('ready');
    if (!el || html.classList.contains('no-intro')) { ready(); if (el) el.remove(); return; }
    try { sessionStorage.setItem('memer:in', '1'); } catch {}
    let over = false, ctl = null; const timers = [], t0 = performance.now();
    const finish = fast => { if (over) return; over = true; timers.forEach(clearTimeout); ready(); el.classList.add('out'); setTimeout(() => { if (ctl) ctl.stop(); el.remove(); }, fast ? 500 : 700); };
    el.addEventListener('pointerdown', () => finish(true)); addEventListener('keydown', e => { if (e.key === 'Escape') finish(true); });
    timers.push(setTimeout(() => finish(true), 10000));
    Promise.race([firstLoad, sleep(900)]).then(() => import('/assets/intro3d.js?v=1')).then(mod => {
      if (over) return;
      if (performance.now() - t0 > 4000) { finish(true); return; }
      return mod.run({ canvas: $('#introCv'), stocks: SYMS, logo: LOGO, moodOf: mood, small: innerWidth < 700,
        onLand: () => el.classList.add('land'),
        onEnd: () => { el.classList.add('end'); timers.push(setTimeout(() => finish(false), 700)); } }).then(c => { ctl = c; if (over) c.stop(); else el.classList.add('live'); });
    }).catch(() => finish(true));
  }
  function heroGrid() { const n = innerWidth < 700 ? 36 : 72; $('#heroGrid').innerHTML = Array.from({ length: n }, (_, i) => `<i style="--k:url(${FIT(i * 3)});--dl:${-(i % 9)}s"></i>`).join(''); }
  // a ring of real stocks circling the hero key
  function orbit() {
    const box = $('#orbit'); if (!box) return;
    const list = ['NVDA', 'TSLA', 'AAPL', 'SPCX', 'MSFT', 'GOOGL', 'AMZN', 'META', 'NFLX', 'COIN', 'PLTR', 'AMD', 'GME', 'SPY'];
    box.innerHTML = list.map(s => `<button type="button" class="ob" data-s="${esc(s)}" aria-label="$${esc(s)}">${logoTag(s)}</button>`).join('');
    const items = [...box.children]; let a0 = 0, last = 0, vis = true;
    const place = t => {
      const W = box.clientWidth, H = box.clientHeight, rx = W * .5, ry = H * .2;
      items.forEach((b, i) => { const a = a0 + i / items.length * Math.PI * 2, d = Math.sin(a); b.style.transform = `translate(${(Math.cos(a) * rx).toFixed(1)}px,${(d * ry + H * .08).toFixed(1)}px) scale(${(.66 + .34 * (d + 1) / 2).toFixed(3)})`; b.style.zIndex = d > 0 ? 3 : 1; b.style.opacity = (.55 + .45 * (d + 1) / 2).toFixed(2); });
    };
    place();
    if (REDUCED) return;
    if ('IntersectionObserver' in window) new IntersectionObserver(es => { vis = es[0].isIntersecting; }).observe(box);
    const step = now => { const dt = last ? Math.min(.05, (now - last) / 1000) : 0; last = now; if (vis && !document.hidden) { a0 += dt * .35; place(); } requestAnimationFrame(step); };
    requestAnimationFrame(step);
    box.addEventListener('click', e => { const b = e.target.closest('.ob'); if (b) openDrawer(b.dataset.s); });
  }

  // ---------------------------------------------------------------- wall street's clock (the tokens trade around the clock; the stocks don't)
  const HOL = new Set(['2026-01-01', '2026-01-19', '2026-02-16', '2026-04-03', '2026-05-25', '2026-06-19', '2026-07-03', '2026-09-07', '2026-11-26', '2026-12-25',
    '2027-01-01', '2027-01-18', '2027-02-15', '2027-03-26', '2027-05-31', '2027-06-18', '2027-07-05', '2027-09-06', '2027-11-25', '2027-12-24']);
  const HALF = new Set(['2026-11-27', '2026-12-24', '2027-11-26']);
  const NYF = new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23', weekday: 'short' });
  function ny(d) { const p = Object.fromEntries(NYF.formatToParts(d).map(x => [x.type, x.value])); return { ymd: `${p.year}-${p.month}-${p.day}`, y: +p.year, mo: +p.month, d: +p.day, wd: p.weekday, mins: (+p.hour % 24) * 60 + +p.minute + +p.second / 60 }; }
  function nyInstant(y, mo, d, mins) { const want = Date.UTC(y, mo - 1, d, 0, mins); let g = want; for (let k = 0; k < 2; k++) { const t = ny(new Date(g)); g += want - Date.UTC(t.y, t.mo - 1, t.d, 0, t.mins); } return g; }
  function market(now = new Date()) {
    const t = ny(now), close = HALF.has(t.ymd) ? 780 : 960, trading = !['Sat', 'Sun'].includes(t.wd) && !HOL.has(t.ymd);
    if (trading && t.mins >= 570 && t.mins < close) return { open: true, ms: nyInstant(t.y, t.mo, t.d, close) - now };
    for (let k = 0; k < 14; k++) {
      const day = new Date(Date.UTC(t.y, t.mo - 1, t.d + k, 12)), ymd = day.toISOString().slice(0, 10), wd = day.getUTCDay();
      if (wd === 0 || wd === 6 || HOL.has(ymd) || (k === 0 && t.mins >= 570)) continue;
      return { open: false, ms: nyInstant(day.getUTCFullYear(), day.getUTCMonth() + 1, day.getUTCDate(), 570) - now };
    }
    return { open: false, ms: null };
  }
  const dur = ms => { if (ms == null) return 'soon'; const m = Math.max(1, Math.round(ms / 60000)), d = Math.floor(m / 1440), h = Math.floor(m % 1440 / 60), mm = m % 60; return d ? `${d}d ${h}h` : h ? `${h}h ${mm}m` : `${mm}m`; };
  const marketLine = () => { const s = market(); return s.open ? `open · closes in ${dur(s.ms)}` : `closed · opens in ${dur(s.ms)}`; };

  // ---------------------------------------------------------------- tapes and the wall of keys
  function tapes(ok) {
    const moves = SYMS.filter(has).map(s => `<span>${logoTag(s, 'tl')}$${esc(s)} <b class="${cls(Q[s].chg)}">${pct(Q[s].chg)}</b></span>`);
    const a = ok && moves.length ? moves : ['<span>turn any stock into a meme</span>', '<span>reading today\'s moves</span>'];
    $('#tape').innerHTML = a.join('') + a.join('');
    const b = ['<span>turn any stock into a meme</span>', ...[...LINES.up.slice(0, 4), ...LINES.down.slice(0, 3)].map(l => `<span>${esc(l)}</span>`), '<span>40 stocks. 40 keys.</span>', `<span>wall street: ${esc(marketLine())}</span>`];
    $('#tape2').innerHTML = b.join('') + b.join('');
  }
  function drawWall() {
    const one = hide => SYMS.map((s, i) => { const m = mood(s); return `<button type="button" class="wt" data-s="${esc(s)}"${hide ? ' tabindex="-1" aria-hidden="true"' : ''}><span class="wk lk" style="--c:${TILE[i % 6]}">${lk(s, m)}</span><b>$${esc(s)}</b><span class="wc ${cls(has(s) ? Q[s].chg : null)}">${has(s) ? pct(Q[s].chg) : '—'}</span></button>`; }).join('');
    $('#wall').innerHTML = one(false) + one(true);
  }

  // ---------------------------------------------------------------- 01 the stocks: search, sort, filter, my list
  let FILTER = 'all', SORT = 'none', QUERY = ''; const PREV = {};
  function fits(s) {
    if (QUERY && !(s.toLowerCase().includes(QUERY) || NAME[s].toLowerCase().includes(QUERY))) return false;
    if (FILTER === 'all') return true; if (FILTER === 'fav') return isFav(s);
    if (FILTER === 'up') return has(s) && Q[s].chg > 0; if (FILTER === 'down') return has(s) && Q[s].chg < 0; return GROUP[s].split(' ').includes(FILTER);
  }
  const chgOr = (s, d) => has(s) ? Q[s].chg : d;
  function order(list) {
    const l = [...list];
    if (SORT === 'move') l.sort((a, b) => Math.abs(chgOr(b, 0)) - Math.abs(chgOr(a, 0)));
    else if (SORT === 'up') l.sort((a, b) => chgOr(b, -1e9) - chgOr(a, -1e9));
    else if (SORT === 'down') l.sort((a, b) => chgOr(a, 1e9) - chgOr(b, 1e9));
    else if (SORT === 'vol') l.sort((a, b) => ((Q[b] && Q[b].vol) || 0) - ((Q[a] && Q[a].vol) || 0));
    else if (SORT === 'az') l.sort((a, b) => a.localeCompare(b));
    return l;
  }
  function drawStocks() {
    const list = order(SYMS.filter(fits));
    $('#stockGrid').innerHTML = list.map(s => {
      const i = SYMS.indexOf(s), q = Q[s], m = mood(s), p = q ? q.price : null, fl = p != null && PREV[s] != null && p !== PREV[s] ? (p > PREV[s] ? ' flash-up' : ' flash-dn') : '';
      if (p != null) PREV[s] = p;
      return `<div class="skw"><button type="button" class="sk${s === M.sym ? ' sel' : ''}" data-s="${esc(s)}" style="--dl:${Math.min(i, 24) * 30}ms">
        <span class="ki lk" style="--c:${TILE[i % 6]}">${lk(s, m, (-((i * .37) % 3.6)).toFixed(2) + 's')}</span><b>$${esc(s)}</b><span class="n">${esc(NAME[s])}</span>
        <span class="p${fl}"><span>${usd(p)}</span><span class="${m === 'down' ? 'dn' : m ? 'up' : ''}">${has(s) ? pct(q.chg) : '—'}</span></span></button>
        <button type="button" class="star${isFav(s) ? ' on' : ''}" data-star="${esc(s)}" aria-pressed="${isFav(s)}" aria-label="${isFav(s) ? 'remove' : 'add'} $${esc(s)} ${isFav(s) ? 'from' : 'to'} my list">★</button></div>`;
    }).join('');
    $('#stockNone').hidden = list.length > 0;
  }
  $('#stockGrid').addEventListener('click', e => { const st = e.target.closest('.star'); if (st) { toggleFav(st.dataset.star); return; } const b = e.target.closest('.sk'); if (b) openDrawer(b.dataset.s); });
  if (!REDUCED && HOVER) {
    $('#stockGrid').addEventListener('pointermove', e => { const b = e.target.closest('.sk'); if (!b) return; const r = b.getBoundingClientRect(); b.style.setProperty('--ry', (((e.clientX - r.left) / r.width - .5) * 14).toFixed(1) + 'deg'); b.style.setProperty('--rx', (-((e.clientY - r.top) / r.height - .5) * 14).toFixed(1) + 'deg'); });
    $('#stockGrid').addEventListener('pointerout', e => { const b = e.target.closest('.sk'); if (b && !b.contains(e.relatedTarget)) { b.style.removeProperty('--rx'); b.style.removeProperty('--ry'); } });
  }
  $('#wall').addEventListener('click', e => { const b = e.target.closest('.wt'); if (b) openDrawer(b.dataset.s); });
  $$('#chips button').forEach(b => b.addEventListener('click', () => { FILTER = b.dataset.f; $$('#chips button').forEach(x => x.classList.toggle('on', x === b)); drawStocks(); if (FILTER === 'fav' && !FAV.length) toast('tap ★ on any stock to add it'); }));
  $$('#sorts button').forEach(b => b.addEventListener('click', () => { SORT = b.dataset.sort; $$('#sorts button').forEach(x => x.classList.toggle('on', x === b)); drawStocks(); }));
  let qT; $('#q').addEventListener('input', e => { clearTimeout(qT); qT = setTimeout(() => { QUERY = e.target.value.trim().toLowerCase().replace(/^\$/, ''); drawStocks(); }, 90); });
  const go = id => $(id).scrollIntoView({ behavior: REDUCED ? 'auto' : 'smooth' });

  // ---------------------------------------------------------------- logo pickers (maker, versus, bag, pfp)
  function picker(box, { get, set, marks }) {
    box.innerHTML = STOCKS.map(([s, n]) => `<button type="button" class="pk" data-s="${esc(s)}" title="$${esc(s)} · ${esc(n)}" aria-label="$${esc(s)} ${esc(n)}">${logoTag(s)}<b>${esc(s)}</b></button>`).join('');
    const sync = () => { const v = get(); box.querySelectorAll('.pk').forEach(b => { const s = b.dataset.s, on = Array.isArray(v) ? v.includes(s) : v === s; b.classList.toggle('on', on); b.setAttribute('aria-pressed', on); if (marks) { const mk = marks(s); b.classList.toggle('on-a', mk === 'a'); b.classList.toggle('on-b', mk === 'b'); } }); };
    box.addEventListener('click', e => { const b = e.target.closest('.pk'); if (b) { set(b.dataset.s); sync(); } });
    sync(); return sync;
  }

  // ---------------------------------------------------------------- canvases
  const IMG = {};
  const loadImg = src => IMG[src] || (IMG[src] = new Promise(res => { const im = new Image(); im.onload = () => res(im); im.onerror = () => { delete IMG[src]; res(null); }; im.src = src; }));
  function wrap(ctx, text, max) { const words = text.split(' '), lines = []; let cur = ''; for (const w of words) { const t = cur ? cur + ' ' + w : w; if (ctx.measureText(t).width > max && cur) { lines.push(cur); cur = w; } else cur = t; } if (cur) lines.push(cur); return lines; }
  const BG = m => m === 'down' ? '#ff6b8b' : m === 'flat' ? '#f4ecd9' : '#55ee96';
  const rr = (ctx, x, y, w, h, r) => { ctx.beginPath(); if (ctx.roundRect) ctx.roundRect(x, y, w, h, r); else ctx.rect(x, y, w, h); };
  function logoAt(ctx, im, x, y, s, r) { if (!im) return; ctx.save(); rr(ctx, x, y, s, s, r); ctx.fillStyle = '#111'; ctx.fill(); ctx.clip(); ctx.drawImage(im, x, y, s, s); ctx.restore(); ctx.save(); rr(ctx, x, y, s, s, r); ctx.lineWidth = Math.max(4, s / 24); ctx.strokeStyle = '#fff'; ctx.stroke(); ctx.restore(); }
  function dots(ctx, W, H) { ctx.fillStyle = 'rgba(11,13,12,.07)'; for (let y = 18; y < H; y += 30) for (let x = 18; x < W; x += 30) { ctx.beginPath(); ctx.arc(x, y, 1.6, 0, 7); ctx.fill(); } }
  function foot(ctx, x, y, center) { ctx.fillStyle = '#0b0d0c'; ctx.textAlign = center ? 'center' : 'left'; ctx.font = '800 30px Inter'; if (center) { ctx.fillText('memer', x, y - 30); ctx.font = '500 20px JBM'; ctx.globalAlpha = .65; ctx.fillText('turn any stock into a meme', x, y); } else { ctx.fillText('memer', x, y); ctx.font = '500 20px JBM'; ctx.globalAlpha = .65; ctx.fillText('turn any stock into a meme', x + 120, y - 2); } ctx.globalAlpha = 1; ctx.textAlign = 'left'; }
  const pop = el => { if (!REDUCED && el.animate) el.animate([{ transform: 'scale(.97) rotate(-.4deg)' }, { transform: 'none' }], { duration: 420, easing: 'cubic-bezier(.2,1.5,.4,1)' }); };
  const FMT = { x: [1200, 675], sq: [1080, 1080], story: [1080, 1920] };
  async function card(cv, sym, m, line, fmt = 'x') {
    const tok = cv._t = (cv._t || 0) + 1, [im, lg] = await Promise.all([loadImg(keyImg(sym, m)), loadImg(LOGO(sym))]); if (tok !== cv._t) return;
    const [W, H] = FMT[fmt] || FMT.x, ctx = cv.getContext('2d'); cv.width = W; cv.height = H;
    const q = Q[sym], live = has(sym); ctx.fillStyle = BG(m); ctx.fillRect(0, 0, W, H); dots(ctx, W, H); ctx.fillStyle = '#0b0d0c'; ctx.textBaseline = 'alphabetic';
    if (fmt === 'story') {
      ctx.textAlign = 'center'; logoAt(ctx, lg, W / 2 - 90, 150, 180, 44);
      ctx.font = `800 ${sym.length > 4 ? 150 : 176}px Inter`; ctx.fillText('$' + sym, W / 2, 500);
      ctx.font = '500 36px JBM'; ctx.globalAlpha = .7; ctx.fillText(NAME[sym] || '', W / 2, 560); ctx.globalAlpha = 1;
      if (live) { ctx.font = '700 84px JBM'; ctx.fillText(pct(q.chg) + ' today', W / 2, 690); ctx.font = '500 40px JBM'; ctx.globalAlpha = .7; ctx.fillText(usd(q.price), W / 2, 752); ctx.globalAlpha = 1; }
      if (im) ctx.drawImage(im, (W - 860) / 2, 700, 860, 860);
      ctx.font = '800 66px Inter'; wrap(ctx, line, 900).slice(0, 3).forEach((l, i) => ctx.fillText(l, W / 2, 1620 + i * 74));
      foot(ctx, W / 2, H - 70, true); return;
    }
    if (fmt === 'sq') {
      logoAt(ctx, lg, 64, 64, 132, 32); ctx.font = `800 ${sym.length > 4 ? 100 : 118}px Inter`; ctx.fillText('$' + sym, 222, 168);
      ctx.font = '500 30px JBM'; ctx.globalAlpha = .7; ctx.fillText(NAME[sym] || '', 226, 214); ctx.globalAlpha = 1;
      if (live) { ctx.font = '700 64px JBM'; ctx.fillText(pct(q.chg) + ' today', 66, 330); ctx.font = '500 32px JBM'; ctx.globalAlpha = .7; ctx.fillText(usd(q.price), 70, 380); ctx.globalAlpha = 1; }
      if (im) ctx.drawImage(im, W - 640, H - 690, 640, 640);
      ctx.font = '800 54px Inter'; wrap(ctx, line, 470).slice(0, 4).forEach((l, i) => ctx.fillText(l, 66, (live ? 520 : 400) + i * 64));
      foot(ctx, 66, H - 56); return;
    }
    if (im) ctx.drawImage(im, W - 600, (H - 600) / 2 + 8, 600, 600);
    const tx = lg ? 206 : 60; logoAt(ctx, lg, 60, 50, 124, 30);
    ctx.font = `800 ${lg ? (sym.length > 4 ? 92 : sym.length > 3 ? 108 : 124) : (sym.length > 4 ? 104 : 124)}px Inter`; ctx.fillText('$' + sym, tx, 158);
    ctx.font = '500 28px JBM'; ctx.globalAlpha = .7; ctx.fillText(NAME[sym] || '', tx + 4, 206); ctx.globalAlpha = 1;
    if (live) { ctx.font = '700 58px JBM'; ctx.fillText(pct(q.chg) + ' today', 62, 312); ctx.font = '500 30px JBM'; ctx.globalAlpha = .7; ctx.fillText(usd(q.price), 66, 360); ctx.globalAlpha = 1; }
    ctx.font = '800 50px Inter'; wrap(ctx, line, 560).slice(0, 3).forEach((l, i) => ctx.fillText(l, 62, (live ? 460 : 330) + i * 58));
    foot(ctx, 62, H - 44);
  }
  function verdict(a, b) {
    if (!has(a) || !has(b)) return 'two keys. same shades.';
    const x = Q[a].chg, y = Q[b].chg;
    if (x > 0 && y > 0) return Math.abs(x - y) < .05 ? 'both green. a tie in shades.' : `both green. $${x > y ? a : b} wore it better.`;
    if (x < 0 && y < 0) return `both red. $${x > y ? a : b} lost less.`;
    return `$${x > y ? a : b} wins today.`;
  }
  async function vsCard(cv, a, b) {
    const ma = mood(a) || 'up', mb = mood(b) || 'up', tok = cv._t = (cv._t || 0) + 1;
    const [ia, ib, la, lb] = await Promise.all([loadImg(keyImg(a, ma)), loadImg(keyImg(b, mb)), loadImg(LOGO(a)), loadImg(LOGO(b))]); if (tok !== cv._t) return;
    const ctx = cv.getContext('2d'), W = 1200, H = 675; cv.width = W; cv.height = H;
    ctx.fillStyle = BG(ma); ctx.fillRect(0, 0, W / 2, H); ctx.fillStyle = BG(mb); ctx.fillRect(W / 2, 0, W / 2, H); dots(ctx, W, H);
    if (ia) ctx.drawImage(ia, 70, 50, 430, 430); if (ib) ctx.drawImage(ib, W - 500, 50, 430, 430);
    logoAt(ctx, la, 54, 40, 104, 26); logoAt(ctx, lb, W - 158, 40, 104, 26);
    ctx.fillStyle = '#0b0d0c'; ctx.textAlign = 'center';
    ctx.font = '800 64px Inter'; ctx.fillText('$' + a, 285, 506); ctx.fillText('$' + b, W - 285, 506);
    ctx.font = '700 36px JBM'; if (has(a)) ctx.fillText(pct(Q[a].chg), 285, 552); if (has(b)) ctx.fillText(pct(Q[b].chg), W - 285, 552);
    ctx.save(); ctx.translate(W / 2, 290); ctx.rotate(-.08); ctx.fillStyle = '#0b0d0c'; rr(ctx, -92, -64, 184, 128, 26); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.font = '800 92px Inter'; ctx.fillText('vs', 0, 32); ctx.restore();
    ctx.fillStyle = '#0b0d0c'; ctx.font = '800 38px Inter'; ctx.fillText(verdict(a, b), W / 2, 628); ctx.textAlign = 'left';
  }
  function burst(from) {
    if (REDUCED || !from || !document.body.animate) return;
    const r = from.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    for (let i = 0; i < 12; i++) {
      const d = document.createElement('i'); d.className = 'cf'; d.style.cssText = `left:${cx - 22}px;top:${cy - 22}px;--c:#111;--k:url('${LOGO(SYMS[(i * 7 + Math.floor(Math.random() * 40)) % 40])}')`; document.body.appendChild(d);
      const a = i / 12 * Math.PI * 2 + Math.random() * .4, dist = 90 + Math.random() * 110, dx = Math.cos(a) * dist, dy = Math.sin(a) * dist - 60;
      d.animate([{ transform: 'translate(0,0) scale(.3)', opacity: 1 }, { transform: `translate(${dx}px,${dy}px) scale(1) rotate(${(Math.random() - .5) * 200}deg)`, opacity: 1, offset: .55 }, { transform: `translate(${dx * 1.15}px,${dy + 150}px) scale(.7) rotate(${(Math.random() - .5) * 320}deg)`, opacity: 0 }], { duration: 1150, easing: 'cubic-bezier(.2,.7,.3,1)' });
      setTimeout(() => d.remove(), 1250);
    }
  }
  function save(cv, name, btn) { burst(btn); cv.toBlob(b => { const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = name + '.png'; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 3000); toast('saved'); }, 'image/png'); }
  async function post(cv, name, text) {
    try {
      const blob = await new Promise(r => cv.toBlob(r, 'image/png')); const file = new File([blob], name + '.png', { type: 'image/png' });
      if (navigator.canShare && navigator.canShare({ files: [file] }) && matchMedia('(pointer: coarse)').matches) { await navigator.share({ files: [file], text }); return; }
    } catch (e) { if (e && e.name === 'AbortError') return; }
    save(cv, name); toast('meme saved. attach it to the post.');
    open('https://x.com/intent/post?text=' + encodeURIComponent(text), '_blank', 'noopener');
  }
  const postText = (sym, line) => `$${sym}${has(sym) ? ' ' + pct(Q[sym].chg) + ' today' : ''}. ${line}\n\nmade with memer`;

  // ---------------------------------------------------------------- 02 the maker
  const M = { sym: 'NVDA', mood: 'auto', line: '', fmt: 'x' };
  const curMood = () => M.mood === 'auto' ? (mood(M.sym) || 'up') : M.mood;
  const lineFor = m => pick(LINES[m] || LINES.up);
  let mkSync = () => {};
  async function drawMaker(p) {
    const m = curMood(); if (!M.line || (!M.own && M.lm !== m)) { M.line = lineFor(m); M.own = false; } M.lm = m; $('#mkLine').value = M.line;
    $('#mkR').classList.toggle('story', M.fmt === 'story'); $('#mkR').classList.toggle('sq', M.fmt === 'sq');
    await card($('#mkCanvas'), M.sym, m, M.line, M.fmt); if (p) pop($('#mkCanvas'));
    $('#mkNote').textContent = has(M.sym) ? '' : "today's move for this one can't be read right now, so the meme has no numbers.";
  }
  function toMaker(s, line) { M.sym = s; M.mood = 'auto'; M.line = line || ''; M.own = !!line; mkSync(); $$('#maker .moods:not(.fmt) button').forEach(x => x.classList.toggle('on', x.dataset.mood === 'auto')); drawMaker(true); go('#maker'); }
  function setupMaker() {
    mkSync = picker($('#mkPick'), { get: () => M.sym, set: s => { M.sym = s; M.line = ''; drawMaker(true); } });
    $$('#maker .moods:not(.fmt) button').forEach(b => b.addEventListener('click', () => { M.mood = b.dataset.mood; $$('#maker .moods:not(.fmt) button').forEach(x => x.classList.toggle('on', x === b)); M.line = ''; drawMaker(true); }));
    $$('#mkFmt button').forEach(b => b.addEventListener('click', () => { M.fmt = b.dataset.fmt; $$('#mkFmt button').forEach(x => x.classList.toggle('on', x === b)); drawMaker(true); }));
    $('#mkLine').addEventListener('input', e => { M.line = e.target.value; M.own = true; clearTimeout(M.t); M.t = setTimeout(drawMaker, 120); });
    $('#mkShuffle').addEventListener('click', () => { const m = curMood(); let l = lineFor(m); for (let i = 0; i < 5 && l === M.line; i++) l = lineFor(m); M.line = l; M.own = false; drawMaker(true); });
    $('#mkRandom').addEventListener('click', () => { M.sym = pick(SYMS); mkSync(); M.line = ''; drawMaker(true); });
    $('#mkSave').addEventListener('click', e => save($('#mkCanvas'), `memer-${M.sym}-${M.fmt}`, e.currentTarget));
    $('#mkPost').addEventListener('click', () => post($('#mkCanvas'), `memer-${M.sym}-${M.fmt}`, postText(M.sym, M.line)));
    $('#surprise').addEventListener('click', e => { burst(e.currentTarget); const live = SYMS.filter(has); toMaker(pick(live.length ? live : SYMS)); });
  }

  // ---------------------------------------------------------------- 04 versus
  const VS = { a: 'NVDA', b: 'AMD', side: 'a' };
  let vsSync = () => {};
  const drawVs = p => vsCard($('#vsCanvas'), VS.a, VS.b).then(() => { if (p) pop($('#vsCanvas')); $('#vsNote').textContent = has(VS.a) && has(VS.b) ? '' : "one of these moves can't be read right now."; });
  function slots() { ['a', 'b'].forEach(k => { const el = $(k === 'a' ? '#vsSlotA' : '#vsSlotB'), s = VS[k]; el.innerHTML = `${logoTag(s)}<b>$${esc(s)}</b><span class="${cls(has(s) ? Q[s].chg : null)}">${has(s) ? pct(Q[s].chg) : '—'}</span>`; el.classList.toggle('on', VS.side === k); el.setAttribute('aria-pressed', VS.side === k); el.setAttribute('aria-label', `${k === 'a' ? 'left' : 'right'} side: $${s}. tap to change it`); }); vsSync(); }
  function setupVs() {
    vsSync = picker($('#vsPick'), { get: () => VS[VS.side], marks: s => s === VS.a ? 'a' : s === VS.b ? 'b' : '', set: s => { const o = VS.side === 'a' ? 'b' : 'a'; if (VS[o] === s) VS[o] = VS[VS.side]; VS[VS.side] = s; VS.side = o; slots(); drawVs(true); } });
    $$('.slot').forEach(b => b.addEventListener('click', () => { VS.side = b.dataset.side; slots(); }));
    $('#vsSwap').addEventListener('click', () => { [VS.a, VS.b] = [VS.b, VS.a]; slots(); drawVs(true); });
    $('#vsRandom').addEventListener('click', () => { VS.a = pick(SYMS); do { VS.b = pick(SYMS); } while (VS.b === VS.a); slots(); drawVs(true); });
    $('#vsSave').addEventListener('click', e => save($('#vsCanvas'), `memer-${VS.a}-vs-${VS.b}`, e.currentTarget));
    $('#vsPost').addEventListener('click', () => post($('#vsCanvas'), `memer-${VS.a}-vs-${VS.b}`, `$${VS.a} vs $${VS.b}. ${verdict(VS.a, VS.b)}\n\nmade with memer`));
    slots();
  }

  // ---------------------------------------------------------------- 05 your bag
  let BAG = store.get('memer:bag', ['NVDA', 'TSLA', 'AAPL', 'SPCX']).filter(s => SYMS.includes(s)).slice(0, 6), bagSync = () => {};
  const bagAvg = () => { const live = BAG.filter(has); return live.length ? live.reduce((a, s) => a + Q[s].chg, 0) / live.length : null; };
  async function bagCard(cv) {
    const list = BAG.slice(0, 6), tok = cv._t = (cv._t || 0) + 1;
    const imgs = await Promise.all(list.map(s => Promise.all([loadImg(LOGO(s)), loadImg(keyImg(s, mood(s)))]))); if (tok !== cv._t) return;
    const ctx = cv.getContext('2d'), W = 1200, H = 675; cv.width = W; cv.height = H;
    const avg = bagAvg(), m = avg == null ? 'flat' : Math.abs(avg) < .3 ? 'flat' : avg > 0 ? 'up' : 'down';
    ctx.fillStyle = BG(m); ctx.fillRect(0, 0, W, H); dots(ctx, W, H); ctx.fillStyle = '#0b0d0c';
    ctx.font = '800 66px Inter'; ctx.fillText('my bag today', 60, 118);
    ctx.font = '700 92px JBM'; ctx.fillText(avg == null ? (list.length ? '—' : 'empty') : pct(avg), 60, 226);
    ctx.font = '500 26px JBM'; ctx.globalAlpha = .7; ctx.fillText(list.length ? `${list.length} stock${list.length > 1 ? 's' : ''} · average 24h move` : 'pick up to six stocks', 66, 268); ctx.globalAlpha = 1;
    list.forEach((s, i) => {
      const c = i % 3, r = Math.floor(i / 3), x = 60 + c * 365, y = 304 + r * 168, [lg, ky] = imgs[i];
      ctx.fillStyle = '#fff'; rr(ctx, x, y, 345, 150, 26); ctx.fill();
      logoAt(ctx, lg, x + 20, y + 30, 88, 22);
      ctx.fillStyle = '#0b0d0c'; ctx.font = `800 ${s.length > 4 ? 36 : 42}px Inter`; ctx.fillText('$' + s, x + 124, y + 70);
      ctx.font = '700 32px JBM'; ctx.fillStyle = has(s) ? (Q[s].chg < 0 ? '#d62f50' : '#0f9a4e') : '#5c6661'; ctx.fillText(has(s) ? pct(Q[s].chg) : '—', x + 124, y + 116);
      if (ky) ctx.drawImage(ky, x + 232, y + 10, 124, 124);
    });
    ctx.fillStyle = '#0b0d0c'; foot(ctx, W - 470, 118);
  }
  const drawBag = p => bagCard($('#bagCanvas')).then(() => { if (p) pop($('#bagCanvas')); const miss = BAG.filter(s => !has(s)); $('#bagNote').textContent = miss.length ? `no 24h move for ${miss.map(s => '$' + s).join(', ')} right now, so ${miss.length > 1 ? 'they sit' : 'it sits'} out of the average.` : ''; });
  function setBag(list, p = true) { BAG = list.slice(0, 6); store.set('memer:bag', BAG); bagSync(); drawBag(p); }
  function setupBag() {
    bagSync = picker($('#bagPick'), { get: () => BAG, set: s => { const l = BAG.includes(s) ? BAG.filter(x => x !== s) : [...BAG, s]; if (l.length > 6) { l.shift(); toast('six max. the first one made room.'); } setBag(l); } });
    $('#bagRandom').addEventListener('click', () => { const l = [...SYMS].sort(() => Math.random() - .5).slice(0, 4 + Math.floor(Math.random() * 3)); setBag(l); });
    $('#bagMine').addEventListener('click', () => { if (!FAV.length) { toast('tap ★ on any stock to start your list'); return; } setBag(FAV); });
    $('#bagClear').addEventListener('click', () => setBag([]));
    $('#bagSave').addEventListener('click', e => save($('#bagCanvas'), 'memer-my-bag', e.currentTarget));
    $('#bagPost').addEventListener('click', () => { const a = bagAvg(); post($('#bagCanvas'), 'memer-my-bag', `my bag today${a == null ? '' : ': ' + pct(a)}\n${BAG.map(s => '$' + s + (has(s) ? ' ' + pct(Q[s].chg) : '')).join(' · ')}\n\nmade with memer`); });
  }

  // ---------------------------------------------------------------- 03 the market map: tiles sized by 24h volume, coloured by the move
  function squarify(items, W, H) {
    const out = [], total = items.reduce((a, b) => a + b.v, 0); if (!total) return out;
    let rest = items.map(i => ({ ...i, a: i.v * W * H / total })), x = 0, y = 0, w = W, h = H;
    const worst = (row, side) => { const s = row.reduce((a, b) => a + b.a, 0), mx = Math.max(...row.map(r => r.a)), mn = Math.min(...row.map(r => r.a)); return Math.max(side * side * mx / (s * s), s * s / (side * side * mn)); };
    while (rest.length) {
      const side = Math.min(w, h); let row = [rest[0]], best = worst(row, side);
      for (let i = 1; i < rest.length; i++) { const wr = worst([...row, rest[i]], side); if (wr > best) break; row.push(rest[i]); best = wr; }
      const sum = row.reduce((a, b) => a + b.a, 0);
      if (w >= h) { const cw = sum / h; let cy = y; for (const r of row) { const rh = r.a / cw; out.push({ s: r.s, x, y: cy, w: cw, h: rh }); cy += rh; } x += cw; w -= cw; }
      else { const ch = sum / w; let cx = x; for (const r of row) { const rw = r.a / ch; out.push({ s: r.s, x: cx, y, w: rw, h: ch }); cx += rw; } y += ch; h -= ch; }
      rest = rest.slice(row.length);
    }
    return out;
  }
  const mix = (a, b, t) => { const p = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16)); const A = p(a), B = p(b); return '#' + A.map((v, i) => Math.round(v + (B[i] - v) * t).toString(16).padStart(2, '0')).join(''); };
  const heat = c => c == null ? '#e6ebe7' : Math.abs(c) < .3 ? '#f4ecd9' : c > 0 ? mix('#c6f6d9', '#1fc466', Math.min(1, (c - .3) / 3.5)) : mix('#ffd4dd', '#f2456b', Math.min(1, (-c - .3) / 3.5));
  function drawMap(ok) {
    const box = $('#mapBox'); if (!ok) { box.innerHTML = "<p class=\"empty\">today's moves can't be read right now.</p>"; return; }
    const W = box.clientWidth || 1000, H = box.clientHeight || 560, max = Math.max(1, ...SYMS.map(s => (Q[s] && Q[s].vol) || 0));
    const items = SYMS.map(s => ({ s, v: Math.sqrt(Math.max((Q[s] && Q[s].vol) || 0, max * .002)) })).sort((a, b) => b.v - a.v);
    box.innerHTML = squarify(items, W, H).map(t => { const c = has(t.s) ? Q[t.s].chg : null, a = Math.min(t.w, t.h), size = a > 150 ? 'xl' : a > 95 ? 'l' : a > 62 ? 'm' : a > 40 ? 's' : 'xs', dark = c != null && Math.abs(c) > 2.2;
      return `<button type="button" class="mt ${size}${dark ? ' dark' : ''}" data-s="${esc(t.s)}" style="left:${(t.x / W * 100).toFixed(3)}%;top:${(t.y / H * 100).toFixed(3)}%;width:${(t.w / W * 100).toFixed(3)}%;height:${(t.h / H * 100).toFixed(3)}%;--bg:${heat(c)}" aria-label="$${esc(t.s)} ${c == null ? 'no move' : pct(c)}">${logoTag(t.s)}<b>$${esc(t.s)}</b><span>${c == null ? '—' : pct(c)}</span></button>`; }).join('');
  }
  $('#mapBox').addEventListener('click', e => { const b = e.target.closest('.mt'); if (b) openDrawer(b.dataset.s); });
  let mapT; addEventListener('resize', () => { clearTimeout(mapT); mapT = setTimeout(() => { const ok = Object.keys(Q).length > 0; drawMap(ok); drawPulse(ok); }, 200); });

  // ---------------------------------------------------------------- 06 today: the biggest moves, already memes
  async function drawToday(ok) {
    const g = $('#todayGrid');
    const movers = SYMS.filter(has).sort((a, b) => Math.abs(Q[b].chg) - Math.abs(Q[a].chg)).slice(0, 3);
    if (!ok || !movers.length) { g.innerHTML = "<p class=\"empty\">today's moves can't be read right now. the maker still works.</p>"; return; }
    g.innerHTML = movers.map((s, i) => `<div class="tcard rv"><canvas data-i="${i}" width="1200" height="675"></canvas><div class="tr"><button type="button" class="btn sm ink" data-a="save" data-i="${i}">save</button><button type="button" class="btn sm ghost" data-a="post" data-i="${i}">post on 𝕏</button><button type="button" class="btn sm ghost" data-a="edit" data-i="${i}">edit</button></div></div>`).join('');
    const lines = movers.map(s => lineFor(mood(s)));
    await Promise.all(movers.map((s, i) => card(g.querySelector(`canvas[data-i="${i}"]`), s, mood(s), lines[i])));
    g.querySelectorAll('button').forEach(b => b.addEventListener('click', () => { const i = +b.dataset.i, s = movers[i], cv = g.querySelector(`canvas[data-i="${i}"]`);
      if (b.dataset.a === 'save') save(cv, `memer-${s}`, b); else if (b.dataset.a === 'post') post(cv, `memer-${s}`, postText(s, lines[i])); else toMaker(s, lines[i]); }));
    reveal();
  }

  // ---------------------------------------------------------------- 07 the board
  let BOARD_ALL = false;
  function drawBoard(ok) {
    const box = $('#boardList');
    if (!ok) { box.innerHTML = "<p class=\"empty\">today's moves can't be read right now.</p>"; return; }
    const rows = [...SYMS].sort((a, b) => chgOr(b, -1e9) - chgOr(a, -1e9));
    const max = Math.max(1, ...SYMS.filter(has).map(s => Math.abs(Q[s].chg)));
    box.innerHTML = rows.map((s, i) => { const m = mood(s), c = has(s) ? Q[s].chg : null, w = c == null ? 0 : Math.min(50, Math.abs(c) / max * 50);
      return `<div class="brow${i > 9 ? ' x' : ''}" data-s="${esc(s)}" style="--r:${Math.min(i, 14)}"><span class="rk">${String(i + 1).padStart(2, '0')}</span><span class="bk" style="--l:url('${LOGO(s)}')"><i style="--k:url(${keyImg(s, m)})"></i></span>
        <span class="bt"><b>$${esc(s)}</b><span>${esc(NAME[s])}</span></span><span class="bp">${usd(Q[s] && Q[s].price)}</span>
        <span class="bc ${cls(c)}">${c == null ? '—' : pct(c)}</span>
        <span class="bar">${c == null ? '' : `<i class="${cls(c)}" style="--w:${w.toFixed(1)}%"></i>`}</span>
        <button type="button" class="bm" data-s="${esc(s)}">meme it</button></div>`; }).join('');
    const live = rows.filter(has), up = live.filter(s => Q[s].chg > 0).length;
    if (live.length) box.insertAdjacentHTML('afterbegin', `<div class="bsum"><span>best <b>$${esc(live[0])} ${pct(Q[live[0]].chg)}</b></span><span>worst <b>$${esc(live[live.length - 1])} ${pct(Q[live[live.length - 1]].chg)}</b></span><span><b>${up}</b> of <b>${live.length}</b> green</span><span>wall street ${esc(marketLine())}</span></div>`);
    box.classList.toggle('short', !BOARD_ALL);
    box.insertAdjacentHTML('beforeend', `<button type="button" class="more">${BOARD_ALL ? 'show the top ten' : 'show all ' + rows.length}</button>`);
    box.querySelector('.more').addEventListener('click', () => { BOARD_ALL = !BOARD_ALL; drawBoard(true); if (!BOARD_ALL) go('#board'); });
  }
  $('#boardList').addEventListener('click', e => { const bm = e.target.closest('.bm'); if (bm) { toMaker(bm.dataset.s); return; } const row = e.target.closest('.brow'); if (row) openDrawer(row.dataset.s); });

  // ---------------------------------------------------------------- 08 sectors
  const SECT = [['tech', 'tech'], ['crypto', 'crypto'], ['funds', 'funds'], ['classic', 'blue chips'], ['meme', 'meme stocks']];
  function drawSectors(ok) {
    const g = $('#secGrid');
    if (!ok) { g.innerHTML = "<p class=\"empty\">today's moves can't be read right now.</p>"; return; }
    const seen = !!g.querySelector('.sec.vis');
    g.innerHTML = SECT.map(([k, label]) => {
      const mem = SYMS.filter(s => GROUP[s].split(' ').includes(k)), live = mem.filter(has);
      const avg = live.length ? live.reduce((a, s) => a + Q[s].chg, 0) / live.length : null;
      const up = live.filter(s => Q[s].chg > 0).length, dn = live.filter(s => Q[s].chg < 0).length, quiet = mem.length - live.length;
      const sorted = live.slice().sort((a, b) => Q[b].chg - Q[a].chg), best = sorted[0], worst = sorted[sorted.length - 1];
      const lead = (s, w) => `<button type="button" class="lead" data-s="${esc(s)}">${logoTag(s)}<span>${w} <b>$${esc(s)}</b> ${pct(Q[s].chg)}</span></button>`;
      return `<div class="sec rv${seen ? ' vis' : ''}"><h3>${label}</h3><div class="avg ${cls(avg)}">${avg == null ? '—' : pct(avg)}</div><small>average 24h move · ${mem.length} keys</small>
        <div class="meter"><i class="g" style="--w:${live.length ? (up / live.length * 100).toFixed(1) : 0}%"></i><i class="r" style="--w:${live.length ? (dn / live.length * 100).toFixed(1) : 0}%"></i></div>
        <div class="cnt">${up} green · ${dn} red${quiet ? ` · ${quiet} no data` : ''}</div>
        ${best ? lead(best, 'best') : ''}${worst && worst !== best ? lead(worst, 'worst') : ''}
        <div class="ks">${mem.slice(0, 8).map((s, j) => `<i style="--l:url('${LOGO(s)}');--j:${j}" title="$${esc(s)}"></i>`).join('')}</div></div>`;
    }).join('');
    reveal();
  }
  $('#secGrid').addEventListener('click', e => { const b = e.target.closest('.lead'); if (b) openDrawer(b.dataset.s); });

  // ---------------------------------------------------------------- 09 the pfp
  const PF = { sym: 'NVDA', c: '#55ee96', fit: 'up' };
  const SW = ['#55ee96', '#3f6bff', '#f4ecd9', '#ffad33', '#8f6dff', '#ff6b8b', '#26c6c6', '#0f1110'];
  let pfSync = () => {};
  async function drawPfp(p) {
    const cv = $('#pfCanvas'), tok = cv._t = (cv._t || 0) + 1, im = await loadImg(keyImg(PF.sym, PF.fit)); if (tok !== cv._t) return;
    const ctx = cv.getContext('2d'), S = 1000; cv.width = S; cv.height = S;
    ctx.fillStyle = PF.c; ctx.fillRect(0, 0, S, S); if (im) ctx.drawImage(im, 120, 110, 760, 760); if (p) pop(cv);
  }
  function setupPfp() {
    pfSync = picker($('#pfPick'), { get: () => PF.sym, set: s => { PF.sym = s; drawPfp(true); } });
    $('#pfColors').innerHTML = SW.map((c, i) => `<button type="button" style="--c:${c}" data-c="${c}" aria-label="colour ${i + 1}"${i ? '' : ' class="on"'}></button>`).join('');
    $$('#pfColors button').forEach(b => b.addEventListener('click', () => { PF.c = b.dataset.c; $$('#pfColors button').forEach(x => x.classList.toggle('on', x === b)); drawPfp(true); }));
    $$('#pfp .moods button').forEach(b => b.addEventListener('click', () => { PF.fit = b.dataset.fit; $$('#pfp .moods button').forEach(x => x.classList.toggle('on', x === b)); drawPfp(true); }));
    $('#pfSave').addEventListener('click', e => save($('#pfCanvas'), `memer-pfp-${PF.sym}`, e.currentTarget));
  }

  // ---------------------------------------------------------------- 11 right now: the totals, every stock on one line, the last hour
  function drawPulse(ok) {
    const st = $('#pStats'), sw = $('#swarm'), hl = $('#hourList');
    if (!ok) { sw.innerHTML = "<p class=\"empty\">today's moves can't be read right now.</p>"; hl.innerHTML = ''; st.innerHTML = ''; return; }
    const live = SYMS.filter(has), mk = market();
    const vol = SYMS.reduce((a, s) => a + ((Q[s] && Q[s].vol) || 0), 0), trades = SYMS.reduce((a, s) => a + (Q[s] ? (Q[s].nb || 0) + (Q[s].ns || 0) : 0), 0);
    const up = live.filter(s => Q[s].chg > 0).length, dn = live.filter(s => Q[s].chg < 0).length;
    const tile = (k, v, sub, c) => `<div class="pt${c ? ' ' + c : ''}"><small>${k}</small><b>${v}</b><span>${sub}</span></div>`;
    st.innerHTML = tile('volume 24h', short(vol), 'all 40 stocks on solana') + tile('trades 24h', int(trades), 'buys and sells') + tile('green · red', `${up} · ${dn}`, `${live.length} of 40 moved`, up >= dn ? 'g' : 'r') + tile('wall street', mk.open ? 'open' : 'closed', (mk.open ? 'closes in ' : 'opens in ') + dur(mk.ms), mk.open ? 'g' : '');
    // the swarm: every stock with a move, placed on one line from worst to best
    const W = sw.clientWidth || 1000, R = W < 600 ? 28 : 36, pad = R / 2 + 10, half = W / 2 - pad, max = Math.max(1, ...live.map(s => Math.abs(Q[s].chg)));
    const items = live.map(s => ({ s, x: W / 2 + Q[s].chg / max * half })).sort((a, b) => Math.abs(a.x - W / 2) - Math.abs(b.x - W / 2)), placed = [];
    for (const it of items) for (let k = 0; k < 40; k++) { const off = k === 0 ? 0 : (k % 2 ? 1 : -1) * Math.ceil(k / 2) * (R + 4); if (!placed.some(p => Math.abs(p.x - it.x) < R + 3 && Math.abs(p.y - off) < R + 3)) { it.y = off; placed.push(it); break; } }
    const span = Math.max(R, ...placed.map(p => Math.abs(p.y))), H = Math.max(220, span * 2 + R + 90), cy = (H - 34) / 2 + 6, seen = sw.classList.contains('seen');
    sw.style.height = H + 'px';
    const sorted = live.slice().sort((a, b) => Q[a].chg - Q[b].chg), worst = sorted[0], best = sorted[sorted.length - 1];
    sw.innerHTML = `<i class="sz" style="top:${cy}px"></i><i class="s0"></i><span class="sl l">−${max.toFixed(1)}%</span><span class="sl c">0%</span><span class="sl r">+${max.toFixed(1)}%</span>` +
      (worst ? `<span class="se l">worst <b>$${esc(worst)} ${pct(Q[worst].chg)}</b></span><span class="se r">best <b>$${esc(best)} ${pct(Q[best].chg)}</b></span>` : '') +
      placed.map((p, i) => `<button type="button" class="sd ${cls(Q[p.s].chg)}" data-s="${esc(p.s)}" title="$${esc(p.s)} ${pct(Q[p.s].chg)}" aria-label="$${esc(p.s)} ${pct(Q[p.s].chg)}" style="left:${(p.x - R / 2).toFixed(1)}px;top:${(cy + p.y - R / 2).toFixed(1)}px;width:${R}px;height:${R}px;--d:${Math.min(i, 30) * 25}ms">${logoTag(p.s)}</button>`).join('');
    if (seen) sw.classList.add('seen');
    // the last hour
    const hr = SYMS.filter(s => Q[s] && Q[s].h1 != null).sort((a, b) => Math.abs(Q[b].h1) - Math.abs(Q[a].h1)).slice(0, 6);
    hl.innerHTML = hr.length ? hr.map(s => `<button type="button" class="hm" data-s="${esc(s)}">${logoTag(s)}<b>$${esc(s)}</b><span class="${cls(Q[s].h1)}">${pct(Q[s].h1)}</span><i class="hb ${cls(Q[s].h1)}" style="--w:${Math.min(100, Math.abs(Q[s].h1) / Math.max(.01, Math.abs(Q[hr[0]].h1)) * 100).toFixed(0)}%"></i></button>`).join('') : '<p class="empty">no moves in the last hour yet.</p>';
  }
  $('#swarm').addEventListener('click', e => { const b = e.target.closest('.sd'); if (b) openDrawer(b.dataset.s); });
  $('#hourList').addEventListener('click', e => { const b = e.target.closest('.hm'); if (b) openDrawer(b.dataset.s); });

  // ---------------------------------------------------------------- the stock drawer: every number we can read for one stock, and its chart
  let DR = null, lastFocus = null, TF = '24h'; const CH = {};
  async function chart() {
    const s = DR, tf = TF, cv = $('#drChart'), note = $('#drCn'); if (!s) return;
    const key = s + tf; note.textContent = '';
    let pts = CH[key] && Date.now() - CH[key].at < 300000 ? CH[key].pts : null;
    const ctx = cv.getContext('2d'), W = cv.width, H = cv.height; ctx.clearRect(0, 0, W, H);
    if (!pts) {
      ctx.fillStyle = '#f4f8f5'; rr(ctx, 0, 0, W, H, 24); ctx.fill(); ctx.fillStyle = '#8b958f'; ctx.font = '500 24px JBM'; ctx.textAlign = 'center'; ctx.fillText('reading the chart…', W / 2, H / 2 + 8); ctx.textAlign = 'left';
      try { const r = await fetch(`/api/chart?s=${encodeURIComponent(s)}&tf=${tf}`); const j = await r.json(); if (j && j.ok) { pts = j.pts; CH[key] = { pts, at: Date.now() }; } } catch {}
      if (DR !== s || TF !== tf) return;
    }
    ctx.clearRect(0, 0, W, H);
    if (!pts || pts.length < 3) { ctx.fillStyle = '#f4f8f5'; rr(ctx, 0, 0, W, H, 24); ctx.fill(); note.textContent = "the chart can't be read right now. the numbers below are live."; return; }
    const ys = pts.map(p => p[1]), lo = Math.min(...ys), hi = Math.max(...ys), pad = (hi - lo) * .12 || hi * .01, y0 = lo - pad, y1 = hi + pad;
    const X = i => 18 + i / (pts.length - 1) * (W - 36), Y = v => H - 34 - (v - y0) / (y1 - y0) * (H - 70);
    const up = ys[ys.length - 1] >= ys[0], col = up ? '#13a356' : '#e23a5b';
    ctx.fillStyle = '#f4f8f5'; rr(ctx, 0, 0, W, H, 24); ctx.fill();
    ctx.strokeStyle = 'rgba(11,13,12,.07)'; ctx.lineWidth = 1; for (let k = 1; k < 4; k++) { const y = 18 + k * (H - 52) / 4; ctx.beginPath(); ctx.moveTo(18, y); ctx.lineTo(W - 18, y); ctx.stroke(); }
    ctx.beginPath(); pts.forEach((p, i) => i ? ctx.lineTo(X(i), Y(p[1])) : ctx.moveTo(X(i), Y(p[1]))); ctx.lineTo(X(pts.length - 1), H - 34); ctx.lineTo(X(0), H - 34); ctx.closePath();
    ctx.fillStyle = up ? 'rgba(47,207,116,.16)' : 'rgba(255,93,125,.16)'; ctx.fill();
    ctx.beginPath(); pts.forEach((p, i) => i ? ctx.lineTo(X(i), Y(p[1])) : ctx.moveTo(X(i), Y(p[1]))); ctx.strokeStyle = col; ctx.lineWidth = 4; ctx.lineJoin = 'round'; ctx.stroke();
    ctx.fillStyle = col; ctx.beginPath(); ctx.arc(X(pts.length - 1), Y(ys[ys.length - 1]), 7, 0, 7); ctx.fill();
    ctx.fillStyle = '#5c6661'; ctx.font = '500 20px JBM'; ctx.fillText('high ' + usd(hi), 26, 36); ctx.fillText('low ' + usd(lo), 26, H - 10);
    const chg = (ys[ys.length - 1] / ys[0] - 1) * 100; ctx.textAlign = 'right'; ctx.fillStyle = col; ctx.font = '700 22px JBM'; ctx.fillText(`${pct(chg)} in ${tf}`, W - 24, 36); ctx.textAlign = 'left';
  }
  function fillDrawer() {
    const s = DR; if (!s) return; const q = Q[s] || {}, m = mood(s), i = SYMS.indexOf(s);
    $('#drLogo').style.setProperty('--l', `url('${LOGO(s)}')`);
    $('#drSym').textContent = '$' + s; $('#drName').textContent = NAME[s] + ' · ' + GROUP[s].split(' ').map(g => GLABEL[g]).join(' · ');
    $('#drKey').style.setProperty('--c', TILE[i % 6]); $('#drKey').innerHTML = lk(s, m);
    $('#drPrice').textContent = usd(q.price);
    const c = $('#drChg'); c.textContent = (has(s) ? pct(q.chg) + ' in 24h · ' : '') + wears(m); c.className = m === 'down' ? 'dn' : m ? 'up' : '';
    const mv = (k, v) => `<div><small>${k}</small><b class="${cls(v)}">${v == null ? '—' : pct(v)}</b></div>`;
    $('#drMoves').innerHTML = mv('1h', q.h1) + mv('6h', q.h6) + mv('24h', q.chg);
    const st = (k, v) => `<div><dt>${k}</dt><dd>${v}</dd></div>`, trades = q.nb == null && q.ns == null ? null : (q.nb || 0) + (q.ns || 0);
    $('#drStats').innerHTML = st('volume 24h', short(q.vol)) + st('trades 24h', int(trades)) + st('traders 24h', int(q.tr)) + st('holders', int(q.hold)) + st('liquidity', short(q.liq)) + st('tokens on solana', short(q.mcap));
    const b = q.buy || 0, se = q.sell || 0, tot = b + se;
    $('#drFlow').innerHTML = tot > 0 ? `<div class="fl"><i class="b" style="width:${(b / tot * 100).toFixed(1)}%"></i><i class="s" style="width:${(se / tot * 100).toFixed(1)}%"></i></div><div class="fll"><span>buys ${Math.round(b / tot * 100)}% · ${short(b)}</span><span>sells ${Math.round(se / tot * 100)}% · ${short(se)}</span></div>` : '';
    $('#drMint').innerHTML = (q.mint ? `<span>mint</span><code>${esc(q.mint.slice(0, 6))}…${esc(q.mint.slice(-6))}</code><button type="button" class="cp" data-m="${esc(q.mint)}">copy</button><a href="https://solscan.io/token/${encodeURIComponent(q.mint)}" target="_blank" rel="noopener noreferrer">solscan ↗</a>` : '') + `<span class="mk">wall street ${esc(marketLine())} · the token trades 24/7</span>`;
    const jup = $('#drJup'), dex = $('#drDex');
    if (q.mint) { jup.href = `https://jup.ag/swap/SOL-${encodeURIComponent(q.mint)}`; dex.href = `https://dexscreener.com/solana/${encodeURIComponent(q.mint)}`; jup.hidden = dex.hidden = false; } else jup.hidden = dex.hidden = true;
    const f = $('#drFav'); f.textContent = isFav(s) ? '★ on my list' : '☆ add to my list'; f.classList.toggle('on', isFav(s));
    $('#drBag').textContent = BAG.includes(s) ? 'in my bag ✓' : 'add to my bag';
  }
  function openDrawer(s) {
    if (!SYMS.includes(s)) return;
    const was = DR; DR = s; lastFocus = was ? lastFocus : document.activeElement; fillDrawer(); chart();
    const d = $('#drawer'); d.hidden = false; html.classList.add('lock');
    requestAnimationFrame(() => requestAnimationFrame(() => d.classList.add('open')));
    setTimeout(() => $('.dr-x').focus({ preventScroll: true }), 60);
    try { history.replaceState(null, '', '#s=' + encodeURIComponent(s)); } catch {}
  }
  function closeDrawer() {
    const d = $('#drawer'); if (d.hidden) return; DR = null;
    d.classList.remove('open'); html.classList.remove('lock'); setTimeout(() => { if (!d.classList.contains('open')) d.hidden = true; }, 420);
    if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
    try { history.replaceState(null, '', location.pathname); } catch {}
  }
  $('#drawer').addEventListener('click', e => {
    if (e.target.closest('[data-close]')) { closeDrawer(); return; }
    const cp = e.target.closest('.cp'); if (cp) navigator.clipboard.writeText(cp.dataset.m).then(() => toast('mint copied'), () => toast(cp.dataset.m));
  });
  $$('.dr-tf button').forEach(b => b.addEventListener('click', () => { TF = b.dataset.tf; $$('.dr-tf button').forEach(x => x.classList.toggle('on', x === b)); chart(); }));
  addEventListener('keydown', e => { if (e.key === 'Escape') closeDrawer(); });
  $('#drMeme').addEventListener('click', () => { const s = DR; closeDrawer(); toMaker(s); });
  $('#drVs').addEventListener('click', () => { const s = DR; closeDrawer(); if (VS.b === s) VS.b = VS.a; VS.a = s; if (VS.b === s) VS.b = s === 'NVDA' ? 'AMD' : 'NVDA'; VS.side = 'b'; slots(); drawVs(true); go('#versus'); });
  $('#drBag').addEventListener('click', () => { const s = DR; if (BAG.includes(s)) { toast(`$${s} is already in your bag`); return; } const l = [...BAG, s]; if (l.length > 6) l.shift(); setBag(l, false); fillDrawer(); toast(`$${s} added to your bag`); });
  $('#drPfp').addEventListener('click', () => { const s = DR; closeDrawer(); PF.sym = s; pfSync(); drawPfp(true); go('#pfp'); });
  $('#drFav').addEventListener('click', () => { if (DR) toggleFav(DR); });
  $('#drLink').addEventListener('click', () => { const u = `${location.origin}/#s=${encodeURIComponent(DR)}`; navigator.clipboard.writeText(u).then(() => toast('link copied'), () => toast(u)); });

  // ---------------------------------------------------------------- motion: reveals, word rise, nav spy, hero parallax
  const io = 'IntersectionObserver' in window ? new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('vis'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -8% 0px' }) : null;
  function reveal() { $$('.rv:not(.vis), .wr:not(.vis)').forEach((el, i) => { if (el.classList.contains('rv')) el.style.transitionDelay = (i % 3) * 90 + 'ms'; if (io) io.observe(el); else el.classList.add('vis'); }); }
  function words() { $$('.band h2').forEach(h => { let i = 0; h.innerHTML = h.textContent.split(' ').map(w => `<span class="w"><span style="--i:${i++}">${esc(w)}</span></span>`).join(' '); h.classList.add('wr'); }); }
  function once(sel, fn) { const el = $(sel); if (!el) return; if (!('IntersectionObserver' in window)) { fn(el); return; } const o = new IntersectionObserver(es => { if (es.some(e => e.isIntersecting)) { o.disconnect(); fn(el); } }, { rootMargin: '0px 0px -10% 0px' }); o.observe(el); }
  function watch() {
    once('#stockGrid', el => { el.classList.add('seen'); setTimeout(() => el.classList.add('done'), 1600); });
    once('#boardList', el => { el.classList.add('seen', 'anim'); setTimeout(() => el.classList.remove('anim'), 2500); });
    once('#mapBox', el => { el.classList.add('seen'); });
    once('#swarm', el => { el.classList.add('seen'); });
    const links = $$('.nav a[href^="#"]');
    if ('IntersectionObserver' in window) { const spy = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) links.forEach(a => a.classList.toggle('on', a.getAttribute('href') === '#' + e.target.id)); }), { rootMargin: '-45% 0px -50% 0px' }); $$('main section[id]').forEach(s => spy.observe(s)); }
    if (!REDUCED && HOVER) { const hk = $('.hero-key'); $('.hero').addEventListener('pointermove', e => { const x = e.clientX / innerWidth - .5, y = e.clientY / innerHeight - .5; hk.style.translate = `${(x * 22).toFixed(1)}px ${(y * 14).toFixed(1)}px`; hk.style.rotate = `${(x * 3).toFixed(2)}deg`; }); }
  }
  if (CONFIG.ca) { const p = $('#caPill'); p.hidden = false; $('#caTxt').textContent = CONFIG.ca.slice(0, 4) + '…' + CONFIG.ca.slice(-4); p.addEventListener('click', async () => { try { await navigator.clipboard.writeText(CONFIG.ca); toast('copied'); } catch { toast(CONFIG.ca); } }); }
  if (CONFIG.x) { const x = $('#xLink'); x.hidden = false; x.href = CONFIG.x; }

  // ---------------------------------------------------------------- go
  words(); $$('.band .panel:not(.swarm), .chips, .tools, .src, .maplegend, .pstats, .hour').forEach(e => e.classList.add('rv'));
  intro(); heroGrid(); orbit(); setupMaker(); setupVs(); setupBag(); setupPfp(); drawStocks(); drawWall(); tapes(false); reveal(); watch();
  Promise.all([document.fonts.load('800 50px Inter'), document.fonts.load('500 20px JBM'), document.fonts.load('700 20px JBM')]).catch(() => {}).then(() => { drawMaker(); drawVs(); drawPfp(); drawBag(); });
  let todayDone = false;
  async function refresh(first) {
    const ok = first ? await firstLoad : await loadQuotes();
    drawStocks(); tapes(ok); drawMaker(); drawVs(); slots(); drawBag(); drawBoard(ok); drawWall(); drawSectors(ok); drawMap(ok); drawPulse(ok); if (DR) fillDrawer();
    if (first || (ok && !todayDone)) { drawToday(ok); todayDone = ok; }
    if (first) { const m = location.hash.match(/^#s=([A-Za-z.]+)$/); if (m && SYMS.includes(decodeURIComponent(m[1]).toUpperCase())) setTimeout(() => openDrawer(decodeURIComponent(m[1]).toUpperCase()), html.classList.contains('ready') ? 200 : 5200); }
  }
  refresh(true); setInterval(() => { if (!document.hidden) refresh(false); }, 60000);
})();
