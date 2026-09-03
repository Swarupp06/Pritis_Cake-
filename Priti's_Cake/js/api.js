const API_BASE_URL = 'http://127.0.0.1:8000/api';

window.API = {
  getToken: function() {
    // For dev/testing admin JWT, we look for 'pc_jwt_token' in localStorage
    return localStorage.getItem('pc_jwt_token');
  },
  
  getProducts: async function() {
    const res = await fetch(${API_BASE_URL}/products);
    if (!res.ok) throw new Error('Failed to fetch products');
    const data = await res.json();
    return data.map(this.mapToFrontendProduct);
  },

  getProduct: async function(id) {
    const res = await fetch(${API_BASE_URL}/products/);
    if (!res.ok) throw new Error('Product not found');
    const data = await res.json();
    return this.mapToFrontendProduct(data);
  },

  createProduct: async function(product) {
    const token = this.getToken();
    const res = await fetch(${API_BASE_URL}/products, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': Bearer  } : {})
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
    const res = await fetch(${API_BASE_URL}/products/, {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': Bearer  } : {})
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
    const res = await fetch(${API_BASE_URL}/products/, {
      method: 'DELETE',
      headers: {
        ...(token ? { 'Authorization': Bearer  } : {})
      }
    });
    if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Failed to delete product');
    }
    return true;
  },

  // Map backend schema to frontend fields
  mapToFrontendProduct: function(backendProduct) {
    // The backend might not store emoji, rating, reviews directly if we modified it
    // Wait, we DO store description, prep_time, image_url.
    // The frontend expects desc, time, emoji/image, rating, reviews.
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
