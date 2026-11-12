// memer: turn any stock into a meme. every stock is a green key in pixel shades, dressed by today's real move.
(() => {
  const CONFIG = { ca: '', x: '' };   // set the coin's CA and X link here when they exist; the pill shows only then
  const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const html = document.documentElement;
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const TILE = ['#3f6bff', '#f4ecd9', '#ffad33', '#8f6dff', '#ff6b8b', '#26c6c6'];
  const FIT = i => `/assets/img/fits/${i % 8}.webp`;
  // ticker, name, group
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
  const NAME = Object.fromEntries(STOCKS.map(s => [s[0], s[1]]));
  const SYMS = STOCKS.map(s => s[0]);
  const LINES = {
    up: ['the shades stay on.', 'green day. same face.', 'unbothered. moisturized. up.', 'not even surprised.', 'the crown fits.', 'pressed the green key.', 'told you. wearing shades.'],
    down: ["it's a dip. the shades stay on.", 'red day. still in shades.', 'down bad. dressed well.', 'beanie on. shades on.', 'pressing the same key again.', 'cold out there. still cool.'],
    flat: ['nothing happened. the shades stay on.', 'flat day. flat face.', 'the market took a nap.'],
  };
  const pick = a => a[Math.floor(Math.random() * a.length)];
  let toastT; function toast(t) { const e = $('#toast'); e.textContent = t; e.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(() => e.classList.remove('show'), 2000); }

  // ---------------------------------------------------------------- the opening
  function intro() {
    const el = $('#intro');
    const ready = () => html.classList.add('ready');
    if (!el || html.classList.contains('no-intro')) { ready(); if (el) el.remove(); return; }
    try { sessionStorage.setItem('memer:in', '1'); } catch {}
    const rows = innerWidth < 640 ? 7 : 6, per = 9;
    $('#iPlane').innerHTML = Array.from({ length: rows }, (_, r) => `<div class="i-row">${Array.from({ length: per * 3 }, (_, i) => { const k = (r * 5 + (i % per) * 3) % 8, c = TILE[(r + i) % 6]; return `<div class="i-t"><i style="--c:${c};--k:url(${FIT(k)})"></i></div>`; }).join('')}</div>`).join('');
    $('#iBurst').innerHTML = Array.from({ length: 14 }, (_, i) => `<i style="--a:${(i * 360 / 14 + (i % 3) * 8).toFixed(0)}deg;--d:${170 + (i * 47) % 160}px;--dl:${(i % 4) * 40}ms;--sp:${(i % 2 ? 1 : -1) * (40 + i * 9)}deg;--c:${TILE[i % 6]};--k:url(${FIT(i)})"></i>`).join('');
    let over = false; const timers = [];
    const at = (ms, fn) => timers.push(setTimeout(() => { if (!over) fn(); }, ms));
    const finish = () => { if (over) return; over = true; timers.forEach(clearTimeout); el.classList.add('leave', 'out'); ready(); setTimeout(() => el.remove(), 1100); };
    el.addEventListener('pointerdown', finish); addEventListener('keydown', e => { if (e.key === 'Escape') finish(); });
    requestAnimationFrame(() => el.classList.add('go'));
    at(1150, () => el.classList.add('focus'));
    at(2050, () => el.classList.add('press'));
    at(3250, () => el.classList.add('leave'));
    at(3450, finish);
  }
  function heroGrid() { const n = innerWidth < 700 ? 36 : 72; $('#heroGrid').innerHTML = Array.from({ length: n }, (_, i) => `<i style="--k:url(${FIT(i * 3)});--dl:${-(i % 9)}s"></i>`).join(''); }

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
  const has = s => Q[s] && Q[s].chg != null;
  const mood = s => { if (!has(s)) return null; return Math.abs(Q[s].chg) < .3 ? 'flat' : Q[s].chg > 0 ? 'up' : 'down'; };
  const keyImg = (s, m) => `/assets/img/keys/${s}-${m === 'down' ? 'down' : 'up'}.webp?v=3`;
  const pct = c => (c > 0 ? '+' : c < 0 ? '−' : '') + Math.abs(c).toFixed(2) + '%';
  const usd = p => p == null ? '—' : '$' + (p >= 1000 ? p.toLocaleString('en-US', { maximumFractionDigits: 0 }) : p >= 1 ? p.toFixed(2) : p.toPrecision(3));
  const tileOf = s => TILE[SYMS.indexOf(s) % 6];

  // ---------------------------------------------------------------- hero mood + tapes
  function moodStrip() {
    const g = SYMS.filter(s => has(s) && Q[s].chg > 0).length, r = SYMS.filter(s => has(s) && Q[s].chg < 0).length;
    $('#mGreen').textContent = g + r ? g : '—'; $('#mRed').textContent = g + r ? r : '—';
  }
  function tapes(ok) {
    const moves = SYMS.filter(has).map(s => `<span>$${esc(s)} <b class="${Q[s].chg < 0 ? 'dn' : 'up'}">${pct(Q[s].chg)}</b></span>`);
    const a = ok && moves.length ? moves : ['<span>turn any stock into a meme</span>', '<span>reading today\'s moves</span>'];
    $('#tape').innerHTML = a.join('') + a.join('');
    const b = ['<span>turn any stock into a meme</span>', ...[...LINES.up.slice(0, 4), ...LINES.down.slice(0, 3)].map(l => `<span>${esc(l)}</span>`), '<span>40 stocks. 40 keys.</span>'];
    $('#tape2').innerHTML = b.join('') + b.join('');
    const c = SYMS.slice(0, 16).map(s => `<span>$${esc(s)} · ${esc(NAME[s])}</span>`);
    $('#tape3').innerHTML = c.join('') + c.join('');
  }

  // ---------------------------------------------------------------- 01 the stocks
  let FILTER = 'all';
  function fits(s) { const g = STOCKS[SYMS.indexOf(s)][2]; if (FILTER === 'all') return true; if (FILTER === 'up') return has(s) && Q[s].chg > 0; if (FILTER === 'down') return has(s) && Q[s].chg < 0; return g.split(' ').includes(FILTER); }
  function drawStocks(first) {
    $('#stockGrid').innerHTML = STOCKS.map(([s, n], i) => {
      const q = Q[s], m = mood(s);
      return `<button type="button" class="sk${first ? ' sk-new' : ''}${s === M.sym ? ' sel' : ''}${fits(s) ? '' : ' hide'}" data-s="${esc(s)}" style="--dl:${Math.min(i, 24) * 25}ms">
        <span class="ki" style="--c:${TILE[i % 6]};--k:url(${keyImg(s, m)})"></span><b>$${esc(s)}</b><span class="n">${esc(n)}</span>
        <span class="p"><span>${usd(q && q.price)}</span><span class="${m === 'down' ? 'dn' : m ? 'up' : ''}">${has(s) ? pct(q.chg) : '—'}</span></span></button>`;
    }).join('');
    $$('.sk').forEach(b => b.addEventListener('click', () => toMaker(b.dataset.s)));
  }
  $$('#chips button').forEach(b => b.addEventListener('click', () => { FILTER = b.dataset.f; $$('#chips button').forEach(x => x.classList.toggle('on', x === b)); $$('.sk').forEach(e => e.classList.toggle('hide', !fits(e.dataset.s))); }));
  function toMaker(s, line) { M.sym = s; M.mood = 'auto'; M.line = line || ''; M.own = !!line; $('#mkStock').value = s; $$('#maker .moods button').forEach(x => x.classList.toggle('on', x.dataset.mood === 'auto')); drawMaker(); $$('.sk').forEach(e => e.classList.toggle('sel', e.dataset.s === s)); $('#maker').scrollIntoView({ behavior: REDUCED ? 'auto' : 'smooth' }); }

  // ---------------------------------------------------------------- canvases
  const IMG = {};
  const loadImg = src => IMG[src] || (IMG[src] = new Promise(res => { const im = new Image(); im.onload = () => res(im); im.onerror = () => res(null); im.src = src; }));
  function wrap(ctx, text, max) { const words = text.split(' '), lines = []; let cur = ''; for (const w of words) { const t = cur ? cur + ' ' + w : w; if (ctx.measureText(t).width > max && cur) { lines.push(cur); cur = w; } else cur = t; } if (cur) lines.push(cur); return lines; }
  const BG = m => m === 'down' ? '#ff6b8b' : m === 'flat' ? '#f4ecd9' : '#55ee96';
  function dots(ctx, W, H) { ctx.fillStyle = 'rgba(11,13,12,.07)'; for (let y = 18; y < H; y += 30) for (let x = 18; x < W; x += 30) { ctx.beginPath(); ctx.arc(x, y, 1.6, 0, 7); ctx.fill(); } }
  function foot(ctx, H) { ctx.fillStyle = '#0b0d0c'; ctx.font = '800 30px Inter'; ctx.fillText('memer', 62, H - 44); ctx.font = '500 20px JBM'; ctx.globalAlpha = .65; ctx.fillText('turn any stock into a meme', 182, H - 46); ctx.globalAlpha = 1; }
  async function card(cv, sym, m, line) {
    const tok = cv._t = (cv._t || 0) + 1, im = await loadImg(keyImg(sym, m)); if (tok !== cv._t) return;
    const ctx = cv.getContext('2d'), W = 1200, H = 675; cv.width = W; cv.height = H;
    const q = Q[sym]; ctx.fillStyle = BG(m); ctx.fillRect(0, 0, W, H); dots(ctx, W, H);
    if (im) ctx.drawImage(im, W - 600, (H - 600) / 2 + 8, 600, 600);
    ctx.fillStyle = '#0b0d0c'; ctx.textBaseline = 'alphabetic';
    ctx.font = `800 ${sym.length > 4 ? 104 : 124}px Inter`; ctx.fillText('$' + sym, 60, 168);
    ctx.font = '500 28px JBM'; ctx.globalAlpha = .7; ctx.fillText(NAME[sym] || '', 66, 214); ctx.globalAlpha = 1;
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
    const [ia, ib] = await Promise.all([loadImg(keyImg(a, ma)), loadImg(keyImg(b, mb))]); if (tok !== cv._t) return;
    const ctx = cv.getContext('2d'), W = 1200, H = 675; cv.width = W; cv.height = H;
    ctx.fillStyle = BG(ma); ctx.fillRect(0, 0, W / 2, H); ctx.fillStyle = BG(mb); ctx.fillRect(W / 2, 0, W / 2, H); dots(ctx, W, H);
    if (ia) ctx.drawImage(ia, 70, 50, 430, 430); if (ib) ctx.drawImage(ib, W - 500, 50, 430, 430);
    ctx.fillStyle = '#0b0d0c'; ctx.textAlign = 'center';
    ctx.font = '800 64px Inter'; ctx.fillText('$' + a, 285, 506); ctx.fillText('$' + b, W - 285, 506);
    ctx.font = '700 36px JBM'; if (has(a)) ctx.fillText(pct(Q[a].chg), 285, 552); if (has(b)) ctx.fillText(pct(Q[b].chg), W - 285, 552);
    ctx.save(); ctx.translate(W / 2, 290); ctx.rotate(-.08); ctx.fillStyle = '#0b0d0c'; ctx.beginPath(); if (ctx.roundRect) ctx.roundRect(-92, -64, 184, 128, 26); else ctx.rect(-92, -64, 184, 128); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.font = '800 92px Inter'; ctx.fillText('vs', 0, 32); ctx.restore();
    ctx.fillStyle = '#0b0d0c'; ctx.font = '800 38px Inter'; ctx.fillText(verdict(a, b), W / 2, 628); ctx.textAlign = 'left';
  }

  // ---------------------------------------------------------------- 02 the maker
  const M = { sym: 'NVDA', mood: 'auto', line: '' };
  const curMood = () => M.mood === 'auto' ? (mood(M.sym) || 'up') : M.mood;
  const lineFor = m => pick(LINES[m] || LINES.up);
  async function drawMaker() {
    const m = curMood(); if (!M.line || (!M.own && M.lm !== m)) { M.line = lineFor(m); M.own = false; } M.lm = m; $('#mkLine').value = M.line;
    await card($('#mkCanvas'), M.sym, m, M.line);
    $('#mkNote').textContent = has(M.sym) ? '' : "today's move for this one can't be read right now, so the meme has no numbers.";
  }
  const opts = () => STOCKS.map(([s, n]) => `<option value="${esc(s)}">$${esc(s)} · ${esc(n)}</option>`).join('');
  function setupMaker() {
    $('#mkStock').innerHTML = opts(); $('#mkStock').value = M.sym;
    $('#mkStock').addEventListener('change', e => { M.sym = e.target.value; M.line = ''; drawMaker(); });
    $$('#maker .moods button').forEach(b => b.addEventListener('click', () => { M.mood = b.dataset.mood; $$('#maker .moods button').forEach(x => x.classList.toggle('on', x === b)); M.line = ''; drawMaker(); }));
    $('#mkLine').addEventListener('input', e => { M.line = e.target.value; M.own = true; clearTimeout(M.t); M.t = setTimeout(drawMaker, 120); });
    $('#mkShuffle').addEventListener('click', () => { const m = curMood(); let l = lineFor(m); for (let i = 0; i < 5 && l === M.line; i++) l = lineFor(m); M.line = l; M.own = false; drawMaker(); });
    $('#mkRandom').addEventListener('click', () => { M.sym = pick(SYMS); $('#mkStock').value = M.sym; M.line = ''; drawMaker(); });
    $('#mkSave').addEventListener('click', () => save($('#mkCanvas'), `memer-${M.sym}`));
    $('#mkPost').addEventListener('click', () => post($('#mkCanvas'), `memer-${M.sym}`, postText(M.sym, M.line)));
  }
  function save(cv, name) { cv.toBlob(b => { const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = name + '.png'; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 3000); toast('saved'); }, 'image/png'); }
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
  const drawVs = () => vsCard($('#vsCanvas'), VS.a, VS.b).then(() => { $('#vsNote').textContent = has(VS.a) && has(VS.b) ? '' : "one of these moves can't be read right now."; });
  function setupVs() {
    $('#vsA').innerHTML = opts(); $('#vsB').innerHTML = opts(); $('#vsA').value = VS.a; $('#vsB').value = VS.b;
    $('#vsA').addEventListener('change', e => { VS.a = e.target.value; drawVs(); });
    $('#vsB').addEventListener('change', e => { VS.b = e.target.value; drawVs(); });
    $('#vsSwap').addEventListener('click', () => { [VS.a, VS.b] = [VS.b, VS.a]; $('#vsA').value = VS.a; $('#vsB').value = VS.b; drawVs(); });
    $('#vsRandom').addEventListener('click', () => { VS.a = pick(SYMS); do { VS.b = pick(SYMS); } while (VS.b === VS.a); $('#vsA').value = VS.a; $('#vsB').value = VS.b; drawVs(); });
    $('#vsSave').addEventListener('click', () => save($('#vsCanvas'), `memer-${VS.a}-vs-${VS.b}`));
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
      if (b.dataset.a === 'save') save(cv, `memer-${s}`); else if (b.dataset.a === 'post') post(cv, `memer-${s}`, postText(s, lines[i])); else toMaker(s, lines[i]); }));
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
      return `<div class="brow${i > 9 ? ' x' : ''}"><span class="rk">${String(i + 1).padStart(2, '0')}</span><span class="bk" style="--c:${tileOf(s)};--k:url(${keyImg(s, m)})"></span>
        <span class="bt"><b>$${esc(s)}</b><span>${esc(NAME[s])}</span></span><span class="bp">${usd(Q[s] && Q[s].price)}</span>
        <span class="bc ${c == null ? '' : c < 0 ? 'dn' : 'up'}">${c == null ? '—' : pct(c)}</span>
        <span class="bar">${c == null ? '' : `<i class="${c < 0 ? 'dn' : 'up'}" style="width:${w.toFixed(1)}%"></i>`}</span>
        <button type="button" class="bm" data-s="${esc(s)}">meme it</button></div>`; }).join('');
    const live = rows.filter(has), up = live.filter(s => Q[s].chg > 0).length;
    if (live.length) box.insertAdjacentHTML('afterbegin', `<div class="bsum"><span>best <b>$${esc(live[0])} ${pct(Q[live[0]].chg)}</b></span><span>worst <b>$${esc(live[live.length - 1])} ${pct(Q[live[live.length - 1]].chg)}</b></span><span><b>${up}</b> of <b>${live.length}</b> green</span></div>`);
    box.classList.toggle('short', !BOARD_ALL);
    box.insertAdjacentHTML('beforeend', `<button type="button" class="more">${BOARD_ALL ? 'show the top ten' : 'show all ' + rows.length}</button>`);
    box.querySelector('.more').addEventListener('click', () => { BOARD_ALL = !BOARD_ALL; drawBoard(true); if (!BOARD_ALL) $('#board').scrollIntoView({ behavior: REDUCED ? 'auto' : 'smooth' }); });
    box.querySelectorAll('.bm').forEach(b => b.addEventListener('click', () => toMaker(b.dataset.s)));
  }

  // ---------------------------------------------------------------- 06 the pfp
  const PF = { sym: 'NVDA', c: '#55ee96', fit: 'up' };
  const SW = ['#55ee96', '#3f6bff', '#f4ecd9', '#ffad33', '#8f6dff', '#ff6b8b', '#26c6c6', '#0f1110'];
  async function drawPfp() {
    const cv = $('#pfCanvas'), tok = cv._t = (cv._t || 0) + 1, im = await loadImg(keyImg(PF.sym, PF.fit)); if (tok !== cv._t) return;
    const ctx = cv.getContext('2d'), S = 1000; cv.width = S; cv.height = S;
    ctx.fillStyle = PF.c; ctx.fillRect(0, 0, S, S); if (im) ctx.drawImage(im, 120, 110, 760, 760);
  }
  function setupPfp() {
    $('#pfStock').innerHTML = opts(); $('#pfStock').value = PF.sym;
    $('#pfStock').addEventListener('change', e => { PF.sym = e.target.value; drawPfp(); });
    $('#pfColors').innerHTML = SW.map((c, i) => `<button type="button" style="--c:${c}" data-c="${c}" aria-label="colour ${i + 1}"${i ? '' : ' class="on"'}></button>`).join('');
    $$('#pfColors button').forEach(b => b.addEventListener('click', () => { PF.c = b.dataset.c; $$('#pfColors button').forEach(x => x.classList.toggle('on', x === b)); drawPfp(); }));
    $$('#pfp .moods button').forEach(b => b.addEventListener('click', () => { PF.fit = b.dataset.fit; $$('#pfp .moods button').forEach(x => x.classList.toggle('on', x === b)); drawPfp(); }));
    $('#pfSave').addEventListener('click', () => save($('#pfCanvas'), `memer-pfp-${PF.sym}`));
  }

  // ---------------------------------------------------------------- reveal + config
  const io = 'IntersectionObserver' in window ? new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('vis'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -8% 0px' }) : null;
  function reveal() { $$('.rv:not(.vis)').forEach((el, i) => { el.style.transitionDelay = (i % 3) * 90 + 'ms'; if (io) io.observe(el); else el.classList.add('vis'); }); }
  if (CONFIG.ca) { const p = $('#caPill'); p.hidden = false; $('#caTxt').textContent = CONFIG.ca.slice(0, 4) + '…' + CONFIG.ca.slice(-4); p.addEventListener('click', async () => { try { await navigator.clipboard.writeText(CONFIG.ca); toast('copied'); } catch { toast(CONFIG.ca); } }); }
  if (CONFIG.x) { const x = $('#xLink'); x.hidden = false; x.href = CONFIG.x; }

  // ---------------------------------------------------------------- go
  intro(); heroGrid(); setupMaker(); setupVs(); setupPfp(); drawStocks(true); tapes(false); reveal();
  Promise.all([document.fonts.load('800 50px Inter'), document.fonts.load('500 20px JBM'), document.fonts.load('700 20px JBM')]).catch(() => {}).then(() => { drawMaker(); drawVs(); drawPfp(); });
  let todayDone = false;
  async function refresh(first) {
    const ok = await loadQuotes();
    drawStocks(false); tapes(ok); moodStrip(); drawMaker(); drawVs(); drawBoard(ok);
    if (first || (ok && !todayDone)) { drawToday(ok); todayDone = ok; }
  }
  refresh(true); setInterval(() => { if (!document.hidden) refresh(false); }, 60000);
})();
