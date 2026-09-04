// ===== DATA STORE =====
const DB = {
  cakes: [
    { id: 1, name: "Strawberry Dream", category: "Birthday", price: 850, emoji: "🍓", desc: "Layers of vanilla sponge with fresh strawberry cream and glazed strawberries on top.", rating: 4.9, reviews: 128, weight: "1 kg", time: "2-3 hrs", serves: "8-10", tag: "Bestseller" },
    { id: 2, name: "Chocolate Fudge", category: "Birthday", price: 950, emoji: "🍫", desc: "Rich dark chocolate cake with fudge frosting and chocolate ganache drizzle.", rating: 4.8, reviews: 95, weight: "1 kg", time: "2-3 hrs", serves: "8-10", tag: "Popular" },
    { id: 3, name: "Royal Wedding Cake", category: "Wedding", price: 4500, emoji: "💍", desc: "Elegant 3-tier white fondant cake with floral decorations, perfect for your special day.", rating: 5.0, reviews: 42, weight: "3 kg", time: "1-2 days", serves: "30-40", tag: "Premium" },
    { id: 4, name: "Mango Delight", category: "Seasonal", price: 780, emoji: "🥭", desc: "Fresh mango mousse cake with mango jelly layers and whipped cream.", rating: 4.7, reviews: 67, weight: "1 kg", time: "2-3 hrs", serves: "8-10", tag: "Seasonal" },
    { id: 5, name: "Red Velvet", category: "Birthday", price: 900, emoji: "❤️", desc: "Classic red velvet with cream cheese frosting, moist and velvety texture.", rating: 4.9, reviews: 112, weight: "1 kg", time: "2-3 hrs", serves: "8-10", tag: "Classic" },
    { id: 6, name: "Unicorn Fantasy", category: "Kids", price: 1200, emoji: "🦄", desc: "Colorful rainbow layers with unicorn horn decoration, kids absolutely love it!", rating: 4.8, reviews: 88, weight: "1.5 kg", time: "3-4 hrs", serves: "12-15", tag: "Kids Fav" },
    { id: 7, name: "Black Forest", category: "Birthday", price: 820, emoji: "🍒", desc: "German classic with chocolate sponge, whipped cream and cherries.", rating: 4.6, reviews: 74, weight: "1 kg", time: "2-3 hrs", serves: "8-10", tag: "" },
    { id: 8, name: "Butterscotch Bliss", category: "Anniversary", price: 880, emoji: "🧁", desc: "Soft butterscotch cake with caramel drizzle and crunchy praline topping.", rating: 4.7, reviews: 56, weight: "1 kg", time: "2-3 hrs", serves: "8-10", tag: "" },
    { id: 9, name: "Pineapple Fresh", category: "Birthday", price: 750, emoji: "🍍", desc: "Light pineapple sponge with fresh cream and pineapple chunks.", rating: 4.5, reviews: 49, weight: "1 kg", time: "2-3 hrs", serves: "8-10", tag: "" },
    { id: 10, name: "Custom Photo Cake", category: "Custom", price: 1500, emoji: "📸", desc: "Personalized cake with edible photo print. Send us your photo and we'll create magic!", rating: 4.9, reviews: 203, weight: "1.5 kg", time: "1 day", serves: "12-15", tag: "Custom" },
    { id: 11, name: "Blueberry Cheesecake", category: "Anniversary", price: 1100, emoji: "🫐", desc: "New York style cheesecake with fresh blueberry compote topping.", rating: 4.8, reviews: 61, weight: "1 kg", time: "4-5 hrs", serves: "8-10", tag: "" },
    { id: 12, name: "Truffle Royale", category: "Wedding", price: 2200, emoji: "🎂", desc: "Luxurious chocolate truffle cake with gold leaf decoration for premium occasions.", rating: 5.0, reviews: 38, weight: "2 kg", time: "1 day", serves: "20-25", tag: "Luxury" }
  ],
  users: JSON.parse(localStorage.getItem('pc_users') || '[]'),
  orders: JSON.parse(localStorage.getItem('pc_orders') || '[]'),
  cart: JSON.parse(localStorage.getItem('pc_cart') || '[]'),
  currentUser: JSON.parse(localStorage.getItem('pc_current_user') || 'null')
};

// Admin credentials removed

// ===== SAVE TO STORAGE =====
function saveData() {
  localStorage.setItem('pc_users', JSON.stringify(DB.users));
  localStorage.setItem('pc_orders', JSON.stringify(DB.orders));
  localStorage.setItem('pc_cart', JSON.stringify(DB.cart));
  localStorage.setItem('pc_current_user', JSON.stringify(DB.currentUser));
  localStorage.setItem('pc_cakes', JSON.stringify(DB.cakes));
}

