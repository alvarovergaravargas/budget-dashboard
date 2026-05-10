import { useMemo } from 'react';
import { deriveFilteredStats } from '../services/googleSheetsService';

// Returns filtered dashboard stats for a given period, or null when period = 'all'
export const useFilteredData = (data, period) => {
  return useMemo(() => {
    if (!data || period.type === 'all') return null;
    if (!data.allTransactions || !data.allBudgets) return null;
    return deriveFilteredStats(
      data.allTransactions,
      data.allBudgets,
      data.quinceналData || [],
      period
    );
  }, [data, period]);
};

// Human-readable label for a period selection
export const periodLabel = (period, quinceналData = []) => {
  if (period.type === 'all') return 'Año completo';
  if (period.type === 'month') {
    const q = quinceналData.find(q => q.monthIdx === period.monthIdx);
    return q?.month || 'Mes';
  }
  if (period.type === 'quincena') {
    const q = quinceналData.find(q => q.q === period.value);
    return q ? `${period.value} · ${q.name}` : period.value;
  }
  return '';
};
