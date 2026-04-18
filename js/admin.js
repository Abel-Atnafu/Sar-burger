/* ===== DEFAULT DATA ===== */
const DEFAULT_MENU = {
  burgers: [
    { name: 'The Naked Smash', price: 600, desc: 'Freshly smashed beef patty, NO CHEESE, SAR sauce on a toasted potato bun.', available: true },
    { name: 'Smash Burger', price: 690, desc: 'Freshly smashed beef patty, Cheddar Cheese, SAR sauce on a toasted potato bun.', available: true },
    { name: 'Onion Smash Burger', price: 690, desc: 'Freshly smashed beef patty with thinly sliced onions pressed into the meat as it cooks crispy, topped with Cheddar cheese and SAR sauce.', available: true },
    { name: 'BBQ Smash Burger', price: 790, desc: 'Freshly smashed beef patty, Cheddar cheese, SAR BBQ sauce on a toasted potato bun.', available: true },
    { name: 'Butter Smash Burger', price: 790, desc: 'Freshly smashed beef patty seared in butter for extra crispiness and flavor. Topped with Cheddar cheese and SAR sauce.', available: true },
    { name: 'Thick Beef Burger', price: 790, desc: 'A thick beef patty with Cheddar Cheese and SAR sauce on a toasted potato bun.', available: true },
  ],
  sandwiches: [
    { name: 'Philly Cheese Steak', price: 850, desc: 'Tender thin-sliced Prime cut beef, grilled with onions and smothered in melted cheese, all served on a toasted hoagie roll.', available: true },
    { name: 'Chicken Philly Cheese Steak', price: 890, desc: 'Grilled seasoned chicken breast, grilled with onions, melted cheese on a toasted hoagie roll.', available: true },
    { name: 'Tuna Salad Sandwich', price: 650, desc: 'Fresh, flaky tuna mixed with crisp celery and a hint of mustard. Served on a baguette with salad and tomato.', available: true },
  ],
  cocktails: [
    { name: 'Lemonade Breeze', price: 250, available: true },
    { name: 'Cinnamon Cooler', price: 300, available: true },
    { name: 'Ginger Delight', price: 290, available: true },
    { name: "Rosemary's Secret", price: 290, available: true },
    { name: 'Strawberry Sunset', price: 300, available: true },
    { name: 'Thyme to Shine', price: 290, available: true },
    { name: 'SAR Special', price: 350, available: true },
  ],
  coffee: [
    { name: 'Ice Tea', price: 150, available: true },
    { name: 'Ice Latte', price: 200, available: true },
    { name: 'Ice Moca', price: 250, available: true },
    { name: 'Ice Caramel', price: 250, available: true },
    { name: 'Ice Tea Americano', price: 180, available: true },
  ],
  softdrinks: [
    { name: 'Water', price: 95, available: true },
    { name: 'Sprite', price: 95, available: true },
    { name: 'Coca Cola', price: 95, available: true },
    { name: 'Novida', price: 95, available: true },
    { name: 'Ambo Water', price: 95, available: true },
  ],
};

const DEFAULT_HOURS = [
  { day: 'Monday',    open: '10:00', close: '23:00', isOpen: true },
  { day: 'Tuesday',   open: '10:00', close: '23:00', isOpen: true },
  { day: 'Wednesday', open: '10:00', close: '23:00', isOpen: true },
  { day: 'Thursday',  open: '10:00', close: '23:00', isOpen: true },
  { day: 'Friday',    open: '10:00', close: '23:00', isOpen: true },
  { day: 'Saturday',  open: '10:00', close: '23:00', isOpen: true },
  { day: 'Sunday',    open: '10:00', close: '23:00', isOpen: true },
];

const DEFAULT_PROMOS = [
  { title: 'Combo Deal of the Day', desc: 'Any Burger + Any Drink starting from 745 Birr', highlight: 'Save up to 150 Birr!' },
];

const ADMIN_PASSWORD = 'sarAdmin2025';

/* ===== STATE ===== */
let menuData  = JSON.parse(JSON.stringify(DEFAULT_MENU));
let hoursData = JSON.parse(JSON.stringify(DEFAULT_HOURS));
let promosData = JSON.parse(JSON.stringify(DEFAULT_PROMOS));
let pendingDelete = null;
let ordersUnsubscribe = null;

/* ===== FIRESTORE REFS ===== */
const menuRef   = () => db.doc('sar_data/menu');
const hoursRef  = () => db.doc('sar_data/hours');
const promosRef = () => db.doc('sar_data/promotions');
const ordersCol = () => db.collection('sar_orders');

