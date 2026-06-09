import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Login.css';

export default function Signup() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      await register(fullName, email, password);
      navigate('/');
    } catch (err) {
      setError(err.message || 'Registration failed. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page-container">
      <div className="auth-card">
        {/* Left Side Info Panel */}
        <div className="auth-info-panel signup-theme">
          <h1>Looks like you're new here!</h1>
          <p>Sign up with your details to get started on your shopping journey</p>
          <div className="auth-graphics">✨🚚🎁</div>
        </div>

        {/* Right Side Form Panel */}
        <div className="auth-form-panel">
          <form onSubmit={handleSubmit} className="auth-form">
            {error && <div className="auth-error-toast">{error}</div>}

            <div className="floating-group">
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder=" "
              />
              <label>Enter Full Name</label>
            </div>

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

            <div className="floating-group">
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder=" "
              />
              <label>Confirm Password</label>
            </div>

            <button type="submit" className="auth-submit-btn signup-btn" disabled={loading}>
              {loading ? 'Creating Account...' : 'Continue'}
            </button>

            <div className="auth-switch-link">
              Already have an account? <Link to="/login">Login</Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
