import { NextResponse } from 'next/server';
import { guardarIntegracion } from '../../../../lib/store';

const delay = (ms: number) => new Promise(r => setTimeout(r, ms));

export async function POST(req: Request) {
  const body = await req.json() as { cedula?: string; solicitudId?: string };
  await delay(1200);
  const data = {
    embargos: 0,
    listasRestrictivas: 'Sin coincidencias',
    cedula: body.cedula,
  };
  const consultadoEn = new Date().toISOString();
  // Persist to store if solicitudId provided
  if (body.solicitudId) {
    try {
      guardarIntegracion(body.solicitudId, 'automas', { estado: 'ok', data, consultadoEn });
    } catch {
      // Solicitud no encontrada — no bloquear la respuesta
    }
  }
  return NextResponse.json({ estado: 'ok', consultadoEn, data });
}
