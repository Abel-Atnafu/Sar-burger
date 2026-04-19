// SAR Burger — customer site
import { supabase } from './supabase-config.js';

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const state = {
  settings: {
    restaurant_name: 'SAR Burger',
    tagline: 'Smash-grilled burgers, Ethiopian soul.',
    phone: '251000000000',
    address: 'Addis Ababa, Ethiopia',
    maps_embed: '',
  },
  menu: [],
  combos: [],
  hours: [],
  activeCat: 'burger',
};

// ---------- helpers ----------
const $  = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

function prettyPhone(p) {
  const digits = (p || '').replace(/\D/g, '');
  if (digits.startsWith('251') && digits.length >= 12) {
    return '+251 ' + digits.slice(3, 6) + ' ' + digits.slice(6, 9) + ' ' + digits.slice(9);
  }
  return '+' + digits;
}

function waLink(message) {
  const phone = (state.settings.phone || '').replace(/\D/g, '');
  const text = encodeURIComponent(message || 'Hi SAR Burger, I would like to place an order.');
  return `https://wa.me/${phone}?text=${text}`;
}

function formatPrice(n) {
  const v = Number(n || 0);
  return v.toLocaleString('en-US', { maximumFractionDigits: 0 }) + ' Birr';
}

function formatTime(t) {
  if (!t) return '';
  const [h, m] = String(t).split(':');
  const hh = parseInt(h, 10);
  const suffix = hh >= 12 ? 'PM' : 'AM';
  const disp = ((hh + 11) % 12) + 1;
  return `${disp}:${m} ${suffix}`;
}

// ---------- render ----------
function applySettings() {
  $$('[data-setting="restaurant_name"]').forEach((el) => el.textContent = state.settings.restaurant_name || 'SAR Burger');
  $$('[data-setting="tagline"]').forEach((el) => el.textContent = state.settings.tagline || '');
  $$('[data-setting="address"]').forEach((el) => el.textContent = state.settings.address || '');
  $$('[data-setting="phone-pretty"]').forEach((el) => el.textContent = prettyPhone(state.settings.phone));
  document.title = `${state.settings.restaurant_name || 'SAR Burger'} — ${state.settings.tagline || ''}`;

  const heroOrder = $('#hero-order');
  const contactOrder = $('#contact-order');
  const msg = `Hi ${state.settings.restaurant_name || 'SAR Burger'}, I'd like to place an order.`;
  if (heroOrder) heroOrder.href = waLink(msg);
  if (contactOrder) contactOrder.href = waLink(msg);

  const map = $('#map-embed');
  if (map) {
    map.innerHTML = state.settings.maps_embed || '<p class="muted">Map coming soon.</p>';
  }
}

function renderMenu() {
  const grid = $('#menu-grid');
  if (!grid) return;
  const items = state.menu
    .filter((i) => i.category === state.activeCat)
    .sort((a, b) => (a.sort_order - b.sort_order) || a.name.localeCompare(b.name));

  if (items.length === 0) {
    grid.innerHTML = '<p class="muted">No items in this category yet.</p>';
    return;
  }

  grid.innerHTML = items.map((item) => {
    const unavail = !item.available;
    const orderMsg = `Hi SAR Burger, I'd like to order: ${item.name} (${formatPrice(item.price)}).`;
    const href = unavail ? '#' : waLink(orderMsg);
    const target = unavail ? '' : 'target="_blank" rel="noopener"';
    const badge = unavail ? '<span class="badge">Sold out</span>' : '';
    const img = item.image_url
      ? `<img class="card__img" src="${escapeAttr(item.image_url)}" alt="${escapeAttr(item.name)}" loading="lazy" />`
      : '';
    return `
      <article class="card ${unavail ? 'card--unavailable' : ''}">
        ${img}
        <div class="card__row">
          <h3 class="card__title">${escapeHtml(item.name)}</h3>
          ${badge}
        </div>
        ${item.description ? `<p class="card__desc">${escapeHtml(item.description)}</p>` : ''}
        <div class="card__row">
          <span class="card__price">${formatPrice(item.price)}</span>
          <a class="card__order ${unavail ? 'is-disabled' : ''}" href="${href}" ${target}>${unavail ? 'Unavailable' : 'Order'}</a>
        </div>
      </article>`;
  }).join('');
}

function renderCombos() {
  const grid = $('#combos-grid');
  if (!grid) return;
  const list = state.combos
    .slice()
    .sort((a, b) => (a.sort_order - b.sort_order) || a.name.localeCompare(b.name));

  if (list.length === 0) {
    grid.innerHTML = '<p class="muted">Combo deals coming soon.</p>';
    return;
  }

  grid.innerHTML = list.map((c) => {
    const unavail = !c.available;
    const msg = `Hi SAR Burger, I'd like to order the ${c.name} combo (${formatPrice(c.price)}): ${c.items || ''}`.trim();
    const href = unavail ? '#' : waLink(msg);
    const target = unavail ? '' : 'target="_blank" rel="noopener"';
    const badge = unavail ? '<span class="badge">Sold out</span>' : '';
    return `
      <article class="card card--combo ${unavail ? 'card--unavailable' : ''}">
        <div class="card__row">
          <h3 class="card__title">${escapeHtml(c.name)}</h3>
          ${badge}
        </div>
        ${c.description ? `<p class="card__desc">${escapeHtml(c.description)}</p>` : ''}
        ${c.items ? `<p class="card__items">${escapeHtml(c.items)}</p>` : ''}
        <div class="card__row">
          <span class="card__price">${formatPrice(c.price)}</span>
          <a class="card__order ${unavail ? 'is-disabled' : ''}" href="${href}" ${target}>${unavail ? 'Unavailable' : 'Order Combo'}</a>
        </div>
      </article>`;
  }).join('');
}

