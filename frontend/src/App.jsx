import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { CartProvider, WishlistProvider, ProductsProvider } from './context/ShopContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Shop from './pages/Shop';
import ProductDetail from './pages/ProductDetail';
import Cart from './pages/Cart';
import Wishlist from './pages/Wishlist';
import Checkout from './pages/Checkout';
import Admin from './pages/Admin';
import Login from './pages/Login';
import Signup from './pages/Signup';
import UserDashboard from './pages/UserDashboard';

// Route Guard for authenticated users
function ProtectedRoute({ children }) {
  const { user, token, loading } = useAuth();
  const location = useLocation();

  if (loading) return <div style={{ padding: '80px 20px', textAlign: 'center', fontSize: '16px', color: '#666' }}>Verifying session status...</div>;
  if (!token || !user) return <Navigate to="/login" state={{ from: location }} replace />;

  return children;
}

// Route Guard for administrator access
function AdminRoute({ children }) {
  const { user, token, loading } = useAuth();
  const location = useLocation();

  if (loading) return <div style={{ padding: '80px 20px', textAlign: 'center', fontSize: '16px', color: '#666' }}>Verifying credentials...</div>;
  if (!token || !user || user.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <LanguageProvider>
        <AuthProvider>
          <ProductsProvider>
            <CartProvider>
              <WishlistProvider>
                <Navbar />
                <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/shop" element={<Shop />} />
                <Route path="/product/:id" element={<ProductDetail />} />
                <Route path="/cart" element={<Cart />} />
                <Route path="/wishlist" element={<Wishlist />} />
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
                
                {/* Protected customer routes */}
                <Route path="/checkout" element={
                  <ProtectedRoute>
                    <Checkout />
                  </ProtectedRoute>
                } />
                <Route path="/profile" element={
                  <ProtectedRoute>
                    <UserDashboard />
                  </ProtectedRoute>
                } />

                {/* Restricted Admin routes */}
                <Route path="/admin" element={
                  <AdminRoute>
                    <Admin />
                  </AdminRoute>
                } />
              </Routes>
            </WishlistProvider>
          </CartProvider>
        </ProductsProvider>
      </AuthProvider>
     </LanguageProvider>
    </BrowserRouter>
  );
}
