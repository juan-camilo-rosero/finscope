import { adminAuth } from '../../../../lib/firebase/firebase.admin';
import { ROLE_BY_EMAIL, HOME_BY_ROLE } from '../../../../lib/roles';

const FIVE_DAYS_MS = 60 * 60 * 24 * 5 * 1000;

function devDecodeIdToken(idToken: string): { email?: string } | null {
  try {
    const parts = idToken.split('.');
    if (parts.length !== 3) return null;
    const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'));
    if (payload.aud !== 'finscope-c1437') return null;
    return { email: payload.email };
  } catch {
    return null;
  }
}

export async function POST(req: Request) {
  try {
    const { idToken } = await req.json() as { idToken: string };
    if (!idToken) return Response.json({ error: 'idToken requerido' }, { status: 400 });

    const noSA = !process.env.FIREBASE_SERVICE_ACCOUNT;
    let email: string | undefined;

    if (noSA) {
      const decoded = devDecodeIdToken(idToken);
      email = decoded?.email;
    } else {
      const decoded = await adminAuth.verifyIdToken(idToken);
      email = decoded.email ?? undefined;
    }

    const rol = ROLE_BY_EMAIL[email ?? ''];
    if (!rol) return Response.json({ error: 'usuario no autorizado' }, { status: 403 });

    let sessionCookie: string;
    const secure = process.env.NODE_ENV === 'production';

    if (noSA) {
      const payload = Buffer.from(JSON.stringify({ email, exp: Date.now() + FIVE_DAYS_MS })).toString('base64url');
      sessionCookie = `dev.${payload}`;
    } else {
      sessionCookie = await adminAuth.createSessionCookie(idToken, { expiresIn: FIVE_DAYS_MS });
    }

    const res = Response.json({ rol, home: HOME_BY_ROLE[rol] });
    res.headers.set(
      'Set-Cookie',
      `session=${sessionCookie}; HttpOnly; ${secure ? 'Secure; ' : ''}SameSite=Lax; Max-Age=${FIVE_DAYS_MS / 1000}; Path=/`,
    );
    return res;
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error de autenticación';
    return Response.json({ error: msg }, { status: 401 });
  }
}

export async function DELETE() {
  const res = Response.json({ ok: true });
  res.headers.set('Set-Cookie', 'session=; HttpOnly; Max-Age=0; Path=/');
  return res;
}