function renderHours() {
  const table = $('#hours-table tbody');
  if (!table) return;
  const today = new Date().getDay();
  const rows = state.hours.slice().sort((a, b) => a.day - b.day);
  if (rows.length === 0) {
    table.innerHTML = '<tr><td class="muted" colspan="2">Hours coming soon.</td></tr>';
  } else {
    table.innerHTML = rows.map((h) => {
      const label = h.closed ? 'Closed' : `${formatTime(h.open_time)} – ${formatTime(h.close_time)}`;
      const cls = h.day === today ? 'is-today' : '';
      return `<tr class="${cls}"><td>${DAY_NAMES[h.day]}</td><td>${label}</td></tr>`;
    }).join('');
  }
  renderOpenStatus();
}

function renderOpenStatus() {
  const el = $('#open-status');
  if (!el) return;
  const now = new Date();
  const today = now.getDay();
  const row = state.hours.find((h) => h.day === today);
  if (!row || row.closed) {
    el.innerHTML = '<span class="dot dot--closed"></span>Closed today';
    return;
  }
  const [oh, om] = String(row.open_time).split(':').map(Number);
  const [ch, cm] = String(row.close_time).split(':').map(Number);
  const nowM = now.getHours() * 60 + now.getMinutes();
  const openM = oh * 60 + om;
  const closeM = ch * 60 + cm;
  const isOpen = nowM >= openM && nowM < closeM;
  el.innerHTML = isOpen
    ? `<span class="dot dot--open"></span>Open now · until ${formatTime(row.close_time)}`
    : `<span class="dot dot--closed"></span>Closed now · opens ${formatTime(row.open_time)}`;
}

function escapeHtml(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));
}
function escapeAttr(s) { return escapeHtml(s); }

// ---------- data ----------
async function loadAll() {
  const [menuRes, combosRes, hoursRes, settingsRes] = await Promise.all([
    supabase.from('menu_items').select('*'),
    supabase.from('combos').select('*'),
    supabase.from('hours').select('*'),
    supabase.from('public_settings').select('*'),
  ]);
  if (menuRes.data)    state.menu    = menuRes.data;
  if (combosRes.data)  state.combos  = combosRes.data;
  if (hoursRes.data)   state.hours   = hoursRes.data;
  if (settingsRes.data) {
    for (const row of settingsRes.data) {
      state.settings[row.key] = row.value;
    }
  }
  applySettings();
  renderMenu();
  renderCombos();
  renderHours();
}

function subscribeRealtime() {
  supabase.channel('public:menu_items')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'menu_items' }, async () => {
      const { data } = await supabase.from('menu_items').select('*');
      if (data) { state.menu = data; renderMenu(); }
    }).subscribe();

  supabase.channel('public:combos')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'combos' }, async () => {
      const { data } = await supabase.from('combos').select('*');
      if (data) { state.combos = data; renderCombos(); }
    }).subscribe();

  supabase.channel('public:hours')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'hours' }, async () => {
      const { data } = await supabase.from('hours').select('*');
      if (data) { state.hours = data; renderHours(); }
    }).subscribe();

  supabase.channel('public:settings')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'settings' }, async () => {
      const { data } = await supabase.from('public_settings').select('*');
      if (data) {
        for (const row of data) state.settings[row.key] = row.value;
        applySettings();
        renderMenu();
        renderCombos();
      }
    }).subscribe();
}

// ---------- UI wiring ----------
function wireUI() {
  $$('.tab').forEach((btn) => {
    btn.addEventListener('click', () => {
      $$('.tab').forEach((b) => b.classList.remove('is-active'));
      btn.classList.add('is-active');
      state.activeCat = btn.dataset.cat;
      renderMenu();
    });
  });

  const toggle = $('#nav-toggle');
  const links  = $('#nav-links');
  if (toggle && links) {
    toggle.addEventListener('click', () => {
      toggle.classList.toggle('is-open');
      links.classList.toggle('is-open');
    });
    links.addEventListener('click', (e) => {
      if (e.target.matches('a')) {
        toggle.classList.remove('is-open');
        links.classList.remove('is-open');
      }
    });
  }

  const year = $('#year');
  if (year) year.textContent = new Date().getFullYear();

  setInterval(renderOpenStatus, 60 * 1000);
}

wireUI();
loadAll().catch((err) => {
  console.error('Failed to load site data:', err);
  const grid = $('#menu-grid');
  if (grid) grid.innerHTML = '<p class="muted">Could not load menu. Please refresh.</p>';
});
subscribeRealtime();
