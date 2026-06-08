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
  extra?: React.ReactNode;
}

const ROLE_LABELS: Record<Role, string> = {
  cliente:     'Cliente',
  analista:    'Analista de Crédito',
  coordinador: 'Coordinador',
};

const ROLE_INITIALS: Record<Role, string> = {
  cliente:     'CL',
  analista:    'AN',
  coordinador: 'CO',
};

export default function NavBar({ activeLabel, rol, tabs = [], onLogout, extra }: NavBarProps) {
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

      {extra && <div style={{ flexShrink: 0 }}>{extra}</div>}

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
        <div style={{
          width: 32, height: 32, borderRadius: '50%',
          background: rol === 'coordinador' ? C.magenta : C.g900,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#fff', fontSize: 13, fontWeight: 600,
        }}>
          {ROLE_INITIALS[rol]}
        </div>

        {rol === 'coordinador' ? (
          <span style={{
            fontSize: 11, fontWeight: 600, background: C.blueL, color: C.blue,
            borderRadius: 5, padding: '3px 8px', border: `1px solid ${C.blue}30`,
          }}>
            Coordinador
          </span>
        ) : rol === 'analista' ? (
          <span style={{
            fontSize: 11, fontWeight: 600, background: C.successL, color: C.success,
            borderRadius: 5, padding: '3px 8px', border: `1px solid ${C.success}30`,
          }}>
            Analista
          </span>
        ) : (
          <div style={{ fontSize: 13 }}>
            <div style={{ fontWeight: 500, color: C.g900 }}>{ROLE_LABELS[rol]}</div>
          </div>
        )}

        {onLogout && (
          <button
            onClick={onLogout}
            title="Cerrar sesión"
            style={{
              marginLeft: 4, fontSize: 12, color: C.g500,
              background: 'none', border: `1px solid ${C.g200}`,
              borderRadius: 7, padding: '5px 10px', cursor: 'pointer',
              fontFamily: 'Roboto', display: 'flex', alignItems: 'center', gap: 4,
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            Salir
          </button>
        )}
      </div>
    </div>
  );
}
