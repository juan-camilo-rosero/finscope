export const C = {
  magenta:  '#ee252a',
  magentaL: 'rgba(238,37,42,0.08)',
  success:  '#16a34a',
  successL: '#dcfce7',
  warn:     '#f59e0b',
  warnL:    '#fffbeb',
  danger:   '#dc2626',
  dangerL:  '#fef2f2',
  blue:     '#3f5cdd',
  blueL:    '#eff4ff',
  yellow:   '#FFAE00',
  g900:     '#212121',
  g700:     '#616161',
  g500:     '#9E9E9E',
  g200:     '#EEEEEE',
  g50:      '#FAFAFA',
  white:    '#FFFFFF',
} as const;

// Cuota mensual a tasa efectiva anual 15.2%
export function calcCuota(monto: number, plazoMeses: number): number {
  const r = Math.pow(1.152, 1 / 12) - 1;
  return Math.round(monto * r / (1 - Math.pow(1 + r, -plazoMeses)));
}
export const fmt = (n: number) => '$' + n.toLocaleString('es-CO');
export const fmtMiles = (n: number) => Number(n).toLocaleString('es-CO');
