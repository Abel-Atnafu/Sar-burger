// SAR Burger — admin panel
import { supabase } from './supabase-config.js';

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const PW_KEY = 'sar_admin_pw';

const state = {
  menu: [],
  combos: [],
  hours: [],
  orders: [],
  settings: {},
};

// ---------- helpers ----------
const $  = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

function getPw() { return sessionStorage.getItem(PW_KEY) || ''; }
function setPw(pw) { sessionStorage.setItem(PW_KEY, pw); }
function clearPw() { sessionStorage.removeItem(PW_KEY); }

function toast(msg, isError = false) {
  const el = $('#toast');
  el.textContent = msg;
  el.classList.toggle('toast--error', isError);
  el.hidden = false;
  clearTimeout(toast._t);
  toast._t = setTimeout(() => { el.hidden = true; }, 2600);
}

async function rpc(name, args) {
  const { data, error } = await supabase.rpc(name, args);
  if (error) {
    if (/invalid admin password/i.test(error.message)) {
      clearPw();
      showLogin('Session expired. Please sign in again.');
    }
    throw error;
  }
  return data;
}

function escapeHtml(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));
}

function formatPrice(n) {
  return Number(n || 0).toLocaleString('en-US', { maximumFractionDigits: 0 }) + ' Birr';
}

function formatDate(d) {
  try { return new Date(d).toLocaleString(); } catch { return d; }
}

// ---------- login ----------
function showLogin(msg = '') {
  $('#login-screen').hidden = false;
  $('#app').hidden = true;
  const err = $('#login-error');
  if (msg) { err.textContent = msg; err.hidden = false; } else { err.hidden = true; }
  $('#login-password').value = '';
  $('#login-password').focus();
}

function showApp() {
  $('#login-screen').hidden = true;
  $('#app').hidden = false;
  refreshAll();
}

$('#login-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const pw = $('#login-password').value;
  try {
    const ok = await supabase.rpc('admin_login', { p_password: pw });
    if (ok.error) throw ok.error;
    setPw(pw);
    showApp();
  } catch (err) {
    const errEl = $('#login-error');
    errEl.textContent = 'Wrong password.';
    errEl.hidden = false;
  }
});

$('#logout-btn').addEventListener('click', () => {
  clearPw();
  showLogin();
});

// ---------- navigation ----------
$$('.side__nav button').forEach((btn) => {
  btn.addEventListener('click', () => gotoView(btn.dataset.view));
});
$$('[data-goto]').forEach((btn) => {
  btn.addEventListener('click', () => gotoView(btn.dataset.goto));
});

function gotoView(name) {
  $$('.side__nav button').forEach((b) => b.classList.toggle('is-active', b.dataset.view === name));
  $$('.view').forEach((v) => v.hidden = v.dataset.view !== name);
}

// ---------- data loading ----------
async function refreshAll() {
  try {
    const [menuRes, combosRes, hoursRes, settingsRes] = await Promise.all([
      supabase.from('menu_items').select('*'),
      supabase.from('combos').select('*'),
      supabase.from('hours').select('*'),
      supabase.from('public_settings').select('*'),
    ]);
    state.menu    = menuRes.data    || [];
    state.combos  = combosRes.data  || [];
    state.hours   = hoursRes.data   || [];
    state.settings = {};
    for (const row of (settingsRes.data || [])) state.settings[row.key] = row.value;

    try {
      state.orders = await rpc('admin_list_orders', { p_password: getPw() });
    } catch { state.orders = []; }

    renderStats();
    renderMenu();
    renderCombos();
    renderHours();
    renderOrders();
    renderSettings();
  } catch (err) {
    console.error(err);
    toast('Failed to load data.', true);
  }
}

// ---------- overview ----------
function renderStats() {
  $('#stat-menu').textContent = state.menu.length;
  $('#stat-available').textContent = state.menu.filter((i) => i.available).length;
  $('#stat-combos').textContent = state.combos.length;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const todayCount = state.orders.filter((o) => new Date(o.created_at) >= today).length;
  $('#stat-orders-today').textContent = todayCount;
}

