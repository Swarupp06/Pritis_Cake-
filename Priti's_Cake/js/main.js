// ===== DATA STORE =====
const DB = {
  cakes: [],
  users: JSON.parse(localStorage.getItem('pc_users') || '[]'),
  orders: JSON.parse(localStorage.getItem('pc_orders') || '[]'),
  cart: JSON.parse(localStorage.getItem('pc_cart') || '[]'),
  currentUser: JSON.parse(localStorage.getItem('pc_current_user') || 'null')
};

// Admin credentials
const ADMIN = { email: 'admin@priticake.com', password: 'admin123', name: 'Admin' };

// ===== SAVE TO STORAGE =====
function saveData() {
  localStorage.setItem('pc_users', JSON.stringify(DB.users));
  localStorage.setItem('pc_orders', JSON.stringify(DB.orders));
  localStorage.setItem('pc_cart', JSON.stringify(DB.cart));
  localStorage.setItem('pc_current_user', JSON.stringify(DB.currentUser));
  
}



// ===== IMAGE HELPERS =====
// Returns the inner HTML for a cake's visual (real image or emoji fallback)
function cakeMedia(cake) {
  if (cake && cake.image) return `<img src="${cake.image}" alt="${cake.name}">`;
  return (cake && cake.emoji) ? cake.emoji : '🎂';
}

