import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { categories } from '../data/products';
import { useProducts } from '../context/ShopContext';
import { useLanguage } from '../context/LanguageContext';
import ProductCard from '../components/ProductCard';
import './Home.css';

function BannerCountdown({ expiryTime }) {
  const [timeLeft, setTimeLeft] = useState('');
  const { t } = useLanguage();

  useEffect(() => {
    if (!expiryTime) return;

    const calculateTimeLeft = () => {
      const difference = +new Date(expiryTime) - +new Date();
      if (difference <= 0) {
        setTimeLeft(t('offer_ended'));
        return;
      }

      const hrs = Math.floor(difference / (1000 * 60 * 60));
      const mins = Math.floor((difference / 1000 / 60) % 60);
      const secs = Math.floor((difference / 1000) % 60);

      setTimeLeft(
        `${hrs.toString().padStart(2, '0')}h : ${mins.toString().padStart(2, '0')}m : ${secs.toString().padStart(2, '0')}s`
      );
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(interval);
  }, [expiryTime, t]);

  if (!expiryTime) return null;

  return (
    <div className="banner-countdown">
      <span className="countdown-label">⚡ {t('ends_in')}:</span>
      <span className="countdown-time">{timeLeft}</span>
    </div>
  );
}

export default function Home() {
  const [bannerIdx, setBannerIdx] = useState(0);
  const [animating, setAnimating] = useState(false);
  const { products, banners, loading, error } = useProducts();
  const { t } = useLanguage();

  // Dynamic automatic banner sliding based on individual banner's set timing/duration
  useEffect(() => {
    if (!banners || banners.length === 0) return;

    // Safety check for boundary index
    if (bannerIdx >= banners.length) {
      setBannerIdx(0);
      return;
    }

    const currentBanner = banners[bannerIdx];
    const slideDuration = (currentBanner?.duration || 5) * 1000;

    const timer = setTimeout(() => {
      setAnimating(true);
      setTimeout(() => {
        setBannerIdx(i => (i + 1) % banners.length);
        setAnimating(false);
      }, 400);
    }, slideDuration);

    return () => clearTimeout(timer);
  }, [bannerIdx, banners]);

  const goTo = (idx) => {
    setAnimating(true);
    setTimeout(() => { setBannerIdx(idx); setAnimating(false); }, 300);
  };

  const banner = banners && banners.length > 0 ? banners[bannerIdx] : null;
  const featured = products.slice(0, 4);
  const trending = products.slice(4, 8);
  const deals = products.filter(p => p.discount >= 28);

  if (loading) {
    return (
      <div className="home-loading" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '80vh', gap: '16px', paddingTop: '80px' }}>
        <div className="spinner" style={{ width: '48px', height: '48px', border: '5px solid #e0e0e0', borderTop: '5px solid #2874f0', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        <h3 style={{ color: '#555' }}>{t('loading_shop')}</h3>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="home">
      {/* Hero Banner */}
      {banner && (
        <section className={`hero-banner${animating ? ' fade-out' : ' fade-in'}`} style={{ background: banner.bg }}>
          <div className="hero-content">
            {banner.expiry_time && <BannerCountdown expiryTime={banner.expiry_time} />}
            <div className="hero-emoji">{banner.emoji}</div>
            <h1 className="hero-title" style={{ color: banner.accent }}>{banner.title}</h1>
            <p className="hero-subtitle">{banner.subtitle}</p>
            <Link to="/shop" className="hero-cta">{banner.cta} →</Link>
          </div>
          <div className="hero-dots">
            {banners.map((_, i) => (
              <button key={i} className={`dot${i === bannerIdx ? ' active' : ''}`} onClick={() => goTo(i)} />
            ))}
          </div>
          <div className="hero-prev" onClick={() => goTo((bannerIdx - 1 + banners.length) % banners.length)}>‹</div>
          <div className="hero-next" onClick={() => goTo((bannerIdx + 1) % banners.length)}>›</div>
        </section>
      )}

      {/* Category Strip */}
      <section className="category-strip">
        <div className="section-inner">
          <div className="cat-scroll">
            {categories.filter(c => c.id !== 'all').map(cat => (
              <Link key={cat.id} to={`/shop?cat=${cat.id}`} className="cat-chip">
                <span className="cat-icon">{cat.icon}</span>
                <span className="cat-name">{cat.name}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="home-section">
        <div className="section-inner">
          <div className="section-header">
            <h2 className="section-title">🔥 {t('featured_products')}</h2>
            <Link to="/shop" className="view-all">{t('view_all')}</Link>
          </div>
          <div className="products-grid">
            {featured.map(p => <ProductCard key={p.id} product={p} />)}
          </div>
        </div>
      </section>

      {/* Deals Banner Strip */}
      <section className="deals-strip">
        <div className="section-inner">
          <div className="deals-grid">
            <div className="deal-card deal-blue">
              <span className="deal-icon">⚡</span>
              <h3>{t('flash_sale')}</h3>
              <p>{t('electronics_offer')}</p>
              <Link to="/shop?cat=electronics">{t('shop_now')}</Link>
            </div>
            <div className="deal-card deal-pink">
              <span className="deal-icon">👗</span>
              <h3>{t('fashion_week')}</h3>
              <p>{t('fashion_offer')}</p>
              <Link to="/shop?cat=fashion">{t('explore')}</Link>
            </div>
            <div className="deal-card deal-green">
              <span className="deal-icon">🏠</span>
              <h3>{t('home_deals')}</h3>
              <p>{t('home_offer')}</p>
              <Link to="/shop?cat=home">{t('discover')}</Link>
            </div>
          </div>
        </div>
      </section>

      {/* Trending */}
      <section className="home-section">
        <div className="section-inner">
          <div className="section-header">
            <h2 className="section-title">📈 {t('trending_now')}</h2>
            <Link to="/shop" className="view-all">{t('view_all')}</Link>
          </div>
          <div className="products-grid">
            {trending.map(p => <ProductCard key={p.id} product={p} />)}
          </div>
        </div>
      </section>

      {/* Best Deals */}
      <section className="home-section">
        <div className="section-inner">
          <div className="section-header">
            <h2 className="section-title">💰 {t('best_deals')}</h2>
            <Link to="/shop" className="view-all">{t('view_all')}</Link>
          </div>
          <div className="products-grid">
            {deals.map(p => <ProductCard key={p.id} product={p} />)}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="home-footer">
        <div className="section-inner">
          <div className="footer-grid">
            <div>
              <h4>{t('about')}</h4>
              <ul>
                <li><a href="#">{t('about_us')}</a></li>
                <li><a href="#">{t('careers')}</a></li>
                <li><a href="#">{t('press')}</a></li>
                <li><a href="#">{t('blog')}</a></li>
              </ul>
            </div>
            <div>
              <h4>{t('help')}</h4>
              <ul>
                <li><a href="#">{t('payments')}</a></li>
                <li><a href="#">{t('shipping')}</a></li>
                <li><a href="#">{t('return_policy')}</a></li>
                <li><a href="#">{t('faq')}</a></li>
              </ul>
            </div>
            <div>
              <h4>{t('policy')}</h4>
              <ul>
                <li><a href="#">{t('privacy')}</a></li>
                <li><a href="#">{t('terms')}</a></li>
                <li><a href="#">{t('security')}</a></li>
                <li><a href="#">{t('sitemap')}</a></li>
              </ul>
            </div>
            <div>
              <h4>{t('connect')}</h4>
              <ul>
                <li><a href="#">Facebook</a></li>
                <li><a href="#">Twitter</a></li>
                <li><a href="#">YouTube</a></li>
                <li><a href="#">Instagram</a></li>
              </ul>
            </div>
          </div>
          <div className="footer-bottom">
            <span>© 2026 SakthiShop. {t('rights_reserved')}.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
