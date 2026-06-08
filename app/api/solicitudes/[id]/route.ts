import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { obtener, cambiarEstado } from '../../../../lib/store';
import type { Status } from '../../../../lib/types';

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const sol = obtener(params.id);
  if (!sol) return NextResponse.json({ error: 'No encontrada' }, { status: 404 });
  return NextResponse.json(sol);
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json() as {
      status: Status;
      motivo?: string;
      analista?: string;
      coordinador?: string;
      analista_override?: boolean;
      motivoAnulacion?: string;
    };
    const actualizada = cambiarEstado(params.id, body.status, {
      motivo:            body.motivo,
      analista:          body.analista,
      coordinador:       body.coordinador,
      analista_override: body.analista_override,
      motivoAnulacion:   body.motivoAnulacion,
    });
    return NextResponse.json(actualizada);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error al cambiar estado';
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
