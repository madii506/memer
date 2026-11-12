// memer prices: one request to Jupiter for every tokenized stock on solana (xStocks), cached at Vercel's edge for
// 30 seconds so every visitor shares the same read. Only public market data; nothing is stored.
const MINTS = {
  NVDA: 'Xsc9qvGR1efVDFGLrVsmkzv3qi45LTBjeUKSPmx9qEh', TSLA: 'XsDoVfqeBukxuZHWhdvWHBhgEHjGNst4MLodqsJHzoB', AAPL: 'XsbEhLAtcf6HdfpFZ5xEMdqW8nfAvcsP5bdudRLJzJp',
  MSFT: 'XspzcW1PRtgf6Wj92HCiZdjzKCyFekVD8P5Ueh3dRMX', AMZN: 'Xs3eBt7uRfJX8QUs4suhyU8p2M6DoUDrJyWBa8LLZsg', GOOGL: 'XsCPL9dNWBMvFtTmwcCA5v3xWPSMEBCszbQdiLLq6aN',
  META: 'Xsa62P5mvPszXL1krVUnU5ar38bBSVcWAB6fmPCo5Zu', NFLX: 'XsEH7wWfJJu2ZT3UCFeVfALnVA6CP5ur7Ee11KmzVpL', AMD: 'XsXcJ6GZ9kVnjqGsjBnktRcuwMBmvKWh8S93RefZ1rF',
  AVGO: 'XsgSaSvNSqLTtFuyWPBhK9196Xb9Bbdyjj4fH3cPJGo', ORCL: 'XsjFwUPiLofddX5cWFHW35GCbXcSu1BCUGfxoQAQjeL', INTC: 'XshPgPdXFRWB8tP1j82rebb2Q9rPgGX37RuqzohmArM',
  IBM: 'XspwhyYPdWVM8XBHZnpS9hgyag9MKjLRyE3tVfmCbSr', CRM: 'XsczbcQ3zfcgAEt9qHQES8pxKAVG5rujPSHQEXi4kaN', CRWD: 'Xs7xXqkcK7K8urEqGg52SECi79dRp2cEKKuYjUePYDw',
  PLTR: 'XsoBhf2ufR8fTyNSjqfU71DYGaE6Z3SUGAidpzriAA4', APP: 'XsPdAVBi8Zc1xvv53k4JcMrQaEDTgkGqKYeh7AYgPHV', COIN: 'Xs7ZdzSHLU9ftNJsii5fCeJhoRWSC32SQGzGQtePxNu',
  MSTR: 'XsP7xzNPvEHS1m6qfanPUGjNmdnmsLKEoNAnHjdxxyZ', HOOD: 'XsvNBAYkrDRNhA7wPHQfX3ZUXZyZLdnCQDfHZ56bzpg', CRCL: 'XsueG8BtpquVJX9LVLLEGuViXUungE6WmK5YZ3p3bd1',
  DFDV: 'Xs2yquAgsHByNzx68WJC55WHjHBvG9JsMB7CWjTLyPy', SPY: 'XsoCS1TfEyfFhfvj8EtZ528L3CaKBDBRqRapnBbDF2W', QQQ: 'Xs8S1uUs1zvS2p7iwtsG3b6fkhpvmwz4GYU3gWAmWHZ',
  TQQQ: 'XsjQP3iMAaQ3kQScQKthQpx9ALRbjKAjQtHg6TFomoc', GLD: 'Xsv9hRk1z5ystj9MhnA7Lq4vjSsLwzL2nxrwmwtD3re', GME: 'Xsf9mBktVB9BSU5kf4nHxPq5hCBJ2j2ui3ecFGxPRGc',
  OPEN: 'XsGtpmjhmC8kyjVSWL4VicGu36ceq9u55PTgF8bhGv6', SPCX: 'Xs3oZwbHvqis4NYcf4YKWmEia2eC84wSiVrcYcTqpH8', 'BRK.B': 'Xs6B6zawENwAbWVi7w92rjazLuAr5Az59qgWKcNb45x',
  JPM: 'XsMAqkcKsUewDrzVkait4e5u4y8REgtyS7jWgCpLV2C', V: 'XsqgsbXwWogGJsNcVZ3TyVouy2MbTkfCFhCGGGcQZ2p', WMT: 'Xs151QeqTCiuKtinzfRATnUESM2xTU6V9Wy8Vy538ci',
  MCD: 'XsqE9cRRpzxcGKDXj1BJ7Xmg4GRhZoyY1KpmGSxAWT2', KO: 'XsaBXg8dU5cPM6ehmVctMkVqoiRG2ZjMo1cyBJ3AykQ', PEP: 'Xsv99frTRUeornyvCfvhnDesQDWuvns1M852Pez91vF',
  XOM: 'XsaHND8sHyfMfsWPj6kSdd5VwvCayZvjYgKmmcNL5qh', LLY: 'Xsnuv4omNoHozR6EEW5mXkw8Nrny5rB3jVfLqi6gKMH', UNH: 'XszvaiXGPwvk2nwb3o9C1CX4K6zH8sez11E6uyup6fe',
  NVO: 'XsfAzPzYrYjd4Dpa9BU3cusBsvWfVB9gBcyGC87S57n',
};
const num = v => (typeof v === 'number' && isFinite(v)) ? v : null;
module.exports = async (req, res) => {
  res.setHeader('content-type', 'application/json; charset=utf-8');
  try {
    const by = Object.fromEntries(Object.entries(MINTS).map(([s, id]) => [id, s]));
    const r = await fetch('https://lite-api.jup.ag/tokens/v2/search?query=' + Object.values(MINTS).join(','), { headers: { accept: 'application/json', 'user-agent': 'memer/1.0' }, signal: AbortSignal.timeout(8000) });
    if (!r.ok) throw new Error('upstream ' + r.status);
    const arr = await r.json(), q = {};
    for (const t of Array.isArray(arr) ? arr : []) { const s = by[t.id]; if (!s) continue; const st = t.stats24h || {};
      const h1 = t.stats1h || {}, h6 = t.stats6h || {};
      q[s] = { price: num(t.usdPrice), chg: num(st.priceChange), h1: num(h1.priceChange), h6: num(h6.priceChange), mcap: num(t.mcap), liq: num(t.liquidity), hold: num(t.holderCount),
        buy: num(st.buyVolume), sell: num(st.sellVolume), vol: num((st.buyVolume || 0) + (st.sellVolume || 0)), nb: num(st.numBuys), ns: num(st.numSells), tr: num(st.numTraders), mint: t.id }; }
    if (!Object.keys(q).length) throw new Error('empty');
    res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate'); res.setHeader('CDN-Cache-Control', 'public, s-maxage=30, stale-while-revalidate=300');
    res.end(JSON.stringify({ ok: true, at: Date.now(), q }));
  } catch (e) {
    res.statusCode = 502; res.setHeader('Cache-Control', 'no-store'); res.end(JSON.stringify({ ok: false }));
  }
};
module.exports.MINTS = MINTS;
