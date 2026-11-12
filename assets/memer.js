// memer: turn any stock into a meme. every stock is a green key in pixel shades, dressed by today's real move.
(() => {
  const CONFIG = { ca: '', x: '' };   // set the coin's CA and X link here when they exist; the pill shows only then
  const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const html = document.documentElement;
  const TILE = ['#3f6bff', '#f4ecd9', '#ffad33', '#8f6dff', '#ff6b8b', '#26c6c6'];
  const FIT = i => `/assets/img/fits/${i % 8}.webp`;
  const STOCKS = [['NVDA', 'NVIDIA'], ['TSLA', 'Tesla'], ['AAPL', 'Apple'], ['MSFT', 'Microsoft'], ['AMZN', 'Amazon'], ['GOOGL', 'Alphabet'], ['META', 'Meta'],
    ['COIN', 'Coinbase'], ['MSTR', 'Strategy'], ['HOOD', 'Robinhood'], ['SPY', 'S&P 500'], ['QQQ', 'Nasdaq 100'], ['PLTR', 'Palantir'], ['AMD', 'AMD'],
    ['NFLX', 'Netflix'], ['CRCL', 'Circle'], ['GME', 'GameStop'], ['AVGO', 'Broadcom'], ['ORCL', 'Oracle'], ['GLD', 'Gold']];
  const NAME = Object.fromEntries(STOCKS);
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
    const finish = () => {
      if (over) return; over = true; timers.forEach(clearTimeout);
      el.classList.add('leave', 'out'); ready(); setTimeout(() => el.remove(), 1100);
    };
    el.addEventListener('pointerdown', finish); addEventListener('keydown', e => { if (e.key === 'Escape') finish(); });
    requestAnimationFrame(() => el.classList.add('go'));
    at(1150, () => el.classList.add('focus'));
    at(2050, () => el.classList.add('press'));
    at(3250, () => el.classList.add('leave'));
    at(3450, finish);
  }

  // ---------------------------------------------------------------- the hero's drifting wall of keys
  function heroGrid() {
    const n = innerWidth < 700 ? 36 : 72;
    $('#heroGrid').innerHTML = Array.from({ length: n }, (_, i) => `<i style="--k:url(${FIT(i * 3)});--dl:${-(i % 9)}s"></i>`).join('');
  }

  // ---------------------------------------------------------------- live prices: tokenized stocks on solana, from jupiter
  const Q = {};
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const MK = 'memer:mints:v1';
  // one search per ticker to find its token once (kept in this browser), then every refresh is one request for all of them
  async function findMint(sym) {
    try {
      const r = await fetch(`https://lite-api.jup.ag/tokens/v2/search?query=${encodeURIComponent(sym + 'x')}`);
      if (r.status === 429 || r.status >= 500) return 'retry'; if (!r.ok) return null;
      const arr = await r.json(), want = (sym + 'x').toLowerCase();
      const c = (Array.isArray(arr) ? arr : []).filter(t => String(t.symbol || '').toLowerCase() === want);
      c.sort((a, b) => (b.isVerified ? 1 : 0) - (a.isVerified ? 1 : 0) || (b.liquidity || 0) - (a.liquidity || 0));
      return c[0] && c[0].isVerified ? c[0].id : null;
    } catch { return 'retry'; }
  }
  async function mints() {
    let m = {}; try { m = JSON.parse(localStorage.getItem(MK) || '{}') || {}; } catch {}
    const need = STOCKS.map(([s]) => s).filter(s => !m[s]);
    for (let i = 0; i < need.length; i += 3) {
      await Promise.all(need.slice(i, i + 3).map(async s => { for (let t = 0; t < 4; t++) { const id = await findMint(s); if (id === 'retry') { await sleep(600 * (t + 1)); continue; } if (id) m[s] = id; break; } }));
      if (i + 3 < need.length) await sleep(250);
    }
    try { localStorage.setItem(MK, JSON.stringify(m)); } catch {}
    return m;
  }
  async function loadQuotes() {
    const m = await mints(), ids = Object.values(m); if (!ids.length) return false;
    for (let t = 0; t < 3; t++) {
      try {
        const r = await fetch(`https://lite-api.jup.ag/tokens/v2/search?query=${ids.join(',')}`);
        if (r.status === 429 || r.status >= 500) { await sleep(800 * (t + 1)); continue; }
        const arr = await r.json(); if (!Array.isArray(arr)) return false;
        const by = Object.fromEntries(Object.entries(m).map(([s, id]) => [id, s]));
        for (const tk of arr) { const s = by[tk.id]; if (!s) continue; const st = tk.stats24h || {};
          Q[s] = { mint: tk.id, price: typeof tk.usdPrice === 'number' ? tk.usdPrice : null, chg: typeof st.priceChange === 'number' ? st.priceChange : null }; }
        return Object.keys(Q).length > 0;
      } catch { await sleep(800 * (t + 1)); }
    }
    return false;
  }
  const mood = s => { const q = Q[s]; if (!q || q.chg == null) return null; return Math.abs(q.chg) < .3 ? 'flat' : q.chg > 0 ? 'up' : 'down'; };
  const keyImg = (s, m) => `/assets/img/keys/${s}-${m === 'down' ? 'down' : 'up'}.webp`;
  const pct = c => (c > 0 ? '+' : c < 0 ? '−' : '') + Math.abs(c).toFixed(2) + '%';
  const usd = p => p == null ? '—' : '$' + (p >= 1000 ? p.toLocaleString('en-US', { maximumFractionDigits: 0 }) : p.toFixed(2));

  // ---------------------------------------------------------------- 01 the stocks
  function drawStocks(first) {
    $('#stockGrid').innerHTML = STOCKS.map(([s, n], i) => {
      const q = Q[s], m = mood(s);
      return `<button type="button" class="sk${first ? ' sk-new' : ''}${s === M.sym ? ' sel' : ''}" data-s="${s}" style="--dl:${i * 30}ms">
        <span class="ki" style="--c:${TILE[i % 6]};--k:url(${keyImg(s, m)})"></span><b>$${s}</b><span class="n">${esc(n)}</span>
        <span class="p"><span>${usd(q && q.price)}</span><span class="${m === 'down' ? 'dn' : m ? 'up' : ''}">${q && q.chg != null ? pct(q.chg) : '—'}</span></span></button>`;
    }).join('');
    $$('.sk').forEach(b => b.addEventListener('click', () => { M.sym = b.dataset.s; $('#mkStock').value = M.sym; M.line = ''; drawMaker(); drawStocks(); $('#maker').scrollIntoView({ behavior: REDUCED ? 'auto' : 'smooth' }); }));
  }
  function tape(ok) {
    const items = STOCKS.map(([s]) => { const q = Q[s]; if (!q || q.chg == null) return null; return `<span>$${s} <b class="${q.chg < 0 ? 'dn' : 'up'}">${pct(q.chg)}</b></span>`; }).filter(Boolean);
    const base = ok && items.length ? items : ['<span>turn any stock into a meme</span>', '<span>prices are not answering right now</span>'];
    $('#tape').innerHTML = base.join('') + base.join('');
  }

  // ---------------------------------------------------------------- the meme card
  const IMG = {};
  const loadImg = src => IMG[src] || (IMG[src] = new Promise(res => { const im = new Image(); im.onload = () => res(im); im.onerror = () => res(null); im.src = src; }));
  function wrap(ctx, text, max) { const words = text.split(' '), lines = []; let cur = ''; for (const w of words) { const t = cur ? cur + ' ' + w : w; if (ctx.measureText(t).width > max && cur) { lines.push(cur); cur = w; } else cur = t; } if (cur) lines.push(cur); return lines; }
  async function card(cv, sym, m, line) {
    const ctx = cv.getContext('2d'), W = 1200, H = 675; cv.width = W; cv.height = H;
    const q = Q[sym], bg = m === 'down' ? '#ff6b8b' : m === 'flat' ? '#f4ecd9' : '#55ee96';
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = 'rgba(11,13,12,.07)'; for (let y = 18; y < H; y += 30) for (let x = 18; x < W; x += 30) { ctx.beginPath(); ctx.arc(x, y, 1.6, 0, 7); ctx.fill(); }
    const im = await loadImg(keyImg(sym, m)); if (im) ctx.drawImage(im, W - 600, (H - 600) / 2 + 8, 600, 600);
    ctx.fillStyle = '#0b0d0c'; ctx.textBaseline = 'alphabetic';
    ctx.font = '800 124px Inter'; ctx.fillText('$' + sym, 60, 168);
    ctx.font = '500 28px JBM'; ctx.globalAlpha = .7; ctx.fillText(NAME[sym] || '', 66, 214); ctx.globalAlpha = 1;
    if (q && q.chg != null) { ctx.font = '700 58px JBM'; ctx.fillText(pct(q.chg) + ' today', 62, 312); ctx.font = '500 30px JBM'; ctx.globalAlpha = .7; ctx.fillText(usd(q.price), 66, 360); ctx.globalAlpha = 1; }
    ctx.font = '800 50px Inter'; const ls = wrap(ctx, line, 560).slice(0, 3); ls.forEach((l, i) => ctx.fillText(l, 62, (q && q.chg != null ? 460 : 330) + i * 58));
    ctx.font = '800 30px Inter'; ctx.fillText('memer', 62, H - 44); ctx.font = '500 20px JBM'; ctx.globalAlpha = .65; ctx.fillText('turn any stock into a meme', 182, H - 46); ctx.globalAlpha = 1;
  }

  // ---------------------------------------------------------------- 02 the maker
  const M = { sym: 'NVDA', mood: 'auto', line: '' };
  const curMood = () => M.mood === 'auto' ? (mood(M.sym) || 'up') : M.mood;
  function lineFor(m) { return pick(LINES[m] || LINES.up); }
  async function drawMaker() {
    const m = curMood(); if (!M.line) M.line = lineFor(m); $('#mkLine').value = M.line;
    await card($('#mkCanvas'), M.sym, m, M.line);
    const q = Q[M.sym]; $('#mkNote').textContent = q && q.chg != null ? '' : "today's move for this one can't be read right now, so the meme has no numbers.";
  }
  function setupMaker() {
    $('#mkStock').innerHTML = STOCKS.map(([s, n]) => `<option value="${s}">$${s} · ${esc(n)}</option>`).join('');
    $('#mkStock').value = M.sym;
    $('#mkStock').addEventListener('change', e => { M.sym = e.target.value; M.line = ''; drawMaker(); drawStocks(); });
    $$('.moods button').forEach(b => b.addEventListener('click', () => { M.mood = b.dataset.mood; $$('.moods button').forEach(x => x.classList.toggle('on', x === b)); M.line = ''; drawMaker(); }));
    $('#mkLine').addEventListener('input', e => { M.line = e.target.value; clearTimeout(M.t); M.t = setTimeout(drawMaker, 120); });
    $('#mkShuffle').addEventListener('click', () => { const m = curMood(); let l = lineFor(m); for (let i = 0; i < 5 && l === M.line; i++) l = lineFor(m); M.line = l; drawMaker(); });
    $('#mkSave').addEventListener('click', () => save($('#mkCanvas'), M.sym));
    $('#mkPost').addEventListener('click', () => post($('#mkCanvas'), M.sym, M.line));
  }
  function save(cv, sym) { cv.toBlob(b => { const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = `memer-${sym}.png`; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 3000); toast('saved'); }, 'image/png'); }
  function postText(sym, line) { const q = Q[sym]; return `$${sym}${q && q.chg != null ? ' ' + pct(q.chg) + ' today' : ''}. ${line}\n\nmade with memer`; }
  async function post(cv, sym, line) {
    const text = postText(sym, line);
    try {
      const blob = await new Promise(r => cv.toBlob(r, 'image/png')); const file = new File([blob], `memer-${sym}.png`, { type: 'image/png' });
      if (navigator.canShare && navigator.canShare({ files: [file] }) && matchMedia('(pointer: coarse)').matches) { await navigator.share({ files: [file], text }); return; }
    } catch (e) { if (e && e.name === 'AbortError') return; }
    save(cv, sym); toast('meme saved. attach it to the post.');
    open('https://x.com/intent/post?text=' + encodeURIComponent(text), '_blank', 'noopener');
  }

  // ---------------------------------------------------------------- 03 today: the biggest moves, already memes
  async function drawToday(ok) {
    const g = $('#todayGrid');
    const movers = STOCKS.map(([s]) => s).filter(s => Q[s] && Q[s].chg != null).sort((a, b) => Math.abs(Q[b].chg) - Math.abs(Q[a].chg)).slice(0, 3);
    if (!ok || !movers.length) { g.innerHTML = "<p class=\"empty\">today's moves can't be read right now. the maker still works.</p>"; return; }
    g.innerHTML = movers.map((s, i) => `<div class="tcard rv"><canvas data-i="${i}" width="1200" height="675"></canvas><div class="tr"><button type="button" class="btn sm ink" data-a="save" data-i="${i}">save</button><button type="button" class="btn sm ghost" data-a="post" data-i="${i}">post on 𝕏</button><button type="button" class="btn sm ghost" data-a="edit" data-i="${i}">edit</button></div></div>`).join('');
    const lines = movers.map(s => lineFor(mood(s)));
    await Promise.all(movers.map((s, i) => card(g.querySelector(`canvas[data-i="${i}"]`), s, mood(s), lines[i])));
    g.querySelectorAll('button').forEach(b => b.addEventListener('click', () => { const i = +b.dataset.i, s = movers[i], cv = g.querySelector(`canvas[data-i="${i}"]`);
      if (b.dataset.a === 'save') save(cv, s); else if (b.dataset.a === 'post') post(cv, s, lines[i]);
      else { M.sym = s; M.mood = 'auto'; M.line = lines[i]; $('#mkStock').value = s; $$('.moods button').forEach(x => x.classList.toggle('on', x.dataset.mood === 'auto')); drawMaker(); drawStocks(); $('#maker').scrollIntoView({ behavior: REDUCED ? 'auto' : 'smooth' }); } }));
    reveal();
  }

  // ---------------------------------------------------------------- reveal + config
  const io = 'IntersectionObserver' in window ? new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('vis'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -8% 0px' }) : null;
  function reveal() { $$('.rv:not(.vis)').forEach((el, i) => { el.style.transitionDelay = (i % 3) * 90 + 'ms'; if (io) io.observe(el); else el.classList.add('vis'); }); }
  if (CONFIG.ca) { const p = $('#caPill'); p.hidden = false; $('#caTxt').textContent = CONFIG.ca.slice(0, 4) + '…' + CONFIG.ca.slice(-4); p.addEventListener('click', async () => { try { await navigator.clipboard.writeText(CONFIG.ca); toast('copied'); } catch { toast(CONFIG.ca); } }); }
  if (CONFIG.x) { const x = $('#xLink'); x.hidden = false; x.href = CONFIG.x; }

  // ---------------------------------------------------------------- go
  intro(); heroGrid(); setupMaker(); drawStocks(true); reveal();
  Promise.all([document.fonts.load('800 50px Inter'), document.fonts.load('500 20px JBM'), document.fonts.load('700 20px JBM')]).catch(() => {}).then(() => drawMaker());
  let todayDone = false;
  async function refresh(first) { const ok = await loadQuotes(); drawStocks(false); tape(ok); drawMaker(); if (first || (ok && !todayDone)) { drawToday(ok); todayDone = ok; } }
  refresh(true); setInterval(() => { if (!document.hidden) refresh(false); }, 60000);
})();