/* ===== AUTH ===== */
function handleLogin(e) {
  e.preventDefault();
  const pw = document.getElementById('password').value;
  if (pw === ADMIN_PASSWORD) {
    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('adminLayout').classList.add('visible');
    initAdmin();
  } else {
    document.getElementById('loginError').classList.add('show');
    document.getElementById('password').value = '';
  }
}

function handleLogout() {
  if (ordersUnsubscribe) { ordersUnsubscribe(); ordersUnsubscribe = null; }
  document.getElementById('adminLayout').classList.remove('visible');
  document.getElementById('loginScreen').style.display = 'flex';
  document.getElementById('password').value = '';
  document.getElementById('loginError').classList.remove('show');
}

/* ===== PANEL NAVIGATION ===== */
function showPanel(name, el) {
  document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  document.getElementById('panel-' + name).classList.add('active');
  if (el) el.classList.add('active');
  const titles = { dashboard: 'Dashboard', menu: 'Menu Manager', promotions: 'Promotions', hours: 'Opening Hours', orders: 'Orders Log' };
  document.getElementById('topbarTitle').textContent = titles[name] || 'Dashboard';
}

/* ===== TOAST ===== */
function toast(msg) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.classList.add('show');
  setTimeout(() => el.classList.remove('show'), 3000);
}

/* ===== INIT — load all data from Firestore, seed defaults if first run ===== */
async function initAdmin() {
  try {
    // Load menu
    const menuSnap = await menuRef().get();
    if (menuSnap.exists) {
      menuData = menuSnap.data();
    } else {
      await menuRef().set(DEFAULT_MENU);
      menuData = JSON.parse(JSON.stringify(DEFAULT_MENU));
    }

    // Load hours
    const hoursSnap = await hoursRef().get();
    if (hoursSnap.exists) {
      hoursData = hoursSnap.data().schedule;
    } else {
      await hoursRef().set({ schedule: DEFAULT_HOURS });
      hoursData = JSON.parse(JSON.stringify(DEFAULT_HOURS));
    }

    // Load promotions
    const promosSnap = await promosRef().get();
    if (promosSnap.exists) {
      promosData = promosSnap.data().items;
    } else {
      await promosRef().set({ items: DEFAULT_PROMOS });
      promosData = JSON.parse(JSON.stringify(DEFAULT_PROMOS));
    }
  } catch (err) {
    console.warn('Firestore not configured — running in offline mode.', err);
  }

  renderMenuTables();
  renderHoursAdmin();
  renderPromos();
  subscribeToOrders();
  updateStats();
  renderTodaySpecials();
}

/* ===== STATS ===== */
function updateStats() {
  document.getElementById('stat-burgers').textContent = menuData.burgers.length;
  document.getElementById('stat-sandwiches').textContent = menuData.sandwiches.length;
  const drinkCount = menuData.cocktails.length + menuData.coffee.length + menuData.softdrinks.length;
  document.getElementById('stat-drinks').textContent = drinkCount;
  document.getElementById('stat-promos').textContent = promosData.length;
}

function renderTodaySpecials() {
  const container = document.getElementById('today-specials-list');
  if (!promosData.length) {
    container.innerHTML = '<p style="color:var(--text-muted);font-size:0.9rem;">No active promotions.</p>';
    return;
  }
  container.innerHTML = promosData.map(p => `
    <div class="promo-card">
      <div><h4>${p.title}</h4><p>${p.desc}</p></div>
      ${p.highlight ? `<span class="category-tag">${p.highlight}</span>` : ''}
    </div>`).join('');
}

/* ===== MENU TABLES ===== */
function renderMenuTables() {
  renderCategoryTable('burgers', 'burgers-table-body', 'burger-count-badge');
  renderCategoryTable('sandwiches', 'sandwiches-table-body', 'sandwich-count-badge');
  renderDrinksTable();
}

function renderCategoryTable(category, tbodyId, badgeId) {
  const items = menuData[category];
  if (badgeId) document.getElementById(badgeId).textContent = `${items.length} items`;
  document.getElementById(tbodyId).innerHTML = items.map((item, i) => `
    <tr>
      <td><strong>${item.name}</strong>${item.desc ? `<br><small style="color:var(--text-muted)">${item.desc.substring(0,60)}…</small>` : ''}</td>
      <td><strong>${item.price}</strong> Birr</td>
      <td><span class="avail-badge ${item.available ? 'yes' : 'no'}">${item.available ? '✓ Available' : '✗ Unavailable'}</span></td>
      <td>
        <button class="btn-edit" onclick="editMenuItem('${category}',${i})">Edit</button>
        <button class="btn-danger" onclick="openDeleteModal('${category}',${i})">Delete</button>
      </td>
    </tr>`).join('');
}

