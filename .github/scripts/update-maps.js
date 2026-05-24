/**
 * update-maps.js
 * Tax Foundation等から最新のマップ画像を取得し、
 * 変更があればimages/に保存してHTMLの年号表記も更新する
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// 監視対象：固定URLで内容が更新されるページ
const WATCH_LIST = [
  {
    name: '消費税（Sales Tax）',
    pageUrl: 'https://taxfoundation.org/data/all/state/sales-tax-rates/',
    imageFile: 'images/tax.png',
    htmlFile: 'tax.html',
    yearPattern: /State and Local Sales Tax Rates,\s*(\d{4})/i,
    titleJa: '州別の消費税マップ',
  },
  {
    name: '所得税（Income Tax）',
    pageUrl: 'https://taxfoundation.org/data/all/state/state-income-tax-rates/',
    imageFile: 'images/income-tax.png',
    htmlFile: 'income-tax.html',
    yearPattern: /State Individual Income Tax Rates.*?(\d{4})/i,
    titleJa: '州別の所得税率マップ',
  },
];

function fetch(url) {
  return new Promise((resolve, reject) => {
    const lib = url.startsWith('https') ? require('https') : require('http');
    lib.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        return fetch(res.headers.location).then(resolve).catch(reject);
      }
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => resolve(Buffer.concat(chunks)));
      res.on('error', reject);
    }).on('error', reject);
  });
}

function extractImageUrl(html) {
  const matches = [...html.matchAll(
    /https?:\/\/taxfoundation\.org\/wp-content\/uploads\/(\d{4})\/(\d{2})\/([^"' \n]+\.png)/g
  )].map(m => ({ url: m[0], year: parseInt(m[1]), month: parseInt(m[2]) }))
    .filter(m => !m.url.match(/-\d+x\d+\.png/) &&
                 !m.url.includes('screenshot') &&
                 !m.url.includes('Favicon') &&
                 !m.url.includes('logo') &&
                 !m.url.includes('author') &&
                 !m.url.includes('europe') &&
                 !m.url.includes('icon'));

  if (matches.length === 0) return null;
  // 最新年月のものを選ぶ
  matches.sort((a, b) => b.year !== a.year ? b.year - a.year : b.month - a.month);
  return matches[0].url;
}

function extractYear(html, pattern) {
  const m = html.match(pattern);
  return m ? parseInt(m[1]) : null;
}

async function updateMap(item) {
  console.log(`\n=== チェック: ${item.name} ===`);

  // ページHTMLを取得
  const html = (await fetch(item.pageUrl)).toString('utf-8');
  const latestImgUrl = extractImageUrl(html);
  const latestYear = extractYear(html, item.yearPattern);

  if (!latestImgUrl) {
    console.log('⚠️  画像URL見つからず、スキップ');
    return false;
  }

  console.log(`最新画像URL: ${latestImgUrl}`);
  console.log(`最新年: ${latestYear}`);

  // 現在の画像ファイルのURLをHTMLから取得して比較
  const htmlFilePath = item.htmlFile;
  const currentHtml = fs.existsSync(htmlFilePath) ? fs.readFileSync(htmlFilePath, 'utf-8') : '';
  const currentImgMatch = currentHtml.match(new RegExp(item.imageFile.replace('images/', 'images/') + '[^"]*'));

  // 画像を取得して保存
  console.log('画像を取得中...');
  const imgBuffer = await fetch(latestImgUrl);
  const currentBuffer = fs.existsSync(item.imageFile) ? fs.readFileSync(item.imageFile) : null;

  if (currentBuffer && imgBuffer.equals(currentBuffer)) {
    console.log('✅ 画像は最新（変更なし）');
    return false;
  }

  console.log('🔄 新しい画像を検出！更新します');
  fs.writeFileSync(item.imageFile, imgBuffer);
  console.log(`✅ ${item.imageFile} を更新`);

  // HTMLの年号表記を更新
  if (latestYear && currentHtml) {
    const updatedHtml = currentHtml
      .replace(/（\d{4}年版）/g, `（${latestYear}年版）`)
      .replace(/（\d{4}年1月版）/g, `（${latestYear}年1月版）`);
    if (updatedHtml !== currentHtml) {
      fs.writeFileSync(htmlFilePath, updatedHtml);
      console.log(`✅ ${htmlFilePath} の年号を ${latestYear} に更新`);
    }
  }

  return true;
}

(async () => {
  let updated = false;
  for (const item of WATCH_LIST) {
    try {
      const changed = await updateMap(item);
      if (changed) updated = true;
    } catch (e) {
      console.error(`❌ エラー (${item.name}): ${e.message}`);
    }
  }

  if (updated) {
    console.log('\n🎉 更新あり → コミットされます');
  } else {
    console.log('\n✅ すべて最新です（変更なし）');
  }
})();
