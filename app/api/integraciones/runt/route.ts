import { NextResponse } from 'next/server';
import { guardarIntegracion } from '../../../../lib/store';

const delay = (ms: number) => new Promise(r => setTimeout(r, ms));

export async function POST(req: Request) {
  const body = await req.json() as { placa?: string; vehiculo?: string; solicitudId?: string };
  await delay(1200);
  const data = {
    propietario: 'Coincide',
    gravamenes: 0,
    soat: 'Vigente',
    revisionTecnica: 'Vigente',
    vehiculo: body.vehiculo ?? body.placa,
  };
  const consultadoEn = new Date().toISOString();
  // Persist to store if solicitudId provided
  if (body.solicitudId) {
    try {
      guardarIntegracion(body.solicitudId, 'runt', { estado: 'ok', data, consultadoEn });
    } catch {
      // Solicitud no encontrada — no bloquear la respuesta
    }
  }
  return NextResponse.json({ estado: 'ok', consultadoEn, data });
}
