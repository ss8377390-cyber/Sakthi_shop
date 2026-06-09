import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProducts } from '../context/ShopContext';
import './Admin.css';

export default function Admin() {
  const navigate = useNavigate();
  const {
    products,
    banners,
    apiKey,
    setApiKey,
    addProduct,
    updateProduct,
    deleteProduct,
    uploadImage,
    addBanner,
    updateBanner,
    deleteBanner,
    error
  } = useProducts();

  // Authentication States
  // Always lock the admin portal initially upon entering the page
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pin, setPin] = useState('');
  const [pinError, setPinError] = useState(false);

  // Tab & Orders States
  const [activeTab, setActiveTab] = useState('inventory');
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [orderSearchQuery, setOrderSearchQuery] = useState('');

  // Banner States
  const [isEditingBanner, setIsEditingBanner] = useState(false);
  const [bannerForm, setBannerForm] = useState({
    id: null,
    title: '',
    subtitle: '',
    cta: 'Shop Now',
    bg: 'linear-gradient(135deg, #2874f0 0%, #0a3d91 100%)',
    accent: '#ffd32a',
    emoji: '⚡',
    duration: 5,
    expiry_time: ''
  });

  const fetchOrders = async (silent = false) => {
    if (!silent) setLoadingOrders(true);
    try {
      const res = await fetch('http://localhost:8000/api/orders', {
        headers: {
          'X-API-Key': apiKey
        }
      });
      if (!res.ok) throw new Error('Failed to fetch orders from database');
      const data = await res.json();
      setOrders(data);
    } catch (err) {
      console.error(err);
      if (!silent) showNotification('Failed to fetch orders: ' + err.message, 'error');
    } finally {
      if (!silent) setLoadingOrders(false);
    }
  };

  useEffect(() => {
    let interval;
    if (isAuthenticated && activeTab === 'orders') {
      fetchOrders();
      interval = setInterval(() => {
        fetchOrders(true);
      }, 3000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isAuthenticated, activeTab, apiKey]);

  // Form State
  const [form, setForm] = useState({
    id: null,
    name: '',
    category: 'electronics',
    price: '',
    originalPrice: '',
    discount: 0,
    badge: '',
    badgeColor: '#2874f0',
    image: '',
    inStock: true,
    freeDelivery: false,
    specs: ''
  });

  const [imageFile, setImageFile] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });
  const [keyInput, setKeyInput] = useState(apiKey);
  const [isUploading, setIsUploading] = useState(false);

  const showNotification = (msg, type = 'success') => {
    setNotification({ show: true, message: msg, type });
    setTimeout(() => setNotification({ show: false, message: '', type: 'success' }), 3000);
  };

  // Listen for physical keyboard PIN entry
  useEffect(() => {
    if (isAuthenticated) return;
    const handleKeyDown = (e) => {
      if (e.key >= '0' && e.key <= '9') {
        if (pin.length < 6) {
          const newPin = pin + e.key;
          setPin(newPin);
          if (newPin.length === 6) {
            verifyPin(newPin);
          }
        }
      } else if (e.key === 'Backspace') {
        setPin(prev => prev.slice(0, -1));
      } else if (e.key === 'Escape') {
        setPin('');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [pin, isAuthenticated]);

  // Automatically lock the admin portal when navigating away from the page
  useEffect(() => {
    return () => {
      setIsAuthenticated(false);
    };
  }, []);

  const verifyPin = (enteredPin) => {
    if (enteredPin === '101105') {
      setIsAuthenticated(true);
      showNotification('Access Granted! Welcome Admin.', 'success');
      setPin('');
    } else {
      setPinError(true);
      showNotification('Invalid PIN. Please try again.', 'error');
      setTimeout(() => {
        setPinError(false);
        setPin('');
      }, 600);
    }
  };

  const handlePinClick = (num) => {
    if (pin.length >= 6) return;
    const newPin = pin + num;
    setPin(newPin);
    if (newPin.length === 6) {
      verifyPin(newPin);
    }
  };

  const handlePinBackspace = () => {
    setPin(prev => prev.slice(0, -1));
  };

  const handlePinClear = () => {
    setPin('');
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    showNotification('Portal locked successfully.', 'success');
  };

  const handleExitAdmin = () => {
    setIsAuthenticated(false);
    showNotification('Portal locked. Exiting Admin Portal...', 'success');
    setTimeout(() => {
      navigate('/');
    }, 600);
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setImageFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!imageFile) return;
    setIsUploading(true);
    try {
      const url = await uploadImage(imageFile);
      setForm(prev => ({ ...prev, image: url }));
      setImageFile(null);
      showNotification('Image uploaded successfully!');
    } catch (err) {
      showNotification(err.message || 'Image upload failed. Check API Key.', 'error');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSaveKey = () => {
    setApiKey(keyInput);
    showNotification('API Key saved successfully!');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    let currentImageUrl = form.image;
    
    // Auto-upload if user selected an image file but forgot to click "Upload"
    if (imageFile) {
      setIsUploading(true);
      try {
        currentImageUrl = await uploadImage(imageFile);
        setImageFile(null);
        showNotification('Image uploaded successfully during submission!');
      } catch (err) {
        showNotification(err.message || 'Auto image upload failed. Check API Key.', 'error');
        setIsUploading(false);
        return;
      } finally {
        setIsUploading(false);
      }
    }

    if (!form.name || !form.price || !form.originalPrice || !currentImageUrl) {
      showNotification('Please fill all mandatory fields (Name, Price, Original Price, Image)', 'error');
      return;
    }

    const payload = {
      name: form.name,
      category: form.category,
      price: parseFloat(form.price),
      originalPrice: parseFloat(form.originalPrice),
      discount: parseInt(form.discount || 0),
      badge: form.badge || null,
      badgeColor: form.badge ? form.badgeColor : null,
      image: currentImageUrl,
      inStock: form.inStock,
      freeDelivery: form.freeDelivery,
      specs: form.specs ? form.specs.split(',').map(s => s.trim()).filter(Boolean) : []
    };

    try {
      if (isEditing) {
        await updateProduct(form.id, payload);
        showNotification('Product updated successfully!');
      } else {
        await addProduct(payload);
        showNotification('Product added successfully!');
      }
      resetForm();
    } catch (err) {
      showNotification(err.message || 'Action failed. Check if API Key is valid.', 'error');
    }
  };

  const handleEditClick = (p) => {
    setIsEditing(true);
    setForm({
      id: p.id,
      name: p.name,
      category: p.category,
      price: p.price,
      originalPrice: p.originalPrice,
      discount: p.discount,
      badge: p.badge || '',
      badgeColor: p.badgeColor || '#2874f0',
      image: p.image,
      inStock: p.inStock,
      freeDelivery: p.freeDelivery,
      specs: p.specs ? p.specs.join(', ') : ''
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteClick = async (id) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await deleteProduct(id);
        showNotification('Product deleted successfully!');
      } catch (err) {
        showNotification(err.message || 'Delete failed. Check API Key.', 'error');
      }
    }
  };

  const resetForm = () => {
    setForm({
      id: null,
      name: '',
      category: 'electronics',
      price: '',
      originalPrice: '',
      discount: 0,
      badge: '',
      badgeColor: '#2874f0',
      image: '',
      inStock: true,
      freeDelivery: false,
      specs: ''
    });
    setIsEditing(false);
    setImageFile(null);
  };

  const handleBannerInputChange = (e) => {
    const { name, value } = e.target;
    setBannerForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const resetBannerForm = () => {
    setBannerForm({
      id: null,
      title: '',
      subtitle: '',
      cta: 'Shop Now',
      bg: 'linear-gradient(135deg, #2874f0 0%, #0a3d91 100%)',
      accent: '#ffd32a',
      emoji: '⚡',
      duration: 5,
      expiry_time: ''
    });
    setIsEditingBanner(false);
  };

  const handleBannerEditClick = (b) => {
    setIsEditingBanner(true);
    setBannerForm({
      id: b.id,
      title: b.title,
      subtitle: b.subtitle,
      cta: b.cta || 'Shop Now',
      bg: b.bg || 'linear-gradient(135deg, #2874f0 0%, #0a3d91 100%)',
      accent: b.accent || '#ffd32a',
      emoji: b.emoji || '⚡',
      duration: b.duration || 5,
      expiry_time: b.expiry_time ? b.expiry_time.slice(0, 16) : ''
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBannerDeleteClick = async (id) => {
    if (window.confirm('Are you sure you want to delete this promotional banner?')) {
      try {
        await deleteBanner(id);
        showNotification('Promo Banner deleted successfully!');
      } catch (err) {
        showNotification(err.message || 'Failed to delete banner', 'error');
      }
    }
  };

  const handleBannerSubmit = async (e) => {
    e.preventDefault();
    if (!bannerForm.title || !bannerForm.subtitle) {
      showNotification('Please fill all mandatory fields (Title, Subtitle)', 'error');
      return;
    }

    const payload = {
      title: bannerForm.title,
      subtitle: bannerForm.subtitle,
      cta: bannerForm.cta,
      bg: bannerForm.bg,
      accent: bannerForm.accent,
      emoji: bannerForm.emoji,
      duration: parseInt(bannerForm.duration || 5),
      expiry_time: bannerForm.expiry_time || null
    };

    try {
      if (isEditingBanner) {
        await updateBanner(bannerForm.id, payload);
        showNotification('Promo Banner updated successfully!');
      } else {
        await addBanner(payload);
        showNotification('Promo Banner added successfully!');
      }
      resetBannerForm();
    } catch (err) {
      showNotification(err.message || 'Banner action failed', 'error');
    }
  };


  const filteredOrders = orders.filter(order => {
    if (!orderSearchQuery) return true;
    const query = orderSearchQuery.toLowerCase().trim();
    
    // Check if ID matches (#SKT... or numeric)
    const orderIdMatch = (order.id && order.id.toString().includes(query)) || 
                         `#skt${order.id}`.toLowerCase().includes(query) ||
                         `skt${order.id}`.toLowerCase().includes(query);
                         
    // Check if customer name matches
    const nameMatch = order.customer_name && order.customer_name.toLowerCase().includes(query);
    
    // Check if phone matches
    const phoneMatch = order.phone && order.phone.toLowerCase().includes(query);
    
    // Check if city matches
    const cityMatch = order.city && order.city.toLowerCase().includes(query);

    // Check if status matches
    const statusMatch = order.status && order.status.toLowerCase().includes(query);
    
    return orderIdMatch || nameMatch || phoneMatch || cityMatch || statusMatch;
  });

  if (!isAuthenticated) {
    return (
      <div className="admin-lock-screen">
        {notification.show && (
          <div className={`toast-notification ${notification.type}`}>
            {notification.message}
          </div>
        )}
        <div className={`lock-card${pinError ? ' shake' : ''}`}>
          <div className="lock-icon-wrap">
            🔐
          </div>
          <h2>Admin Authentication</h2>
          <p className="lock-sub">Please verify your identity to access portal controls</p>

          <div className="pin-auth-container">
            <div className="pin-dots-container">
              {[...Array(6)].map((_, i) => (
                <div 
                  key={i} 
                  className={`pin-dot${i < pin.length ? ' active' : ''}${pinError ? ' error' : ''}`}
                />
              ))}
            </div>
            <div className="numeric-keypad">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                <button 
                  key={num} 
                  type="button" 
                  className="keypad-btn"
                  onClick={() => handlePinClick(num.toString())}
                >
                  {num}
                </button>
              ))}
              <button 
                type="button" 
                className="keypad-btn action-btn"
                onClick={handlePinClear}
              >
                Clear
              </button>
              <button 
                type="button" 
                className="keypad-btn"
                onClick={() => handlePinClick('0')}
              >
                0
              </button>
              <button 
                type="button" 
                className="keypad-btn action-btn"
                onClick={handlePinBackspace}
              >
                ⌫
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <div className="admin-container">
        
        {/* Notification Toast */}
        {notification.show && (
          <div className={`toast-notification ${notification.type}`}>
            {notification.message}
          </div>
        )}

        <div className="admin-header">
          <div className="admin-header-title-row">
            <h1>🛠 SakthiShop Admin Portal</h1>
            <div className="admin-header-actions">
              <button className="admin-logout-btn" onClick={handleLogout}>🔒 Lock Portal</button>
              <button className="admin-exit-btn" onClick={handleExitAdmin}>🚪 Exit Admin</button>
            </div>
          </div>
          <p>Manage store catalog, add products, upload media, edit and delete inventory.</p>
        </div>

        {/* API Key Panel */}
        <div className="admin-card api-key-card">
          <h3>🔐 Admin Security Credentials</h3>
          <p>Endpoints that modify products require verification using the API Key configured in your FastAPI backend.</p>
          <div className="api-key-input-row">
            <input
              type="password"
              placeholder="Enter API Secret Key"
              value={keyInput}
              onChange={(e) => setKeyInput(e.target.value)}
            />
            <button onClick={handleSaveKey}>Verify & Save Key</button>
          </div>
          {error && <div className="offline-warning">⚠️ Note: {error}</div>}
        </div>

        {/* Tab Navigation */}
        <div className="admin-tabs" style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
          <button 
            type="button"
            onClick={() => setActiveTab('inventory')}
            style={{
              padding: '10px 20px',
              borderRadius: '4px',
              border: 'none',
              background: activeTab === 'inventory' ? '#2874f0' : '#e0e0e0',
              color: activeTab === 'inventory' ? '#fff' : '#333',
              fontWeight: '700',
              cursor: 'pointer',
              transition: 'background 0.2s'
            }}
          >
            📦 Inventory Catalog
          </button>
          <button 
            type="button"
            onClick={() => setActiveTab('orders')}
            style={{
              padding: '10px 20px',
              borderRadius: '4px',
              border: 'none',
              background: activeTab === 'orders' ? '#2874f0' : '#e0e0e0',
              color: activeTab === 'orders' ? '#fff' : '#333',
              fontWeight: '700',
              cursor: 'pointer',
              transition: 'background 0.2s'
            }}
          >
            🛍 Customer Orders ({orders.length})
          </button>
          <button 
            type="button"
            onClick={() => setActiveTab('banners')}
            style={{
              padding: '10px 20px',
              borderRadius: '4px',
              border: 'none',
              background: activeTab === 'banners' ? '#2874f0' : '#e0e0e0',
              color: activeTab === 'banners' ? '#fff' : '#333',
              fontWeight: '700',
              cursor: 'pointer',
              transition: 'background 0.2s'
            }}
          >
            📢 Manage Banners ({banners.length})
          </button>
        </div>

        {activeTab === 'inventory' && (
          <div className="admin-layout">
          {/* Form Side */}
          <div className="admin-form-col">
            <div className="admin-card">
              <h2>{isEditing ? '✏️ Edit Product' : '➕ Add New Product'}</h2>
              <form onSubmit={handleSubmit}>
                <div className="form-grid">
                  <div className="form-group full-width">
                    <label>Product Name *</label>
                    <input
                      type="text"
                      name="name"
                      value={form.name}
                      onChange={handleInputChange}
                      placeholder="e.g. Apple iPhone 15 Pro Max"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Category *</label>
                    <select name="category" value={form.category} onChange={handleInputChange}>
                      <option value="electronics">Electronics</option>
                      <option value="fashion">Fashion</option>
                      <option value="home">Home & Kitchen</option>
                      <option value="beauty">Beauty</option>
                      <option value="sports">Sports</option>
                      <option value="books">Books</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Discount (%)</label>
                    <input
                      type="number"
                      name="discount"
                      value={form.discount}
                      onChange={handleInputChange}
                      placeholder="e.g. 10"
                    />
                  </div>

                  <div className="form-group">
                    <label>Price (₹) *</label>
                    <input
                      type="number"
                      name="price"
                      value={form.price}
                      onChange={handleInputChange}
                      placeholder="e.g. 139900"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Original Price (₹) *</label>
                    <input
                      type="number"
                      name="originalPrice"
                      value={form.originalPrice}
                      onChange={handleInputChange}
                      placeholder="e.g. 159900"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Badge Text</label>
                    <input
                      type="text"
                      name="badge"
                      value={form.badge}
                      onChange={handleInputChange}
                      placeholder="e.g. Best Seller"
                    />
                  </div>

                  <div className="form-group">
                    <label>Badge Background Color</label>
                    <input
                      type="color"
                      name="badgeColor"
                      value={form.badgeColor}
                      onChange={handleInputChange}
                    />
                  </div>

                  {/* Image Options */}
                  <div className="form-group full-width image-upload-group">
                    <label>Product Image URL *</label>
                    <input
                      type="text"
                      name="image"
                      value={form.image}
                      onChange={handleInputChange}
                      placeholder="e.g. https://images.unsplash.com/... or uploaded path"
                      required
                    />
                    
                    <div className="divider-or"><span>OR UPLOAD IMAGE</span></div>
                    
                    <div className="file-upload-row">
                      <input type="file" accept="image/*" onChange={handleFileChange} />
                      <button
                        type="button"
                        onClick={handleUpload}
                        disabled={!imageFile || isUploading}
                      >
                        {isUploading ? 'Uploading...' : 'Upload'}
                      </button>
                    </div>
                  </div>

                  <div className="form-group full-width">
                    <label>Specifications (Comma-separated)</label>
                    <input
                      type="text"
                      name="specs"
                      value={form.specs}
                      onChange={handleInputChange}
                      placeholder="e.g. 12GB RAM, 256GB Storage, 5000mAh Battery"
                    />
                  </div>

                  <div className="form-checkbox-row full-width">
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        name="inStock"
                        checked={form.inStock}
                        onChange={handleInputChange}
                      />
                      <span>In Stock</span>
                    </label>
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        name="freeDelivery"
                        checked={form.freeDelivery}
                        onChange={handleInputChange}
                      />
                      <span>Free Delivery</span>
                    </label>
                  </div>
                </div>

                <div className="form-action-buttons">
                  <button type="submit" className="save-btn">
                    {isEditing ? '💾 Update Product' : '🚀 Add Product'}
                  </button>
                  <button type="button" className="cancel-btn" onClick={resetForm}>
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* List Side */}
          <div className="admin-list-col">
            <div className="admin-card">
              <h2>Inventory List ({products.length} Products)</h2>
              <div className="admin-products-table-wrapper">
                <table className="admin-products-table">
                  <thead>
                    <tr>
                      <th>Image</th>
                      <th>Product Details</th>
                      <th>Price</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map(p => (
                      <tr key={p.id}>
                        <td>
                          <img src={p.image} alt={p.name} className="table-product-image" />
                        </td>
                        <td>
                          <div className="table-product-name">{p.name}</div>
                          <div className="table-product-meta">
                            <span className="table-category-tag">{p.category}</span>
                            {p.badge && <span className="table-badge-tag" style={{ background: p.badgeColor }}>{p.badge}</span>}
                          </div>
                        </td>
                        <td>
                          <div className="table-price">₹{p.price.toLocaleString('en-IN')}</div>
                          {p.discount > 0 && <div className="table-discount">{p.discount}% Off</div>}
                        </td>
                        <td>
                          <div className="table-actions">
                            <button className="edit-btn" onClick={() => handleEditClick(p)}>✏️</button>
                            <button className="delete-btn" onClick={() => handleDeleteClick(p.id)}>🗑</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
        )}

        {activeTab === 'orders' && (
          <div className="admin-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1.5px solid #f0f0f0', paddingBottom: '12px' }}>
              <h2 style={{ margin: 0, border: 'none', padding: 0 }}>🛍 Customer Checkout Orders</h2>
              <button 
                onClick={fetchOrders} 
                style={{ 
                  background: '#2874f0', 
                  color: 'white', 
                  border: 'none', 
                  borderRadius: '4px', 
                  padding: '6px 12px', 
                  cursor: 'pointer',
                  fontWeight: '600'
                }}
              >
                🔄 Refresh
              </button>
            </div>
            
            {loadingOrders ? (
              <div style={{ padding: '40px', textAlign: 'center', color: '#666' }}>Loading orders from database...</div>
            ) : orders.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', color: '#666' }}>No orders found in the database.</div>
            ) : (
              <>
                <div className="order-search-container">
                  <span className="order-search-icon">🔍</span>
                  <input 
                    type="text"
                    className="order-search-input"
                    placeholder="Search by Order ID (#SKT...), customer name, phone, or location..."
                    value={orderSearchQuery}
                    onChange={(e) => setOrderSearchQuery(e.target.value)}
                  />
                  {orderSearchQuery && (
                    <button 
                      type="button" 
                      className="order-search-clear"
                      onClick={() => setOrderSearchQuery('')}
                      title="Clear search"
                    >
                      ✕
                    </button>
                  )}
                  <span className={`order-search-badge ${filteredOrders.length === 0 ? 'no-results' : ''}`}>
                    {filteredOrders.length} {filteredOrders.length === 1 ? 'order' : 'orders'} found
                  </span>
                </div>

                {filteredOrders.length === 0 ? (
                  <div style={{ padding: '40px', textAlign: 'center', color: '#666' }}>
                    <div style={{ fontSize: '32px', marginBottom: '12px' }}>🔍❌</div>
                    <div style={{ fontWeight: '600', fontSize: '16px', marginBottom: '8px' }}>No matching orders found</div>
                    <div style={{ fontSize: '14px', color: '#878787', marginBottom: '16px' }}>We couldn't find any orders matching "{orderSearchQuery}".</div>
                    <button 
                      type="button"
                      onClick={() => setOrderSearchQuery('')}
                      style={{
                        background: '#f1f3f6',
                        color: '#212121',
                        border: '1.5px solid #d8d8d8',
                        borderRadius: '4px',
                        padding: '8px 16px',
                        fontWeight: '600',
                        cursor: 'pointer'
                      }}
                    >
                      Clear Search Query
                    </button>
                  </div>
                ) : (
                  <div className="admin-products-table-wrapper">
                    <table className="admin-products-table">
                      <thead>
                        <tr>
                          <th>Order ID</th>
                          <th>Customer Details</th>
                          <th>Shipping Address</th>
                          <th>Items Ordered</th>
                          <th>Total Paid</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredOrders.map(order => (
                          <tr key={order.id}>
                            <td><strong>#SKT{order.id}</strong></td>
                            <td>
                              <div style={{ fontWeight: '600' }}>{order.customer_name}</div>
                              <div style={{ fontSize: '12px', color: '#666' }}>📞 {order.phone}</div>
                            </td>
                            <td>
                              <div style={{ fontSize: '13px' }}>{order.address}</div>
                              <div style={{ fontSize: '12px', color: '#555' }}>{order.city} - {order.pin}</div>
                            </td>
                            <td>
                              <div style={{ fontSize: '13px' }}>
                                {order.items && order.items.map((item, idx) => (
                                  <div key={idx} style={{ marginBottom: '4px' }}>
                                    • {item.name} <span style={{ color: '#666' }}>x{item.qty}</span> (₹{item.price.toLocaleString('en-IN')})
                                  </div>
                                ))}
                              </div>
                            </td>
                            <td>
                              <div style={{ fontWeight: '700', color: '#212121' }}>₹{order.total_amount.toLocaleString('en-IN')}</div>
                              <div style={{ fontSize: '11px', color: '#878787' }}>{order.payment_method ? order.payment_method.toUpperCase() : 'UPI'}</div>
                            </td>
                            <td>
                              <span style={{ 
                                background: '#e3f2fd', 
                                color: '#0d47a1', 
                                padding: '4px 8px', 
                                borderRadius: '4px', 
                                fontSize: '11px',
                                fontWeight: '700' 
                              }}>
                                {order.status || 'Pending'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {activeTab === 'banners' && (
          <div className="admin-layout">
            {/* Banner Form Side */}
            <div className="admin-form-col">
              <div className="admin-card">
                <h2>{isEditingBanner ? '✏️ Edit Promotional Banner' : '➕ Add New Banner'}</h2>
                <form onSubmit={handleBannerSubmit}>
                  <div className="form-grid">
                    <div className="form-group full-width">
                      <label>Banner Title *</label>
                      <input
                        type="text"
                        name="title"
                        value={bannerForm.title}
                        onChange={handleBannerInputChange}
                        placeholder="e.g. Big Billion Days or 80% Offer"
                        required
                      />
                    </div>

                    <div className="form-group full-width">
                      <label>Subtitle / Description *</label>
                      <input
                        type="text"
                        name="subtitle"
                        value={bannerForm.subtitle}
                        onChange={handleBannerInputChange}
                        placeholder="e.g. Upto 80% Off on Electronics & Appliances"
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label>CTA Button Text</label>
                      <input
                        type="text"
                        name="cta"
                        value={bannerForm.cta}
                        onChange={handleBannerInputChange}
                        placeholder="e.g. Shop Now"
                      />
                    </div>

                    <div className="form-group">
                      <label>Emoji Icon</label>
                      <input
                        type="text"
                        name="emoji"
                        value={bannerForm.emoji}
                        onChange={handleBannerInputChange}
                        placeholder="e.g. ⚡, 👗, 🛍️"
                      />
                    </div>

                    <div className="form-group">
                      <label>Slide Duration (seconds) *</label>
                      <input
                        type="number"
                        name="duration"
                        value={bannerForm.duration}
                        onChange={handleBannerInputChange}
                        min="1"
                        placeholder="e.g. 5"
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label>Offer Accent Color</label>
                      <input
                        type="color"
                        name="accent"
                        value={bannerForm.accent}
                        onChange={handleBannerInputChange}
                      />
                    </div>

                    <div className="form-group full-width">
                      <label>Background (CSS solid, gradient, etc.)</label>
                      <input
                        type="text"
                        name="bg"
                        value={bannerForm.bg}
                        onChange={handleBannerInputChange}
                        placeholder="linear-gradient(135deg, #e91e8c 0%, #7b1fa2 100%) or #2874f0"
                      />
                    </div>

                    <div className="form-group full-width">
                      <label>Expiry Date & Time (Optional countdown, local time)</label>
                      <input
                        type="datetime-local"
                        name="expiry_time"
                        value={bannerForm.expiry_time}
                        onChange={handleBannerInputChange}
                      />
                      <span style={{ fontSize: '11px', color: '#666', marginTop: '4px' }}>
                        If set, a dynamic live countdown timer will be displayed on the banner.
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                    <button type="submit" style={{ background: '#2874f0', color: 'white', flex: 1, border: 'none', padding: '10px', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer' }}>
                      {isEditingBanner ? 'Update Banner' : 'Publish Banner'}
                    </button>
                    {isEditingBanner && (
                      <button type="button" onClick={resetBannerForm} style={{ background: '#e0e0e0', color: '#333', border: 'none', padding: '10px', borderRadius: '4px', cursor: 'pointer' }}>
                        Cancel
                      </button>
                    )}
                  </div>
                </form>
              </div>
            </div>

            {/* Banner List Side */}
            <div className="admin-list-col">
              <div className="admin-card">
                <h2>📢 Active Promotional Banners ({banners.length})</h2>
                <div className="admin-products-table-wrapper">
                  <table className="admin-products-table">
                    <thead>
                      <tr>
                        <th>Preview</th>
                        <th>Banner Details</th>
                        <th>Timing</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {banners.map(b => (
                        <tr key={b.id}>
                          <td>
                            <div style={{
                              width: '60px',
                              height: '40px',
                              borderRadius: '4px',
                              background: b.bg,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '20px'
                            }}>
                              {b.emoji}
                            </div>
                          </td>
                          <td>
                            <div style={{ fontWeight: '700', color: b.accent }}>{b.title}</div>
                            <div style={{ fontSize: '12px', color: '#666' }}>{b.subtitle}</div>
                          </td>
                          <td>
                            <div style={{ fontSize: '12px' }}>⏱️ Slide: {b.duration}s</div>
                            {b.expiry_time && (
                              <div style={{ fontSize: '10px', color: '#f39c12', fontWeight: 'bold' }}>
                                ⏳ Ends: {new Date(b.expiry_time).toLocaleString()}
                              </div>
                            )}
                          </td>
                          <td>
                            <div className="table-actions">
                              <button className="edit-btn" onClick={() => handleBannerEditClick(b)}>✏️</button>
                              <button className="delete-btn" onClick={() => handleBannerDeleteClick(b.id)}>🗑</button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
