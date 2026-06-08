import type { Role } from './types';

export const ROLE_BY_EMAIL: Record<string, Role> = {
  'cliente@finscope.co':     'cliente',
  'analista@finscope.co':    'analista',
  'coordinador@finscope.co': 'coordinador',
};

export const HOME_BY_ROLE: Record<Role, string> = {
  cliente:     '/cliente/radicar',
  analista:    '/analista/cola',
  coordinador: '/coordinador/dashboard',
};

/** Rutas accesibles por cada rol (prefijos) */
export const RUTAS_POR_ROL: Record<Role, string[]> = {
  cliente:     ['/cliente'],
  analista:    ['/analista'],
  coordinador: ['/coordinador'],
};
