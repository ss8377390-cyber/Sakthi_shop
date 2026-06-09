import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart, useWishlist } from '../context/ShopContext';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import './Navbar.css';

export default function Navbar() {
  const { count } = useCart();
  const { items: wishItems } = useWishlist();
  const { user, token, logout } = useAuth();
  const { lang, setLang, t, languages } = useLanguage();
  
  const [search, setSearch] = useState('');
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (search.trim()) navigate(`/shop?q=${encodeURIComponent(search.trim())}`);
  };

  const handleLogoutClick = () => {
    logout();
    navigate('/');
  };

  return (
    <header className={`navbar${scrolled ? ' scrolled' : ''}`}>
      <div className="navbar-inner">
        {/* Logo */}
        <Link to="/" className="navbar-logo">
          <span className="logo-text">Sakthi</span>
          <span className="logo-accent">Shop</span>
          <span className="logo-tagline">{t('logo_tagline')}</span>
        </Link>

        {/* Search Bar */}
        <form className="navbar-search" onSubmit={handleSearch}>
          <input
            type="text"
            placeholder={t('search_placeholder')}
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <button type="submit" className="search-btn">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
          </button>
        </form>

        {/* Nav Actions */}
        <nav className="navbar-actions">
          <Link to="/shop" className="nav-link">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            </svg>
            <span>{t('home')}</span>
          </Link>

          <Link to="/wishlist" className="nav-link">
            <div className="nav-icon-wrap">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
              {wishItems.length > 0 && <span className="badge">{wishItems.length}</span>}
            </div>
            <span>{t('wishlist')}</span>
          </Link>

          <Link to="/cart" className="nav-link cart-link">
            <div className="nav-icon-wrap">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" />
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
              </svg>
              {count > 0 && <span className="badge">{count}</span>}
            </div>
            <span>{t('cart')}</span>
          </Link>

          {/* Language Selector Dropdown */}
          <div className="nav-dropdown-container lang-selector">
            <button className="nav-link dropdown-toggle-btn lang-btn">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="2" y1="12" x2="22" y2="12" />
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
              </svg>
              <span>{languages.find(l => l.code === lang)?.native}</span>
            </button>
            <div className="nav-dropdown-menu lang-menu">
              {languages.map(l => (
                <button
                  key={l.code}
                  className={`dropdown-item lang-item${lang === l.code ? ' active' : ''}`}
                  onClick={() => setLang(l.code)}
                >
                  <span className="lang-name">{l.native}</span>
                  <span className="lang-code-tag">({l.label})</span>
                </button>
              ))}
            </div>
          </div>

          {token && user ? (
            <div className="nav-dropdown-container">
              <button className="nav-link dropdown-toggle-btn">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
                <span>{user.full_name.split(' ')[0]}</span>
              </button>
              <div className="nav-dropdown-menu">
                <Link to="/profile" className="dropdown-item">👤 {t('dashboard')}</Link>
                {user.role === 'admin' && (
                  <Link to="/admin" className="dropdown-item admin-link">🛠 {t('admin_panel')}</Link>
                )}
                <hr className="dropdown-divider" />
                <button onClick={handleLogoutClick} className="dropdown-item logout-btn-item">🚪 {t('logout')}</button>
              </div>
            </div>
          ) : (
            <Link to="/login" className="login-btn-nav">
              {t('login')}
            </Link>
          )}
        </nav>

        {/* Mobile Hamburger */}
        <button className="hamburger" onClick={() => setMenuOpen(!menuOpen)}>
          <span /><span /><span />
        </button>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="mobile-menu">
          {/* Mobile Language Selector */}
          <div className="mobile-lang-selector">
            <span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: 'middle', marginRight: '4px' }}>
                <circle cx="12" cy="12" r="10" />
                <line x1="2" y1="12" x2="22" y2="12" />
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
              </svg>
              Language / மொழி / भाषा
            </span>
            <div className="mobile-lang-buttons">
              {languages.map(l => (
                <button
                  key={l.code}
                  className={`mobile-lang-btn${lang === l.code ? ' active' : ''}`}
                  onClick={() => { setLang(l.code); setMenuOpen(false); }}
                >
                  {l.native}
                </button>
              ))}
            </div>
          </div>

          <Link to="/" onClick={() => setMenuOpen(false)}>{t('home')}</Link>
          <Link to="/shop" onClick={() => setMenuOpen(false)}>{t('explore')}</Link>
          <Link to="/wishlist" onClick={() => setMenuOpen(false)}>{t('wishlist')} {wishItems.length > 0 && `(${wishItems.length})`}</Link>
          <Link to="/cart" onClick={() => setMenuOpen(false)}>{t('cart')} {count > 0 && `(${count})`}</Link>
          {token && user ? (
            <>
              <Link to="/profile" onClick={() => setMenuOpen(false)}>{t('dashboard')}</Link>
              {user.role === 'admin' && <Link to="/admin" onClick={() => setMenuOpen(false)}>{t('admin_panel')}</Link>}
              <a href="#" onClick={() => { handleLogoutClick(); setMenuOpen(false); }}>{t('logout')}</a>
            </>
          ) : (
            <Link to="/login" onClick={() => setMenuOpen(false)}>{t('login')}</Link>
          )}
        </div>
      )}
    </header>
  );
}
