import { Link } from 'react-router-dom';
import { useWishlist, useCart } from '../context/ShopContext';
import { useAuth } from '../context/AuthContext';
import './Wishlist.css';

export default function Wishlist() {
  const { items: localItems, dispatch: localDispatch } = useWishlist();
  const { dispatch: cartDispatch } = useCart();
  const { user, favorites, toggleFavorite } = useAuth();

  const items = user ? favorites : localItems;

  const handleRemove = async (item) => {
    if (user) {
      try {
        await toggleFavorite(item.id);
      } catch (err) {
        console.error("Error removing favorite:", err);
      }
    } else {
      localDispatch({ type: 'TOGGLE_WISHLIST', product: item });
    }
  };

  const moveToCart = async (item) => {
    cartDispatch({ type: 'ADD_TO_CART', product: item });
    await handleRemove(item);
  };

  if (items.length === 0) {
    return (
      <div className="wishlist-empty">
        <div className="wishlist-empty-icon">🤍</div>
        <h2>Your Wishlist is empty!</h2>
        <p>Save items you love to your wishlist.</p>
        <Link to="/shop" className="wishlist-shop-btn">Start Shopping</Link>
      </div>
    );
  }

  return (
    <div className="wishlist-page">
      <div className="wishlist-container">
        <div className="wishlist-header">
          <h1>My Wishlist <span>({items.length})</span></h1>
        </div>
        <div className="wishlist-grid">
          {items.map(item => (
            <div className="wishlist-card" key={item.id}>
              <button
                className="wishlist-remove"
                onClick={() => handleRemove(item)}
                title="Remove"
              >✕</button>

              <Link to={`/product/${item.id}`} className="wishlist-img">
                <img src={item.image} alt={item.name} />
                {item.discount > 0 && <span className="wl-discount">{item.discount}% off</span>}
              </Link>

              <div className="wishlist-info">
                <Link to={`/product/${item.id}`} className="wl-name">{item.name}</Link>
                <div className="wl-rating">
                  <span className="wl-rating-pill">★ {item.rating}</span>
                  <span className="wl-reviews">({item.reviews.toLocaleString()})</span>
                </div>
                <div className="wl-price">
                  <span className="wl-price-now">₹{item.price.toLocaleString('en-IN')}</span>
                  <span className="wl-price-old">₹{item.originalPrice.toLocaleString('en-IN')}</span>
                </div>
                <button className="wl-add-cart" onClick={() => moveToCart(item)}>
                  🛒 Move to Cart
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
