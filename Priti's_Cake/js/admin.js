document.addEventListener('DOMContentLoaded', async () => {
  await window.cakesLoaded;
  // Auth check
  if (!isAdmin()) { window.location.href = 'login.html'; return; }

  document.getElementById('adminName').textContent = DB.currentUser.name;
  loadDashboard();
  showSection('dashboard');
});

function showSection(id) {
  document.querySelectorAll('.dash-section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.sidebar-link').forEach(l => l.classList.remove('active'));
  const sec = document.getElementById('sec-' + id);
  const link = document.getElementById('link-' + id);
  if (sec) sec.classList.add('active');
  if (link) link.classList.add('active');
  document.getElementById('pageTitle').textContent = {
    dashboard: 'Dashboard Overview', cakes: 'Manage Cakes',
    orders: 'Manage Orders', customers: 'Customers', settings: 'Settings'
  }[id] || 'Dashboard';

  if (id === 'cakes') loadCakes();
  if (id === 'orders') loadOrders();
  if (id === 'customers') loadCustomers();
  if (id === 'dashboard') loadDashboard();
}

async function loadDashboard() {
  try {
    const orders = await window.API.getOrders();
    const revenue = orders.reduce((s, o) => s + o.total_amount, 0);
    document.getElementById('totalOrders').textContent = orders.length;
    document.getElementById('totalRevenue').textContent = '?' + revenue;
    
    // Recent orders
    const tbody = document.getElementById('recentOrdersBody');
    const recent = orders.slice(0, 5);
    tbody.innerHTML = recent.length ? recent.map(o => {
      const d = new Date(o.created_at);
      return `
      <tr>
        <td><strong>ORD${o.id}</strong></td>
        <td>User ${o.user_id}</td>
        <td>${o.items.map(i => i.product?.name).join(', ')}</td>
        <td><strong>?${o.total_amount}</strong></td>
        <td><span class="badge badge-${o.status.toLowerCase()}">${o.status}</span></td>
      </tr>
      `;
    }).join('') : '<tr><td colspan="5" style="text-align:center;color:#999;padding:30px">No orders yet</td></tr>';
  } catch(e) {
    console.error(e);
  }
}

// ===== CAKES =====
function loadCakes() {
  const grid = document.getElementById('cakesGrid');
  grid.innerHTML = DB.cakes.map(cake => `
    <div class="admin-cake-card">
      <div class="admin-cake-img">${cakeMedia(cake)}</div>
      <div class="admin-cake-info">
        <h4>${cake.name}</h4>
        <div style="font-size:0.8rem;color:#999;margin-bottom:5px">${cake.category}</div>
        <div class="price">₹${cake.price}</div>
        <div class="admin-cake-actions">
          <button class="btn-sm btn-edit" onclick="editCake(${cake.id})">✏️ Edit</button>
          <button class="btn-sm btn-delete" onclick="deleteCake(${cake.id})">🗑️ Delete</button>
        </div>
      </div>
    </div>
  `).join('');
}

function openAddCakeModal() {
  document.getElementById('cakeModalTitle').textContent = 'Add New Cake';
  const form = document.getElementById('cakeForm');
  if (form) form.reset();
  document.getElementById('editCakeId').value = '';
  ['cakeName', 'cakePrice', 'cakeEmoji', 'cakeWeight', 'cakeServes', 'cakeTime', 'cakeTag', 'cakeDesc'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
  document.getElementById('cakeCategory').value = 'Birthday';
  const fileInput = document.getElementById('cakeImage');
  if (fileInput) fileInput.value = '';
  const preview = document.getElementById('cakeImagePreview');
  if (preview) preview.style.display = 'none';
  openModal('cakeModal');
}

function editCake(id) {
  const cake = DB.cakes.find(c => c.id === id);
  if (!cake) return;
  document.getElementById('cakeModalTitle').textContent = 'Edit Cake';
  document.getElementById('editCakeId').value = id;
  document.getElementById('cakeName').value = cake.name;
  document.getElementById('cakeCategory').value = cake.category;
  document.getElementById('cakePrice').value = cake.price;
  document.getElementById('cakeEmoji').value = cake.emoji;
  document.getElementById('cakeWeight').value = cake.weight;
  document.getElementById('cakeServes').value = cake.serves;
  document.getElementById('cakeTime').value = cake.time;
  document.getElementById('cakeTag').value = cake.tag || '';
  document.getElementById('cakeDesc').value = cake.desc;
  const fileInput = document.getElementById('cakeImage');
  if (fileInput) fileInput.value = '';
  const preview = document.getElementById('cakeImagePreview');
  const previewImg = document.getElementById('cakeImagePreviewImg');
  if (preview && previewImg) {
    if (cake.image) { previewImg.src = cake.image; preview.style.display = 'block'; }
    else preview.style.display = 'none';
  }
  openModal('cakeModal');
}

async async function saveCake() {
  const id = document.getElementById('editCakeId').value;
  const data = {
    name: document.getElementById('cakeName').value.trim(),
    category: document.getElementById('cakeCategory').value,
    price: parseInt(document.getElementById('cakePrice').value),
    emoji: document.getElementById('cakeEmoji').value.trim() || '??',
    weight: document.getElementById('cakeWeight').value.trim(),
    serves: document.getElementById('cakeServes').value.trim(),
    time: document.getElementById('cakeTime').value.trim(),
    tag: document.getElementById('cakeTag').value.trim(),
    desc: document.getElementById('cakeDesc').value.trim(),
    rating: 4.5, reviews: 0
  };
  if (!data.name || !data.price) { showToast('Please fill required fields', 'error'); return; }
  const existing = id ? DB.cakes.find(c => c.id == id) : null;
  const fileInput = document.getElementById('cakeImage');
  
  const finish = async (image) => {
    data.image = image || (existing ? existing.image : '');
    const submitBtn = document.querySelector('#cakeModal .btn-primary');
    const oldText = submitBtn.textContent;
    submitBtn.textContent = 'Saving...';
    submitBtn.disabled = true;

    try {
      if (id) {
        const updated = await window.API.updateProduct(id, data);
        const idx = DB.cakes.findIndex(c => c.id == id);
        if (idx !== -1) DB.cakes[idx] = updated;
        showToast('Cake updated successfully! ??', 'success');
      } else {
        const created = await window.API.createProduct(data);
        DB.cakes.push(created);
        showToast('Cake added successfully! ??', 'success');
      }
      closeModal('cakeModal');
      loadCakes();
      loadDashboard();
    } catch (e) {
      showToast(e.message, 'error');
    } finally {
      submitBtn.textContent = oldText;
      submitBtn.disabled = false;
    }
  };

  if (fileInput && fileInput.files && fileInput.files[0]) {
    resizeImageFile(fileInput.files[0], finish);
  } else {
    finish(null);
  }
}

function deleteCake(id) {
  if (!confirm('Delete this cake?')) return;
  try {
    await window.API.deleteProduct(id);
    DB.cakes = DB.cakes.filter(c => c.id !== id);
    loadCakes();
    loadDashboard();
    showToast('Cake deleted', 'error');
  } catch (e) {
    showToast(e.message, 'error');
  }
}).join('') : '<tr><td colspan="6" style="text-align:center;color:#999;padding:30px">No customers yet</td></tr>';
}

// ===== MODAL HELPERS =====
function openModal(id) { document.getElementById(id).classList.add('active'); }
function closeModal(id) { document.getElementById(id).classList.remove('active'); }

// ===== SIDEBAR TOGGLE =====
function toggleSidebar() {
  document.getElementById('dashSidebar').classList.toggle('open');
}



