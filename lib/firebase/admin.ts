import * as admin from 'firebase-admin';

// Init idempotente — evita doble inicialización en hot-reload de Next.js
function getAdminApp(): admin.app.App {
  if (admin.apps.length) return admin.apps[0]!;

  const serviceAccountB64 = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!serviceAccountB64) {
    // En build sin envs no tronamos; el error aparecerá en runtime si se llama
    return admin.initializeApp({ projectId: 'finscope-placeholder' });
  }

  const serviceAccount = JSON.parse(
    Buffer.from(serviceAccountB64, 'base64').toString('utf8')
  ) as admin.ServiceAccount;

  return admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
}

export const adminAuth = (): admin.auth.Auth => getAdminApp().auth();
