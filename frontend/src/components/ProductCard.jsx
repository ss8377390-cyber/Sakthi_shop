import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCart, useWishlist } from '../context/ShopContext';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import './ProductCard.css';

export default function ProductCard({ product }) {
  const { dispatch: cartDispatch } = useCart();
  const { items: wishItems, dispatch: wishDispatch } = useWishlist();
  const { user, toggleFavorite, isFavorite } = useAuth();
  const { t } = useLanguage();
  
  const [added, setAdded] = useState(false);
  const isWished = user ? isFavorite(product.id) : wishItems.some(i => i.id === product.id);

  const handleAddToCart = (e) => {
    e.preventDefault();
    cartDispatch({ type: 'ADD_TO_CART', product });
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  const handleWishlist = async (e) => {
    e.preventDefault();
    if (user) {
      try {
        await toggleFavorite(product.id);
      } catch (err) {
        console.error("Error toggling favorite:", err);
      }
    } else {
      wishDispatch({ type: 'TOGGLE_WISHLIST', product });
    }
  };

  const formatPrice = (p) => '₹' + p.toLocaleString('en-IN');

  return (
    <Link to={`/product/${product.id}`} className="product-card">
      <div className="card-image-wrap">
        <img src={product.image} alt={product.name} loading="lazy" />
        {product.discount > 0 && (
          <span className="card-discount">{product.discount}% off</span>
        )}
        <button
          className={`wish-btn${isWished ? ' wished' : ''}`}
          onClick={handleWishlist}
          title={isWished ? 'Remove from favorites' : 'Add to favorites'}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill={isWished ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
        </button>
        {product.badge && (
          <span className="card-badge" style={{ background: product.badgeColor }}>
            {product.badge}
          </span>
        )}
      </div>

      <div className="card-body">
        <h3 className="card-name">{product.name}</h3>

        <div className="card-rating">
          <span className="rating-pill">
            ★ {product.rating}
          </span>
          <span className="rating-count">({product.reviews.toLocaleString()})</span>
        </div>

        <div className="card-price">
          <span className="price-now">{formatPrice(product.price)}</span>
          <span className="price-old">{formatPrice(product.originalPrice)}</span>
        </div>

        {product.freeDelivery && (
          <p className="free-delivery">🚚 Free Delivery</p>
        )}

        <button
          className={`add-cart-btn${added ? ' added' : ''}`}
          onClick={handleAddToCart}
        >
          {added ? `✓ ${t('cart')}!` : t('add_to_cart')}
        </button>
      </div>
    </Link>
  );
}
