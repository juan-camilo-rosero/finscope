'use client';
import { useEffect, useRef, useId, useState } from 'react';
import { C } from '../../lib/theme';

interface ConfirmModalProps {
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'default' | 'danger';
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
}

export default function ConfirmModal({
  title, description, confirmLabel = 'Confirmar', cancelLabel = 'Cancelar',
  variant = 'default', onConfirm, onCancel,
}: ConfirmModalProps) {
  const danger = variant === 'danger';
  const titleId = useId();
  const [loading, setLoading] = useState(false);
  const cancelRef  = useRef<HTMLButtonElement>(null);
  const confirmRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    (danger ? cancelRef : confirmRef).current?.focus();
  }, [danger]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !loading) onCancel();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [loading, onCancel]);

  async function handleConfirm() {
    setLoading(true);
    try {
      await onConfirm();
    } finally {
      setLoading(false);
    }
  }

  const confirmBg = danger ? C.danger : C.success;

  return (
    <>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={loading ? undefined : onCancel}
        style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
          zIndex: 400, display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 20, animation: 'fadeUp 0.2s ease',
        }}
      >
        <div
          onClick={e => e.stopPropagation()}
          style={{
            background: C.white, borderRadius: 16, padding: '26px 24px 20px',
            maxWidth: 420, width: '100%',
            boxShadow: '0 20px 60px rgba(0,0,0,0.25)', animation: 'pop 0.2s ease',
          }}
        >
          <h3 id={titleId} style={{ fontSize: 17, fontWeight: 700, color: C.g900, marginBottom: 8 }}>
            {title}
          </h3>
          {description && (
            <p style={{ fontSize: 13, color: C.g700, lineHeight: 1.7, marginBottom: 22 }}>
              {description}
            </p>
          )}
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              ref={cancelRef}
              onClick={onCancel}
              disabled={loading}
              style={{
                flex: 1, padding: 13, borderRadius: 10,
                background: 'transparent', color: loading ? C.g200 : C.g700,
                fontSize: 14, fontWeight: 500, border: `1px solid ${loading ? C.g200 : C.g200}`,
                cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'Roboto',
                transition: 'color 0.15s',
              }}
            >
              {cancelLabel}
            </button>
            <button
              ref={confirmRef}
              onClick={handleConfirm}
              disabled={loading}
              style={{
                flex: 1, padding: 13, borderRadius: 10,
                background: loading ? confirmBg + 'cc' : confirmBg,
                color: '#fff', fontSize: 14, fontWeight: 600,
                border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
                fontFamily: 'Roboto', display: 'flex', alignItems: 'center',
                justifyContent: 'center', gap: 8, transition: 'background 0.15s',
              }}
            >
              {loading && (
                <div style={{
                  width: 14, height: 14, borderRadius: '50%',
                  border: '2px solid rgba(255,255,255,0.35)',
                  borderTopColor: '#fff',
                  animation: 'spin 0.7s linear infinite',
                  flexShrink: 0,
                }} />
              )}
              {loading ? 'Procesando…' : confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
