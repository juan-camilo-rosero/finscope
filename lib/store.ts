import type { Solicitud, Status, Semaforo, Flujo } from './types';
export type { Status };
import { calcCuota } from './theme';
import { SEED_SOLICITUDES } from '../data/seed';

// Transiciones permitidas por estado (§7.2 — ajustado en Prompt 01.5)
const TRANSICIONES: Partial<Record<Status, Status[]>> = {
  radicada:          ['en_analisis'],
  en_analisis:       ['en_coordinacion', 'devuelta_analista'],
  devuelta_analista: ['en_analisis', 'en_coordinacion'],
  en_coordinacion:   ['aprobada', 'rechazada', 'devuelta_analista'],
  aprobada:          ['en_coordinacion'],   // reversión para demo (undo toast)
  rechazada:         ['en_coordinacion'],   // reversión para demo (undo toast)
};

export function semaforoDe(status: Status): Semaforo {
  switch (status) {
    case 'aprobada':         return 'green';
    case 'en_analisis':
    case 'en_coordinacion':
    case 'radicada':         return 'yellow';
    case 'devuelta_analista':
    case 'rechazada':        return 'red';
  }
}

function clonar<T>(v: T): T {
  return JSON.parse(JSON.stringify(v));
}

// Store en memoria del servidor — en Vercel no persiste entre lambdas;
// la UI usa Context de cliente como fuente de verdad de sesión (§8.2).
let _store: Solicitud[] = clonar(SEED_SOLICITUDES);

export function reset(): void {
  _store = clonar(SEED_SOLICITUDES);
}

export function listar(filtro?: { status?: Status; flujo?: Flujo; ejecutivo?: string }): Solicitud[] {
  let resultado = _store;
  if (filtro?.status)    resultado = resultado.filter(s => s.status === filtro.status);
  if (filtro?.flujo)     resultado = resultado.filter(s => s.flujo  === filtro.flujo);
  if (filtro?.ejecutivo) resultado = resultado.filter(s => s.analista === filtro.ejecutivo);
  return clonar(resultado);
}

export function obtener(id: string): Solicitud | undefined {
  const s = _store.find(s => s.id === id);
  return s ? clonar(s) : undefined;
}

export interface CrearInput {
  flujo: Flujo;
  origen?: Solicitud['origen'];
  cliente: string;
  cedula: string;
  monto: number;
  plazoMeses: number;
  vehiculo: string;
  tipo: Solicitud['tipo'];
  analista?: string;
  docs?: Solicitud['docs'];
}

export function crear(input: CrearInput): Solicitud {
  const ahora = new Date().toISOString();
  const id = `SOL-${new Date().getFullYear()}-${String(Math.floor(1000 + Math.random() * 8999)).padStart(4, '0')}`;
  const fecha = new Date().toLocaleDateString('es-CO', { day: '2-digit', month: 'short' });

  // Flujo prospectado → directo a coordinador; flujo nuevo → radicada → en_analisis
  const statusInicial: Status =
    input.flujo === 'prospectado' ? 'en_coordinacion' : 'en_analisis';

  const timeline: Solicitud['timeline'] =
    input.flujo === 'prospectado'
      ? [{ label: 'Radicada (prospectado)', date: fecha, done: true },
         { label: 'En coordinación', date: fecha, done: true, active: true }]
      : [{ label: 'Radicada', date: fecha, done: true },
         { label: 'En análisis', date: fecha, done: true, active: true }];

  const nueva: Solicitud = {
    id,
    flujo: input.flujo,
    origen: input.origen ?? (input.flujo === 'prospectado' ? 'finscope_ia' : 'concesionario'),
    cliente: input.cliente,
    cedula: input.cedula,
    monto: input.monto,
    plazoMeses: input.plazoMeses,
    cuota: calcCuota(input.monto, input.plazoMeses),
    vehiculo: input.vehiculo,
    tipo: input.tipo,
    status: statusInicial,
    semaforo: semaforoDe(statusInicial),
    analista: input.analista,
    docs: input.docs ?? [],
    integraciones: {
      datacredito: { estado: 'pendiente' },
      runt:        { estado: 'pendiente' },
      automas:     { estado: 'pendiente' },
      soi:         { estado: 'pendiente' },
    },
    timeline,
    updated: 'Justo ahora',
    createdAt: ahora,
  };
  _store.push(nueva);
  return clonar(nueva);
}

export function cambiarEstado(
  id: string,
  nuevoStatus: Status,
  meta?: { motivo?: string; analista?: string; coordinador?: string; analista_override?: boolean; motivoAnulacion?: string }
): Solicitud {
  const idx = _store.findIndex(s => s.id === id);
  if (idx === -1) throw new Error(`Solicitud ${id} no encontrada`);

  const sol = _store[idx];
  const permitidos = TRANSICIONES[sol.status] ?? [];
  if (!permitidos.includes(nuevoStatus)) {
    throw new Error(`Transición inválida: ${sol.status} → ${nuevoStatus}`);
  }

  sol.status    = nuevoStatus;
  sol.semaforo  = semaforoDe(nuevoStatus);
  sol.updated   = 'Justo ahora';

  if (meta?.analista)            sol.analista          = meta.analista;
  if (meta?.coordinador)         sol.coordinador       = meta.coordinador;
  if (meta?.analista_override)   sol.analista_override = meta.analista_override;
  if (meta?.motivoAnulacion)     sol.motivoAnulacion   = meta.motivoAnulacion;

  const labelMap: Record<Status, string> = {
    radicada:          'Radicada',
    en_analisis:       'En análisis',
    devuelta_analista: 'Devuelta al analista',
    en_coordinacion:   'En coordinación',
    aprobada:          'Aprobada',
    rechazada:         'Rechazada',
  };

  const fecha = new Date().toLocaleDateString('es-CO', { day: '2-digit', month: 'short' });
  sol.timeline = sol.timeline.map(t => ({ ...t, active: false }));
  sol.timeline.push({ label: labelMap[nuevoStatus], date: fecha, done: true, active: true });

  _store[idx] = sol;
  return clonar(sol);
}
