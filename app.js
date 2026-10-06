/* Macro-Tracker — shared behaviour: theme, tabs, TOC highlighting, expand-all, search, dashboard */
(function () {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

  /* ---------- theme ---------- */
  const themeBtn = $('#themeBtn');
  function applyTheme(t) {
    if (t) document.documentElement.setAttribute('data-theme', t); else document.documentElement.removeAttribute('data-theme');
    if (themeBtn) themeBtn.textContent = t === 'dark' ? 'Light' : t === 'light' ? 'Auto' : 'Dark';
  }
  try { applyTheme(localStorage.getItem('mt-theme') || ''); } catch (e) { applyTheme(''); }
  if (themeBtn) themeBtn.addEventListener('click', () => {
    const cur = document.documentElement.getAttribute('data-theme') || '';
    const next = cur === '' ? 'dark' : cur === 'dark' ? 'light' : '';
    applyTheme(next);
    try { next ? localStorage.setItem('mt-theme', next) : localStorage.removeItem('mt-theme'); } catch (e) {}
  });

  /* ---------- active nav ---------- */
  const here = location.pathname.split('/').pop() || 'index.html';
  $$('.nav a').forEach(a => { if (a.getAttribute('href') === here) a.classList.add('active'); });

  /* ---------- tabs ---------- */
  $$('.section').forEach(sec => {
    const tabs = $$('.tab', sec), panels = $$('.panel', sec);
    tabs.forEach((t, i) => {
      t.addEventListener('click', () => {
        tabs.forEach(x => x.classList.remove('active')); panels.forEach(x => x.classList.remove('active'));
        t.classList.add('active'); panels[i].classList.add('active');
        if (sec.id) history.replaceState(null, '', '#' + sec.id + (i ? '/' + t.dataset.key : ''));
      });
    });
  });
  // open #section/tab from URL
  function openFromHash() {
    const h = location.hash.replace('#', '');
    if (!h) return;
    const [id, key] = h.split('/');
    const sec = document.getElementById(id);
    if (!sec) return;
    if (key) { const t = $$('.tab', sec).find(x => x.dataset.key === key); if (t) t.click(); }
    setTimeout(() => sec.scrollIntoView({ block: 'start' }), 10);
  }
  openFromHash();
  window.addEventListener('hashchange', openFromHash);

  /* ---------- expand all ---------- */
  const expandBtn = $('#expandAll');
  if (expandBtn) {
    let on = false;
    try { on = localStorage.getItem('mt-expand') === '1'; } catch (e) {}
    const set = v => { on = v; $$('.section').forEach(s => s.classList.toggle('expanded', on)); expandBtn.textContent = on ? 'Show tabs' : 'Expand all'; try { localStorage.setItem('mt-expand', on ? '1' : '0'); } catch (e) {} };
    set(on);
    expandBtn.addEventListener('click', () => set(!on));
  }

  /* ---------- TOC highlight ---------- */
  const tocLinks = $$('.toc a[href^="#"]');
  if (tocLinks.length && 'IntersectionObserver' in window) {
    const map = new Map(tocLinks.map(a => [a.getAttribute('href').slice(1), a]));
    const io = new IntersectionObserver(entries => {
      entries.forEach(en => { if (en.isIntersecting) { tocLinks.forEach(a => a.classList.remove('active')); const a = map.get(en.target.id); if (a) a.classList.add('active'); } });
    }, { rootMargin: '-20% 0px -70% 0px' });
    $$('.section[id]').forEach(s => io.observe(s));
  }

  /* ---------- in-page search ---------- */
  const search = $('#pageSearch');
  if (search) {
    search.addEventListener('input', () => {
      const q = search.value.trim().toLowerCase();
      $$('.section').forEach(sec => {
        const hit = !q || sec.textContent.toLowerCase().includes(q);
        sec.style.display = hit ? '' : 'none';
        if (q && hit) sec.classList.add('expanded'); else if (!expandBtn || expandBtn.textContent === 'Expand all') sec.classList.remove('expanded');
      });
    });
  }

  /* ---------- dashboard ---------- */
  const dash = $('#dashboard');
  if (!dash) return;

  const GROUPS = [
    ['india_eq', 'India equities'], ['us_eq', 'US equities'], ['us_rates', 'US rates'],
    ['fx', 'Currencies'], ['cmdty', 'Commodities'], ['other', 'Risk & other'],
  ];
  const fmt = (q) => {
    const v = q.last; if (v == null || isNaN(v)) return '—';
    switch (q.unit) {
      case 'pct': return v.toFixed(2) + '%';
      case 'fx': return v >= 50 ? v.toFixed(2) : v.toFixed(4);
      case 'usd': return v >= 1000 ? v.toLocaleString('en-US', { maximumFractionDigits: 0 }) : v.toFixed(2);
      case 'bps': return (v >= 0 ? '+' : '') + Math.round(v) + ' bp';
      case 'inr': return '₹' + v.toLocaleString('en-IN', { maximumFractionDigits: 0 });
      default: return v >= 1000 ? v.toLocaleString('en-US', { maximumFractionDigits: 0 }) : v.toFixed(2);
    }
  };
  const chgText = (q) => {
    if (q.last == null) return { cls: 'flat', txt: 'awaiting first update' };
    if (q.seed) return { cls: 'flat', txt: 'seed value' };
    if (q.unit === 'pct') { const bp = Math.round(q.chg * 100); return { cls: bp > 0 ? 'up' : bp < 0 ? 'down' : 'flat', txt: (bp > 0 ? '+' : '') + bp + ' bp' }; }
    const p = q.chg_pct || 0; const cls = p > 0.001 ? 'up' : p < -0.001 ? 'down' : 'flat';
    return { cls, txt: (p > 0 ? '+' : '') + p.toFixed(2) + '%' };
  };
  const tile = (q, extraCls = '') => {
    const c = chgText(q);
    const arrow = c.cls === 'up' ? '▲' : c.cls === 'down' ? '▼' : '•';
    // For "bad when up" items (yields, USD/INR, oil, VIX) colour is still direction-of-move; the label text says what it means.
    return `<div class="tile ${q.stale ? 'stale' : ''} ${extraCls}" title="${q.ticker || ''}">
      <div class="lbl"><span>${q.label}</span>${q.stale && !q.seed ? '<span class="badge src">stale</span>' : ''}</div>
      <div class="val">${fmt(q)}</div>
      <div class="chg ${c.cls}"><span aria-hidden="true">${arrow}</span>${c.txt}</div>
      ${q.note ? `<div class="note">${q.note}</div>` : ''}</div>`;
  };

  fetch('data/quotes.json?cb=' + Date.now()).then(r => r.json()).then(d => {
    const stamp = $('#dashStamp');
    const updated = new Date(d.updated_utc);
    const ageMin = Math.round((Date.now() - updated.getTime()) / 60000);
    const isSeed = (d.quotes || []).every(q => q.seed);
    if (stamp) {
      stamp.textContent = isSeed ? 'Showing seed values — live feed starts after the first GitHub Action run' :
        `Updated ${updated.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', hour12: false })} IST (${ageMin < 90 ? ageMin + ' min ago' : Math.round(ageMin / 60) + ' h ago'}) · ${d.source}`;
      stamp.classList.toggle('stale', isSeed || ageMin > 180);
    }
    let html = '';
    GROUPS.forEach(([g, title]) => {
      const qs = (d.quotes || []).filter(q => q.group === g);
      if (!qs.length) return;
      html += `<div class="group"><h3>${title}</h3><div class="tiles">${qs.map(q => tile(q)).join('')}</div></div>`;
    });
    // Manual + derived
    const m = d.manual || {};
    const manualTiles = Object.entries(m).filter(([k]) => !k.startsWith('_')).map(([k, v]) => {
      const q = { label: v.label, last: typeof v.value === 'number' ? v.value : null, unit: v.unit === 'usd_bn' ? 'idx' : v.unit, note: `as of ${v.asof} · ${v.source}`, stale: false, seed: true };
      if (typeof v.value !== 'number') return `<div class="tile manual"><div class="lbl"><span>${v.label}</span></div><div class="val">${v.value}</div><div class="note">as of ${v.asof} · ${v.source}</div></div>`;
      if (v.unit === 'usd_bn') q.note = '$ bn · ' + q.note;
      return tile(q, 'manual').replace('seed value', 'manual input');
    }).join('');
    const derivedTiles = (d.derived || []).map(q => tile({ ...q, seed: true }, 'manual').replace('seed value', 'derived')).join('');
    if (manualTiles || derivedTiles) html += `<div class="group"><h3>Policy, macro & derived (manual inputs — dashed)</h3><div class="tiles">${manualTiles}${derivedTiles}</div></div>`;
    dash.innerHTML = html;
    if (d.failures && d.failures.length && !isSeed) dash.insertAdjacentHTML('beforeend', `<p class="legend">Could not fetch this run: ${d.failures.join(', ')} (showing last good value).</p>`);
  }).catch(() => { dash.innerHTML = '<p class="meta">Could not load data/quotes.json.</p>'; });

  // Optional: live FX refresh in the browser from Frankfurter (ECB daily fixes, CORS-enabled, no key).
  fetch('https://api.frankfurter.app/latest?from=USD&to=INR,EUR,JPY,CNY').then(r => r.json()).then(fx => {
    const el = $('#fxEcb'); if (!el || !fx.rates) return;
    el.innerHTML = `ECB reference (${fx.date}): USD/INR ${fx.rates.INR.toFixed(2)} · EUR/USD ${(1 / fx.rates.EUR).toFixed(4)} · USD/JPY ${fx.rates.JPY.toFixed(2)} · USD/CNY ${fx.rates.CNY.toFixed(3)}`;
  }).catch(() => {});
})();
