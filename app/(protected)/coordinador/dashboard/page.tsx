'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import NavBar from '../../../../components/shell/NavBar';
import DeviceToggle from '../../../../components/shell/DeviceToggle';
import { C, fmt } from '../../../../lib/theme';
import { useSolicitudes } from '../../../../context/SolicitudesProvider';
import type { Solicitud, Status } from '../../../../lib/types';

const TABS = [
  { label: 'Dashboard', href: '/coordinador/dashboard' },
  { label: 'Cola de decisión', href: '/coordinador/cola' },
];

const STATUS_LABEL: Record<Status, string> = {
  radicada:          'Radicada',
  en_analisis:       'En análisis',
  en_coordinacion:   'En coordinación',
  devuelta_analista: 'Devuelta al analista',
  aprobada:          'Aprobada',
  rechazada:         'Rechazada',
};

const SEM = {
  green:  { bg: '#f0fdf4', color: '#22c55e', dot: '#22c55e' },
  yellow: { bg: '#fffbeb', color: '#f59e0b', dot: '#f59e0b' },
  red:    { bg: '#fef2f2', color: '#ef4444', dot: '#ef4444' },
} as const;

const IA_CHIP = {
  aprobar:  { bg: C.successL, color: C.success, label: 'Motor: Aprobar' },
  revisar:  { bg: C.warnL,    color: C.warn,    label: 'Motor: Revisar' },
  rechazar: { bg: C.dangerL,  color: C.danger,  label: 'Motor: Rechazar' },
} as const;

function OriginChip({ origen }: { origen: Solicitud['origen'] }) {
  if (origen === 'finscope_ia') {
    return (
      <span style={{ fontSize: 11, fontWeight: 600, background: C.blueL, color: C.blue, borderRadius: 6, padding: '3px 9px', whiteSpace: 'nowrap' }}>
        ⚡ IA · Finscope
      </span>
    );
  }
  return (
    <span style={{ fontSize: 11, fontWeight: 500, background: C.g50, color: C.g500, borderRadius: 6, padding: '3px 9px', border: `1px solid ${C.g200}`, whiteSpace: 'nowrap' }}>
      Concesionario
    </span>
  );
}

