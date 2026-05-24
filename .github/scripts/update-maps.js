/**
 * update-maps.js v3
 * Tax FoundationのLOST{Mon}{YY}.pngパターンで最新版を正確に取得
 * index.html / tax.html / income-tax.html の年号も自動更新
 */
const https = require('https');
const fs = require('fs');

function fetchBuf(url) {
  return new Promise((res, rej) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, r => {
      if (r.statusCode === 301 || r.statusCode === 302) return fetchBuf(r.headers.location).then(res).catch(rej);
      if (r.statusCode === 404) return rej(new Error('404'));
      const c = []; r.on('data', d => c.push(d)); r.on('end', () => res(Buffer.concat(c)));
    }).on('error', rej);
  });
}

function headCheck(url) {
  return new Promise(res => {
    https.request(url, { method: 'HEAD', headers: { 'User-Agent': 'Mozilla/5.0' } }, r => {
      res(r.statusCode === 200 ? url : null);
    }).on('error', () => res(null)).end();
  });
}

async function findLatestLostUrl() {
  const now = new Date();
  const candidates = [];
  for (let y = now.getFullYear() + 1; y >= now.getFullYear() - 1; y--) {
    const yy = String(y).slice(-2);
    const yyyy = String(y);
    for (const [mo, mm, mon] of [[1,'01','Jan'],[7,'07','Jul']]) {
      candidates.push({ url: 'https://taxfoundation.org/wp-content/uploads/' + yyyy + '/' + mm + '/LOST' + mon + yy + '.png', year: y, month: mo });
    }
  }
  candidates.sort((a, b) => b.year !== a.year ? b.year - a.year : b.month - a.month);
  for (const c of candidates) {
    console.log('チェック: ' + c.url);
    const found = await headCheck(c.url);
    if (found) {
      console.log('最新版発見: ' + found);
      return { url: found, year: c.year };
    }
  }
  return null;
}

async function findImgFromPage(pageUrl) {
  const html = (await fetchBuf(pageUrl)).toString('utf-8');
  const ms = [...html.matchAll(/https?:\/\/taxfoundation\.org\/wp-content\/uploads\/(\d{4})\/(\d{2})\/([^"' \n]+\.png)/g)]
    .map(m => ({ url: m[0], year: +m[1], month: +m[2] }))
    .filter(m => !m.url.match(/-\d+x\d+\.png/) && !m.url.includes('screenshot') && !m.url.includes('logo'));
  if (!ms.length) return null;
  ms.sort((a, b) => b.year - a.year || b.month - a.month);
  return { url: ms[0].url, year: ms[0].year };
}

// 年号を更新するHTMLファイル（画像ごとに対応するファイル一覧）
const ITEMS = [
  {
    name: '消費税',
    findUrl: findLatestLostUrl,
    img: 'images/tax.png',
    htmlFiles: ['tax.html', 'index.html'],   // ← index.htmlも更新
  },
  {
    name: '所得税',
    page: 'https://taxfoundation.org/data/all/state/state-income-tax-rates/',
    img: 'images/income-tax.png',
    htmlFiles: ['income-tax.html', 'index.html'],
  },
];

async function run(item) {
  console.log('=== ' + item.name + ' ===');
  const r = item.findUrl ? await item.findUrl() : await findImgFromPage(item.page);
  if (!r) { console.log('URLなし'); return false; }

  const newBuf = await fetchBuf(r.url);
  const oldBuf = fs.existsSync(item.img) ? fs.readFileSync(item.img) : null;
  if (oldBuf && newBuf.equals(oldBuf)) { console.log('unchanged: ' + item.img); return false; }

  fs.writeFileSync(item.img, newBuf);
  console.log('updated: ' + item.img + ' <- ' + r.url);

  // 対象HTMLファイルの年号を更新
  for (const hf of (item.htmlFiles || [])) {
    if (!fs.existsSync(hf)) continue;
    const h = fs.readFileSync(hf, 'utf-8');
    const u = h.replace(/\d{4}年(\d+月)?版/g, r.year + '年1月版');
    if (u !== h) { fs.writeFileSync(hf, u); console.log('html year -> ' + r.year + ' in ' + hf); }
  }
  return true;
}

(async () => {
  let any = false;
  for (const item of ITEMS) {
    try { if (await run(item)) any = true; } catch(e) { console.error(item.name + ':' + e.message); }
  }
  console.log(any ? '更新あり->コミット' : 'すべて最新');
})();
