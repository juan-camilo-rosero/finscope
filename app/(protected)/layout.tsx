import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { adminAuth } from '../../lib/firebase/firebase.admin';
import { ROLE_BY_EMAIL } from '../../lib/roles';
import { SolicitudesProvider } from '../../context/SolicitudesProvider';

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = cookies();
  const session     = cookieStore.get('session')?.value;

  if (!session) {
    redirect('/login');
  }

  try {
    let email: string | undefined;
    if (session.startsWith('dev.')) {
      const payload = JSON.parse(Buffer.from(session.slice(4), 'base64url').toString('utf8')) as { email?: string; exp?: number };
      if ((payload.exp ?? 0) < Date.now()) redirect('/login');
      email = payload.email;
    } else {
      const decoded = await adminAuth.verifySessionCookie(session, false);
      email = decoded.email ?? undefined;
    }
    const rol = ROLE_BY_EMAIL[email ?? ''];
    if (!rol) redirect('/login');
  } catch {
    redirect('/login');
  }

  return (
    <SolicitudesProvider>
      {children}
    </SolicitudesProvider>
  );
}
