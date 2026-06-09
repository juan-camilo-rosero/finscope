'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../../../lib/firebase/firebase.config';
import Logo from '../../../components/shell/Logo';
import { C } from '../../../lib/theme';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd]   = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

  // ── Recuperación de contraseña ──────────────────────────────────────────────
  const [resetMode, setResetMode]     = useState(false);
  const [resetEmail, setResetEmail]   = useState('');
  const [resetSent, setResetSent]     = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError]   = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const cred    = await signInWithEmailAndPassword(auth, email, password);
      const idToken = await cred.user.getIdToken();

      const res = await fetch('/api/auth/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      });

      if (!res.ok) {
        const data = await res.json() as { error?: string };
        setError(data.error ?? 'Error al iniciar sesión');
        return;
      }

      const { home } = await res.json() as { home: string };
      router.push(home);
    } catch (err: unknown) {
      const code = (err as { code?: string }).code ?? '';
      if (code === 'auth/invalid-credential' || code === 'auth/user-not-found' || code === 'auth/wrong-password') {
        setError('Correo o contraseña incorrectos');
      } else if (code === 'auth/too-many-requests') {
        setError('Demasiados intentos fallidos. Espera unos minutos o restablece tu contraseña.');
      } else {
        setError('Error al iniciar sesión. Intenta de nuevo.');
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleResetSubmit(e: React.FormEvent) {
    e.preventDefault();
    setResetError('');
    setResetLoading(true);
    try {
      await sendPasswordResetEmail(auth, resetEmail);
      setResetSent(true);
    } catch (err: unknown) {
      const code = (err as { code?: string }).code ?? '';
      if (code === 'auth/user-not-found') {
        setResetError('No existe una cuenta con ese correo.');
      } else {
        setResetError('No se pudo enviar el correo. Intenta de nuevo.');
      }
    } finally {
      setResetLoading(false);
    }
  }

  function openReset() {
    setResetEmail(email);
    setResetSent(false);
    setResetError('');
    setResetMode(true);
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '11px 14px', fontSize: 14,
    borderRadius: 9, border: `1px solid ${C.g200}`,
    fontFamily: 'Roboto', outline: 'none', color: C.g900,
    background: C.white,
  };

  return (
    <div style={{
      minHeight: '100vh', background: '#EDECEA',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 20,
    }}>
      <div style={{
        background: C.white, borderRadius: 16, padding: 40,
        maxWidth: 400, width: '100%',
        boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 8 }}>
          <Logo size="md" />
        </div>
        <p style={{ fontSize: 13, color: C.g500, textAlign: 'center', marginBottom: 28 }}>
          Ingresa con tu cuenta
        </p>

        {/* ── Formulario de login ─────────────────────────────────────────── */}
        {!resetMode ? (
          <>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 500, color: C.g700, display: 'block', marginBottom: 6 }}>
                  Correo electrónico
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="usuario@finscope.co"
                  required
                  style={inputStyle}
                  autoComplete="email"
                />
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 500, color: C.g700, display: 'block', marginBottom: 6 }}>
                  Contraseña
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPwd ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    style={{ ...inputStyle, paddingRight: 44 }}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwd(v => !v)}
                    style={{
                      position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                      background: 'none', border: 'none', cursor: 'pointer', color: C.g500, padding: 0,
                    }}
                    aria-label={showPwd ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  >
                    {showPwd
                      ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                      : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                    }
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                style={{
                  width: '100%', padding: 13, borderRadius: 12,
                  background: loading ? C.g500 : C.magenta,
                  color: '#fff', fontSize: 15, fontWeight: 600,
                  border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
                  fontFamily: 'Roboto', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                  transition: 'background 0.2s',
                }}
              >
                {loading && (
                  <div style={{
                    width: 16, height: 16, borderRadius: '50%',
                    border: '2px solid rgba(255,255,255,0.4)',
                    borderTopColor: '#fff',
                    animation: 'spin 0.7s linear infinite',
                  }} />
                )}
                {loading ? 'Ingresando…' : 'Ingresar'}
              </button>

              {error && (
                <p style={{ fontSize: 13, color: C.danger, textAlign: 'center', margin: 0 }}>{error}</p>
              )}
            </form>

            <div style={{ textAlign: 'center', marginTop: 12 }}>
              <button
                type="button"
                onClick={openReset}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  fontSize: 12, color: C.g500, textDecoration: 'underline', fontFamily: 'Roboto',
                }}
              >
                ¿Olvidaste tu contraseña?
              </button>
            </div>
          </>
        ) : (
          /* ── Formulario de recuperación ──────────────────────────────────── */
          <div>
            {!resetSent ? (
              <form onSubmit={handleResetSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <p style={{ fontSize: 14, fontWeight: 600, color: C.g900, marginBottom: 4 }}>
                    Restablecer contraseña
                  </p>
                  <p style={{ fontSize: 12, color: C.g500, lineHeight: 1.6 }}>
                    Ingresa tu correo y te enviaremos un enlace para crear una nueva contraseña.
                  </p>
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 500, color: C.g700, display: 'block', marginBottom: 6 }}>
                    Correo electrónico
                  </label>
                  <input
                    type="email"
                    required
                    value={resetEmail}
                    onChange={e => setResetEmail(e.target.value)}
                    placeholder="usuario@finscope.co"
                    style={inputStyle}
                    autoFocus
                  />
                </div>
                {resetError && (
                  <p style={{ fontSize: 12, color: C.danger, margin: 0 }}>{resetError}</p>
                )}
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    type="button"
                    onClick={() => setResetMode(false)}
                    style={{
                      flex: 1, padding: 11, borderRadius: 9, background: 'transparent',
                      border: `1px solid ${C.g200}`, color: C.g700,
                      fontSize: 13, cursor: 'pointer', fontFamily: 'Roboto',
                    }}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={resetLoading}
                    style={{
                      flex: 2, padding: 11, borderRadius: 9,
                      background: resetLoading ? C.g500 : C.magenta,
                      color: '#fff', fontSize: 13, fontWeight: 600,
                      border: 'none', cursor: resetLoading ? 'not-allowed' : 'pointer',
                      fontFamily: 'Roboto',
                    }}
                  >
                    {resetLoading ? 'Enviando…' : 'Enviar enlace'}
                  </button>
                </div>
              </form>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{
                  background: '#f0fdf4', border: '1px solid #86efac',
                  borderRadius: 10, padding: '14px 16px', fontSize: 13, color: '#166534', lineHeight: 1.6,
                }}>
                  Enviamos un enlace a <strong>{resetEmail}</strong>. Revisa tu bandeja de entrada (y la carpeta de spam).
                </div>
                <button
                  type="button"
                  onClick={() => { setResetMode(false); setResetSent(false); }}
                  style={{
                    width: '100%', padding: 11, borderRadius: 9,
                    background: C.magenta, color: '#fff',
                    fontSize: 13, fontWeight: 600, border: 'none',
                    cursor: 'pointer', fontFamily: 'Roboto',
                  }}
                >
                  Volver al inicio de sesión
                </button>
              </div>
            )}
          </div>
        )}

        {/* Links al cliente */}
        {!resetMode && (
          <div style={{ marginTop: 24, textAlign: 'center', display: 'flex', gap: 8, justifyContent: 'center', alignItems: 'center', flexWrap: 'wrap' }}>
            <a href="/cliente/radicar" style={{ fontSize: 12, color: C.blue, textDecoration: 'none' }}>
              ¿Cliente nuevo? Radica tu solicitud →
            </a>
            <span style={{ fontSize: 12, color: C.g200 }}>·</span>
            <a href="/cliente/index.html" target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: C.blue, textDecoration: 'none' }}>
              Ver experiencia cliente B2C ↗
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
