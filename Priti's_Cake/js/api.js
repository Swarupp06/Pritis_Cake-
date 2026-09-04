const API_BASE_URL = 'http://127.0.0.1:8000/api';

window.API = {
  getToken: function() {
    // For dev/testing admin JWT, we look for 'pc_jwt_token' in localStorage
    return localStorage.getItem('pc_jwt_token');
  },
  
  getProducts: async function() {
    const res = await fetch(`${API_BASE_URL}/products`);
    if (!res.ok) throw new Error('Failed to fetch products');
    const data = await res.json();
    return data.map(this.mapToFrontendProduct);
  },

  getProduct: async function(id) {
    const res = await fetch(`${API_BASE_URL}/products/${id}`);
    if (!res.ok) throw new Error('Product not found');
    const data = await res.json();
    return this.mapToFrontendProduct(data);
  },

  createProduct: async function(product) {
    const token = this.getToken();
    const res = await fetch(`${API_BASE_URL}/products`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      },
      body: JSON.stringify(this.mapToBackendProduct(product))
    });
    if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Failed to create product');
    }
    const data = await res.json();
    return this.mapToFrontendProduct(data);
  },

  updateProduct: async function(id, product) {
    const token = this.getToken();
    const res = await fetch(`${API_BASE_URL}/products/${id}`, {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      },
      body: JSON.stringify(this.mapToBackendProduct(product))
    });
    if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Failed to update product');
    }
    const data = await res.json();
    return this.mapToFrontendProduct(data);
  },

  deleteProduct: async function(id) {
    const token = this.getToken();
    const res = await fetch(`${API_BASE_URL}/products/${id}`, {
      method: 'DELETE',
      headers: { ...(token ? { 'Authorization': `Bearer ${token}` } : {}) }
    });
    if (!res.ok) throw new Error('Failed to delete product');
    return true;
  },

  // Auth
  register: async function(name, email, phone, password) {
    const res = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, phone, password })
    });
    if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Failed to register');
    }
    return await res.json();
  },

  login: async function(email, password) {
    const res = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ username: email, password: password })
    });
    if (!res.ok) throw new Error('Invalid credentials');
    const data = await res.json();
    localStorage.setItem('pc_jwt_token', data.access_token);
    return data;
  },
  
  getProfile: async function() {
    const token = this.getToken();
    if (!token) return null;
    const res = await fetch(`${API_BASE_URL}/auth/me`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) return null;
    return await res.json();
  },

  // Cart
  getCart: async function() {
    const token = this.getToken();
    if (!token) return { items: [], total_price: 0 };
    const res = await fetch(`${API_BASE_URL}/cart`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) throw new Error('Failed to fetch cart');
    return await res.json();
  },

  addToCart: async function(productId, quantity = 1) {
    const token = this.getToken();
    const res = await fetch(`${API_BASE_URL}/cart/items`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ product_id: productId, quantity })
    });
    if (!res.ok) throw new Error('Failed to add to cart');
    return await res.json();
  },

  updateCartItem: async function(productId, quantity) {
    const token = this.getToken();
    const res = await fetch(`${API_BASE_URL}/cart/items/${productId}`, {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ quantity })
    });
    if (!res.ok) throw new Error('Failed to update cart item');
    return await res.json();
  },

  removeCartItem: async function(productId) {
    const token = this.getToken();
    const res = await fetch(`${API_BASE_URL}/cart/items/${productId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) throw new Error('Failed to remove item');
    return true;
  },

  // Orders
  createOrder: async function() {
    const token = this.getToken();
    const res = await fetch(`${API_BASE_URL}/orders`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Failed to place order');
    }
    return await res.json();
  },

  getOrders: async function() {
    const token = this.getToken();
    const res = await fetch(`${API_BASE_URL}/orders`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) throw new Error('Failed to fetch orders');
    return await res.json();
  },
  
  updateOrderStatus: async function(orderId, status) {
    const token = this.getToken();
    const res = await fetch(`${API_BASE_URL}/orders/${orderId}/status`, {
      method: 'PATCH',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ status })
    });
    if (!res.ok) throw new Error('Failed to update order status');
    return await res.json();
  },

  // Map backend schema to frontend fields
  mapToFrontendProduct: function(backendProduct) {
    return {
      id: backendProduct.id,
      name: backendProduct.name,
      category: backendProduct.category || '',
      price: backendProduct.price,
      desc: backendProduct.description || '',
      weight: backendProduct.weight || '',
      serves: backendProduct.serves || '',
      time: backendProduct.prep_time || '',
      tag: backendProduct.tag || '',
      image: backendProduct.image_url?.length > 10 ? backendProduct.image_url : null,
      emoji: backendProduct.image_url?.length <= 10 ? backendProduct.image_url : null,
      rating: 4.8, // Fallbacks since we didn't add rating to API
      reviews: 100
    };
  },

  // Map frontend form data to backend schema
  mapToBackendProduct: function(frontendProduct) {
    return {
      name: frontendProduct.name,
      category: frontendProduct.category,
      price: parseFloat(frontendProduct.price) || 0,
      description: frontendProduct.desc,
      weight: frontendProduct.weight,
      serves: frontendProduct.serves,
      prep_time: frontendProduct.time,
      tag: frontendProduct.tag,
      image_url: frontendProduct.image || frontendProduct.emoji || ''
    };
  }
};