// ---------- menu ----------
function renderMenu() {
  const tbody = $('#menu-rows');
  if (state.menu.length === 0) {
    tbody.innerHTML = '<tr><td class="muted" colspan="5">No items yet. Click "Add item" to get started.</td></tr>';
    return;
  }
  tbody.innerHTML = state.menu
    .slice().sort((a, b) => a.category.localeCompare(b.category) || (a.sort_order - b.sort_order))
    .map((i) => `
      <tr>
        <td><strong>${escapeHtml(i.name)}</strong>${i.description ? `<div class="muted small">${escapeHtml(i.description)}</div>` : ''}</td>
        <td style="text-transform:capitalize">${escapeHtml(i.category)}</td>
        <td>${formatPrice(i.price)}</td>
        <td><span class="pill ${i.available ? 'pill--on' : 'pill--off'}">${i.available ? 'Yes' : 'No'}</span></td>
        <td class="actions">
          <button class="btn btn--small" data-act="toggle-menu" data-id="${i.id}">${i.available ? 'Mark unavailable' : 'Mark available'}</button>
          <button class="btn btn--small" data-act="edit-menu" data-id="${i.id}">Edit</button>
          <button class="btn btn--small btn--danger" data-act="del-menu" data-id="${i.id}">Delete</button>
        </td>
      </tr>`).join('');
}

$('#menu-rows').addEventListener('click', async (e) => {
  const btn = e.target.closest('button[data-act]'); if (!btn) return;
  const id = btn.dataset.id;
  const item = state.menu.find((i) => i.id === id);
  if (!item) return;
  try {
    if (btn.dataset.act === 'toggle-menu') {
      await rpc('admin_upsert_menu_item', { p_password: getPw(), p_item: { id, available: !item.available } });
      toast('Updated.');
      await refreshAll();
    } else if (btn.dataset.act === 'edit-menu') {
      openMenuModal(item);
    } else if (btn.dataset.act === 'del-menu') {
      if (confirm(`Delete "${item.name}"?`)) {
        await rpc('admin_delete_menu_item', { p_password: getPw(), p_id: id });
        toast('Deleted.');
        await refreshAll();
      }
    }
  } catch (err) { toast(err.message || 'Error', true); }
});

$('#menu-add').addEventListener('click', () => openMenuModal(null));

function openMenuModal(item) {
  const data = item || { category: 'burger', name: '', description: '', price: 0, image_url: '', available: true };
  openModal(item ? 'Edit menu item' : 'Add menu item', `
    <label>Category
      <select name="category">
        <option value="burger">Burger</option>
        <option value="sandwich">Sandwich</option>
        <option value="drink">Drink</option>
      </select>
    </label>
    <label>Name <input name="name" required /></label>
    <label>Description <textarea name="description" rows="2"></textarea></label>
    <label>Price (Birr) <input name="price" type="number" min="0" step="1" required /></label>
    <label>Image URL (optional) <input name="image_url" type="url" /></label>
    <label class="checkbox"><input type="checkbox" name="available" /> Available</label>
  `, (form) => {
    form.category.value    = data.category;
    form.name.value        = data.name;
    form.description.value = data.description || '';
    form.price.value       = data.price;
    form.image_url.value   = data.image_url || '';
    form.available.checked = !!data.available;
  }, async (form) => {
    const payload = {
      id: item ? item.id : null,
      category: form.category.value,
      name: form.name.value.trim(),
      description: form.description.value.trim(),
      price: Number(form.price.value),
      image_url: form.image_url.value.trim(),
      available: form.available.checked,
    };
    if (!payload.name) { toast('Name required', true); return false; }
    await rpc('admin_upsert_menu_item', { p_password: getPw(), p_item: payload });
    toast('Saved.');
    await refreshAll();
    return true;
  });
}

// ---------- combos ----------
function renderCombos() {
  const tbody = $('#combo-rows');
  if (state.combos.length === 0) {
    tbody.innerHTML = '<tr><td class="muted" colspan="5">No combos yet.</td></tr>';
    return;
  }
  tbody.innerHTML = state.combos
    .slice().sort((a, b) => (a.sort_order - b.sort_order) || a.name.localeCompare(b.name))
    .map((c) => `
      <tr>
        <td><strong>${escapeHtml(c.name)}</strong>${c.description ? `<div class="muted small">${escapeHtml(c.description)}</div>` : ''}</td>
        <td class="muted small">${escapeHtml(c.items || '')}</td>
        <td>${formatPrice(c.price)}</td>
        <td><span class="pill ${c.available ? 'pill--on' : 'pill--off'}">${c.available ? 'Yes' : 'No'}</span></td>
        <td class="actions">
          <button class="btn btn--small" data-act="toggle-combo" data-id="${c.id}">${c.available ? 'Mark unavailable' : 'Mark available'}</button>
          <button class="btn btn--small" data-act="edit-combo" data-id="${c.id}">Edit</button>
          <button class="btn btn--small btn--danger" data-act="del-combo" data-id="${c.id}">Delete</button>
        </td>
      </tr>`).join('');
}

