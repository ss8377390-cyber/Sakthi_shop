import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();
const API_BASE_URL = 'http://localhost:8000/api';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('sakthi_token') || null);
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);

  // Sync token to localStorage
  useEffect(() => {
    if (token) {
      localStorage.setItem('sakthi_token', token);
    } else {
      localStorage.removeItem('sakthi_token');
    }
  }, [token]);

  // Fetch logged in user and favorites
  const fetchMe = async (authToken) => {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/me`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
      if (res.ok) {
        const userData = await res.json();
        setUser(userData);
        // Also fetch their favorites
        fetchFavorites(authToken);
      } else {
        // Token is invalid/expired
        logout();
      }
    } catch (err) {
      console.error("Error fetching user profile:", err);
      // Backend might be offline, keep state as is to prevent loops
    } finally {
      setLoading(false);
    }
  };

  const fetchFavorites = async (authToken) => {
    try {
      const res = await fetch(`${API_BASE_URL}/users/favorites`, {
        headers: {
          'Authorization': `Bearer ${authToken || token}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setFavorites(data);
      }
    } catch (err) {
      console.error("Error fetching favorites:", err);
    }
  };

  useEffect(() => {
    if (token) {
      fetchMe(token);
    } else {
      setUser(null);
      setFavorites([]);
      setLoading(false);
    }
  }, [token]);

  const login = async (email, password) => {
    const res = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password })
    });
    if (!res.ok) {
      const errData = await res.json();
      throw new Error(errData.detail || 'Login failed');
    }
    const data = await res.json();
    setToken(data.access_token);
    setUser(data.user);
    return data.user;
  };

  const register = async (fullName, email, password) => {
    const res = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ full_name: fullName, email, password })
    });
    if (!res.ok) {
      const errData = await res.json();
      throw new Error(errData.detail || 'Registration failed');
    }
    const data = await res.json();
    setToken(data.access_token);
    setUser(data.user);
    return data.user;
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    setFavorites([]);
  };

  const updateProfile = async (profileData) => {
    if (!token) return;
    const res = await fetch(`${API_BASE_URL}/auth/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(profileData)
    });
    if (!res.ok) {
      const errData = await res.json();
      throw new Error(errData.detail || 'Failed to update profile');
    }
    const updatedUser = await res.json();
    setUser(updatedUser);
    return updatedUser;
  };

  const toggleFavorite = async (productId) => {
    if (!token) {
      throw new Error('Please login to add to favorites');
    }
    const res = await fetch(`${API_BASE_URL}/users/favorites/${productId}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    if (!res.ok) {
      throw new Error('Failed to toggle favorite');
    }
    const data = await res.json();
    setUser(prev => prev ? { ...prev, favorites: data.favorites } : null);
    fetchFavorites(token);
  };

  const isFavorite = (productId) => {
    return user?.favorites?.includes(productId) || false;
  };

  return (
    <AuthContext.Provider value={{
      user,
      token,
      loading,
      favorites,
      login,
      register,
      logout,
      updateProfile,
      toggleFavorite,
      isFavorite,
      fetchFavorites
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
