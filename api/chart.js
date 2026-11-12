// memer chart: one stock's recent price path from its deepest pool on geckoterminal, cached at the edge.
// 24h = 15-minute closes, 7d = 4-hour closes. Only public market data; nothing is stored.
const { MINTS } = require('./prices.js');
const G = 'https://api.geckoterminal.com/api/v2/networks/solana';
const H = { accept: 'application/json', 'user-agent': 'memer/1.0' };
const POOL = {};   // warm instances remember each stock's pool
async function j(u) { const r = await fetch(u, { headers: H, signal: AbortSignal.timeout(8000) }); if (!r.ok) throw new Error('upstream ' + r.status); return r.json(); }
module.exports = async (req, res) => {
  res.setHeader('content-type', 'application/json; charset=utf-8');
  const s = String((req.query && req.query.s) || '').toUpperCase(), tf = req.query && req.query.tf === '7d' ? '7d' : '24h';
  const mint = Object.prototype.hasOwnProperty.call(MINTS, s) ? MINTS[s] : null;
  if (!mint) { res.statusCode = 404; res.setHeader('Cache-Control', 'no-store'); return res.end(JSON.stringify({ ok: false })); }
  try {
    let pool = POOL[s];
    if (!pool) {
      const p = await j(`${G}/tokens/${mint}/pools?page=1`);
      const best = (p.data || []).map(d => d.attributes || {}).sort((a, b) => (+b.reserve_in_usd || 0) - (+a.reserve_in_usd || 0))[0];
      if (!best || !best.address) throw new Error('no pool'); pool = POOL[s] = best.address;
    }
    const path = tf === '7d' ? 'hour?aggregate=4&limit=42' : 'minute?aggregate=15&limit=96';
    const o = await j(`${G}/pools/${pool}/ohlcv/${path}&currency=usd&token=${mint}`);
    const list = (o.data && o.data.attributes && o.data.attributes.ohlcv_list) || [];
    const pts = list.map(r => [r[0], +r[4]]).filter(p => isFinite(p[1]) && p[1] > 0).sort((a, b) => a[0] - b[0]);
    if (pts.length < 3) throw new Error('thin');
    res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate');
    res.setHeader('CDN-Cache-Control', `public, s-maxage=${tf === '7d' ? 1200 : 300}, stale-while-revalidate=3600`);
    res.end(JSON.stringify({ ok: true, s, tf, pts }));
  } catch (e) { res.statusCode = 502; res.setHeader('Cache-Control', 'no-store'); res.end(JSON.stringify({ ok: false })); }
};
