import { NextResponse } from 'next/server';

const delay = (ms: number) => new Promise(r => setTimeout(r, ms));

export async function POST(req: Request) {
  const body = await req.json() as { placa?: string; vehiculo?: string };
  await delay(1200);
  return NextResponse.json({
    estado: 'ok',
    consultadoEn: new Date().toISOString(),
    data: {
      propietario: 'Coincide',
      gravamenes: 0,
      soat: 'Vigente',
      revisionTecnica: 'Vigente',
      vehiculo: body.vehiculo ?? body.placa,
    },
  });
}
