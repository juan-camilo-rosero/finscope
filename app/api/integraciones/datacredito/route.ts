import { NextResponse } from 'next/server';

const delay = (ms: number) => new Promise(r => setTimeout(r, ms));

export async function POST(req: Request) {
  const body = await req.json() as { cedula?: string };
  await delay(1200);
  return NextResponse.json({
    estado: 'ok',
    consultadoEn: new Date().toISOString(),
    data: {
      score: 748,
      estado: 'Al día',
      obligacionesVigentes: 3,
      mora: 0,
      cedula: body.cedula,
    },
  });
}
