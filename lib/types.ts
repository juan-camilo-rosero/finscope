export type Role = 'cliente' | 'analista' | 'coordinador';

/**
 * Flujo del caso:
 * - prospectado: el cliente fue identificado proactivamente por Finscope.
 *   La IA ya emitió una recomendación. Se salta al analista y va directo al coordinador.
 * - nuevo: el cliente llega al concesionario. Pasa por analista → coordinador.
 */
export type Flujo = 'prospectado' | 'nuevo';

/**
 * Máquina de estados — ver §3 de este prompt para las transiciones válidas.
 */
export type Status =
  | 'radicada'             // estado inicial para flujo nuevo (cliente acaba de radicar)
  | 'en_analisis'          // asignada al analista (solo flujo nuevo)
  | 'devuelta_analista'    // coordinador devuelve al analista (solo flujo nuevo)
  | 'en_coordinacion'      // lista para decisión del coordinador (ambos flujos)
  | 'aprobada'             // coordinador aprueba
  | 'rechazada';           // coordinador rechaza (estado terminal)

export type Semaforo = 'green' | 'yellow' | 'red';
export type Tipo = 'Pre-aprobado' | 'Nuevo';

export interface TimelineEvent {
  label: string;
  date: string;
  done?: boolean;
  active?: boolean;
}

export interface IntegracionResultado {
  estado: 'pendiente' | 'ok' | 'error';
  data?: Record<string, unknown>;
  consultadoEn?: string;
}

/**
 * Recomendación generada por IA (solo flujo prospectado).
 */
export interface IARecomendacion {
  decision: 'aprobar' | 'revisar' | 'rechazar';
  score: number;       // 0–1000, p. ej. 748
  motivo: string;      // texto explicativo
  generadoEn: string;  // ISO timestamp
}

export interface Solicitud {
  id: string;
  flujo: Flujo;
  /** De dónde vino la solicitud */
  origen: 'finscope_ia' | 'concesionario';
  cliente: string;
  cedula: string;
  monto: number;
  plazoMeses: number;
  cuota: number;
  vehiculo: string;
  tipo: Tipo;
  status: Status;
  semaforo: Semaforo;
  analista?: string;
  coordinador?: string;
  /** Solo flujo prospectado */
  ia_recomendacion?: IARecomendacion;
  docs: {
    nombre: string;
    estado: 'pendiente' | 'validado' | 'rechazado';
    motivo?: string;
  }[];
  integraciones: {
    datacredito: IntegracionResultado;
    runt: IntegracionResultado;
    automas: IntegracionResultado;
    soi: IntegracionResultado;
  };
  timeline: TimelineEvent[];
  updated: string;
  createdAt: string;
}