function renderDrinksTable() {
  const drinkCategories = [
    { key: 'cocktails', label: 'Cocktail' },
    { key: 'coffee',    label: 'Cold Coffee' },
    { key: 'softdrinks',label: 'Soft Drink' },
  ];
  let rows = '';
  drinkCategories.forEach(({ key, label }) => {
    menuData[key].forEach((item, i) => {
      rows += `
        <tr>
          <td><strong>${item.name}</strong></td>
          <td><span class="category-tag">${label}</span></td>
          <td><strong>${item.price}</strong> Birr</td>
          <td>
            <button class="btn-edit" onclick="editMenuItem('${key}',${i})">Edit</button>
            <button class="btn-danger" onclick="openDeleteModal('${key}',${i})">Delete</button>
          </td>
        </tr>`;
    });
  });
  document.getElementById('drinks-table-body').innerHTML = rows;
}

/* ===== MENU FORM ===== */
function editMenuItem(category, index) {
  const item = menuData[category][index];
  document.getElementById('edit-index').value = index;
  document.getElementById('edit-category').value = category;
  document.getElementById('item-name').value = item.name;
  document.getElementById('item-price').value = item.price;
  document.getElementById('item-category').value = category;
  document.getElementById('item-desc').value = item.desc || '';
  document.getElementById('item-available').checked = item.available !== false;
  document.getElementById('menu-form-title').textContent = 'Edit Menu Item';
  document.getElementById('panel-menu').scrollIntoView({ behavior: 'smooth' });
}

function clearMenuForm() {
  ['edit-index','edit-category','item-name','item-price','item-desc'].forEach(id => {
    document.getElementById(id).value = '';
  });
  document.getElementById('item-category').value = 'burgers';
  document.getElementById('item-available').checked = true;
  document.getElementById('menu-form-title').textContent = 'Add New Menu Item';
}

async function saveMenuItem() {
  const name      = document.getElementById('item-name').value.trim();
  const price     = parseInt(document.getElementById('item-price').value);
  const category  = document.getElementById('item-category').value;
  const desc      = document.getElementById('item-desc').value.trim();
  const available = document.getElementById('item-available').checked;
  const editIndex = document.getElementById('edit-index').value;
  const editCat   = document.getElementById('edit-category').value;

  if (!name || !price || isNaN(price)) { toast('⚠️ Name and price are required.'); return; }

  const item = { name, price, desc, available };

  if (editIndex !== '' && editCat) {
    menuData[editCat][parseInt(editIndex)] = item;
  } else {
    menuData[category] = menuData[category] || [];
    menuData[category].push(item);
  }

  try {
    await menuRef().set(menuData);
    toast('✅ ' + (editIndex !== '' ? 'Item updated!' : 'Item added!'));
  } catch {
    toast('⚠️ Saved locally — Firestore not connected.');
  }

  renderMenuTables();
  updateStats();
  clearMenuForm();
}

/* ===== DELETE ===== */
function openDeleteModal(category, index) {
  pendingDelete = { category, index };
  document.getElementById('deleteModal').classList.add('open');
}

function closeDeleteModal() {
  pendingDelete = null;
  document.getElementById('deleteModal').classList.remove('open');
}

async function confirmDelete() {
  if (!pendingDelete) return;
  menuData[pendingDelete.category].splice(pendingDelete.index, 1);
  try {
    await menuRef().set(menuData);
  } catch { /* offline */ }
  renderMenuTables();
  updateStats();
  closeDeleteModal();
  toast('🗑️ Item deleted.');
}

/* ===== HOURS ===== */
function renderHoursAdmin() {
  document.getElementById('hours-admin-grid').innerHTML = hoursData.map((h, i) => `
    <div class="hours-admin-row">
      <span class="day-label">${h.day}</span>
      <input type="time" value="${h.open}" id="open-${i}" />
      <input type="time" value="${h.close}" id="close-${i}" />
      <label class="toggle-open">
        <input type="checkbox" id="isopen-${i}" ${h.isOpen ? 'checked' : ''} /> Open
      </label>
    </div>`).join('');
}

async function saveHours() {
  hoursData = hoursData.map((h, i) => ({
    ...h,
    open:   document.getElementById(`open-${i}`).value,
    close:  document.getElementById(`close-${i}`).value,
    isOpen: document.getElementById(`isopen-${i}`).checked,
  }));
  try {
    await hoursRef().set({ schedule: hoursData });
    toast('✅ Hours saved!');
  } catch {
    toast('⚠️ Saved locally — Firestore not connected.');
  }
}

