import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import api from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
  quickSwitchRole: (role: 'ADMIN' | 'STAFF' | 'CUSTOMER') => Promise<void>;
  isAdmin: boolean;
  isStaff: boolean;
  isCustomer: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedToken = localStorage.getItem('brightloop_token');
    const savedUser = localStorage.getItem('brightloop_user');

    if (savedToken && savedUser) {
      try {
        setToken(savedToken);
        setUser(JSON.parse(savedUser));
        // Verify with /api/auth/me in background
        api.get('/auth/me')
          .then((res) => {
            if (res.data?.user) {
              setUser(res.data.user);
              localStorage.setItem('brightloop_user', JSON.stringify(res.data.user));
            }
          })
          .catch(() => {
            // invalid session
          });
      } catch (e) {
        localStorage.removeItem('brightloop_token');
        localStorage.removeItem('brightloop_user');
      }
    }
    setLoading(false);
  }, []);

  const login = (newToken: string, newUser: User) => {
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem('brightloop_token', newToken);
    localStorage.setItem('brightloop_user', JSON.stringify(newUser));
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('brightloop_token');
    localStorage.removeItem('brightloop_user');
    window.location.href = '/';
  };

  const quickSwitchRole = async (role: 'ADMIN' | 'STAFF' | 'CUSTOMER') => {
    let email = 'admin@brightloop.io';
    if (role === 'STAFF') email = 'rohan.mehra@brightloop.io';
    if (role === 'CUSTOMER') email = 'customer@brightloop.io';

    try {
      const res = await api.post('/auth/login', {
        email,
        password: 'Brightloop@2026',
      });
      if (res.data?.success) {
        login(res.data.token, res.data.user);
        window.location.reload();
      }
    } catch (err) {
      console.error('Role switch error:', err);
    }
  };

  const isAdmin = user?.role === 'ADMIN';
  const isStaff = user?.role === 'STAFF';
  const isCustomer = user?.role === 'CUSTOMER';

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        logout,
        quickSwitchRole,
        isAdmin,
        isStaff,
        isCustomer,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