// Reads an uploaded image file and returns a compressed data URL (max dim 800px, JPEG)
function resizeImageFile(file, cb) {
  const reader = new FileReader();
  reader.onload = e => {
    const img = new Image();
    img.onload = () => {
      let { width, height } = img;
      const maxDim = 800;
      if (width > maxDim || height > maxDim) {
        const ratio = Math.min(maxDim / width, maxDim / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }
      const canvas = document.createElement('canvas');
      canvas.width = width; canvas.height = height;
      canvas.getContext('2d').drawImage(img, 0, 0, width, height);
      try { cb(canvas.toDataURL('image/jpeg', 0.8)); }
      catch (err) { cb(e.target.result); }
    };
    img.onerror = () => cb(e.target.result);
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

// ===== AUTH =====
async function login(email, password) {
  try {
    await window.API.login(email, password);
    const profile = await window.API.getProfile();
    DB.currentUser = profile;
    await fetchCartFromAPI();
    saveData();
    return { success: true, role: profile.role };
  } catch(e) {
    return { success: false, msg: e.message };
  }
}

async function register(name, email, phone, password) {
  try {
    await window.API.register(name, email, phone, password);
    // After successful register, login the user automatically
    return await login(email, password);
  } catch(e) {
    return { success: false, msg: e.message };
  }
}

function logout() {
  DB.currentUser = null;
  saveData();
  window.location.href = 'login.html';
}

function isLoggedIn() { return DB.currentUser !== null; }
function isAdmin() { return DB.currentUser && DB.currentUser.role === 'admin'; }

// ===== CART =====
async function fetchCartFromAPI() {
  if (!isLoggedIn()) return;
  try {
    const data = await window.API.getCart();
    DB.cart = data.items.map(i => ({
      cakeId: i.product.id,
      qty: i.quantity,
      name: i.product.name,
      price: i.product.price,
      emoji: i.product.image_url?.length <= 10 ? i.product.image_url : '??',
      image: i.product.image_url?.length > 10 ? i.product.image_url : ''
    }));
    updateCartUI();
  } catch(e) {
    console.error("Failed to load cart", e);
  }
}

async function addToCart(cakeId, qty = 1) {
  if (!isLoggedIn()) { showToast('Please login to add items to cart', 'error'); setTimeout(() => window.location.href = 'login.html', 1500); return; }
  try {
    await window.API.addToCart(cakeId, qty);
    await fetchCartFromAPI();
    showToast('Item added to cart! 🍰', 'success');
  } catch(e) {
    showToast(e.message, 'error');
  }
}

async function removeFromCart(cakeId) {
  try {
    await window.API.removeCartItem(cakeId);
    await fetchCartFromAPI();
  } catch(e) {
    showToast(e.message, 'error');
  }
}

function getCartTotal() { return DB.cart.reduce((sum, i) => sum + (i.price * i.qty), 0); }
function getCartCount() { return DB.cart.reduce((sum, i) => sum + i.qty, 0); }

function updateCartUI() {
  const badge = document.getElementById('cartBadge');
  const count = getCartCount();
  if (badge) { badge.textContent = count; badge.style.display = count > 0 ? 'flex' : 'none'; }
  renderCartItems();
}

function renderCartItems() {
  const container = document.getElementById('cartItems');
  const totalEl = document.getElementById('cartTotal');
  if (!container) return;
  if (DB.cart.length === 0) {
    container.innerHTML = `<div class="cart-empty"><div class="icon">🛒</div><p>Your cart is empty</p></div>`;
    if (totalEl) totalEl.style.display = 'none';
    return;
  }
  if (totalEl) totalEl.style.display = 'block';
  container.innerHTML = DB.cart.map(item => `
    <div class="cart-item">
      <div class="cart-item-img">${item.image ? `<img src="${item.image}" alt="${item.name}">` : item.emoji}</div>
      <div class="cart-item-info">
        <h4>${item.name}</h4>
        <div class="price">₹${item.price} × ${item.qty}</div>
        <div style="font-weight:700;color:#e91e8c">₹${item.price * item.qty}</div>
      </div>
      <button class="cart-item-remove" onclick="removeFromCart(${item.cakeId})">✕</button>
    </div>
  `).join('');
  const subtotal = getCartTotal();
  const delivery = subtotal > 0 ? 50 : 0;
  document.getElementById('cartSubtotal').textContent = `₹${subtotal}`;
  document.getElementById('cartDelivery').textContent = `₹${delivery}`;
  document.getElementById('cartGrandTotal').textContent = `₹${subtotal + delivery}`;
}

function toggleCart() {
  const sidebar = document.getElementById('cartSidebar');
  if (sidebar) sidebar.classList.toggle('open');
}

async function placeOrder() {
  if (DB.cart.length === 0) { showToast('Cart is empty!', 'error'); return; }
  try {
    const submitBtn = document.querySelector('.cart-total .btn-primary');
    const oldText = submitBtn.textContent;
    submitBtn.textContent = 'Placing Order...';
    submitBtn.disabled = true;

    await window.API.createOrder();
    await fetchCartFromAPI(); // Will be empty
    
    toggleCart();
    showToast('Order placed successfully! 🎂', 'success');
  } catch(e) {
    showToast(e.message, 'error');
  } finally {
    const submitBtn = document.querySelector('.cart-total .btn-primary');
    if (submitBtn) {
      submitBtn.textContent = 'Place Order';
      submitBtn.disabled = false;
    }
  }
}

// ===== TOAST =====
function showToast(msg, type = '') {
  let toast = document.getElementById('toast');
  if (!toast) { toast = document.createElement('div'); toast.id = 'toast'; toast.className = 'toast'; document.body.appendChild(toast); }
  toast.textContent = msg;
  toast.className = `toast ${type}`;
  setTimeout(() => toast.classList.add('show'), 10);
  setTimeout(() => toast.classList.remove('show'), 3000);
}

// ===== NAV AUTH BUTTONS =====
function updateNavAuth() {
  const navBtns = document.getElementById('navBtns');
  if (!navBtns) return;
  if (isLoggedIn()) {
    navBtns.innerHTML = `
      <div class="cart-btn-wrap">
        <button class="btn btn-outline" onclick="toggleCart()">🛒 Cart</button>
        <span class="cart-badge" id="cartBadge" style="display:none">0</span>
      </div>
      <a href="${isAdmin() ? 'admin-dashboard.html' : 'client-dashboard.html'}" class="btn btn-primary">Dashboard</a>
    `;
  } else {
    navBtns.innerHTML = `
      <a href="login.html" class="btn btn-outline">Login</a>
      <a href="register.html" class="btn btn-primary">Register</a>
    `;
  }
  updateCartUI();
}

// ===== HAMBURGER =====
function toggleMobileNav() {
  const nav = document.getElementById('navLinks');
  if (nav) nav.classList.toggle('open');
}

// ===== INIT =====
document.addEventListener('DOMContentLoaded', () => {
  updateNavAuth();
  const hamburger = document.getElementById('hamburger');
  if (hamburger) hamburger.addEventListener('click', toggleMobileNav);
});

// ===== LOAD API CAKES =====
window.cakesLoaded = (async function() {
  try {
    DB.cakes = await window.API.getProducts();
    if (typeof fetchCartFromAPI === 'function') await fetchCartFromAPI();
  } catch (e) {
    console.error("Failed to load cakes from API:", e);
    DB.cakes = [];
    if (typeof showToast === 'function') {
      showToast("Unable to load cakes. Please try again.", "error");
    }
  }
})();




