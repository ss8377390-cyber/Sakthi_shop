import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/ShopContext';
import { useAuth } from '../context/AuthContext';
import './Checkout.css';

export default function Checkout() {
  const { items, total, dispatch } = useCart();
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [placed, setPlaced] = useState(false);
  const [form, setForm] = useState({ name: user?.full_name || '', phone: '', address: '', city: '', pin: '', payment: 'upi' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderId, setOrderId] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (user) {
      setForm(prev => ({ ...prev, name: user.full_name }));
    }
  }, [user]);

  const discount = Math.round(total * 0.05);
  const delivery = total > 500 ? 0 : 40;
  const finalTotal = total - discount + delivery;

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handlePlaceOrder = async () => {
    if (!form.name || !form.phone || !form.address || !form.city || !form.pin) {
      alert("Please fill in all delivery details before placing the order.");
      setStep(1);
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const payload = {
        customer_name: form.name,
        phone: form.phone,
        address: form.address,
        city: form.city,
        pin: form.pin,
        payment_method: form.payment,
        items: items.map(item => ({
          id: item.id,
          name: item.name,
          price: item.price,
          qty: item.qty
        })),
        total_amount: finalTotal
      };

      const token = localStorage.getItem('sakthi_token');
      const headers = {
        'Content-Type': 'application/json'
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch('http://localhost:8000/api/orders', {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        throw new Error('Failed to save order to the database. Is the backend running?');
      }

      const data = await res.json();
      setOrderId(`#SKT${data.id}`);
      setPlaced(true);
      dispatch({ type: 'CLEAR_CART' });
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || 'Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (placed) {
    return (
      <div className="order-success">
        <div className="success-icon">🎉</div>
        <h1>Order Placed Successfully!</h1>
        <p>Your order has been placed and will be delivered within <strong>3-5 business days</strong>.</p>
        <p className="order-id">Order ID: <strong>{orderId}</strong></p>
        <div className="success-actions">
          <Link to="/shop" className="success-btn primary">Continue Shopping</Link>
          <Link to="/" className="success-btn secondary">Go Home</Link>
        </div>
      </div>
    );
  }


  if (items.length === 0) {
    return (
      <div className="order-success">
        <div style={{ fontSize: 64 }}>🛒</div>
        <h2>No items to checkout</h2>
        <Link to="/shop" className="success-btn primary" style={{ marginTop: 16 }}>Shop Now</Link>
      </div>
    );
  }

  return (
    <div className="checkout-page">
      <div className="checkout-container">
        {/* Steps */}
        <div className="checkout-steps">
          {['Delivery', 'Payment', 'Summary'].map((s, i) => (
            <div key={s} className={`step${step === i + 1 ? ' active' : step > i + 1 ? ' done' : ''}`}>
              <span className="step-num">{step > i + 1 ? '✓' : i + 1}</span>
              <span className="step-label">{s}</span>
              {i < 2 && <div className="step-line" />}
            </div>
          ))}
        </div>

        <div className="checkout-body">
          <div className="checkout-main">
            {/* Step 1 - Delivery */}
            {step === 1 && (
              <div className="checkout-card">
                <h2 className="card-step-title">📦 Delivery Address</h2>
                <div className="form-grid">
                  <div className="form-group">
                    <label>Full Name</label>
                    <input name="name" value={form.name} onChange={handleChange} placeholder="Enter full name" />
                  </div>
                  <div className="form-group">
                    <label>Phone Number</label>
                    <input name="phone" value={form.phone} onChange={handleChange} placeholder="+91 XXXXX XXXXX" />
                  </div>
                  <div className="form-group full-width">
                    <label>Address</label>
                    <textarea name="address" value={form.address} onChange={handleChange} placeholder="House No., Street, Area" rows={3} />
                  </div>
                  <div className="form-group">
                    <label>City</label>
                    <input name="city" value={form.city} onChange={handleChange} placeholder="City" />
                  </div>
                  <div className="form-group">
                    <label>PIN Code</label>
                    <input name="pin" value={form.pin} onChange={handleChange} placeholder="6-digit PIN" maxLength={6} />
                  </div>
                </div>
                <button className="checkout-next-btn" onClick={() => setStep(2)}>
                  Proceed to Payment →
                </button>
              </div>
            )}

            {/* Step 2 - Payment */}
            {step === 2 && (
              <div className="checkout-card">
                <h2 className="card-step-title">💳 Payment Method</h2>
                <div className="payment-options">
                  {[
                    { id: 'upi', label: '📱 UPI (PhonePe / GPay / Paytm)', desc: 'Instant, secure payment' },
                    { id: 'card', label: '💳 Debit / Credit Card', desc: 'Visa, Mastercard, RuPay' },
                    { id: 'netbanking', label: '🏦 Net Banking', desc: 'All major banks' },
                    { id: 'cod', label: '💵 Cash on Delivery', desc: 'Pay when delivered' },
                  ].map(opt => (
                    <label key={opt.id} className={`payment-opt${form.payment === opt.id ? ' selected' : ''}`}>
                      <input
                        type="radio"
                        name="payment"
                        value={opt.id}
                        checked={form.payment === opt.id}
                        onChange={handleChange}
                      />
                      <div>
                        <span className="opt-label">{opt.label}</span>
                        <span className="opt-desc">{opt.desc}</span>
                      </div>
                    </label>
                  ))}
                </div>
                <div className="step-btns">
                  <button className="checkout-back-btn" onClick={() => setStep(1)}>← Back</button>
                  <button className="checkout-next-btn" onClick={() => setStep(3)}>Review Order →</button>
                </div>
              </div>
            )}

            {/* Step 3 - Summary */}
            {step === 3 && (
              <div className="checkout-card">
                <h2 className="card-step-title">📋 Order Summary</h2>
                <div className="order-items">
                  {items.map(item => (
                    <div key={item.id} className="order-item">
                      <img src={item.image} alt={item.name} />
                      <div>
                        <p className="oi-name">{item.name}</p>
                        <p className="oi-qty">Qty: {item.qty}</p>
                      </div>
                      <span className="oi-price">₹{(item.price * item.qty).toLocaleString('en-IN')}</span>
                    </div>
                  ))}
                </div>
                <div className="order-address">
                  <h4>Deliver To:</h4>
                  <p>{form.name} — {form.phone}</p>
                  <p>{form.address}, {form.city} - {form.pin}</p>
                  <p>Payment: {form.payment.toUpperCase()}</p>
                </div>
                {errorMsg && <div className="checkout-error" style={{ color: 'red', marginTop: 12, fontSize: 14 }}>⚠️ {errorMsg}</div>}
                <div className="step-btns" style={{ marginTop: 12 }}>
                  <button className="checkout-back-btn" onClick={() => setStep(2)} disabled={isSubmitting}>← Back</button>
                  <button className="place-order-btn" onClick={handlePlaceOrder} disabled={isSubmitting}>
                    {isSubmitting ? '⏳ Processing Order...' : `✅ Place Order — ₹${finalTotal.toLocaleString('en-IN')}`}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Price Summary */}
          <div className="checkout-summary">
            <h3>Price Details</h3>
            <div className="cs-row"><span>Items ({items.length})</span><span>₹{total.toLocaleString('en-IN')}</span></div>
            <div className="cs-row"><span>Discount</span><span className="cs-green">−₹{discount.toLocaleString('en-IN')}</span></div>
            <div className="cs-row"><span>Delivery</span><span className={delivery === 0 ? 'cs-green' : ''}>{delivery === 0 ? 'FREE' : `₹${delivery}`}</span></div>
            <div className="cs-divider" />
            <div className="cs-row cs-total"><span>Total</span><span>₹{finalTotal.toLocaleString('en-IN')}</span></div>
            <div className="cs-savings">🎉 You save ₹{discount.toLocaleString('en-IN')}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