$('#combo-rows').addEventListener('click', async (e) => {
  const btn = e.target.closest('button[data-act]'); if (!btn) return;
  const id = btn.dataset.id;
  const combo = state.combos.find((c) => c.id === id);
  if (!combo) return;
  try {
    if (btn.dataset.act === 'toggle-combo') {
      await rpc('admin_upsert_combo', { p_password: getPw(), p_combo: { id, available: !combo.available } });
      toast('Updated.');
      await refreshAll();
    } else if (btn.dataset.act === 'edit-combo') {
      openComboModal(combo);
    } else if (btn.dataset.act === 'del-combo') {
      if (confirm(`Delete combo "${combo.name}"?`)) {
        await rpc('admin_delete_combo', { p_password: getPw(), p_id: id });
        toast('Deleted.');
        await refreshAll();
      }
    }
  } catch (err) { toast(err.message || 'Error', true); }
});

$('#combo-add').addEventListener('click', () => openComboModal(null));

function openComboModal(combo) {
  const data = combo || { name: '', description: '', items: '', price: 0, available: true };
  openModal(combo ? 'Edit combo' : 'Add combo', `
    <label>Name <input name="name" required /></label>
    <label>Description <textarea name="description" rows="2"></textarea></label>
    <label>Items included (comma-separated or free text) <textarea name="items" rows="2" placeholder="Classic Burger, Fries, Coke"></textarea></label>
    <label>Price (Birr) <input name="price" type="number" min="0" step="1" required /></label>
    <label class="checkbox"><input type="checkbox" name="available" /> Available</label>
  `, (form) => {
    form.name.value        = data.name;
    form.description.value = data.description || '';
    form.items.value       = data.items || '';
    form.price.value       = data.price;
    form.available.checked = !!data.available;
  }, async (form) => {
    const payload = {
      id: combo ? combo.id : null,
      name: form.name.value.trim(),
      description: form.description.value.trim(),
      items: form.items.value.trim(),
      price: Number(form.price.value),
      available: form.available.checked,
    };
    if (!payload.name) { toast('Name required', true); return false; }
    await rpc('admin_upsert_combo', { p_password: getPw(), p_combo: payload });
    toast('Saved.');
    await refreshAll();
    return true;
  });
}

// ---------- hours ----------
function renderHours() {
  const tbody = $('#hours-rows');
  const byDay = new Map(state.hours.map((h) => [h.day, h]));
  const rows = [];
  for (let d = 0; d < 7; d++) {
    const h = byDay.get(d) || { day: d, open_time: '10:00', close_time: '23:00', closed: false };
    rows.push(`
      <tr data-day="${d}">
        <td><strong>${DAY_NAMES[d]}</strong></td>
        <td><input type="time" name="open"  value="${String(h.open_time).slice(0,5)}"/></td>
        <td><input type="time" name="close" value="${String(h.close_time).slice(0,5)}"/></td>
        <td><label class="checkbox"><input type="checkbox" name="closed" ${h.closed ? 'checked' : ''}/> Closed</label></td>
        <td class="actions"><button class="btn btn--small btn--primary" data-act="save-hours" data-day="${d}">Save</button></td>
      </tr>`);
  }
  tbody.innerHTML = rows.join('');
}

$('#hours-rows').addEventListener('click', async (e) => {
  const btn = e.target.closest('button[data-act="save-hours"]'); if (!btn) return;
  const day = Number(btn.dataset.day);
  const tr = btn.closest('tr');
  const open   = tr.querySelector('input[name="open"]').value;
  const close  = tr.querySelector('input[name="close"]').value;
  const closed = tr.querySelector('input[name="closed"]').checked;
  try {
    await rpc('admin_upsert_hours', {
      p_password: getPw(), p_day: day, p_open: open, p_close: close, p_closed: closed,
    });
    toast(`${DAY_NAMES[day]} saved.`);
    await refreshAll();
  } catch (err) { toast(err.message || 'Error', true); }
});

// ---------- orders ----------
function renderOrders() {
  const tbody = $('#order-rows');
  if (state.orders.length === 0) {
    tbody.innerHTML = '<tr><td class="muted" colspan="6">No orders logged yet.</td></tr>';
    return;
  }
  tbody.innerHTML = state.orders.map((o) => `
    <tr>
      <td class="muted small">${formatDate(o.created_at)}</td>
      <td><strong>${escapeHtml(o.customer_name || '—')}</strong></td>
      <td class="muted small">${escapeHtml(o.item_summary || '')}</td>
      <td>${formatPrice(o.total)}</td>
      <td><span class="pill pill--${escapeHtml(o.status)}">${escapeHtml(o.status)}</span></td>
      <td class="actions">
        <button class="btn btn--small" data-act="edit-order" data-id="${o.id}">Edit</button>
        <button class="btn btn--small btn--danger" data-act="del-order" data-id="${o.id}">Delete</button>
      </td>
    </tr>`).join('');
}

