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
  const lk = (s, m, c, bd) => `<span class="lg-big" style="--l:url('${LOGO(s)}')"></span><i class="kk" style="--k:url(${keyImg(s, m)})${bd ? ';--bd:' + bd : ''}"></i>`;
  const wears = m => m === 'down' ? 'beanie on' : m === 'flat' ? 'a flat day' : m ? 'crown on' : 'no move yet';

  // ---------------------------------------------------------------- the opening: a ticker board, a bare key, the shades come down
  function intro() {
    const el = $('#intro'), ready = () => html.classList.add('ready');
    if (!el || html.classList.contains('no-intro')) { ready(); if (el) el.remove(); return; }
    try { sessionStorage.setItem('memer:in', '1'); } catch {}
    const narrow = innerWidth < 640, cols = narrow ? 3 : innerWidth < 1100 ? 5 : 6, rows = narrow ? 9 : 6;
    const list = Array.from({ length: cols * rows }, (_, i) => SYMS[(i * 7) % SYMS.length]);
    const board = $('#iBoard'); board.style.setProperty('--cols', cols);
    board.innerHTML = list.map((s, i) => `<div class="i-cell" style="--dl:${(i % cols) * 45 + Math.floor(i / cols) * 60}ms">${logoTag(s)}<b></b><span></span></div>`).join('');
    const cells = [...board.children];
    $('#iBurst').innerHTML = Array.from({ length: 14 }, (_, i) => `<i style="--a:${(i * 360 / 14 + (i % 3) * 8).toFixed(0)}deg;--d:${190 + (i * 47) % 170}px;--dl:${(i % 4) * 40}ms;--sp:${(i % 2 ? 1 : -1) * (40 + i * 9)}deg;--c:${TILE[i % 6]};--k:url(${FIT(i)})"></i>`).join('');
    // split-flap text: every character spins through glyphs, then settles left to right
    const GL = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789$+-.%', flips = new Map();
    const flip = (node, to, delay) => flips.set(node, { to, t0: performance.now() + delay });
    const tick = () => { const now = performance.now(); for (const [node, f] of flips) { const k = now - f.t0; if (k < 0) continue; const done = Math.floor(k / 34); let out = ''; for (let i = 0; i < f.to.length; i++) out += i < done || f.to[i] === ' ' ? f.to[i] : GL[(Math.random() * GL.length) | 0]; node.textContent = out; if (done >= f.to.length) flips.delete(node); } };
    const paint = first => cells.forEach((c, i) => { const s = list[i], sp = c.lastChild; sp.className = cls(has(s) ? Q[s].chg : null); if (first) flip(c.querySelector('b'), '$' + s, 150 + i * 16); flip(sp, has(s) ? pct(Q[s].chg) : NAME[s], (first ? 300 : 0) + i * 14); });
    let over = false; const timers = [];
    const at = (ms, fn) => timers.push(setTimeout(() => { if (!over) fn(); }, ms));
    timers.push(setInterval(tick, 45));
    paint(true);
    firstLoad.then(ok => { if (ok && !over && !el.classList.contains('drop')) paint(false); });
    const SUB = 'turn any stock into a meme', sub = $('#iSub');
    const type = () => { let i = 0; const t = setInterval(() => { sub.textContent = SUB.slice(0, ++i); if (i >= SUB.length) clearInterval(t); }, 24); timers.push(t); };
    const finish = fast => { if (over) return; over = true; timers.forEach(t => { clearTimeout(t); clearInterval(t); }); flips.clear(); ready(); el.classList.add('out'); setTimeout(() => el.remove(), fast ? 500 : 650); };
    el.addEventListener('pointerdown', () => finish(true)); addEventListener('keydown', e => { if (e.key === 'Escape') finish(true); });
    requestAnimationFrame(() => el.classList.add('go'));
    at(1150, () => el.classList.add('drop'));
    at(1900, () => el.classList.add('deal'));
    at(2900, () => { el.classList.add('land'); type(); });
    at(3950, () => el.classList.add('end'));
    at(4600, () => finish(false));
  }
  function heroGrid() { const n = innerWidth < 700 ? 36 : 72; $('#heroGrid').innerHTML = Array.from({ length: n }, (_, i) => `<i style="--k:url(${FIT(i * 3)});--dl:${-(i % 9)}s"></i>`).join(''); }

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
  function clock() { const s = market(); $('#clock').classList.toggle('open', s.open); $('#clockTxt').textContent = s.open ? `open · closes in ${dur(s.ms)}` : `closed · opens in ${dur(s.ms)}`; }

  // ---------------------------------------------------------------- hero mood, tapes, the wall of keys
  function countTo(el, to) {
    const from = parseFloat(el.dataset.v || '0') || 0; el.dataset.v = to;
    if (REDUCED || from === to) { el.textContent = to; return; }
    const t0 = performance.now(), D = 800, step = now => { const k = Math.min(1, (now - t0) / D); el.textContent = Math.round(from + (to - from) * (1 - Math.pow(1 - k, 3))); if (k < 1) requestAnimationFrame(step); };
    requestAnimationFrame(step); setTimeout(() => { el.textContent = to; }, D + 150);
  }
  function moodStrip() {
    const g = SYMS.filter(s => has(s) && Q[s].chg > 0).length, r = SYMS.filter(s => has(s) && Q[s].chg < 0).length;
    if (g + r) { countTo($('#mGreen'), g); countTo($('#mRed'), r); } else { $('#mGreen').textContent = '—'; $('#mRed').textContent = '—'; }
  }
  function tapes(ok) {
    const moves = SYMS.filter(has).map(s => `<span>$${esc(s)} <b class="${cls(Q[s].chg)}">${pct(Q[s].chg)}</b></span>`);
    const a = ok && moves.length ? moves : ['<span>turn any stock into a meme</span>', '<span>reading today\'s moves</span>'];
    $('#tape').innerHTML = a.join('') + a.join('');
    const b = ['<span>turn any stock into a meme</span>', ...[...LINES.up.slice(0, 4), ...LINES.down.slice(0, 3)].map(l => `<span>${esc(l)}</span>`), '<span>40 stocks. 40 keys.</span>', `<span>wall street: ${esc(marketLine())}</span>`];
    $('#tape2').innerHTML = b.join('') + b.join('');
  }
  function drawWall() {
    const one = hide => SYMS.map((s, i) => { const m = mood(s); return `<button type="button" class="wt" data-s="${esc(s)}"${hide ? ' tabindex="-1" aria-hidden="true"' : ''}><span class="wk lk" style="--c:${TILE[i % 6]}">${lk(s, m)}</span><b>$${esc(s)}</b><span class="wc ${cls(has(s) ? Q[s].chg : null)}">${has(s) ? pct(Q[s].chg) : '—'}</span></button>`; }).join('');
    $('#wall').innerHTML = one(false) + one(true);
  }

  // ---------------------------------------------------------------- 01 the stocks
  let FILTER = 'all'; const PREV = {};
  function fits(s) { if (FILTER === 'all') return true; if (FILTER === 'up') return has(s) && Q[s].chg > 0; if (FILTER === 'down') return has(s) && Q[s].chg < 0; return GROUP[s].split(' ').includes(FILTER); }
  function drawStocks() {
    $('#stockGrid').innerHTML = STOCKS.map(([s, n], i) => {
      const q = Q[s], m = mood(s), p = q ? q.price : null, fl = p != null && PREV[s] != null && p !== PREV[s] ? (p > PREV[s] ? ' flash-up' : ' flash-dn') : '';
      if (p != null) PREV[s] = p;
      return `<button type="button" class="sk${s === M.sym ? ' sel' : ''}${fits(s) ? '' : ' hide'}" data-s="${esc(s)}" style="--dl:${Math.min(i, 24) * 30}ms">
        <span class="ki lk" style="--c:${TILE[i % 6]}">${lk(s, m, TILE[i % 6], (-((i * .37) % 3.6)).toFixed(2) + 's')}</span><b>$${esc(s)}</b><span class="n">${esc(n)}</span>
        <span class="p${fl}"><span>${usd(p)}</span><span class="${m === 'down' ? 'dn' : m ? 'up' : ''}">${has(s) ? pct(q.chg) : '—'}</span></span></button>`;
    }).join('');
  }
  $('#stockGrid').addEventListener('click', e => { const b = e.target.closest('.sk'); if (b) openDrawer(b.dataset.s); });
  if (!REDUCED && HOVER) {
    $('#stockGrid').addEventListener('pointermove', e => { const b = e.target.closest('.sk'); if (!b) return; const r = b.getBoundingClientRect(); b.style.setProperty('--ry', (((e.clientX - r.left) / r.width - .5) * 14).toFixed(1) + 'deg'); b.style.setProperty('--rx', (-((e.clientY - r.top) / r.height - .5) * 14).toFixed(1) + 'deg'); });
    $('#stockGrid').addEventListener('pointerout', e => { const b = e.target.closest('.sk'); if (b && !b.contains(e.relatedTarget)) { b.style.removeProperty('--rx'); b.style.removeProperty('--ry'); } });
  }
  $('#wall').addEventListener('click', e => { const b = e.target.closest('.wt'); if (b) openDrawer(b.dataset.s); });
  $$('#chips button').forEach(b => b.addEventListener('click', () => { FILTER = b.dataset.f; $$('#chips button').forEach(x => x.classList.toggle('on', x === b)); $$('.sk').forEach(e => e.classList.toggle('hide', !fits(e.dataset.s))); }));
  const go = id => $(id).scrollIntoView({ behavior: REDUCED ? 'auto' : 'smooth' });
  function toMaker(s, line) { M.sym = s; M.mood = 'auto'; M.line = line || ''; M.own = !!line; $('#mkStock').value = s; $$('#maker .moods button').forEach(x => x.classList.toggle('on', x.dataset.mood === 'auto')); drawMaker(true); $$('.sk').forEach(e => e.classList.toggle('sel', e.dataset.s === s)); go('#maker'); }

  // ---------------------------------------------------------------- canvases
  const IMG = {};
  const loadImg = src => IMG[src] || (IMG[src] = new Promise(res => { const im = new Image(); im.onload = () => res(im); im.onerror = () => { delete IMG[src]; res(null); }; im.src = src; }));
  function wrap(ctx, text, max) { const words = text.split(' '), lines = []; let cur = ''; for (const w of words) { const t = cur ? cur + ' ' + w : w; if (ctx.measureText(t).width > max && cur) { lines.push(cur); cur = w; } else cur = t; } if (cur) lines.push(cur); return lines; }
  const BG = m => m === 'down' ? '#ff6b8b' : m === 'flat' ? '#f4ecd9' : '#55ee96';
  const rr = (ctx, x, y, w, h, r) => { ctx.beginPath(); if (ctx.roundRect) ctx.roundRect(x, y, w, h, r); else ctx.rect(x, y, w, h); };
  function logoAt(ctx, im, x, y, s, r) { if (!im) return; ctx.save(); rr(ctx, x, y, s, s, r); ctx.fillStyle = '#111'; ctx.fill(); ctx.clip(); ctx.drawImage(im, x, y, s, s); ctx.restore(); ctx.save(); rr(ctx, x, y, s, s, r); ctx.lineWidth = 5; ctx.strokeStyle = '#fff'; ctx.stroke(); ctx.restore(); }
  function dots(ctx, W, H) { ctx.fillStyle = 'rgba(11,13,12,.07)'; for (let y = 18; y < H; y += 30) for (let x = 18; x < W; x += 30) { ctx.beginPath(); ctx.arc(x, y, 1.6, 0, 7); ctx.fill(); } }
  function foot(ctx, H) { ctx.fillStyle = '#0b0d0c'; ctx.font = '800 30px Inter'; ctx.fillText('memer', 62, H - 44); ctx.font = '500 20px JBM'; ctx.globalAlpha = .65; ctx.fillText('turn any stock into a meme', 182, H - 46); ctx.globalAlpha = 1; }
  const pop = el => { if (!REDUCED && el.animate) el.animate([{ transform: 'scale(.97) rotate(-.4deg)' }, { transform: 'none' }], { duration: 420, easing: 'cubic-bezier(.2,1.5,.4,1)' }); };
  async function card(cv, sym, m, line) {
    const tok = cv._t = (cv._t || 0) + 1, [im, lg] = await Promise.all([loadImg(keyImg(sym, m)), loadImg(LOGO(sym))]); if (tok !== cv._t) return;
    const ctx = cv.getContext('2d'), W = 1200, H = 675; cv.width = W; cv.height = H;
    const q = Q[sym]; ctx.fillStyle = BG(m); ctx.fillRect(0, 0, W, H); dots(ctx, W, H);
    if (im) ctx.drawImage(im, W - 600, (H - 600) / 2 + 8, 600, 600);
    ctx.fillStyle = '#0b0d0c'; ctx.textBaseline = 'alphabetic';
    const tx = lg ? 206 : 60; logoAt(ctx, lg, 60, 50, 124, 30);
    ctx.font = `800 ${lg ? (sym.length > 4 ? 92 : sym.length > 3 ? 108 : 124) : (sym.length > 4 ? 104 : 124)}px Inter`; ctx.fillText('$' + sym, tx, 158);
    ctx.font = '500 28px JBM'; ctx.globalAlpha = .7; ctx.fillText(NAME[sym] || '', tx + 4, 206); ctx.globalAlpha = 1;
    if (has(sym)) { ctx.font = '700 58px JBM'; ctx.fillText(pct(q.chg) + ' today', 62, 312); ctx.font = '500 30px JBM'; ctx.globalAlpha = .7; ctx.fillText(usd(q.price), 66, 360); ctx.globalAlpha = 1; }
    ctx.font = '800 50px Inter'; wrap(ctx, line, 560).slice(0, 3).forEach((l, i) => ctx.fillText(l, 62, (has(sym) ? 460 : 330) + i * 58));
    foot(ctx, H);
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
      const d = document.createElement('i'); d.className = 'cf'; d.style.cssText = `left:${cx - 22}px;top:${cy - 22}px;--c:${TILE[i % 6]};--k:url(${FIT(i)})`; document.body.appendChild(d);
      const a = i / 12 * Math.PI * 2 + Math.random() * .4, dist = 90 + Math.random() * 110, dx = Math.cos(a) * dist, dy = Math.sin(a) * dist - 60;
      d.animate([{ transform: 'translate(0,0) scale(.3)', opacity: 1 }, { transform: `translate(${dx}px,${dy}px) scale(1) rotate(${(Math.random() - .5) * 200}deg)`, opacity: 1, offset: .55 }, { transform: `translate(${dx * 1.15}px,${dy + 150}px) scale(.7) rotate(${(Math.random() - .5) * 320}deg)`, opacity: 0 }], { duration: 1150, easing: 'cubic-bezier(.2,.7,.3,1)' });
      setTimeout(() => d.remove(), 1250);
    }
  }

  // ---------------------------------------------------------------- 02 the maker
  const M = { sym: 'NVDA', mood: 'auto', line: '' };
  const curMood = () => M.mood === 'auto' ? (mood(M.sym) || 'up') : M.mood;
  const lineFor = m => pick(LINES[m] || LINES.up);
  async function drawMaker(p) {
    const m = curMood(); if (!M.line || (!M.own && M.lm !== m)) { M.line = lineFor(m); M.own = false; } M.lm = m; $('#mkLine').value = M.line;
    await card($('#mkCanvas'), M.sym, m, M.line); if (p) pop($('#mkCanvas'));
    $('#mkNote').textContent = has(M.sym) ? '' : "today's move for this one can't be read right now, so the meme has no numbers.";
  }
  const opts = () => STOCKS.map(([s, n]) => `<option value="${esc(s)}">$${esc(s)} · ${esc(n)}</option>`).join('');
  function setupMaker() {
    $('#mkStock').innerHTML = opts(); $('#mkStock').value = M.sym;
    $('#mkStock').addEventListener('change', e => { M.sym = e.target.value; M.line = ''; drawMaker(true); });
    $$('#maker .moods button').forEach(b => b.addEventListener('click', () => { M.mood = b.dataset.mood; $$('#maker .moods button').forEach(x => x.classList.toggle('on', x === b)); M.line = ''; drawMaker(true); }));
    $('#mkLine').addEventListener('input', e => { M.line = e.target.value; M.own = true; clearTimeout(M.t); M.t = setTimeout(drawMaker, 120); });
    $('#mkShuffle').addEventListener('click', () => { const m = curMood(); let l = lineFor(m); for (let i = 0; i < 5 && l === M.line; i++) l = lineFor(m); M.line = l; M.own = false; drawMaker(true); });
    $('#mkRandom').addEventListener('click', () => { M.sym = pick(SYMS); $('#mkStock').value = M.sym; M.line = ''; drawMaker(true); });
    $('#mkSave').addEventListener('click', e => save($('#mkCanvas'), `memer-${M.sym}`, e.currentTarget));
    $('#mkPost').addEventListener('click', () => post($('#mkCanvas'), `memer-${M.sym}`, postText(M.sym, M.line)));
  }
  function save(cv, name, btn) { burst(btn); cv.toBlob(b => { const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = name + '.png'; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 3000); toast('saved'); }, 'image/png'); }
  function postText(sym, line) { return `$${sym}${has(sym) ? ' ' + pct(Q[sym].chg) + ' today' : ''}. ${line}\n\nmade with memer`; }
  async function post(cv, name, text) {
    try {
      const blob = await new Promise(r => cv.toBlob(r, 'image/png')); const file = new File([blob], name + '.png', { type: 'image/png' });
      if (navigator.canShare && navigator.canShare({ files: [file] }) && matchMedia('(pointer: coarse)').matches) { await navigator.share({ files: [file], text }); return; }
    } catch (e) { if (e && e.name === 'AbortError') return; }
    save(cv, name); toast('meme saved. attach it to the post.');
    open('https://x.com/intent/post?text=' + encodeURIComponent(text), '_blank', 'noopener');
  }

  // ---------------------------------------------------------------- 03 versus
  const VS = { a: 'NVDA', b: 'AMD' };
  const drawVs = p => vsCard($('#vsCanvas'), VS.a, VS.b).then(() => { if (p) pop($('#vsCanvas')); $('#vsNote').textContent = has(VS.a) && has(VS.b) ? '' : "one of these moves can't be read right now."; });
  function setupVs() {
    $('#vsA').innerHTML = opts(); $('#vsB').innerHTML = opts(); $('#vsA').value = VS.a; $('#vsB').value = VS.b;
    $('#vsA').addEventListener('change', e => { VS.a = e.target.value; drawVs(true); });
    $('#vsB').addEventListener('change', e => { VS.b = e.target.value; drawVs(true); });
    $('#vsSwap').addEventListener('click', () => { [VS.a, VS.b] = [VS.b, VS.a]; $('#vsA').value = VS.a; $('#vsB').value = VS.b; drawVs(true); });
    $('#vsRandom').addEventListener('click', () => { VS.a = pick(SYMS); do { VS.b = pick(SYMS); } while (VS.b === VS.a); $('#vsA').value = VS.a; $('#vsB').value = VS.b; drawVs(true); });
    $('#vsSave').addEventListener('click', e => save($('#vsCanvas'), `memer-${VS.a}-vs-${VS.b}`, e.currentTarget));
    $('#vsPost').addEventListener('click', () => post($('#vsCanvas'), `memer-${VS.a}-vs-${VS.b}`, `$${VS.a} vs $${VS.b}. ${verdict(VS.a, VS.b)}\n\nmade with memer`));
  }

  // ---------------------------------------------------------------- 04 today: the biggest moves, already memes
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

  // ---------------------------------------------------------------- 05 the board
  let BOARD_ALL = false;
  function drawBoard(ok) {
    const box = $('#boardList');
    if (!ok) { box.innerHTML = "<p class=\"empty\">today's moves can't be read right now.</p>"; return; }
    const rows = [...SYMS].sort((a, b) => (has(b) ? Q[b].chg : -1e9) - (has(a) ? Q[a].chg : -1e9));
    const max = Math.max(1, ...SYMS.filter(has).map(s => Math.abs(Q[s].chg)));
    box.innerHTML = rows.map((s, i) => { const m = mood(s), c = has(s) ? Q[s].chg : null, w = c == null ? 0 : Math.min(50, Math.abs(c) / max * 50);
      return `<div class="brow${i > 9 ? ' x' : ''}" data-s="${esc(s)}" style="--r:${Math.min(i, 14)}"><span class="rk">${String(i + 1).padStart(2, '0')}</span><span class="bk" style="--l:url('${LOGO(s)}')"><i style="--k:url(${keyImg(s, m)})"></i></span>
        <span class="bt"><b>$${esc(s)}</b><span>${esc(NAME[s])}</span></span><span class="bp">${usd(Q[s] && Q[s].price)}</span>
        <span class="bc ${cls(c)}">${c == null ? '—' : pct(c)}</span>
        <span class="bar">${c == null ? '' : `<i class="${cls(c)}" style="--w:${w.toFixed(1)}%"></i>`}</span>
        <button type="button" class="bm" data-s="${esc(s)}">meme it</button></div>`; }).join('');
    const live = rows.filter(has), up = live.filter(s => Q[s].chg > 0).length;
    if (live.length) box.insertAdjacentHTML('afterbegin', `<div class="bsum"><span>best <b>$${esc(live[0])} ${pct(Q[live[0]].chg)}</b></span><span>worst <b>$${esc(live[live.length - 1])} ${pct(Q[live[live.length - 1]].chg)}</b></span><span><b>${up}</b> of <b>${live.length}</b> green</span></div>`);
    box.classList.toggle('short', !BOARD_ALL);
    box.insertAdjacentHTML('beforeend', `<button type="button" class="more">${BOARD_ALL ? 'show the top ten' : 'show all ' + rows.length}</button>`);
    box.querySelector('.more').addEventListener('click', () => { BOARD_ALL = !BOARD_ALL; drawBoard(true); if (!BOARD_ALL) go('#board'); });
  }
  $('#boardList').addEventListener('click', e => { const bm = e.target.closest('.bm'); if (bm) { toMaker(bm.dataset.s); return; } const row = e.target.closest('.brow'); if (row) openDrawer(row.dataset.s); });

  // ---------------------------------------------------------------- 06 sectors
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

  // ---------------------------------------------------------------- 07 the pfp
  const PF = { sym: 'NVDA', c: '#55ee96', fit: 'up' };
  const SW = ['#55ee96', '#3f6bff', '#f4ecd9', '#ffad33', '#8f6dff', '#ff6b8b', '#26c6c6', '#0f1110'];
  async function drawPfp(p) {
    const cv = $('#pfCanvas'), tok = cv._t = (cv._t || 0) + 1, im = await loadImg(keyImg(PF.sym, PF.fit)); if (tok !== cv._t) return;
    const ctx = cv.getContext('2d'), S = 1000; cv.width = S; cv.height = S;
    ctx.fillStyle = PF.c; ctx.fillRect(0, 0, S, S); if (im) ctx.drawImage(im, 120, 110, 760, 760); if (p) pop(cv);
  }
  function setupPfp() {
    $('#pfStock').innerHTML = opts(); $('#pfStock').value = PF.sym;
    $('#pfStock').addEventListener('change', e => { PF.sym = e.target.value; drawPfp(true); });
    $('#pfColors').innerHTML = SW.map((c, i) => `<button type="button" style="--c:${c}" data-c="${c}" aria-label="colour ${i + 1}"${i ? '' : ' class="on"'}></button>`).join('');
    $$('#pfColors button').forEach(b => b.addEventListener('click', () => { PF.c = b.dataset.c; $$('#pfColors button').forEach(x => x.classList.toggle('on', x === b)); drawPfp(true); }));
    $$('#pfp .moods button').forEach(b => b.addEventListener('click', () => { PF.fit = b.dataset.fit; $$('#pfp .moods button').forEach(x => x.classList.toggle('on', x === b)); drawPfp(true); }));
    $('#pfSave').addEventListener('click', e => save($('#pfCanvas'), `memer-pfp-${PF.sym}`, e.currentTarget));
  }

  // ---------------------------------------------------------------- the stock drawer: every number we can read for one stock
  let DR = null, lastFocus = null;
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
  }
  function openDrawer(s) {
    DR = s; lastFocus = document.activeElement; fillDrawer();
    const d = $('#drawer'); d.hidden = false; html.classList.add('lock');
    requestAnimationFrame(() => requestAnimationFrame(() => d.classList.add('open')));
    setTimeout(() => $('.dr-x').focus({ preventScroll: true }), 60);
  }
  function closeDrawer() {
    const d = $('#drawer'); if (d.hidden) return; DR = null;
    d.classList.remove('open'); html.classList.remove('lock'); setTimeout(() => { if (!d.classList.contains('open')) d.hidden = true; }, 420);
    if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
  }
  $('#drawer').addEventListener('click', e => {
    if (e.target.closest('[data-close]')) { closeDrawer(); return; }
    const cp = e.target.closest('.cp'); if (cp) navigator.clipboard.writeText(cp.dataset.m).then(() => toast('mint copied'), () => toast(cp.dataset.m));
  });
  addEventListener('keydown', e => { if (e.key === 'Escape') closeDrawer(); });
  $('#drMeme').addEventListener('click', () => { const s = DR; closeDrawer(); toMaker(s); });
  $('#drVs').addEventListener('click', () => { const s = DR; closeDrawer(); VS.a = s; if (VS.b === s) VS.b = s === 'NVDA' ? 'AMD' : 'NVDA'; $('#vsA').value = VS.a; $('#vsB').value = VS.b; drawVs(true); go('#versus'); });
  $('#drPfp').addEventListener('click', () => { const s = DR; closeDrawer(); PF.sym = s; $('#pfStock').value = s; drawPfp(true); go('#pfp'); });

  // ---------------------------------------------------------------- motion: reveals, word rise, nav spy, hero parallax
  const io = 'IntersectionObserver' in window ? new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('vis'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -8% 0px' }) : null;
  function reveal() { $$('.rv:not(.vis), .wr:not(.vis)').forEach((el, i) => { if (el.classList.contains('rv')) el.style.transitionDelay = (i % 3) * 90 + 'ms'; if (io) io.observe(el); else el.classList.add('vis'); }); }
  function words() { $$('.band h2').forEach(h => { let i = 0; h.innerHTML = h.textContent.split(' ').map(w => `<span class="w"><span style="--i:${i++}">${esc(w)}</span></span>`).join(' '); h.classList.add('wr'); }); }
  function once(sel, fn) { const el = $(sel); if (!el) return; if (!('IntersectionObserver' in window)) { fn(el); return; } const o = new IntersectionObserver(es => { if (es.some(e => e.isIntersecting)) { o.disconnect(); fn(el); } }, { rootMargin: '0px 0px -10% 0px' }); o.observe(el); }
  function watch() {
    once('#stockGrid', el => { el.classList.add('seen'); setTimeout(() => el.classList.add('done'), 1600); });
    once('#boardList', el => { el.classList.add('seen', 'anim'); setTimeout(() => el.classList.remove('anim'), 2500); });
    const links = $$('.nav a[href^="#"]');
    if ('IntersectionObserver' in window) { const spy = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) links.forEach(a => a.classList.toggle('on', a.getAttribute('href') === '#' + e.target.id)); }), { rootMargin: '-45% 0px -50% 0px' }); $$('main section[id]').forEach(s => spy.observe(s)); }
    if (!REDUCED && HOVER) { const hk = $('.hero-key'); $('.hero').addEventListener('pointermove', e => { const x = e.clientX / innerWidth - .5, y = e.clientY / innerHeight - .5; hk.style.translate = `${(x * 22).toFixed(1)}px ${(y * 14).toFixed(1)}px`; hk.style.rotate = `${(x * 3).toFixed(2)}deg`; }); }
  }
  if (CONFIG.ca) { const p = $('#caPill'); p.hidden = false; $('#caTxt').textContent = CONFIG.ca.slice(0, 4) + '…' + CONFIG.ca.slice(-4); p.addEventListener('click', async () => { try { await navigator.clipboard.writeText(CONFIG.ca); toast('copied'); } catch { toast(CONFIG.ca); } }); }
  if (CONFIG.x) { const x = $('#xLink'); x.hidden = false; x.href = CONFIG.x; }

  // ---------------------------------------------------------------- go
  words(); $$('.band .panel, .qa details, .chips, .src').forEach(e => e.classList.add('rv'));
  intro(); heroGrid(); setupMaker(); setupVs(); setupPfp(); drawStocks(); drawWall(); tapes(false); clock(); reveal(); watch();
  Promise.all([document.fonts.load('800 50px Inter'), document.fonts.load('500 20px JBM'), document.fonts.load('700 20px JBM')]).catch(() => {}).then(() => { drawMaker(); drawVs(); drawPfp(); });
  let todayDone = false;
  async function refresh(first) {
    const ok = first ? await firstLoad : await loadQuotes();
    drawStocks(); tapes(ok); moodStrip(); drawMaker(); drawVs(); drawBoard(ok); drawWall(); drawSectors(ok); clock(); if (DR) fillDrawer();
    if (first || (ok && !todayDone)) { drawToday(ok); todayDone = ok; }
  }
  refresh(true); setInterval(() => { if (!document.hidden) refresh(false); }, 60000); setInterval(clock, 30000);
})();
