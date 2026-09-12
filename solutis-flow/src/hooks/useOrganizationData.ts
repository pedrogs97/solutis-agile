import { useState, useEffect, useCallback } from 'react';
import { Area, CostCenter } from '../types';
import { mockAreas, mockCostCenters } from '../mockData';
import { fetchAreas as apiFetchAreas, fetchCostCenters as apiFetchCostCenters } from '../services/api';

export function useOrganizationData(token?: string) {
  const [areas, setAreas] = useState<Area[]>(() => {
    const saved = localStorage.getItem('flowta_areas');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return mockAreas;
  });

  const [costCenters, setCostCenters] = useState<CostCenter[]>(() => {
    const saved = localStorage.getItem('flowta_cost_centers');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return mockCostCenters;
  });

  const refreshOrganization = useCallback(async () => {
    try {
      const [areasData, ccsData] = await Promise.all([
        apiFetchAreas(token).catch(() => null),
        apiFetchCostCenters(token).catch(() => null),
      ]);

      if (Array.isArray(areasData) && areasData.length > 0) {
        setAreas(areasData);
        localStorage.setItem('flowta_areas', JSON.stringify(areasData));
      }
      if (Array.isArray(ccsData) && ccsData.length > 0) {
        setCostCenters(ccsData);
        localStorage.setItem('flowta_cost_centers', JSON.stringify(ccsData));
      }
    } catch (e) {
      console.info('Backend unreachable, keeping local organization state');
    }
  }, [token]);

  useEffect(() => {
    refreshOrganization();
  }, [refreshOrganization]);

  return {
    areas,
    costCenters,
    refreshOrganization,
  };
}