$('#order-rows').addEventListener('click', async (e) => {
  const btn = e.target.closest('button[data-act]'); if (!btn) return;
  const id = btn.dataset.id;
  const order = state.orders.find((o) => o.id === id);
  if (!order) return;
  try {
    if (btn.dataset.act === 'edit-order') {
      openOrderModal(order);
    } else if (btn.dataset.act === 'del-order') {
      if (confirm('Delete this order?')) {
        await rpc('admin_delete_order', { p_password: getPw(), p_id: id });
        toast('Deleted.');
        await refreshAll();
      }
    }
  } catch (err) { toast(err.message || 'Error', true); }
});

$('#order-add').addEventListener('click', () => openOrderModal(null));

$('#order-clear').addEventListener('click', async () => {
  if (!confirm('Clear ALL orders? This cannot be undone.')) return;
  try {
    await rpc('admin_clear_orders', { p_password: getPw() });
    toast('Cleared.');
    await refreshAll();
  } catch (err) { toast(err.message || 'Error', true); }
});

function openOrderModal(order) {
  const data = order || { customer_name: '', item_summary: '', total: 0, status: 'pending', note: '' };
  openModal(order ? 'Edit order' : 'Log order', `
    <label>Customer name <input name="customer_name" /></label>
    <label>Items summary <textarea name="item_summary" rows="2"></textarea></label>
    <label>Total (Birr) <input name="total" type="number" min="0" step="1" /></label>
    <label>Status
      <select name="status">
        <option value="pending">Pending</option>
        <option value="completed">Completed</option>
        <option value="cancelled">Cancelled</option>
      </select>
    </label>
    <label>Note <textarea name="note" rows="2"></textarea></label>
  `, (form) => {
    form.customer_name.value = data.customer_name || '';
    form.item_summary.value  = data.item_summary || '';
    form.total.value         = data.total;
    form.status.value        = data.status;
    form.note.value          = data.note || '';
  }, async (form) => {
    const payload = {
      id: order ? order.id : null,
      customer_name: form.customer_name.value.trim(),
      item_summary: form.item_summary.value.trim(),
      total: Number(form.total.value || 0),
      status: form.status.value,
      note: form.note.value.trim(),
    };
    await rpc('admin_upsert_order', { p_password: getPw(), p_order: payload });
    toast('Saved.');
    await refreshAll();
    return true;
  });
}

// ---------- settings ----------
function renderSettings() {
  const f = $('#settings-form');
  if (!f) return;
  f.restaurant_name.value = state.settings.restaurant_name || '';
  f.tagline.value         = state.settings.tagline || '';
  f.phone.value           = state.settings.phone || '';
  f.address.value         = state.settings.address || '';
  f.maps_embed.value      = state.settings.maps_embed || '';
}

$('#settings-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const f = e.currentTarget;
  const updates = [
    ['restaurant_name', f.restaurant_name.value.trim()],
    ['tagline',         f.tagline.value.trim()],
    ['phone',           f.phone.value.replace(/\D/g, '')],
    ['address',         f.address.value.trim()],
    ['maps_embed',      f.maps_embed.value.trim()],
  ];
  try {
    for (const [k, v] of updates) {
      await rpc('admin_update_setting', { p_password: getPw(), p_key: k, p_value: v });
    }
    toast('Settings saved.');
    await refreshAll();
  } catch (err) { toast(err.message || 'Error', true); }
});

$('#password-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const f = e.currentTarget;
  const current = f.current.value;
  const next    = f.new.value;
  const confirmPw = f.confirm.value;
  if (next.length < 6) { toast('Password must be at least 6 characters', true); return; }
  if (next !== confirmPw) { toast("New passwords don't match", true); return; }
  try {
    await rpc('admin_change_password', { p_password: current, p_new_password: next });
    setPw(next);
    f.reset();
    toast('Password updated.');
  } catch (err) { toast(err.message || 'Error', true); }
});

// ---------- modal ----------
function openModal(title, bodyHtml, fill, onSave) {
  const modal = $('#modal');
  $('#modal-title').textContent = title;
  const form = $('#modal-form');
  form.innerHTML = bodyHtml;
  fill(form);
  modal.hidden = false;

  const close = () => { modal.hidden = true; };
  $('#modal-cancel').onclick = close;
  $('#modal-save').onclick = async () => {
    try {
      const ok = await onSave(form);
      if (ok !== false) close();
    } catch (err) { toast(err.message || 'Error', true); }
  };
  modal.onclick = (e) => { if (e.target === modal) close(); };
}

// ---------- boot ----------
if (getPw()) {
  // Verify session still valid.
  supabase.rpc('admin_login', { p_password: getPw() }).then(({ error }) => {
    if (error) { clearPw(); showLogin(); }
    else showApp();
  });
} else {
  showLogin();
}