function DrawerPanel({ sol, onClose }: { sol: Solicitud; onClose: () => void }) {
  const router = useRouter();
  const sp = SEM[sol.semaforo];

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.25)', zIndex: 200 }} />
      <div style={{
        position: 'fixed', right: 0, top: 0, bottom: 0, width: 500,
        background: C.white, zIndex: 201, animation: 'slideIn 0.25s ease',
        display: 'flex', flexDirection: 'column', boxShadow: '-8px 0 40px rgba(0,0,0,0.10)',
      }}>
        {/* Header */}
        <div style={{ padding: '18px 20px', borderBottom: `1px solid ${C.g200}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: C.g900 }}>{sol.cliente}</div>
            <div style={{ fontSize: 12, color: C.g500 }}>{sol.id} · {fmt(sol.monto)} · {sol.plazoMeses} meses</div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: C.g500, lineHeight: 1 }}>✕</button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: 20, display: 'flex', flexDirection: 'column', gap: 18 }}>
          {/* Sección 1 — Estado */}
          <div style={{ background: sp.bg, border: `1px solid ${sp.dot}30`, borderRadius: 10, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: sp.dot, flexShrink: 0 }} />
            <div style={{ fontSize: 14, fontWeight: 600, color: sp.color }}>{STATUS_LABEL[sol.status]}</div>
          </div>

          {/* Sección 2 — Detección IA (solo prospectado) */}
          {sol.flujo === 'prospectado' && sol.ia_recomendacion && (() => {
            const rec = sol.ia_recomendacion;
            const chip = IA_CHIP[rec.decision];
            return (
              <div style={{ background: C.blueL, border: `1px solid ${C.blue}30`, borderRadius: 12, padding: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, background: C.blue, color: '#fff', borderRadius: 6, padding: '3px 9px' }}>
                    ⚡ Detectado por Finscope IA
                  </span>
                  <span style={{ fontSize: 11, color: C.g500 }}>
                    {new Date(rec.generadoEn).toLocaleDateString('es-CO')}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 11, fontWeight: 600, background: chip.bg, color: chip.color, borderRadius: 6, padding: '3px 9px' }}>
                    Recomendación: {rec.decision.toUpperCase()}
                  </span>
                  <span style={{ fontSize: 12, color: C.g700 }}>
                    Score: <strong>{rec.score}</strong> / 1000
                  </span>
                </div>
                <p style={{ fontSize: 13, color: C.g700, lineHeight: 1.6 }}>{rec.motivo}</p>
              </div>
            );
          })()}

          {/* Sección 3 — Línea de tiempo */}
          <div style={{ background: C.white, borderRadius: 12, padding: 16, border: `1px solid ${C.g200}` }}>
            <p style={{ fontSize: 11, fontWeight: 600, color: C.g500, textTransform: 'uppercase', letterSpacing: '0.7px', marginBottom: 14 }}>
              Línea de tiempo
            </p>
            {sol.timeline.map((ev, i) => (
              <div key={i} style={{ display: 'flex', gap: 12, marginBottom: i < sol.timeline.length - 1 ? 16 : 0 }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div style={{
                    width: 24, height: 24, borderRadius: '50%', flexShrink: 0,
                    background: ev.done ? C.magenta : ev.active ? C.magentaL : C.g200,
                    border: ev.active ? `2px solid ${C.magenta}` : 'none',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {ev.done
                      ? <svg width="11" height="8" viewBox="0 0 11 8" fill="none"><path d="M1 4l3 3 6-6" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                      : ev.active
                        ? <div style={{ width: 8, height: 8, borderRadius: '50%', background: C.magenta }} />
                        : <div style={{ width: 7, height: 7, borderRadius: '50%', background: C.g500 }} />}
                  </div>
                  {i < sol.timeline.length - 1 && (
                    <div style={{ width: 2, height: 18, background: ev.done ? C.magenta : C.g200, margin: '3px 0' }} />
                  )}
                </div>
                <div style={{ paddingTop: 2 }}>
                  <div style={{ fontSize: 13, fontWeight: ev.active ? 600 : 400, color: ev.done || ev.active ? C.g900 : C.g500 }}>
                    {ev.label}
                  </div>
                  <div style={{ fontSize: 11, color: ev.active ? C.magenta : C.g500, marginTop: 1 }}>{ev.date}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Sección 4 — Documentos */}
          <div style={{ background: C.white, borderRadius: 12, padding: 16, border: `1px solid ${C.g200}` }}>
            <p style={{ fontSize: 11, fontWeight: 600, color: C.g500, textTransform: 'uppercase', letterSpacing: '0.7px', marginBottom: 12 }}>
              Documentos
            </p>
            {sol.docs.map((doc, i) => (
              <div key={doc.nombre} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '8px 0', borderBottom: i < sol.docs.length - 1 ? `1px solid ${C.g200}` : 'none',
                fontSize: 13,
              }}>
                <span style={{ color: C.g700 }}>{doc.nombre}</span>
                <span style={{ fontSize: 12, fontWeight: 500, color: doc.estado === 'validado' ? '#22c55e' : doc.estado === 'rechazado' ? '#ef4444' : '#f59e0b' }}>
                  {doc.estado === 'validado' ? '✓ Validado' : doc.estado === 'rechazado' ? '✕ Rechazado' : 'Pendiente'}
                </span>
              </div>
            ))}
          </div>

          {/* Sección 5 — CTA */}
          {sol.status === 'en_coordinacion' && (
            <button
              onClick={() => { onClose(); router.push(`/coordinador/cola?id=${sol.id}`); }}
              style={{
                width: '100%', padding: 13, borderRadius: 12,
                background: C.magenta, color: '#fff', fontSize: 14, fontWeight: 600,
                border: 'none', cursor: 'pointer', fontFamily: 'Roboto',
                boxShadow: `0 4px 12px ${C.magenta}40`,
              }}
            >
              Ir a tomar decisión →
            </button>
          )}
        </div>
      </div>
    </>
  );
}

type FilterKey = 'todas' | 'accion' | 'ia' | 'historial';

const FILTER_TABS: Array<{ value: FilterKey; label: string }> = [
  { value: 'todas',    label: 'Todas' },
  { value: 'accion',   label: 'Requieren acción' },
  { value: 'ia',       label: 'Detectados por IA' },
  { value: 'historial',label: 'Historial' },
];

export default function CoordinadorDashboard() {
  const router = useRouter();
  const { solicitudes, loading, refetch } = useSolicitudes();
  const [device, setDevice] = useState<'desktop' | 'mobile'>('desktop');
  const [filter, setFilter] = useState<FilterKey>('todas');
  const [selected, setSelected] = useState<Solicitud | null>(null);

  useEffect(() => {
    const t = setInterval(refetch, 5000);
    return () => clearInterval(t);
  }, [refetch]);

  async function handleLogout() {
    await fetch('/api/auth/session', { method: 'DELETE' });
    router.push('/login');
  }

  async function handleReset() {
    await fetch('/api/reset', { method: 'POST' });
    await refetch();
  }

  const visibles = solicitudes.filter(s => s.status !== 'en_analisis');

  const displayed = visibles.filter(s => {
    if (filter === 'accion')    return s.status === 'en_coordinacion';
    if (filter === 'ia')        return s.origen === 'finscope_ia';
    if (filter === 'historial') return s.status === 'aprobada' || s.status === 'rechazada';
    return true;
  });

  const metrics = [
    { label: 'Solicitudes activas',  val: visibles.filter(s => s.status !== 'aprobada' && s.status !== 'rechazada').length, accent: false },
    { label: 'Requieren acción',      val: visibles.filter(s => s.status === 'en_coordinacion').length,  accent: true  },
    { label: 'Detectados por IA',     val: visibles.filter(s => s.origen === 'finscope_ia').length,     accent: false },
    { label: 'Aprobadas',             val: visibles.filter(s => s.status === 'aprobada').length,        accent: false },
  ];

  const desktopContent = (
    <div style={{ marginTop: 52, padding: '24px 32px', minHeight: 'calc(100vh - 52px)', overflowY: 'auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: C.g900 }}>Cola de coordinación</h1>
        <span style={{ fontSize: 13, color: C.g500 }}>
          {visibles.length} solicitudes visibles
        </span>
      </div>

      {/* Métricas */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 24 }}>
        {metrics.map(m => (
          <div key={m.label} style={{
            background: m.accent ? C.magentaL : C.white, borderRadius: 14,
            padding: '18px 20px', border: `1px solid ${m.accent ? C.magenta + '40' : C.g200}`,
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
          }}>
            <div style={{ fontSize: 12, color: C.g500, marginBottom: 6 }}>{m.label}</div>
            <div style={{ fontSize: 28, fontWeight: 700, color: m.accent ? C.magenta : C.g900 }}>{m.val}</div>
          </div>
        ))}
      </div>

      {/* Filtros */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {FILTER_TABS.map(f => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            style={{
              padding: '6px 14px', borderRadius: 20, fontSize: 13,
              border: `1px solid ${filter === f.value ? C.magenta : C.g200}`,
              background: filter === f.value ? C.magentaL : C.white,
              color: filter === f.value ? C.magenta : C.g700,
              cursor: 'pointer', fontFamily: 'Roboto', fontWeight: filter === f.value ? 600 : 400,
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Tabla */}
      <div style={{ background: C.white, borderRadius: 14, overflow: 'hidden', border: `1px solid ${C.g200}`, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
        <div style={{
          display: 'grid', gridTemplateColumns: '14px 1fr 150px 1fr 140px 160px',
          padding: '10px 16px', borderBottom: `1px solid ${C.g200}`,
          background: C.g50, gap: 12,
        }}>
          {['', 'Cliente', 'Origen', 'Etapa', 'Actualización', 'Acción'].map((h, i) => (
            <div key={i} style={{ fontSize: 11, fontWeight: 600, color: C.g500, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{h}</div>
          ))}
        </div>

        {loading ? (
          <div style={{ padding: 32, textAlign: 'center', color: C.g500, fontSize: 14 }}>Cargando…</div>
        ) : displayed.length === 0 ? (
          <div style={{ padding: 32, textAlign: 'center', color: C.g500, fontSize: 14 }}>No hay solicitudes en este filtro</div>
        ) : displayed.map(sol => {
          const sp = SEM[sol.semaforo];
          const isIA = sol.origen === 'finscope_ia';
          return (
            <div
              key={sol.id}
              style={{
                display: 'grid', gridTemplateColumns: '14px 1fr 150px 1fr 140px 160px',
                padding: '13px 16px', borderBottom: `1px solid ${C.g200}`,
                alignItems: 'center', gap: 12,
                borderLeft: isIA ? `4px solid ${C.blue}` : '4px solid transparent',
              }}
            >
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: sp.dot }} />
              <div>
                <div style={{ fontSize: 14, fontWeight: 500, color: C.g900 }}>{sol.cliente}</div>
                <div style={{ fontSize: 11, color: C.g500 }}>{sol.id}</div>
                <div style={{ fontSize: 11, color: C.g500, marginTop: 1 }}>{fmt(sol.monto)} · {sol.plazoMeses} m</div>
              </div>
              <div><OriginChip origen={sol.origen} /></div>
              <div>
                <div style={{ fontSize: 13, color: sp.color, fontWeight: 500 }}>{STATUS_LABEL[sol.status]}</div>
                {sol.status === 'en_coordinacion' && isIA && sol.ia_recomendacion && (
                  <div style={{ marginTop: 4 }}>
                    <span style={{
                      fontSize: 11, fontWeight: 600,
                      background: IA_CHIP[sol.ia_recomendacion.decision].bg,
                      color: IA_CHIP[sol.ia_recomendacion.decision].color,
                      borderRadius: 6, padding: '2px 7px',
                    }}>
                      {IA_CHIP[sol.ia_recomendacion.decision].label}
                    </span>
                  </div>
                )}
              </div>
              <div style={{ fontSize: 13, color: C.g500 }}>{sol.updated}</div>
              <div>
                {sol.status === 'en_coordinacion' ? (
                  <button
                    onClick={() => router.push(`/coordinador/cola?id=${sol.id}`)}
                    style={{
                      padding: '7px 14px', borderRadius: 7, background: C.magenta,
                      color: '#fff', fontSize: 12, fontWeight: 500, border: 'none',
                      cursor: 'pointer', fontFamily: 'Roboto', whiteSpace: 'nowrap',
                    }}
                  >
                    Tomar decisión
                  </button>
                ) : (
                  <button
                    onClick={() => setSelected(sol)}
                    style={{
                      padding: '7px 14px', borderRadius: 7, background: C.g50,
                      color: C.g700, fontSize: 12, fontWeight: 500,
                      border: `1px solid ${C.g200}`, cursor: 'pointer', fontFamily: 'Roboto', whiteSpace: 'nowrap',
                    }}
                  >
                    {sol.status === 'rechazada' ? 'Ver motivo' : 'Ver detalle'}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  const mobileContent = (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: C.g50 }}>
      <div style={{ padding: '12px 16px', background: C.white, borderBottom: `1px solid ${C.g200}`, flexShrink: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <span style={{ fontSize: 15, fontWeight: 700, color: C.g900 }}>Coordinación</span>
          <span style={{ fontSize: 12, color: C.g500 }}>{visibles.length} casos</span>
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {FILTER_TABS.map(f => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              style={{
                padding: '4px 10px', borderRadius: 14, fontSize: 11,
                border: `1px solid ${filter === f.value ? C.magenta : C.g200}`,
                background: filter === f.value ? C.magentaL : C.white,
                color: filter === f.value ? C.magenta : C.g700,
                cursor: 'pointer', fontFamily: 'Roboto',
              }}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {displayed.map(sol => {
          const sp = SEM[sol.semaforo];
          const isIA = sol.origen === 'finscope_ia';
          return (
            <div
              key={sol.id}
              onClick={() => sol.status === 'en_coordinacion'
                ? router.push(`/coordinador/cola?id=${sol.id}`)
                : setSelected(sol)}
              style={{
                background: C.white, borderBottom: `1px solid ${C.g200}`,
                padding: '14px 16px', cursor: 'pointer',
                borderLeft: isIA ? `3px solid ${C.blue}` : '3px solid transparent',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 9, height: 9, borderRadius: '50%', background: sp.dot, flexShrink: 0 }} />
                  <div style={{ fontSize: 14, fontWeight: 600, color: C.g900 }}>{sol.cliente}</div>
                </div>
                <OriginChip origen={sol.origen} />
              </div>
              <div style={{ fontSize: 12, color: C.g500, marginBottom: 4, paddingLeft: 17 }}>
                {sol.id} · {fmt(sol.monto)}
              </div>
              <div style={{ fontSize: 13, color: sp.color, fontWeight: 500, paddingLeft: 17 }}>
                {STATUS_LABEL[sol.status]}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  return (
    <>
      <NavBar
        rol="coordinador"
        activeLabel="Dashboard"
        tabs={TABS}
        onLogout={handleLogout}
        onReset={handleReset}
        extra={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <a
              href="/cliente/index.html"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                background: 'transparent', color: C.blue, fontSize: 12,
                border: `1px solid ${C.blue}30`, borderRadius: 6, padding: '4px 10px',
                textDecoration: 'none', whiteSpace: 'nowrap',
              }}
            >
              ↗ Demo B2C
            </a>
            <DeviceToggle device={device} onChange={setDevice} />
          </div>
        }
      />
      {device === 'desktop'
        ? desktopContent
        : (
          <div style={{
            marginTop: 52, background: '#EDECEA', minHeight: 'calc(100vh - 52px)',
            display: 'flex', justifyContent: 'center', alignItems: 'flex-start',
            padding: 20, overflowY: 'auto',
          }}>
            <div style={{
              width: 390, height: 760, background: C.white, borderRadius: 24,
              overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
              display: 'flex', flexDirection: 'column',
            }}>
              {mobileContent}
            </div>
          </div>
        )
      }
      {selected && <DrawerPanel sol={selected} onClose={() => setSelected(null)} />}
    </>
  );
}
