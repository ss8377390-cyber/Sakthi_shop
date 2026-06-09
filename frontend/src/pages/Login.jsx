import { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Login.css';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const redirectPath = location.state?.from || '/';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const loggedUser = await login(email, password);
      if (loggedUser.role === 'admin') {
        navigate('/admin');
      } else {
        navigate(redirectPath);
      }
    } catch (err) {
      setError(err.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page-container">
      <div className="auth-card">
        {/* Left Side Info Panel */}
        <div className="auth-info-panel">
          <h1>Login</h1>
          <p>Get access to your Orders, Wishlist and Recommendations</p>
          <div className="auth-graphics">🛒🛍️❤️</div>
        </div>

        {/* Right Side Form Panel */}
        <div className="auth-form-panel">
          <form onSubmit={handleSubmit} className="auth-form">
            {error && <div className="auth-error-toast">{error}</div>}

            <div className="floating-group">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder=" "
              />
              <label>Enter Email Address</label>
            </div>

            <div className="floating-group">
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder=" "
              />
              <label>Enter Password</label>
            </div>

            <p className="terms-text">
              By continuing, you agree to SakthiShop's <span className="blue-link">Terms of Use</span> and <span className="blue-link">Privacy Policy</span>.
            </p>

            <button type="submit" className="auth-submit-btn" disabled={loading}>
              {loading ? 'Logging in...' : 'Login'}
            </button>

            <div className="auth-switch-link">
              New to SakthiShop? <Link to="/signup">Create an account</Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
