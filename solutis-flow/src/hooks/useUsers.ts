import { useState, useEffect, useCallback } from 'react';
import { User } from '../types';
import { mockUsers } from '../mockData';
import { fetchUsers as apiFetchUsers } from '../services/api';

export function useUsers(token?: string) {
  const [users, setUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem('flowta_team_users');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return mockUsers;
  });

  const refreshUsers = useCallback(async () => {
    try {
      const data = await apiFetchUsers(token);
      if (Array.isArray(data) && data.length > 0) {
        setUsers(data);
        localStorage.setItem('flowta_team_users', JSON.stringify(data));
      }
    } catch (e) {
      console.info('Backend unreachable, keeping local team users state');
    }
  }, [token]);

  useEffect(() => {
    refreshUsers();
  }, [refreshUsers]);

  return {
    users,
    refreshUsers,
  };
}