// Load cakes from storage if admin modified them
const storedCakes = localStorage.getItem('pc_cakes');
if (storedCakes) DB.cakes = JSON.parse(storedCakes);

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
    const data = await api.post('/auth/login', { email, password });
    if (data && data.success) {
      localStorage.setItem('pc_token', data.token);
      
      const profileData = await api.get('/auth/profile');
      if (profileData && profileData.success) {
        localStorage.setItem('pc_current_user', JSON.stringify(profileData.data));
        DB.currentUser = profileData.data;
        return { success: true, role: profileData.data.role };
      }
    }
    return { success: false, msg: data.message || 'Invalid email or password' };
  } catch (error) {
    if (error.status === 401) {
      return { success: false, msg: 'Invalid email or password.' };
    }
    return { success: false, msg: error.message || 'Unable to connect to the server. Please try again.' };
  }
}

async function register(name, email, phone, password) {
  try {
    const data = await api.post('/auth/register', { name, email, password });
    if (data && data.success) {
      // Automatically login after successful registration
      return await login(email, password);
    }
    return { success: false, msg: data.message || 'Registration failed' };
  } catch (error) {
    if (error.status === 409 || (error.message && error.message.toLowerCase().includes('already exists'))) {
      return { success: false, msg: 'An account with this email already exists.' };
    }
    return { success: false, msg: error.message || 'Unable to connect to the server. Please try again.' };
  }
}

function logout() {
  DB.currentUser = null;
  localStorage.removeItem('pc_token');
  localStorage.removeItem('pc_current_user');
  // Optional: clear DB.cart if required, but prompt says "Do NOT clear unrelated application data such as product/cart data unless the current application explicitly requires it."
  saveData();
  window.location.href = 'login.html';
}

function isLoggedIn() { 
  return !!localStorage.getItem('pc_token');
}
function isAdmin() { 
  const apiAdmin = JSON.parse(localStorage.getItem('pc_admin') || 'null');
  const token = localStorage.getItem('pc_token');
  // Check backend provided role first, fallback to pc_admin
  const currentUser = JSON.parse(localStorage.getItem('pc_current_user') || 'null');
  if (currentUser && currentUser.role === 'admin') return true;
  return !!(token && apiAdmin && apiAdmin.role === 'admin');
}

async function hydrateSession() {
  const token = localStorage.getItem('pc_token');
  if (token) {
    try {
      const data = await api.get('/auth/profile');
      if (data && data.success) {
        localStorage.setItem('pc_current_user', JSON.stringify(data.data));
        DB.currentUser = data.data;
      }
    } catch (error) {
      if (error.status === 401) {
        // Invalid or expired token
        localStorage.removeItem('pc_token');
        localStorage.removeItem('pc_current_user');
        DB.currentUser = null;
      }
    }
  } else {
      localStorage.removeItem('pc_current_user');
      DB.currentUser = null;
  }
}

// ===== CART =====
function addToCart(cakeId, qty = 1) {
  if (!isLoggedIn()) { showToast('Please login to add items to cart', 'error'); setTimeout(() => window.location.href = 'login.html', 1500); return; }
  const cake = DB.cakes.find(c => c.id === cakeId);
  if (!cake) return;
  const existing = DB.cart.find(i => i.cakeId === cakeId);
  if (existing) existing.qty += qty;
  else DB.cart.push({ cakeId, qty, name: cake.name, price: cake.price, emoji: cake.emoji, image: cake.image || '' });
  saveData();
  updateCartUI();
  showToast(`${cake.name} added to cart! 🎂`, 'success');
}

function removeFromCart(cakeId) {
  DB.cart = DB.cart.filter(i => i.cakeId !== cakeId);
  saveData();
  updateCartUI();
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

function placeOrder() {
  if (DB.cart.length === 0) { showToast('Cart is empty!', 'error'); return; }
  const order = {
    id: 'ORD' + Date.now(),
    userId: DB.currentUser.id,
    userName: DB.currentUser.name,
    userEmail: DB.currentUser.email,
    items: [...DB.cart],
    total: getCartTotal() + 50,
    status: 'Pending',
    date: new Date().toLocaleDateString(),
    time: new Date().toLocaleTimeString()
  };
  DB.orders.push(order);
  DB.cart = [];
  saveData();
  updateCartUI();
  toggleCart();
  showToast('Order placed successfully! 🎉', 'success');
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
      <a href="login.html" class="btn btn-primary">Order Now</a>
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
document.addEventListener('DOMContentLoaded', async () => {
  await hydrateSession();
  updateNavAuth();
  const hamburger = document.getElementById('hamburger');
  if (hamburger) hamburger.addEventListener('click', toggleMobileNav);
});
