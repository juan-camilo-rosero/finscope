'use client';
import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import type { Solicitud, Status } from '../lib/types';
import type { CrearInput } from '../lib/store';

interface SolicitudesContextValue {
  solicitudes: Solicitud[];
  loading: boolean;
  crearSolicitud: (input: CrearInput) => Promise<Solicitud>;
  cambiarEstado: (id: string, nuevoStatus: Status, meta?: Record<string, unknown>) => Promise<Solicitud>;
  obtener: (id: string) => Solicitud | undefined;
  refetch: () => Promise<void>;
}

const SolicitudesContext = createContext<SolicitudesContextValue>({
  solicitudes: [],
  loading: true,
  crearSolicitud: async () => { throw new Error('Provider no montado'); },
  cambiarEstado:  async () => { throw new Error('Provider no montado'); },
  obtener: () => undefined,
  refetch: async () => {},
});

export function SolicitudesProvider({ children }: { children: React.ReactNode }) {
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([]);
  const [loading, setLoading]         = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const refetch = useCallback(async () => {
    try {
      const res  = await fetch('/api/solicitudes');
      if (!res.ok) return;
      const data = await res.json() as Solicitud[];
      setSolicitudes(data);
    } catch {
      // silencioso en demo — la UI no crashea si el servidor tarda
    }
  }, []);

  // Carga inicial + polling cada 5 s
  useEffect(() => {
    refetch().finally(() => setLoading(false));
    intervalRef.current = setInterval(refetch, 5000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [refetch]);

  const crearSolicitud = useCallback(async (input: CrearInput): Promise<Solicitud> => {
    const res = await fetch('/api/solicitudes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
    if (!res.ok) {
      const err = await res.json() as { error?: string };
      throw new Error(err.error ?? 'Error al crear solicitud');
    }
    const nueva = await res.json() as Solicitud;
    // Optimista: agrega al array local antes del próximo polling
    setSolicitudes(prev => [nueva, ...prev]);
    return nueva;
  }, []);

  const cambiarEstado = useCallback(async (
    id: string, nuevoStatus: Status, meta?: Record<string, unknown>
  ): Promise<Solicitud> => {
    const res = await fetch(`/api/solicitudes/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: nuevoStatus, ...meta }),
    });
    if (!res.ok) {
      const err = await res.json() as { error?: string };
      throw new Error(err.error ?? 'Error al cambiar estado');
    }
    const actualizada = await res.json() as Solicitud;
    // Optimista: reemplaza la solicitud en el array local
    setSolicitudes(prev => prev.map(s => s.id === id ? actualizada : s));
    return actualizada;
  }, []);

  const obtener = useCallback((id: string): Solicitud | undefined => {
    return solicitudes.find(s => s.id === id);
  }, [solicitudes]);

  return (
    <SolicitudesContext.Provider value={{ solicitudes, loading, crearSolicitud, cambiarEstado, obtener, refetch }}>
      {children}
    </SolicitudesContext.Provider>
  );
}

export function useSolicitudes() {
  return useContext(SolicitudesContext);
}
