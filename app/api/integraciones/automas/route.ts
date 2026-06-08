import { NextResponse } from 'next/server';

const delay = (ms: number) => new Promise(r => setTimeout(r, ms));

export async function POST(req: Request) {
  const body = await req.json() as { cedula?: string };
  await delay(1200);
  return NextResponse.json({
    estado: 'ok',
    consultadoEn: new Date().toISOString(),
    data: {
      embargos: 0,
      listasRestrictivas: 'Sin coincidencias',
      cedula: body.cedula,
    },
  });
}
