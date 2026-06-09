import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { categories } from '../data/products';
import { useProducts } from '../context/ShopContext';
import { useLanguage } from '../context/LanguageContext';
import ProductCard from '../components/ProductCard';
import './Shop.css';

export default function Shop() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeCategory, setActiveCategory] = useState(searchParams.get('cat') || 'all');
  const [sort, setSort] = useState('relevant');
  const [search, setSearch] = useState(searchParams.get('q') || '');
  const [priceRange, setPriceRange] = useState([0, 200000]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { products, loading } = useProducts();
  const { t } = useLanguage();

  const SORT_OPTIONS = [
    { value: 'relevant', label: t('sort_default') },
    { value: 'price_asc', label: t('price_low_high') },
    { value: 'price_desc', label: t('price_high_low') },
    { value: 'rating', label: t('reviews') },
    { value: 'discount', label: t('discount') },
  ];

  useEffect(() => {
    const cat = searchParams.get('cat');
    const q = searchParams.get('q');
    if (cat) setActiveCategory(cat);
    if (q) setSearch(q);
  }, [searchParams]);

  let filtered = products.filter(p => {
    const matchCat = activeCategory === 'all' || p.category === activeCategory;
    const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase());
    const matchPrice = p.price >= priceRange[0] && p.price <= priceRange[1];
    return matchCat && matchSearch && matchPrice;
  });

  if (sort === 'price_asc') filtered = [...filtered].sort((a, b) => a.price - b.price);
  if (sort === 'price_desc') filtered = [...filtered].sort((a, b) => b.price - a.price);
  if (sort === 'rating') filtered = [...filtered].sort((a, b) => b.rating - a.rating);
  if (sort === 'discount') filtered = [...filtered].sort((a, b) => b.discount - a.discount);

  const handleCategory = (id) => {
    setActiveCategory(id);
    setSearchParams(id !== 'all' ? { cat: id } : {});
    setSidebarOpen(false);
  };

  if (loading) {
    return (
      <div className="shop-loading" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '80vh', gap: '16px', paddingTop: '80px' }}>
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
    <div className="shop-page">
      <div className="shop-layout">
        {/* Sidebar */}
        <aside className={`shop-sidebar${sidebarOpen ? ' open' : ''}`}>
          <div className="sidebar-header">
            <h3>{t('filters')}</h3>
            <button className="close-sidebar" onClick={() => setSidebarOpen(false)}>✕</button>
          </div>

          <div className="filter-section">
            <h4 className="filter-title">{t('category').toUpperCase()}</h4>
            <div className="filter-list">
              {categories.map(cat => (
                <button
                  key={cat.id}
                  className={`filter-item${activeCategory === cat.id ? ' active' : ''}`}
                  onClick={() => handleCategory(cat.id)}
                >
                  <span>{cat.icon}</span>
                  <span>{cat.name}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="filter-section">
            <h4 className="filter-title">{t('price').toUpperCase()}</h4>
            <div className="price-range">
              <input
                type="range"
                min={0}
                max={200000}
                step={1000}
                value={priceRange[1]}
                onChange={e => setPriceRange([0, +e.target.value])}
                className="range-slider"
              />
              <div className="range-labels">
                <span>₹0</span>
                <span>₹{priceRange[1].toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>
        </aside>

        {/* Main */}
        <main className="shop-main">
          {/* Toolbar */}
          <div className="shop-toolbar">
            <button className="filter-toggle" onClick={() => setSidebarOpen(!sidebarOpen)}>
              ⚙ {t('filters')}
            </button>
            <p className="results-count">
              {t('found_products', { count: filtered.length })}
              {search && <> for "<em>{search}</em>"</>}
            </p>
            <div className="sort-bar">
              <span className="sort-label">{t('sort_by')}:</span>
              {SORT_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  className={`sort-btn${sort === opt.value ? ' active' : ''}`}
                  onClick={() => setSort(opt.value)}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Products */}
          {filtered.length === 0 ? (
            <div className="no-products">
              <div className="no-products-emoji">🔍</div>
              <h2>{t('out_of_stock')} / No products found</h2>
              <button onClick={() => { setSearch(''); setActiveCategory('all'); setPriceRange([0, 200000]); }}>
                {t('clear_filters')}
              </button>
            </div>
          ) : (
            <div className="shop-grid">
              {filtered.map(p => <ProductCard key={p.id} product={p} />)}
            </div>
          )}
        </main>
      </div>

      {sidebarOpen && <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />}
    </div>
  );
}
