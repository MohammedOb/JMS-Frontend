'use client';

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { systemVarsService } from '@/services';
import { useAuth } from '@/context/AuthContext';

const SystemVarsContext = createContext({ vars: {}, refreshVars: () => {} });

export function SystemVarsProvider({ children }) {
  const { isAuthenticated } = useAuth();
  const [vars, setVars] = useState({});

  const load = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const res  = await systemVarsService.getAll({});
      const data = Array.isArray(res.data) ? res.data : (res.data?.data ?? []);
      setVars(Object.fromEntries(data.map(r => [r.Name, r.Value])));
    } catch {}
  }, [isAuthenticated]);

  useEffect(() => { load(); }, [load]);

  return (
    <SystemVarsContext.Provider value={{ vars, refreshVars: load }}>
      {children}
    </SystemVarsContext.Provider>
  );
}

export function useSystemVars() {
  return useContext(SystemVarsContext);
}
