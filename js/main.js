/* ===== MENU DATA ===== */
const MENU = {
  burgers: [
    { name: 'The Naked Smash', price: 600, desc: 'Freshly smashed beef patty, NO CHEESE, SAR sauce on a toasted potato bun.' },
    { name: 'Smash Burger', price: 690, desc: 'Freshly smashed beef patty, Cheddar Cheese, SAR sauce on a toasted potato bun.' },
    { name: 'Onion Smash Burger', price: 690, desc: 'Freshly smashed beef patty with thinly sliced onions pressed into the meat as it cooks crispy, topped with Cheddar cheese and SAR sauce.' },
    { name: 'BBQ Smash Burger', price: 790, desc: 'Freshly smashed beef patty, Cheddar cheese, SAR BBQ sauce on a toasted potato bun.' },
    { name: 'Butter Smash Burger', price: 790, desc: 'Freshly smashed beef patty seared in butter for extra crispiness and flavor. Topped with Cheddar cheese and SAR sauce on a toasted potato bun.' },
    { name: 'Thick Beef Burger', price: 790, desc: 'A thick beef patty with Cheddar Cheese and SAR sauce on a toasted potato bun.' },
  ],
  sandwiches: [
    { name: 'Philly Cheese Steak', price: 850, desc: 'Tender thin-sliced Prime cut beef, grilled with onions and smothered in melted cheese, all served on a toasted hoagie roll.' },
    { name: 'Chicken Philly Cheese Steak', price: 890, desc: 'Grilled seasoned chicken breast, grilled with onions, melted cheese on a toasted hoagie roll.' },
    { name: 'Tuna Salad Sandwich', price: 650, desc: 'Fresh, flaky tuna mixed with crisp celery and a hint of mustard for tang. Served on a baguette with salad and tomato. [Add mayo and cheese on request]' },
  ],
  cocktails: [
    { name: 'Lemonade Breeze', price: 250 },
    { name: 'Cinnamon Cooler', price: 300 },
    { name: 'Ginger Delight', price: 290 },
    { name: "Rosemary's Secret", price: 290 },
    { name: 'Strawberry Sunset', price: 300 },
    { name: 'Thyme to Shine', price: 290 },
    { name: 'SAR Special', price: 350 },
  ],
  coffee: [
    { name: 'Ice Tea', price: 150 },
    { name: 'Ice Latte', price: 200 },
    { name: 'Ice Moca', price: 250 },
    { name: 'Ice Caramel', price: 250 },
    { name: 'Ice Tea Americano', price: 180 },
  ],
  softdrinks: [
    { name: 'Water', price: 95 },
    { name: 'Sprite', price: 95 },
    { name: 'Coca Cola', price: 95 },
    { name: 'Novida', price: 95 },
    { name: 'Ambo Water', price: 95 },
  ],
};

/* ===== RENDER MENU ===== */
function renderMenuCard(item) {
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
  return `
    <div class="drink-card">
      <span class="drink-name">${item.name}</span>
      <span class="drink-price">${item.price} Birr</span>
    </div>`;
}

function loadMenu() {
  // Try to load from admin localStorage first
  let menuData = MENU;
  try {
    const saved = localStorage.getItem('sarMenuData');
    if (saved) menuData = JSON.parse(saved);
  } catch (e) { /* use default */ }

  document.getElementById('burgers-grid').innerHTML = menuData.burgers.map(renderMenuCard).join('');
  document.getElementById('sandwiches-grid').innerHTML = menuData.sandwiches.map(renderMenuCard).join('');

  document.getElementById('drinks-container').innerHTML = `
    <h3 class="drinks-section-title">🍹 Alcohol-Free Cocktails</h3>
    <div class="drinks-grid">${menuData.cocktails.map(renderDrinkCard).join('')}</div>
    <h3 class="drinks-section-title">☕ Cold Coffee Drinks</h3>
    <div class="drinks-grid">${menuData.coffee.map(renderDrinkCard).join('')}</div>
    <h3 class="drinks-section-title">🥤 Soft Drinks</h3>
    <div class="drinks-grid">${menuData.softdrinks.map(renderDrinkCard).join('')}</div>
  `;
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

/* ===== HIGHLIGHT TODAY'S ROW ===== */
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
  const now = new Date();
  const hour = now.getHours();
  const isOpen = hour >= 10 && hour < 23;
  badge.textContent = isOpen ? '🟢 Open Now' : '🔴 Currently Closed';
  badge.style.background = isOpen ? 'var(--green-pale)' : '#ffe5e5';
  badge.style.color = isOpen ? 'var(--green-dark)' : '#c0392b';
}

/* ===== NAVBAR SHADOW ON SCROLL ===== */
window.addEventListener('scroll', () => {
  const navbar = document.querySelector('.navbar');
  navbar.style.boxShadow = window.scrollY > 20
    ? '0 4px 30px rgba(0,0,0,0.3)'
    : '0 2px 20px rgba(0,0,0,0.2)';
});

/* ===== INIT ===== */
document.addEventListener('DOMContentLoaded', () => {
  loadMenu();
  highlightToday();
  updateOpenStatus();
});
