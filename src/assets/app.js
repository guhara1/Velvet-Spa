/* 테마 토글 + 지역 검색 (의존성 없음) */
(function () {
  'use strict';

  // ── 테마
  var KEY = 'theme';
  function apply(t) {
    document.documentElement.setAttribute('data-theme', t);
    var b = document.querySelector('[data-theme-toggle]');
    if (b) {
      b.setAttribute('aria-label', t === 'light' ? '어두운 테마로 전환' : '밝은 테마로 전환');
      b.textContent = t === 'light' ? '☾' : '☀';
    }
  }
  function current() {
    return document.documentElement.getAttribute('data-theme') || 'dark';
  }
  document.addEventListener('click', function (e) {
    var t = e.target.closest('[data-theme-toggle]');
    if (!t) return;
    var next = current() === 'light' ? 'dark' : 'light';
    try { localStorage.setItem(KEY, next); } catch (_) {}
    apply(next);
  });
  apply(current());

  // ── 검색
  var input = document.querySelector('[data-search]');
  if (!input) return;
  var out = document.querySelector('[data-search-results]');
  var index = null;
  var loading = false;

  function load() {
    if (index || loading) return Promise.resolve();
    loading = true;
    return fetch('/search-index.json')
      .then(function (r) { return r.json(); })
      .then(function (j) { index = j; loading = false; })
      .catch(function () { loading = false; });
  }

  function render(q) {
    if (!out) return;
    var term = q.trim();
    if (!term) { out.innerHTML = '<li class="search-empty">지역명을 입력하면 행정구·행정동을 바로 찾을 수 있습니다.</li>'; return; }
    if (!index) { out.innerHTML = '<li class="search-empty">검색 데이터를 불러오는 중…</li>'; return; }
    var low = term.toLowerCase();
    var hits = index.filter(function (it) {
      return it.n.indexOf(term) > -1 || it.p.indexOf(term) > -1 || it.s.indexOf(low) > -1;
    }).slice(0, 60);
    if (!hits.length) { out.innerHTML = '<li class="search-empty">"' + term.replace(/[<>&]/g, '') + '" 검색 결과가 없습니다. 행정동 또는 행정구 이름으로 다시 시도해 보세요.</li>'; return; }
    out.innerHTML = hits.map(function (it) {
      return '<li><a href="' + it.u + '"><span>' + it.n + '</span><small>' + it.p + '</small></a></li>';
    }).join('');
  }

  var timer;
  input.addEventListener('input', function () {
    var q = input.value;
    clearTimeout(timer);
    timer = setTimeout(function () { load().then(function () { render(q); }); }, 90);
  });
  load().then(function () {
    var pre = new URLSearchParams(location.search).get('q');
    if (pre) { input.value = pre; }
    render(input.value);
  });
})();
