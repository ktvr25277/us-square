/* US SQUARE 共通ヘッダーメニュー
 * メニューの内容はこのファイル1か所だけで管理します。
 * 新しいページを足すときは、下の NAV の該当カテゴリに ['表示名','ファイル名.html'] を1行足すだけです。
 */
(function () {
  var NAV = [
    { label: 'ホーム', href: 'index.html' },
    { label: '税金', items: [
      ['消費税', 'tax.html'],
      ['所得税', 'income-tax.html'],
      ['酒税・たばこ税', 'alcohol.html']
    ]},
    { label: '暮らし', items: [
      ['最低賃金', 'minimum-wage.html'],
      ['生活費', 'cost-of-living.html'],
      ['家賃', 'rent.html'],
      ['チップ', 'tipping.html']
    ]},
    { label: '安全・健康', items: [
      ['治安・犯罪率', 'crime.html'],
      ['銃の犠牲者', 'guns.html'],
      ['医療費・無保険率', 'healthcare-cost.html'],
      ['肥満率・平均寿命', 'obesity-life-expectancy.html'],
      ['竜巻', 'tornado.html']
    ]},
    { label: '日本人・観光', items: [
      ['在住日本人数', 'japanese.html'],
      ['国立公園', 'landmarks.html']
    ]}
  ];

  var host = document.getElementById('gnav');
  if (!host) return;

  /* 表示中のページ名（tax.html でも /tax でも一致させる） */
  var cur = (location.pathname.split('/').pop() || 'index.html').replace(/\.html$/, '') || 'index';
  function isCur(href) { return href.replace(/\.html$/, '') === cur; }

  /* スタイル（ページ側の古い nav 用CSSより優先されるよう nav.gnav で限定） */
  var css = [
    'nav.gnav{display:flex;align-items:center;flex-wrap:wrap;gap:0}',
    'nav.gnav .g-top{color:var(--text-muted,#9aa5b4);text-decoration:none;font:inherit;font-size:13px;letter-spacing:.05em;padding:0 16px;height:70px;display:flex;align-items:center;gap:5px;background:none;border:0;border-bottom:2px solid transparent;cursor:pointer;white-space:nowrap;transition:color .2s,border-color .2s}',
    'nav.gnav .g-top:hover,nav.gnav .g-top.active,nav.gnav .g-group.open>.g-top{color:var(--gold,#c9a84c);border-bottom-color:var(--gold,#c9a84c)}',
    'nav.gnav .g-caret{font-size:10px;opacity:.7}',
    'nav.gnav .g-group{position:relative}',
    'nav.gnav .g-menu{display:none;position:absolute;top:100%;left:0;min-width:210px;background:var(--navy2,#162032);border:1px solid var(--border,rgba(201,168,76,.2));border-top:2px solid var(--gold,#c9a84c);box-shadow:0 12px 28px rgba(0,0,0,.45);z-index:300}',
    'nav.gnav .g-group.open>.g-menu{display:block}',
    'nav.gnav .g-menu a{display:block;height:auto;padding:12px 18px;font-size:13px;letter-spacing:.03em;color:var(--text-muted,#9aa5b4);text-decoration:none;white-space:nowrap;border:0;border-bottom:1px solid rgba(255,255,255,.05);transition:color .15s,background .15s}',
    'nav.gnav .g-menu a:last-child{border-bottom:0}',
    'nav.gnav .g-menu a:hover,nav.gnav .g-menu a.active{color:var(--gold,#c9a84c);background:rgba(201,168,76,.08)}',
    '@media (hover:hover){nav.gnav .g-group:hover>.g-menu,nav.gnav .g-group:focus-within>.g-menu{display:block}nav.gnav .g-group:hover>.g-top{color:var(--gold,#c9a84c);border-bottom-color:var(--gold,#c9a84c)}}',
    '@media (max-width:700px){',
    ' nav.gnav{justify-content:center}',
    ' nav.gnav .g-top{height:40px;font-size:12px;padding:0 6px;gap:3px}',
    ' nav.gnav .g-caret{font-size:8px}',
    ' nav.gnav .g-group{position:static}',
    ' nav.gnav .g-menu{left:0;right:0;min-width:0;border-left:0;border-right:0}',
    ' nav.gnav .g-menu a{padding:15px 7%;font-size:14px;white-space:normal}',
    '}',
    '@media (max-width:400px){nav.gnav .g-top{font-size:11.5px;padding:0 4px}}'
  ].join('\n');
  var st = document.createElement('style');
  st.id = 'gnav-style';
  st.textContent = css;
  document.head.appendChild(st);

  /* メニュー本体を組み立てる */
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;'); }
  var html = '';
  NAV.forEach(function (n) {
    if (!n.items) {
      html += '<a class="g-top' + (isCur(n.href) ? ' active' : '') + '" href="' + esc(n.href) + '">' + esc(n.label) + '</a>';
      return;
    }
    var hit = n.items.some(function (i) { return isCur(i[1]); });
    html += '<div class="g-group"><button type="button" class="g-top' + (hit ? ' active' : '') +
      '" aria-haspopup="true" aria-expanded="false">' + esc(n.label) + '<span class="g-caret" aria-hidden="true">▼</span></button><div class="g-menu">';
    n.items.forEach(function (i) {
      html += '<a href="' + esc(i[1]) + '"' + (isCur(i[1]) ? ' class="active" aria-current="page"' : '') + '>' + esc(i[0]) + '</a>';
    });
    html += '</div></div>';
  });
  host.className = 'gnav';
  host.setAttribute('aria-label', 'メインメニュー');
  host.innerHTML = html;

  /* タップ操作（マウスを乗せられない端末）用の開閉 */
  function closeAll(except) {
    Array.prototype.forEach.call(host.querySelectorAll('.g-group.open'), function (g) {
      if (g !== except) {
        g.classList.remove('open');
        g.firstChild.setAttribute('aria-expanded', 'false');
      }
    });
  }
  host.addEventListener('click', function (e) {
    var btn = e.target.closest ? e.target.closest('button.g-top') : null;
    if (!btn) return;
    var g = btn.parentNode;
    var willOpen = !g.classList.contains('open');
    closeAll(g);
    g.classList.toggle('open', willOpen);
    btn.setAttribute('aria-expanded', willOpen ? 'true' : 'false');
  });
  document.addEventListener('click', function (e) {
    if (!host.contains(e.target)) closeAll();
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeAll();
  });
})();
