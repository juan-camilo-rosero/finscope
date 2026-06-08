'use client';
import { C } from '../../lib/theme';

interface ConfirmModalProps {
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'default' | 'danger';
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmModal({
  title, description, confirmLabel = 'Confirmar', cancelLabel = 'Cancelar',
  variant = 'default', onConfirm, onCancel,
}: ConfirmModalProps) {
  const danger = variant === 'danger';
  return (
    <div
      onClick={onCancel}
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
        <h3 style={{ fontSize: 17, fontWeight: 700, color: C.g900, marginBottom: 8 }}>{title}</h3>
        {description && (
          <p style={{ fontSize: 13, color: C.g700, lineHeight: 1.7, marginBottom: 22 }}>{description}</p>
        )}
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={onCancel}
            style={{
              flex: 1, padding: 13, borderRadius: 10,
              background: 'transparent', color: C.g700,
              fontSize: 14, fontWeight: 500, border: `1px solid ${C.g200}`,
              cursor: 'pointer', fontFamily: 'Roboto',
            }}
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            style={{
              flex: 1, padding: 13, borderRadius: 10,
              background: danger ? C.danger : C.success,
              color: '#fff', fontSize: 14, fontWeight: 600,
              border: 'none', cursor: 'pointer', fontFamily: 'Roboto',
            }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
