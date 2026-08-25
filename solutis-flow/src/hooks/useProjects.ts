import { useState, useEffect, useCallback } from 'react';
import { Project } from '../types';
import { mockInitialProjects } from '../mockData';
import { fetchProjects as apiFetchProjects } from '../services/api';

export function useProjects(token?: string) {
  const [projects, setProjects] = useState<Project[]>(() => {
    const saved = localStorage.getItem('flowta_projects');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return mockInitialProjects;
  });

  const refreshProjects = useCallback(async () => {
    try {
      const data = await apiFetchProjects(token);
      if (data && data.length > 0) {
        setProjects(data);
      }
    } catch (e) {
      console.info('Backend unreachable, keeping local projects state');
    }
  }, [token]);

  useEffect(() => {
    refreshProjects();
  }, [refreshProjects]);

  const addProject = useCallback((newProject: Project) => {
    setProjects((prev) => [newProject, ...prev]);
  }, []);

  return {
    projects,
    refreshProjects,
    addProject,
  };
}
