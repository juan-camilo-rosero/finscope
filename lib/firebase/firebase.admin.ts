import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

if (!getApps().length) {
  const saB64 = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (saB64) {
    const sa = JSON.parse(Buffer.from(saB64, 'base64').toString('utf8'));
    initializeApp({ credential: cert(sa) });
  } else {
    // Sin service account: init mínima para que el build no truene.
    // verifySessionCookie fallará en runtime si no se configura la variable.
    initializeApp({ projectId: 'finscope-c1437' });
  }
}

export const adminAuth = getAuth();
