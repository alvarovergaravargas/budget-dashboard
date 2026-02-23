import { useState, useEffect, useCallback } from 'react';
import { fetchDashboardData, getMockData } from '../services/googleSheetsService';

const HAS_CREDENTIALS =
  process.env.REACT_APP_GOOGLE_API_KEY &&
  process.env.REACT_APP_SPREADSHEET_ID &&
  process.env.REACT_APP_GOOGLE_API_KEY !== 'tu_api_key_aqui';

export const useDashboard = () => {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);
  const [isDemo, setIsDemo]   = useState(false);
  const [lastSync, setLastSync] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (!HAS_CREDENTIALS) {
        // Modo demo: datos de muestra
        await new Promise(r => setTimeout(r, 900)); // simular latencia
        setData(getMockData());
        setIsDemo(true);
      } else {
        const result = await fetchDashboardData();
        setData(result);
        setIsDemo(false);
      }
      setLastSync(new Date());
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Auto-refresh cada 5 minutos
  useEffect(() => {
    if (!HAS_CREDENTIALS) return;
    const interval = setInterval(load, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [load]);

  return { data, loading, error, isDemo, lastSync, refresh: load };
};
