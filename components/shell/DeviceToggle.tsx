'use client';
import { C } from '../../lib/theme';

interface DeviceToggleProps {
  device: 'desktop' | 'mobile';
  onChange: (d: 'desktop' | 'mobile') => void;
}

export default function DeviceToggle({ device, onChange }: DeviceToggleProps) {
  return (
    <button
      onClick={() => onChange(device === 'desktop' ? 'mobile' : 'desktop')}
      style={{
        display: 'flex', alignItems: 'center', gap: 6,
        background: C.g50, border: `1px solid ${C.g200}`, borderRadius: 8,
        padding: '6px 12px', fontSize: 12, color: C.g700,
        cursor: 'pointer', fontFamily: 'Roboto',
      }}
    >
      {device === 'desktop' ? '📱 Móvil' : '🖥 Desktop'}
    </button>
  );
}
