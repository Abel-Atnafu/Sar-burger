/* ===== FALLBACK MENU (shown if Firebase not yet configured) ===== */
const DEFAULT_MENU = {
  burgers: [
    { name: 'The Naked Smash', price: 600, desc: 'Freshly smashed beef patty, NO CHEESE, SAR sauce on a toasted potato bun.', available: true },
    { name: 'Smash Burger', price: 690, desc: 'Freshly smashed beef patty, Cheddar Cheese, SAR sauce on a toasted potato bun.', available: true },
    { name: 'Onion Smash Burger', price: 690, desc: 'Freshly smashed beef patty with thinly sliced onions pressed into the meat as it cooks crispy, topped with Cheddar cheese and SAR sauce.', available: true },
    { name: 'BBQ Smash Burger', price: 790, desc: 'Freshly smashed beef patty, Cheddar cheese, SAR BBQ sauce on a toasted potato bun.', available: true },
    { name: 'Butter Smash Burger', price: 790, desc: 'Freshly smashed beef patty seared in butter for extra crispiness and flavor. Topped with Cheddar cheese and SAR sauce on a toasted potato bun.', available: true },
    { name: 'Thick Beef Burger', price: 790, desc: 'A thick beef patty with Cheddar Cheese and SAR sauce on a toasted potato bun.', available: true },
  ],
  sandwiches: [
    { name: 'Philly Cheese Steak', price: 850, desc: 'Tender thin-sliced Prime cut beef, grilled with onions and smothered in melted cheese, all served on a toasted hoagie roll.', available: true },
    { name: 'Chicken Philly Cheese Steak', price: 890, desc: 'Grilled seasoned chicken breast, grilled with onions, melted cheese on a toasted hoagie roll.', available: true },
    { name: 'Tuna Salad Sandwich', price: 650, desc: 'Fresh, flaky tuna mixed with crisp celery and a hint of mustard. Served on a baguette with salad and tomato. [Add mayo and cheese on request]', available: true },
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

/* ===== RENDER HELPERS ===== */
function renderMenuCard(item) {
  if (item.available === false) return '';
  const msg = encodeURIComponent(`Hi SAR Burger! I'd like to order a ${item.name} 🍔`);
  return `
    <div class="menu-card">
      <div class="menu-card-header">
        <h3>${item.name}</h3>
        <span class="price-badge">${item.price} Birr</span>
      </div>
      ${item.desc ? `<p>${item.desc}</p>` : ''}
      <a href="https://wa.me/251000000000?text=${msg}" target="_blank" class="menu-order-btn">Order this ↗</a>
    </div>`;
}

function renderDrinkCard(item) {
  if (item.available === false) return '';
  return `
    <div class="drink-card">
      <span class="drink-name">${item.name}</span>
      <span class="drink-price">${item.price} Birr</span>
    </div>`;
}

function applyMenu(data) {
  document.getElementById('burgers-grid').innerHTML =
    data.burgers.map(renderMenuCard).join('') || '<p style="color:var(--text-muted);text-align:center">No items available.</p>';

  document.getElementById('sandwiches-grid').innerHTML =
    data.sandwiches.map(renderMenuCard).join('') || '<p style="color:var(--text-muted);text-align:center">No items available.</p>';

  document.getElementById('drinks-container').innerHTML = `
    <h3 class="drinks-section-title">🍹 Alcohol-Free Cocktails</h3>
    <div class="drinks-grid">${data.cocktails.map(renderDrinkCard).join('')}</div>
    <h3 class="drinks-section-title">☕ Cold Coffee Drinks</h3>
    <div class="drinks-grid">${data.coffee.map(renderDrinkCard).join('')}</div>
    <h3 class="drinks-section-title">🥤 Soft Drinks</h3>
    <div class="drinks-grid">${data.softdrinks.map(renderDrinkCard).join('')}</div>
  `;
}

/* ===== FIREBASE LISTENER — live menu updates ===== */
function subscribeToMenu() {
  try {
    db.doc('sar_data/menu').onSnapshot(
      snap => {
        if (snap.exists) {
          applyMenu(snap.data());
        } else {
          applyMenu(DEFAULT_MENU);
        }
      },
      () => applyMenu(DEFAULT_MENU) // Firestore not configured yet — use defaults
    );
  } catch (e) {
    applyMenu(DEFAULT_MENU);
  }
}

/* ===== TAB SWITCHING ===== */
function switchTab(tab, btn) {
  document.querySelectorAll('.menu-panel').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('tab-' + tab).classList.add('active');
  btn.classList.add('active');
}

/* ===== MOBILE NAV ===== */
function toggleMenu() {
  document.getElementById('navMobile').classList.toggle('open');
}

/* ===== HIGHLIGHT TODAY'S HOURS ROW ===== */
function highlightToday() {
  const days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  const today = days[new Date().getDay()];
  document.querySelectorAll('.hours-row').forEach(row => {
    row.classList.remove('today');
    if (row.querySelector('.hours-day')?.textContent === today) {
      row.classList.add('today');
    }
  });
}

/* ===== OPEN NOW BADGE ===== */
function updateOpenStatus() {
  const badge = document.querySelector('.open-badge');
  if (!badge) return;
  const hour = new Date().getHours();
  const isOpen = hour >= 10 && hour < 23;
  badge.textContent = isOpen ? '🟢 Open Now' : '🔴 Currently Closed';
  badge.style.background = isOpen ? 'var(--green-pale)' : '#ffe5e5';
  badge.style.color = isOpen ? 'var(--green-dark)' : '#c0392b';
}

/* ===== NAVBAR SHADOW ON SCROLL ===== */
window.addEventListener('scroll', () => {
  document.querySelector('.navbar').style.boxShadow = window.scrollY > 20
    ? '0 4px 30px rgba(0,0,0,0.3)'
    : '0 2px 20px rgba(0,0,0,0.2)';
});

/* ===== INIT ===== */
document.addEventListener('DOMContentLoaded', () => {
  subscribeToMenu();
  highlightToday();
  updateOpenStatus();
});
