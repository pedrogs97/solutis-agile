import { useState, useCallback } from 'react';
import { User } from '../types';
import { mockUsers } from '../mockData';

export function useAuth() {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    return localStorage.getItem('flowta_is_logged_in') === 'true';
  });

  const [currentUser, setCurrentUser] = useState<User>(() => {
    const saved = localStorage.getItem('flowta_user');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const exists = mockUsers.find((u) => u.id === parsed.id);
        if (exists) return exists;
      } catch (e) {}
    }
    return mockUsers[1]; // Default to Gestor
  });

  const login = useCallback((user: User) => {
    setCurrentUser(user);
    setIsLoggedIn(true);
    localStorage.setItem('flowta_is_logged_in', 'true');
    localStorage.setItem('flowta_user', JSON.stringify(user));
  }, []);

  const logout = useCallback(() => {
    setIsLoggedIn(false);
    localStorage.removeItem('flowta_is_logged_in');
    localStorage.removeItem('flowta_user');
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
    login,
    logout,
    switchRole,
  };
}
