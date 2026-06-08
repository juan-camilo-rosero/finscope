import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { listar, crear } from '../../../lib/store';
import type { Status } from '../../../lib/store';
import type { Flujo } from '../../../lib/types';
import type { CrearInput } from '../../../lib/store';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const status    = searchParams.get('status')    as Status | null;
  const flujo     = searchParams.get('flujo')     as Flujo | null;
  const ejecutivo = searchParams.get('ejecutivo') ?? undefined;

  const solicitudes = listar({
    status:    status    ?? undefined,
    flujo:     flujo     ?? undefined,
    ejecutivo: ejecutivo ?? undefined,
  });
  return NextResponse.json(solicitudes);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as CrearInput;
    if (!body.flujo) {
      return NextResponse.json({ error: 'El campo flujo es requerido (prospectado | nuevo)' }, { status: 400 });
    }
    const nueva = crear(body);
    return NextResponse.json(nueva, { status: 201 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error al crear';
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
