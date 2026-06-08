'use client';
import { useEffect } from 'react';
import { C } from '../../lib/theme';

interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'info';
  onUndo?: () => void;
  onClose: () => void;
}

export default function Toast({ message, type = 'success', onUndo, onClose }: ToastProps) {
  useEffect(() => {
    const t = setTimeout(onClose, 5000);
    return () => clearTimeout(t);
  }, [onClose]);

  const iconColor = type === 'error' ? C.danger : type === 'info' ? C.blue : C.success;

  return (
    <div style={{
      position: 'fixed', bottom: 30, left: '50%', transform: 'translateX(-50%)',
      background: C.g900, color: '#fff', padding: '12px 18px', borderRadius: 10,
      fontSize: 13, zIndex: 500, boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
      display: 'flex', alignItems: 'center', gap: 14,
      animation: 'fadeUp 0.25s ease', whiteSpace: 'nowrap',
    }}>
      <svg width="18" height="18" viewBox="0 0 22 22" fill="none">
        <circle cx="11" cy="11" r="10" fill={iconColor}/>
        {type !== 'error'
          ? <path d="M6.5 11l3 3 6-6" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          : <path d="M7 7l8 8M15 7l-8 8" stroke="#fff" strokeWidth="2" strokeLinecap="round"/>
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
    </div>
  );
}
