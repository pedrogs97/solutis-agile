import { useState, useCallback, useEffect } from 'react';
import { User } from '../types';
import { mockUsers } from '../mockData';

const AGILE_LOGIN_URL = (import.meta as any).env?.VITE_AGILE_APP_URL || 'http://localhost:3000/login';

function getInitialToken(): string | null {
  const flowtaToken = typeof window !== 'undefined' ? localStorage.getItem('flowta_token') : null;
  if (flowtaToken) return flowtaToken;

  if (typeof window !== 'undefined') {
    const authStoreRaw = localStorage.getItem('auth-store');
    if (authStoreRaw) {
      try {
        const parsed = JSON.parse(authStoreRaw);
        if (parsed?.state?.accessToken) {
          return parsed.state.accessToken;
        }
      } catch (e) {}
    }
  }
  return null;
}

function getInitialUser(): User {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('flowta_user');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed?.avatar && parsed.avatar.includes('images.unsplash.com')) {
          parsed.avatar = '';
          localStorage.setItem('flowta_user', JSON.stringify(parsed));
        }
        return parsed;
      } catch (e) {}
    }

    const profileStoreRaw = localStorage.getItem('profile-store');
    if (profileStoreRaw) {
      try {
        const parsed = JSON.parse(profileStoreRaw);
        const profile = parsed?.state?.profile;
        if (profile) {
          return {
            id: String(profile.id || 'usr-agile'),
            name: profile.full_name || profile.name || 'Usuário Solutis',
            email: profile.email || 'usuario@solutis.com.br',
            role: (profile.group === 'admin' || profile.group === 'MASTER') ? 'ADMIN' : 'GESTOR',
            avatar: profile.avatar || '',
            areaId: 'area-compras',
          };
        }
      } catch (e) {}
    }
  }
  return { ...mockUsers[1], avatar: '' }; // Default to Gestor without unsplash avatar
}

export function useAuth() {
  const [token, setToken] = useState<string | null>(() => getInitialToken());

  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    if (typeof window !== 'undefined' && localStorage.getItem('flowta_is_logged_in') === 'true') {
      return true;
    }
    return !!getInitialToken();
  });

  const [currentUser, setCurrentUser] = useState<User>(() => getInitialUser());

  // Handoff check from Unified Login (URL params ?token=...&user=...) or existing auth-store
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
            avatar: (parsedUser.avatar && !parsedUser.avatar.includes('images.unsplash.com')) ? parsedUser.avatar : '',
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
    } else {
      // Sync from shared origin stores if present
      const sharedToken = getInitialToken();
      if (sharedToken && !token) {
        setToken(sharedToken);
        setIsLoggedIn(true);
        localStorage.setItem('flowta_token', sharedToken);
        localStorage.setItem('flowta_is_logged_in', 'true');
      }
    }
  }, [token]);

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

