import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useCart, useWishlist, useProducts } from '../context/ShopContext';
import ProductCard from '../components/ProductCard';
import './ProductDetail.css';

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { products, loading } = useProducts();
  const product = products.find(p => p.id === +id);
  const { dispatch: cartDispatch } = useCart();
  const { items: wishItems, dispatch: wishDispatch } = useWishlist();
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const [tab, setTab] = useState('overview');

  if (loading) {
    return (
      <div className="pd-loading" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '80vh', gap: '16px', paddingTop: '80px' }}>
        <div className="spinner" style={{ width: '48px', height: '48px', border: '5px solid #e0e0e0', borderTop: '5px solid #2874f0', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        <h3 style={{ color: '#555' }}>Retrieving product details...</h3>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="pd-not-found">
        <div style={{ fontSize: 64 }}>😕</div>
        <h2>Product Not Found</h2>
        <Link to="/shop">← Back to Shop</Link>
      </div>
    );
  }

  const isWished = wishItems.some(i => i.id === product.id);
  const related = products.filter(p => p.category === product.category && p.id !== product.id).slice(0, 4);
  const savings = product.originalPrice - product.price;

  const handleBuyNow = () => {
    cartDispatch({ type: 'ADD_TO_CART', product });
    navigate('/cart');
  };

  const handleAddToCart = () => {
    for (let i = 0; i < qty; i++) cartDispatch({ type: 'ADD_TO_CART', product });
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <div className="pd-page">
      <div className="pd-container">
        {/* Breadcrumb */}
        <nav className="breadcrumb">
          <Link to="/">Home</Link> ›
          <Link to="/shop">Shop</Link> ›
          <Link to={`/shop?cat=${product.category}`}>{product.category}</Link> ›
          <span>{product.name}</span>
        </nav>

        {/* Main */}
        <div className="pd-main">
          {/* Left – Image */}
          <div className="pd-image-col">
            <div className="pd-image-wrap">
              <img src={product.image} alt={product.name} />
              {product.discount > 0 && (
                <span className="pd-discount-badge">{product.discount}% off</span>
              )}
            </div>
            <div className="pd-actions">
              <button
                className={`pd-btn-cart${added ? ' added' : ''}`}
                onClick={handleAddToCart}
              >
                🛒 {added ? 'Added to Cart!' : 'Add to Cart'}
              </button>
              <button className="pd-btn-buy" onClick={handleBuyNow}>
                ⚡ Buy Now
              </button>
            </div>
            <div className="pd-qty-row">
              <span className="pd-qty-label">Qty:</span>
              <button className="qty-btn" onClick={() => setQty(q => Math.max(1, q - 1))}>−</button>
              <span className="qty-val">{qty}</span>
              <button className="qty-btn" onClick={() => setQty(q => q + 1)}>+</button>
            </div>
          </div>

          {/* Right – Info */}
          <div className="pd-info-col">
            <div className="pd-header">
              {product.badge && (
                <span className="pd-badge" style={{ background: product.badgeColor }}>{product.badge}</span>
              )}
              <button
                className={`pd-wish${isWished ? ' wished' : ''}`}
                onClick={() => wishDispatch({ type: 'TOGGLE_WISHLIST', product })}
              >
                {isWished ? '❤️' : '🤍'} {isWished ? 'Wishlisted' : 'Add to Wishlist'}
              </button>
            </div>

            <h1 className="pd-name">{product.name}</h1>

            <div className="pd-rating-row">
              <span className="pd-rating-pill">★ {product.rating}</span>
              <span className="pd-reviews">{product.reviews.toLocaleString()} ratings</span>
              <span className="pd-sep">|</span>
              <span className="pd-sold">In Stock</span>
            </div>

            <div className="pd-price-block">
              <span className="pd-price">₹{product.price.toLocaleString('en-IN')}</span>
              <span className="pd-original">₹{product.originalPrice.toLocaleString('en-IN')}</span>
              <span className="pd-saving">{product.discount}% off — You save ₹{savings.toLocaleString('en-IN')}!</span>
            </div>

            {product.freeDelivery && (
              <div className="pd-delivery">
                <span>🚚</span>
                <span><strong>FREE Delivery</strong> by Tomorrow</span>
              </div>
            )}

            {/* Tabs */}
            <div className="pd-tabs">
              {['overview', 'specs', 'reviews'].map(t => (
                <button
                  key={t}
                  className={`pd-tab${tab === t ? ' active' : ''}`}
                  onClick={() => setTab(t)}
                >
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>

            {tab === 'overview' && (
              <div className="pd-tab-content">
                <p className="pd-desc">
                  Experience premium quality with the <strong>{product.name}</strong>. Designed for those who demand the best, this product offers exceptional performance and style. Whether you're a first-time buyer or upgrading from an older model, you'll immediately notice the difference in quality and user experience.
                </p>
              </div>
            )}

            {tab === 'specs' && (
              <div className="pd-tab-content">
                <ul className="pd-specs-list">
                  {product.specs.map((s, i) => (
                    <li key={i}>
                      <span className="spec-bullet">✓</span>
                      <span>{s}</span>
                    </li>
                  ))}
                  <li><span className="spec-bullet">✓</span><span>1 Year Manufacturer Warranty</span></li>
                  <li><span className="spec-bullet">✓</span><span>10-Day Replacement Policy</span></li>
                </ul>
              </div>
            )}

            {tab === 'reviews' && (
              <div className="pd-tab-content">
                <div className="pd-reviews-summary">
                  <div className="reviews-big-rating">
                    <span className="big-num">{product.rating}</span>
                    <span className="big-star">★</span>
                  </div>
                  <div className="reviews-bars">
                    {[5, 4, 3, 2, 1].map(star => (
                      <div key={star} className="rating-bar-row">
                        <span className="rbar-label">{star}★</span>
                        <div className="rbar-track">
                          <div
                            className="rbar-fill"
                            style={{ width: `${star === 5 ? 60 : star === 4 ? 25 : star === 3 ? 10 : star === 2 ? 3 : 2}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <div className="pd-guarantee">
              <div className="guarantee-item">
                <span>🔒</span>
                <span>Secure Payment</span>
              </div>
              <div className="guarantee-item">
                <span>🔄</span>
                <span>Easy Returns</span>
              </div>
              <div className="guarantee-item">
                <span>✅</span>
                <span>Genuine Product</span>
              </div>
            </div>
          </div>
        </div>

        {/* Related Products */}
        {related.length > 0 && (
          <section className="pd-related">
            <h2 className="pd-related-title">Similar Products</h2>
            <div className="pd-related-grid">
              {related.map(p => <ProductCard key={p.id} product={p} />)}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
