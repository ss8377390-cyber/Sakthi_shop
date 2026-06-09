import { createContext, useContext, useReducer, useState, useEffect } from 'react';
import { products as localProducts, banners as localBanners } from '../data/products';

const API_BASE_URL = 'http://localhost:8000/api';

const CartContext = createContext();

const cartReducer = (state, action) => {
  switch (action.type) {
    case 'ADD_TO_CART': {
      const exists = state.items.find(i => i.id === action.product.id);
      if (exists) {
        return {
          ...state,
          items: state.items.map(i =>
            i.id === action.product.id ? { ...i, qty: i.qty + 1 } : i
          ),
        };
      }
      return { ...state, items: [...state.items, { ...action.product, qty: 1 }] };
    }
    case 'REMOVE_FROM_CART':
      return { ...state, items: state.items.filter(i => i.id !== action.id) };
    case 'UPDATE_QTY':
      return {
        ...state,
        items: state.items.map(i =>
          i.id === action.id ? { ...i, qty: Math.max(1, action.qty) } : i
        ),
      };
    case 'CLEAR_CART':
      return { ...state, items: [] };
    default:
      return state;
  }
};

const WishlistContext = createContext();

const wishlistReducer = (state, action) => {
  switch (action.type) {
    case 'TOGGLE_WISHLIST': {
      const exists = state.items.find(i => i.id === action.product.id);
      if (exists) return { ...state, items: state.items.filter(i => i.id !== action.product.id) };
      return { ...state, items: [...state.items, action.product] };
    }
    default:
      return state;
  }
};

const ProductsContext = createContext();

export function ProductsProvider({ children }) {
  const [products, setProducts] = useState([]);
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [apiKey, setApiKey] = useState(localStorage.getItem('sakthi_api_key') || 'sakthi_secret_key_2026');

  useEffect(() => {
    localStorage.setItem('sakthi_api_key', apiKey);
  }, [apiKey]);

  const fetchProducts = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/products`);
      if (!res.ok) throw new Error('Failed to fetch from backend API');
      const data = await res.json();
      setProducts(data);
      setError(null);
    } catch (err) {
      console.warn('Backend API connection failed, using local seed products.', err);
      if (!silent) {
        setProducts(localProducts);
        setError('Using local fallback database (Backend offline or unreachable)');
      }
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const fetchBanners = async (silent = false) => {
    try {
      const res = await fetch(`${API_BASE_URL}/banners`);
      if (!res.ok) throw new Error('Failed to fetch banners');
      const data = await res.json();
      setBanners(data);
    } catch (err) {
      console.warn('Failed to fetch banners, using local fallback.', err);
      if (!silent) {
        setBanners(localBanners);
      }
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchBanners();

    // Auto-update webpage when database changes on the backend
    const interval = setInterval(() => {
      fetchProducts(true);
      fetchBanners(true);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const addProduct = async (productData) => {
    const res = await fetch(`${API_BASE_URL}/products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': apiKey
      },
      body: JSON.stringify(productData)
    });
    if (!res.ok) {
      const errData = await res.json();
      throw new Error(errData.detail || 'Failed to add product');
    }
    const newProduct = await res.json();
    setProducts(prev => [newProduct, ...prev]);
    return newProduct;
  };

  const updateProduct = async (id, productData) => {
    const res = await fetch(`${API_BASE_URL}/products/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': apiKey
      },
      body: JSON.stringify(productData)
    });
    if (!res.ok) {
      const errData = await res.json();
      throw new Error(errData.detail || 'Failed to update product');
    }
    const updated = await res.json();
    setProducts(prev => prev.map(p => p.id === id ? updated : p));
    return updated;
  };

  const deleteProduct = async (id) => {
    const res = await fetch(`${API_BASE_URL}/products/${id}`, {
      method: 'DELETE',
      headers: {
        'X-API-Key': apiKey
      }
    });
    if (!res.ok) {
      const errData = await res.json();
      throw new Error(errData.detail || 'Failed to delete product');
    }
    setProducts(prev => prev.filter(p => p.id !== id));
  };

  const uploadImage = async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(`${API_BASE_URL}/products/upload-image`, {
      method: 'POST',
      headers: {
        'X-API-Key': apiKey
      },
      body: formData
    });
    if (!res.ok) {
      const errData = await res.json();
      throw new Error(errData.detail || 'Failed to upload image');
    }
    const data = await res.json();
    return data.image_url;
  };

  const addBanner = async (bannerData) => {
    const res = await fetch(`${API_BASE_URL}/banners`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('sakthi_token')}`
      },
      body: JSON.stringify(bannerData)
    });
    if (!res.ok) {
      const errData = await res.json();
      throw new Error(errData.detail || 'Failed to add banner');
    }
    const newBanner = await res.json();
    setBanners(prev => [...prev, newBanner]);
    return newBanner;
  };

  const updateBanner = async (id, bannerData) => {
    const res = await fetch(`${API_BASE_URL}/banners/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('sakthi_token')}`
      },
      body: JSON.stringify(bannerData)
    });
    if (!res.ok) {
      const errData = await res.json();
      throw new Error(errData.detail || 'Failed to update banner');
    }
    const updated = await res.json();
    setBanners(prev => prev.map(b => b.id === id ? updated : b));
    return updated;
  };

  const deleteBanner = async (id) => {
    const res = await fetch(`${API_BASE_URL}/banners/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('sakthi_token')}`
      }
    });
    if (!res.ok) {
      const errData = await res.json();
      throw new Error(errData.detail || 'Failed to delete banner');
    }
    setBanners(prev => prev.filter(b => b.id !== id));
  };

  return (
    <ProductsContext.Provider value={{
      products,
      banners,
      loading,
      error,
      apiKey,
      setApiKey,
      fetchProducts,
      fetchBanners,
      addProduct,
      updateProduct,
      deleteProduct,
      uploadImage,
      addBanner,
      updateBanner,
      deleteBanner
    }}>
      {children}
    </ProductsContext.Provider>
  );
}

export function CartProvider({ children }) {
  const [state, dispatch] = useReducer(cartReducer, { items: [] });
  const total = state.items.reduce((acc, i) => acc + i.price * i.qty, 0);
  const count = state.items.reduce((acc, i) => acc + i.qty, 0);
  return (
    <CartContext.Provider value={{ ...state, total, count, dispatch }}>
      {children}
    </CartContext.Provider>
  );
}

export function WishlistProvider({ children }) {
  const [state, dispatch] = useReducer(wishlistReducer, { items: [] });
  return (
    <WishlistContext.Provider value={{ ...state, dispatch }}>
      {children}
    </WishlistContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
export const useWishlist = () => useContext(WishlistContext);
export const useProducts = () => useContext(ProductsContext);