/* ===== PROMOTIONS ===== */
function renderPromos() {
  const container = document.getElementById('promos-list');
  container.innerHTML = promosData.length
    ? promosData.map((p, i) => `
        <div class="promo-card">
          <div>
            <h4>${p.title}</h4>
            <p>${p.desc}</p>
            ${p.highlight ? `<small style="color:var(--green-mid);font-weight:600">${p.highlight}</small>` : ''}
          </div>
          <div class="promo-actions">
            <button class="btn-danger" onclick="deletePromo(${i})">Delete</button>
          </div>
        </div>`).join('')
    : '<p style="color:var(--text-muted);font-size:0.9rem;text-align:center;padding:1rem 0;">No promotions yet.</p>';
  updateStats();
  renderTodaySpecials();
}

async function savePromo() {
  const title     = document.getElementById('promo-title').value.trim();
  const desc      = document.getElementById('promo-desc').value.trim();
  const highlight = document.getElementById('promo-highlight').value.trim();
  if (!title) { toast('⚠️ Promotion title is required.'); return; }

  promosData.push({ title, desc, highlight });
  try {
    await promosRef().set({ items: promosData });
    toast('✅ Promotion added!');
  } catch {
    toast('⚠️ Saved locally — Firestore not connected.');
  }

  ['promo-title','promo-desc','promo-highlight'].forEach(id => document.getElementById(id).value = '');
  renderPromos();
}

async function deletePromo(i) {
  promosData.splice(i, 1);
  try {
    await promosRef().set({ items: promosData });
  } catch { /* offline */ }
  renderPromos();
  toast('🗑️ Promotion deleted.');
}

/* ===== ORDERS — real-time Firestore listener ===== */
function subscribeToOrders() {
  if (ordersUnsubscribe) ordersUnsubscribe();
  try {
    ordersUnsubscribe = ordersCol()
      .orderBy('timestamp', 'desc')
      .limit(50)
      .onSnapshot(snap => {
        const orders = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        renderOrders(orders);
      }, () => renderOrders([]));
  } catch {
    renderOrders([]);
  }
}

async function logOrder() {
  const name   = document.getElementById('order-name').value.trim();
  const item   = document.getElementById('order-item').value.trim();
  const amount = document.getElementById('order-amount').value;
  const status = document.getElementById('order-status').value;
  if (!item) { toast('⚠️ Item name is required.'); return; }

  const order = {
    name: name || 'Walk-in',
    item,
    amount: amount ? parseInt(amount) : null,
    status,
    timestamp: firebase.firestore.FieldValue.serverTimestamp(),
    displayTime: new Date().toLocaleTimeString('en-ET', { hour: '2-digit', minute: '2-digit' }),
    displayDate: new Date().toLocaleDateString('en-ET'),
  };

  try {
    await ordersCol().add(order);
    toast('✅ Order logged!');
  } catch {
    toast('⚠️ Could not save — Firestore not connected.');
    return;
  }

  ['order-name','order-item','order-amount'].forEach(id => document.getElementById(id).value = '');
}

function renderOrders(orders) {
  const container = document.getElementById('orders-list');
  if (!orders.length) {
    container.innerHTML = '<p style="color:var(--text-muted);font-size:0.9rem;text-align:center;padding:1rem 0;">No orders logged yet.</p>';
    return;
  }
  container.innerHTML = orders.map((o, i) => `
    <div class="order-log-item">
      <div class="order-num">#${orders.length - i}</div>
      <div class="order-details">
        <div class="order-item-name">${o.item}${o.amount ? ` — ${o.amount} Birr` : ''}</div>
        <div class="order-time">${o.name} · ${o.displayDate || ''} ${o.displayTime || ''}</div>
      </div>
      <span class="order-status ${o.status}">${o.status === 'done' ? '✓ Done' : '⏳ Pending'}</span>
    </div>`).join('');
}

async function clearOrders() {
  if (!confirm('Clear all order logs? This cannot be undone.')) return;
  try {
    const snap = await ordersCol().get();
    const batch = db.batch();
    snap.docs.forEach(d => batch.delete(d.ref));
    await batch.commit();
    toast('🗑️ Orders cleared.');
  } catch {
    toast('⚠️ Could not clear — Firestore not connected.');
  }
}

/* ===== MODAL CLOSE ON OVERLAY CLICK ===== */
document.getElementById('deleteModal').addEventListener('click', function(e) {
  if (e.target === this) closeDeleteModal();
});
