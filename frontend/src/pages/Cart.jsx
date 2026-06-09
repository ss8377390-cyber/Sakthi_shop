import { Link } from 'react-router-dom';
import { useCart } from '../context/ShopContext';
import { useLanguage } from '../context/LanguageContext';
import './Cart.css';

export default function Cart() {
  const { items, total, dispatch } = useCart();
  const { t } = useLanguage();

  if (items.length === 0) {
    return (
      <div className="cart-empty">
        <div className="cart-empty-icon">🛒</div>
        <h2>{t('cart_empty')}!</h2>
        <p>{t('start_shopping')}</p>
        <Link to="/shop" className="cart-shop-btn">{t('shop_now')}</Link>
      </div>
    );
  }

  const discount = Math.round(total * 0.05);
  const delivery = total > 500 ? 0 : 40;
  const finalTotal = total - discount + delivery;

  return (
    <div className="cart-page">
      <div className="cart-container">
        <div className="cart-left">
          <div className="cart-header">
            <h1>{t('shopping_cart')} <span>({items.length} {t('items_count')})</span></h1>
          </div>

          <div className="cart-items">
            {items.map(item => (
              <div className="cart-item" key={item.id}>
                <Link to={`/product/${item.id}`} className="cart-item-img">
                  <img src={item.image} alt={item.name} />
                </Link>

                <div className="cart-item-info">
                  <Link to={`/product/${item.id}`} className="cart-item-name">{item.name}</Link>
                  {item.freeDelivery && <p className="cart-item-free">🚚 Free Delivery</p>}
                  <p className="cart-item-instock">✓ In Stock</p>

                  <div className="cart-item-actions">
                    <div className="cart-qty">
                      <button onClick={() => dispatch({ type: 'UPDATE_QTY', id: item.id, qty: item.qty - 1 })}>−</button>
                      <span>{item.qty}</span>
                      <button onClick={() => dispatch({ type: 'UPDATE_QTY', id: item.id, qty: item.qty + 1 })}>+</button>
                    </div>
                    <button
                      className="cart-remove"
                      onClick={() => dispatch({ type: 'REMOVE_FROM_CART', id: item.id })}
                    >
                      🗑 {t('remove')}
                    </button>
                  </div>
                </div>

                <div className="cart-item-price">
                  <span className="cart-price-now">₹{(item.price * item.qty).toLocaleString('en-IN')}</span>
                  <span className="cart-price-old">₹{(item.originalPrice * item.qty).toLocaleString('en-IN')}</span>
                  <span className="cart-price-saving">{item.discount}% off</span>
                </div>
              </div>
            ))}
          </div>

          <div className="cart-footer-note">
            <span>🔒</span>
            <span>Safe and Secure Payments. Easy returns. 100% Authentic products.</span>
          </div>
        </div>

        {/* Price Summary */}
        <div className="cart-right">
          <div className="price-summary">
            <h3 className="summary-title">{t('order_summary')}</h3>

            <div className="summary-row">
              <span>{t('price')} ({items.length} {t('items_count')})</span>
              <span>₹{total.toLocaleString('en-IN')}</span>
            </div>
            <div className="summary-row">
              <span>{t('discount')}</span>
              <span className="summary-green">− ₹{discount.toLocaleString('en-IN')}</span>
            </div>
            <div className="summary-row">
              <span>Delivery Charges</span>
              <span className={delivery === 0 ? 'summary-green' : ''}>
                {delivery === 0 ? '🚚 FREE' : `₹${delivery}`}
              </span>
            </div>

            <div className="summary-divider" />

            <div className="summary-row summary-total">
              <span>{t('grand_total')}</span>
              <span>₹{finalTotal.toLocaleString('en-IN')}</span>
            </div>

            <div className="summary-savings">
              You will save ₹{discount.toLocaleString('en-IN')} on this order 🎉
            </div>

            <Link to="/checkout" className="checkout-btn">
              {t('place_order')} →
            </Link>

            <div className="summary-logos">
              <span className="logo-badge">🔒 SSL</span>
              <span className="logo-badge">✅ Verified</span>
              <span className="logo-badge">🏆 Trusted</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
