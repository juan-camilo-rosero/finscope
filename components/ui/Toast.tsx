'use client';
import { useEffect, useRef } from 'react';
import { C } from '../../lib/theme';

interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'info';
  onUndo?: () => void;
  onClose: () => void;
}

const DURATION: Record<'success' | 'error' | 'info', number> = {
  success: 4000,
  error:   8000,
  info:    5000,
};

export default function Toast({ message, type = 'success', onUndo, onClose }: ToastProps) {
  const timerRef  = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  function startTimer() {
    clearTimer();
    timerRef.current = setTimeout(() => onCloseRef.current(), DURATION[type]);
  }
  function clearTimer() {
    if (timerRef.current !== null) { clearTimeout(timerRef.current); timerRef.current = null; }
  }

  useEffect(() => { startTimer(); return clearTimer; }, []);

  const iconColor = type === 'error' ? C.danger : type === 'info' ? C.blue : C.success;

  return (
    <div
      onMouseEnter={clearTimer}
      onMouseLeave={startTimer}
      style={{
        position: 'fixed', bottom: 30, left: '50%', transform: 'translateX(-50%)',
        background: C.g900, color: '#fff', padding: '12px 18px', borderRadius: 10,
        fontSize: 13, zIndex: 500, boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
        display: 'flex', alignItems: 'center', gap: 14,
        animation: 'fadeUp 0.25s ease', whiteSpace: 'nowrap',
      }}
    >
      <svg width="18" height="18" viewBox="0 0 22 22" fill="none">
        <circle cx="11" cy="11" r="10" fill={iconColor} />
        {type !== 'error'
          ? <path d="M6.5 11l3 3 6-6" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          : <path d="M7 7l8 8M15 7l-8 8" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
        }
      </svg>
      {message}
      {onUndo && (
        <button
          onClick={() => { onUndo(); onClose(); }}
          style={{
            background: 'transparent', border: '1px solid rgba(255,255,255,0.4)',
            color: '#fff', padding: '4px 10px', borderRadius: 6,
            fontSize: 12, cursor: 'pointer', fontFamily: 'Roboto',
          }}
        >
          Deshacer
        </button>
      )}
      <button
        onClick={onClose}
        aria-label="Cerrar"
        style={{
          background: 'transparent', border: 'none', cursor: 'pointer',
          color: 'rgba(255,255,255,0.5)', fontSize: 18, lineHeight: 1,
          padding: '0 2px', fontFamily: 'Roboto', display: 'flex', alignItems: 'center',
        }}
      >
        ×
      </button>
    </div>
  );
}
