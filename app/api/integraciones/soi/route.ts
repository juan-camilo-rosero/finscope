import { NextResponse } from 'next/server';
import { guardarIntegracion } from '../../../../lib/store';

const delay = (ms: number) => new Promise(r => setTimeout(r, ms));

export async function POST(req: Request) {
  const body = await req.json() as { cedula?: string; solicitudId?: string };
  await delay(1200);
  const data = {
    aportes: 'Al día',
    ultimoPago: '2026-04',
    cedula: body.cedula,
  };
  const consultadoEn = new Date().toISOString();
  // Persist to store if solicitudId provided
  if (body.solicitudId) {
    try {
      guardarIntegracion(body.solicitudId, 'soi', { estado: 'ok', data, consultadoEn });
    } catch {
      // Solicitud no encontrada — no bloquear la respuesta
    }
  }
  return NextResponse.json({ estado: 'ok', consultadoEn, data });
}
