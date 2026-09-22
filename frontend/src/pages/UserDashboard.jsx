import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './UserDashboard.css';

export default function UserDashboard() {
  const { user, token, logout, updateProfile, favorites, toggleFavorite } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('orders'); // 'orders', 'favorites', 'profile'
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  // Profile Edit States
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [profileSuccess, setProfileSuccess] = useState('');
  const [profileError, setProfileError] = useState('');
  const [updatingProfile, setUpdatingProfile] = useState(false);

  useEffect(() => {
    if (!token) {
      navigate('/login');
    }
  }, [token, navigate]);

  const fetchUserOrders = async () => {
    setLoadingOrders(true);
    try {
      const res = await fetch('http://localhost:8000/api/orders', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setOrders(data);
      }
    } catch (err) {
      console.error("Error fetching customer orders:", err);
    } finally {
      setLoadingOrders(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchUserOrders();
    }
  }, [token]);

  // Sync profile details if user changes
  useEffect(() => {
    if (user) {
      setFullName(user.full_name);
      setEmail(user.email);
    }
  }, [user]);

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setProfileSuccess('');
    setProfileError('');

    if (password && password !== confirmPassword) {
      setProfileError('New passwords do not match');
      return;
    }

    setUpdatingProfile(true);
    try {
      const payload = { full_name: fullName, email };
      if (password) payload.password = password;

      await updateProfile(payload);
      setProfileSuccess('Profile details updated successfully!');
      setPassword('');
      setConfirmPassword('');
    } catch (err) {
      setProfileError(err.message || 'Failed to update profile');
    } finally {
      setUpdatingProfile(false);
    }
  };

  const handleLogoutClick = () => {
    logout();
    navigate('/');
  };

  const getStatusStep = (status) => {
    const steps = ['Pending', 'Dispatched', 'Shipped', 'Delivered'];
    return steps.indexOf(status);
  };

  if (!user) {
    return <div className="dashboard-loading">Loading Dashboard...</div>;
  }

  return (
    <div className="user-dashboard-container">
      <div className="dashboard-layout">
        {/* Left Sidebar */}
        <aside className="dashboard-sidebar">
          <div className="user-profile-header">
            <div className="avatar-placeholder">{user.full_name.charAt(0).toUpperCase()}</div>
            <div className="user-meta">
              <span className="greeting">Hello,</span>
              <span className="name">{user.full_name}</span>
            </div>
          </div>

          <nav className="dashboard-nav">
            <button
              className={`nav-item-btn ${activeTab === 'orders' ? 'active' : ''}`}
              onClick={() => { setActiveTab('orders'); setSelectedOrder(null); }}
            >
              🛍️ My Orders
            </button>
            <button
              className={`nav-item-btn ${activeTab === 'favorites' ? 'active' : ''}`}
              onClick={() => setActiveTab('favorites')}
            >
              ❤️ Favorites ({favorites.length})
            </button>
            <button
              className={`nav-item-btn ${activeTab === 'profile' ? 'active' : ''}`}
              onClick={() => setActiveTab('profile')}
            >
              👤 Profile Settings
            </button>
            {user.role === 'admin' && (
              <button
                className="nav-item-btn admin-gateway-btn"
                onClick={() => navigate('/admin')}
              >
                ⚙️ Admin Portal
              </button>
            )}
            <hr className="divider" />
            <button className="nav-item-btn logout-btn" onClick={handleLogoutClick}>
              🚪 Logout
            </button>
          </nav>
        </aside>

        {/* Right Content Area */}
        <main className="dashboard-content">

          {/* ORDERS TAB */}
          {activeTab === 'orders' && (
            <div className="dashboard-card">
              <h2>My Purchase History</h2>
              <p className="tab-subtext">View, manage, and check real-time delivery tracking of your orders.</p>

              {selectedOrder ? (
                <div className="order-details-view">
                  <button className="back-btn" onClick={() => setSelectedOrder(null)}>
                    ← Back to all orders
                  </button>

                  <div className="details-header">
                    <h3>Order #SKT{selectedOrder.id}</h3>
                    <span className={`status-badge ${selectedOrder.status.toLowerCase()}`}>
                      {selectedOrder.status}
                    </span>
                  </div>

                  {/* Delivery Status Tracking Timeline */}
                  {selectedOrder.status === 'Cancelled' ? (
                    <div className="cancelled-timeline-banner">
                      🚫 This order has been cancelled.
                    </div>
                  ) : (
                    <div className="tracking-timeline-wrapper">
                      <h4>Delivery Tracking Tracker</h4>
                      <div className="timeline-container">
                        {[
                          { title: 'Ordered', desc: 'Order placed & confirmed' },
                          { title: 'Dispatched', desc: 'Items handed over to delivery hub' },
                          { title: 'Shipped', desc: 'In-transit to local warehouse' },
                          { title: 'Delivered', desc: 'Successfully delivered to customer' }
                        ].map((step, idx) => {
                          const currentStepIdx = getStatusStep(selectedOrder.status);
                          const isCompleted = idx <= currentStepIdx;
                          const isActive = idx === currentStepIdx;

                          return (
                            <div key={idx} className={`timeline-node ${isCompleted ? 'completed' : ''} ${isActive ? 'active' : ''}`}>
                              <div className="timeline-dot">
                                {isCompleted ? '✓' : idx + 1}
                              </div>
                              <div className="timeline-text">
                                <span className="timeline-title">{step.title}</span>
                                <span className="timeline-desc">{step.desc}</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Order Summary & Items list */}
                  <div className="details-row">
                    <div className="delivery-address-col">
                      <h4>Shipping Details</h4>
                      <p><strong>Recipient Name:</strong> {selectedOrder.customer_name}</p>
                      <p><strong>Mobile Number:</strong> {selectedOrder.phone}</p>
                      <p><strong>Shipping Address:</strong> {selectedOrder.address}, {selectedOrder.city} - {selectedOrder.pin}</p>
                      <p><strong>Payment Method:</strong> {selectedOrder.payment_method.toUpperCase()}</p>
                    </div>

                    <div className="items-summary-col">
                      <h4>Items Ordered</h4>
                      <div className="order-items-list">
                        {selectedOrder.items.map((item, idx) => (
                          <div key={idx} className="summary-item-card">
                            <span className="item-name">• {item.name}</span>
                            <span className="item-qty">x{item.qty}</span>
                            <span className="item-price">₹{(item.price * item.qty).toLocaleString('en-IN')}</span>
                          </div>
                        ))}
                      </div>
                      <div className="order-total-price">
                        <span>Total Paid:</span>
                        <strong>₹{selectedOrder.total_amount.toLocaleString('en-IN')}</strong>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="orders-list-view">
                  {loadingOrders ? (
                    <div className="inner-loader">Fetching your orders...</div>
                  ) : orders.length === 0 ? (
                    <div className="empty-state">
                      <span className="empty-icon">🛍️</span>
                      <h3>No Orders Found</h3>
                      <p>You haven't placed any orders yet. Visit our shop and get shopping!</p>
                      <button onClick={() => navigate('/shop')} className="shop-now-btn">
                        Start Shopping
                      </button>
                    </div>
                  ) : (
                    <div className="orders-table-container">
                      <table className="orders-table">
                        <thead>
                          <tr>
                            <th>Order ID</th>
                            <th>Total Amount</th>
                            <th>Status</th>
                            <th>Items Count</th>
                            <th>Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {orders.map((o) => (
                            <tr key={o.id}>
                              <td><strong>#SKT{o.id}</strong></td>
                              <td>₹{o.total_amount.toLocaleString('en-IN')}</td>
                              <td>
                                <span className={`status-badge ${o.status.toLowerCase()}`}>
                                  {o.status}
                                </span>
                              </td>
                              <td>{o.items.reduce((acc, curr) => acc + curr.qty, 0)} items</td>
                              <td>
                                <button className="view-details-btn" onClick={() => setSelectedOrder(o)}>
                                  Track Details
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* FAVORITES TAB */}
          {activeTab === 'favorites' && (
            <div className="dashboard-card">
              <h2>My Favorites</h2>
              <p className="tab-subtext">Quickly access items you loved and saved for later.</p>

              {favorites.length === 0 ? (
                <div className="empty-state">
                  <span className="empty-icon">❤️</span>
                  <h3>Your Favorites List is Empty</h3>
                  <p>Browse products and click the heart icon to save products here!</p>
                  <button onClick={() => navigate('/shop')} className="shop-now-btn">
                    Browse Catalog
                  </button>
                </div>
              ) : (
                <div className="favorites-grid">
                  {favorites.map((product) => (
                    <div key={product.id} className="fav-product-card">
                      <div className="img-wrap">
                        <img src={product.image} alt={product.name} />
                      </div>
                      <div className="fav-product-details">
                        <h4>{product.name}</h4>
                        <div className="price-row">
                          <span className="curr-price">₹{product.price.toLocaleString('en-IN')}</span>
                          {product.discount > 0 && (
                            <span className="orig-price">₹{product.originalPrice.toLocaleString('en-IN')}</span>
                          )}
                        </div>
                        <div className="action-row">
                          <button
                            className="buy-btn"
                            onClick={() => navigate(`/product/${product.id}`)}
                          >
                            View Product
                          </button>
                          <button
                            className="remove-fav-btn"
                            onClick={() => toggleFavorite(product.id)}
                            title="Remove from favorites"
                          >
                            🗑 Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* PROFILE SETTINGS TAB */}
          {activeTab === 'profile' && (
            <div className="dashboard-card">
              <h2>Account Settings</h2>
              <p className="tab-subtext">Update your name, registered email address, and change passwords.</p>

              <form onSubmit={handleProfileSubmit} className="profile-form">
                {profileSuccess && <div className="toast-success">{profileSuccess}</div>}
                {profileError && <div className="toast-error">{profileError}</div>}

                <div className="form-row">
                  <div className="form-group">
                    <label>Full Name</label>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Email Address</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <fieldset className="password-fieldset">
                  <legend>Update Password (Optional)</legend>
                  <p className="fieldset-help">Leave fields empty if you don't wish to change password.</p>

                  <div className="form-row">
                    <div className="form-group">
                      <label>New Password</label>
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                      />
                    </div>

                    <div className="form-group">
                      <label>Confirm New Password</label>
                      <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                      />
                    </div>
                  </div>
                </fieldset>

                <button type="submit" className="save-profile-btn" disabled={updatingProfile}>
                  {updatingProfile ? 'Saving Changes...' : '💾 Save Profile Details'}
                </button>
              </form>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
