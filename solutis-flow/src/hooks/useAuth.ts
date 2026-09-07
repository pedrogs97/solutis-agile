import { useState, useCallback, useEffect } from 'react';
import { User } from '../types';
import { mockUsers } from '../mockData';

const AGILE_LOGIN_URL = (import.meta as any).env?.VITE_AGILE_APP_URL || 'http://localhost:3000/login';

export function useAuth() {
  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('flowta_token');
  });

  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    return localStorage.getItem('flowta_is_logged_in') === 'true';
  });

  const [currentUser, setCurrentUser] = useState<User>(() => {
    const saved = localStorage.getItem('flowta_user');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return parsed;
      } catch (e) {}
    }
    return mockUsers[1]; // Default to Gestor
  });

  // Handoff check from Unified Login (URL params ?token=...&user=...)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tokenParam = urlParams.get('token');
    const userParam = urlParams.get('user');

    if (tokenParam) {
      localStorage.setItem('flowta_token', tokenParam);
      setToken(tokenParam);
      setIsLoggedIn(true);
      localStorage.setItem('flowta_is_logged_in', 'true');

      if (userParam) {
        try {
          const parsedUser = JSON.parse(decodeURIComponent(userParam));
          const userObj: User = {
            id: String(parsedUser.id || 'usr-agile'),
            name: parsedUser.name || parsedUser.full_name || 'Usuário Solutis',
            email: parsedUser.email || 'usuario@solutis.com.br',
            role: parsedUser.role || 'GESTOR',
            avatar: parsedUser.avatar || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80',
            areaId: parsedUser.areaId || 'area-compras',
          };
          setCurrentUser(userObj);
          localStorage.setItem('flowta_user', JSON.stringify(userObj));
        } catch (err) {
          console.warn('Could not parse userParam:', err);
        }
      }

      // Clean query params from address bar without reloading
      const cleanUrl = window.location.pathname;
      window.history.replaceState({}, document.title, cleanUrl);
    }
  }, []);

  const login = useCallback((user: User, customToken?: string) => {
    setCurrentUser(user);
    setIsLoggedIn(true);
    localStorage.setItem('flowta_is_logged_in', 'true');
    localStorage.setItem('flowta_user', JSON.stringify(user));
    if (customToken) {
      setToken(customToken);
      localStorage.setItem('flowta_token', customToken);
    }
  }, []);

  const logout = useCallback(() => {
    setIsLoggedIn(false);
    setToken(null);
    localStorage.removeItem('flowta_is_logged_in');
    localStorage.removeItem('flowta_user');
    localStorage.removeItem('flowta_token');
    localStorage.removeItem('auth-store');
    localStorage.removeItem('profile-store');
    window.location.href = AGILE_LOGIN_URL;
  }, []);

  const switchRole = useCallback((newRole: User['role']) => {
    const targetUser = mockUsers.find((u) => u.role === newRole) || {
      ...currentUser,
      role: newRole,
    };
    setCurrentUser(targetUser);
    localStorage.setItem('flowta_user', JSON.stringify(targetUser));
  }, [currentUser]);

  return {
    isLoggedIn,
    currentUser,
    token,
    login,
    logout,
    switchRole,
  };
}

