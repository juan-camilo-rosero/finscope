import { NextResponse, type NextRequest } from 'next/server';

// NOTA: firebase-admin NO funciona en Edge Runtime (middleware de Next.js).
// Este middleware solo verifica existencia de la cookie.
// La verificación criptográfica real (verifySessionCookie + ROLE_BY_EMAIL) ocurre
// en app/(protected)/layout.tsx, que corre en Node.js como Server Component.
//
// FALLBACK si se necesita verificación en middleware (futuro):
// usar el package 'firebase-admin/edge' o migrar a una Route Handler intermedia.

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Rutas siempre públicas: no requieren sesión
  if (
    pathname.startsWith('/cliente') ||
    pathname === '/login' ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname === '/favicon.ico' ||
    pathname === '/imagen.png'
  ) {
    return NextResponse.next();
  }

  const session = req.cookies.get('session')?.value;
  if (!session) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  // Cookie presente → pasa. La verificación real ocurre en el layout protegido.
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|imagen.png).*)'],
};
