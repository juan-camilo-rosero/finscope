'use client';
import Link from 'next/link';
import Logo from './Logo';
import { C } from '../../lib/theme';
import type { Role } from '../../lib/types';

interface NavTab {
  label: string;
  href: string;
}

interface NavBarProps {
  activeLabel?: string;
  rol: Role;
  tabs?: NavTab[];
  onLogout?: () => void;
  onReset?: () => void;
  extra?: React.ReactNode;
}

const SHOW_RESET = process.env.NEXT_PUBLIC_SHOW_RESET === 'true';

const ROLE_DATA: Record<Role, { iniciales: string; nombreCorto: string; rolLabel: string }> = {
  coordinador: { iniciales: 'CO', nombreCorto: 'Coordinador', rolLabel: 'Coordinador de Crédito' },
  analista:    { iniciales: 'AN', nombreCorto: 'Analista',    rolLabel: 'Analista de Crédito' },
  cliente:     { iniciales: 'CL', nombreCorto: 'Cliente',     rolLabel: '' },
};

export default function NavBar({ activeLabel, rol, tabs = [], onLogout, onReset, extra }: NavBarProps) {
  const { iniciales, nombreCorto, rolLabel } = ROLE_DATA[rol];
  return (
    <div style={{
      height: 52, background: C.white, borderBottom: `1px solid ${C.g200}`,
      display: 'flex', alignItems: 'center', padding: '0 20px', gap: 20,
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
    }}>
      <Logo />

      {tabs.length > 0 ? (
        <div style={{
          display: 'flex', gap: 2, height: '100%', alignItems: 'center',
          flex: 1, overflowX: 'auto', whiteSpace: 'nowrap',
        }}>
          {tabs.map(t => {
            const active = t.label === activeLabel;
            return (
              <Link key={t.href} href={t.href} style={{
                padding: '0 12px', height: '100%', display: 'flex', alignItems: 'center',
                fontSize: 13, fontWeight: active ? 600 : 400,
                color: active ? C.magenta : C.g700,
                borderBottom: active ? `2px solid ${C.magenta}` : '2px solid transparent',
                textDecoration: 'none',
              }}>
                {t.label}
              </Link>
            );
          })}
        </div>
      ) : (
        <div style={{ flex: 1 }} />
      )}

      {SHOW_RESET && onReset && (
        <button
          onClick={onReset}
          style={{
            flexShrink: 0, background: C.g50, color: C.g500,
            border: `1px solid ${C.g200}`, fontSize: 11, borderRadius: 6,
            padding: '3px 8px', cursor: 'pointer', fontFamily: 'Roboto',
          }}
        >
          ↺ Reiniciar demo
        </button>
      )}
      {extra && <div style={{ flexShrink: 0 }}>{extra}</div>}

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
        <div style={{
          width: 32, height: 32, borderRadius: '50%',
          background: C.g900,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#fff', fontSize: 12, fontWeight: 600, flexShrink: 0,
        }}>
          {iniciales}
        </div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 500, color: C.g900, lineHeight: 1.2 }}>{nombreCorto}</div>
          {rolLabel && <div style={{ fontSize: 11, color: C.g500 }}>{rolLabel}</div>}
        </div>
        {onLogout && (
          <button
            onClick={onLogout}
            style={{
              display: 'flex', alignItems: 'center', gap: 5,
              background: 'transparent', border: 'none', cursor: 'pointer',
              color: C.g500, fontSize: 13, padding: '6px 4px', borderRadius: 6,
              fontFamily: 'Roboto',
            }}
          >
            <svg width={15} height={15} viewBox="0 0 16 16" fill="none">
              <path d="M6 14H3a1 1 0 01-1-1V3a1 1 0 011-1h3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              <path d="M10 11l3-3-3-3M13 8H6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Salir
          </button>
        )}
      </div>
    </div>
  );
}
