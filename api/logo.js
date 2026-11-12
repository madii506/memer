// memer logos: each stock's token icon as published for its xStock, served from our own origin and cached at the edge for a week,
// so the meme canvases can draw it. Only the 40 icons below can be fetched through this.
const J = 'https://static.datapi.jup.ag/token-icons/', B = 'https://xstocks-metadata.backed.fi/logos/tokens/';
const ICON = {
  NVDA: J + '5550a81a36c9cce2af5d8b738bcf665c7b4da250a4652dd025107a5d6f0b9458.webp', TSLA: J + 'e1d90902b191d70826c331e81dee1c19bf7d8884e436626153ff09397c36d278.webp',
  MSFT: J + '01cc89d2a92ce9845c11e410e1b21614cc211f65239934b3c54d95cf06a84910.webp', GOOGL: J + '12d3b57880ed15dda32a5f89564aa9adf6e30f5dd8a44d1a645b3dc00f7e45be.webp',
  META: J + 'a636a567e1cfdaa487635e36e24467d111a7bdd6f072b41eb41bea784088e9ab.webp', MSTR: J + '80e0f9b2b1a97b8aee2ce90f161e9c9557f9afdb81abc86e2d543197e996d470.webp',
  SPY: J + '4d04cfdd8396f0c9274d49f135a458b7d4726cc098e3fc69bb3b4124eb24a2f2.webp', GLD: J + '4b57f2ddf52a0b96ed41fa9678f5540a6f08ca0aa81e735a884c8106e7ea8add.webp',
  SPCX: J + '408050c7fcb89ee19487cf7b549476b645151a6bb777dc925bba09fb49eb69e1.webp',
};
for (const s of ['AAPL', 'AMZN', 'NFLX', 'AMD', 'AVGO', 'ORCL', 'INTC', 'IBM', 'CRM', 'CRWD', 'PLTR', 'APP', 'COIN', 'HOOD', 'CRCL', 'DFDV', 'QQQ', 'TQQQ', 'GME', 'OPEN',
  'BRK.B', 'JPM', 'V', 'WMT', 'MCD', 'KO', 'PEP', 'XOM', 'LLY', 'UNH', 'NVO']) ICON[s] = B + s + 'x.png';
module.exports = async (req, res) => {
  const s = String((req.query && req.query.s) || '').toUpperCase(), u = Object.prototype.hasOwnProperty.call(ICON, s) ? ICON[s] : null;
  if (!u) { res.statusCode = 404; res.setHeader('Cache-Control', 'no-store'); return res.end(); }
  try {
    const r = await fetch(u, { headers: { accept: 'image/webp,image/png,image/*' }, signal: AbortSignal.timeout(8000) });
    const ct = (r.headers.get('content-type') || '').split(';')[0];
    if (!r.ok || !/^image\/(png|webp|jpeg)$/.test(ct)) throw new Error('bad upstream');
    const buf = Buffer.from(await r.arrayBuffer());
    if (buf.length > 600000) throw new Error('too big');
    res.setHeader('content-type', ct); res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Cache-Control', 'public, max-age=86400'); res.setHeader('CDN-Cache-Control', 'public, s-maxage=604800, stale-while-revalidate=86400');
    res.end(buf);
  } catch (e) { res.statusCode = 502; res.setHeader('Cache-Control', 'no-store'); res.end(); }
};
