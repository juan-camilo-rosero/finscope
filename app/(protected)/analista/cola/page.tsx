'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import NavBar from '../../../../components/shell/NavBar';
import { useIsMobile } from '../../../../hooks/useIsMobile';
import Toast from '../../../../components/ui/Toast';
import ConfirmModal from '../../../../components/ui/ConfirmModal';
import { C, fmt } from '../../../../lib/theme';
import { useSolicitudes } from '../../../../context/SolicitudesProvider';
import type { Solicitud } from '../../../../lib/types';

const TABS = [{ label: 'Cola de análisis', href: '/analista/cola' }];

const MOTOR_SEM = {
  aprobar:  { color: C.success, bg: C.successL, label: 'Aprobar',   icon: 'M4 10l5 5 7-8' },
  revisar:  { color: C.warn,    bg: C.warnL,    label: 'Revisar',   icon: 'M10 5v6M10 14v1' },
  rechazar: { color: C.danger,  bg: C.dangerL,  label: 'Rechazar',  icon: 'M5 5l10 10M15 5L5 15' },
} as const;

// ── CaseItem ──────────────────────────────────────────────────────────────────
function MotorBadge({ decision }: { decision: keyof typeof MOTOR_SEM }) {
  const s = MOTOR_SEM[decision] ?? MOTOR_SEM.revisar;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      fontSize: 11, color: s.color, fontWeight: 600,
      background: s.bg, padding: '3px 8px', borderRadius: 12,
      border: `1px solid ${s.color}30`,
    }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: s.color, display: 'inline-block' }} />
      {s.label}
    </span>
  );
}

function StatusDot({ status }: { status: Solicitud['status'] }) {
  const col = status === 'en_analisis' ? C.warn : status === 'devuelta_analista' ? C.danger : C.success;
  return <span style={{ width: 8, height: 8, borderRadius: '50%', background: col, display: 'inline-block', flexShrink: 0 }} />;
}

function CaseItem({ sol, selected, onClick }: { sol: Solicitud; selected: boolean; onClick: () => void }) {
  const rec = sol.ia_recomendacion;
  return (
    <div
      onClick={onClick}
      style={{
        padding: '12px 16px',
        background: selected ? C.magentaL : C.white,
        borderLeft: selected ? `3px solid ${C.magenta}` : '3px solid transparent',
        cursor: 'pointer', borderBottom: `1px solid ${C.g200}`, transition: 'background 0.15s',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 3 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'wrap' }}>
          <StatusDot status={sol.status} />
          <span style={{ fontSize: 14, fontWeight: 600, color: C.g900 }}>{sol.cliente}</span>
          {sol.sarlaft && (
            <span style={{ fontSize: 10, fontWeight: 600, background: C.dangerL, color: C.danger, borderRadius: 4, padding: '2px 6px' }}>
              SARLAFT
            </span>
          )}
        </div>
        {sol.status === 'devuelta_analista' && (
          <span style={{ fontSize: 10, fontWeight: 600, background: C.dangerL, color: C.danger, borderRadius: 4, padding: '2px 6px' }}>
            Devuelto
          </span>
        )}
      </div>
      <div style={{ fontSize: 12, color: C.g500, marginBottom: 6, marginLeft: 15 }}>{sol.id} · {fmt(sol.monto)}</div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginLeft: 15 }}>
        {rec ? <MotorBadge decision={rec.decision} /> : <span />}
        <span style={{ fontSize: 11, color: C.g500 }}>{sol.updated}</span>
      </div>
    </div>
  );
}

// ── MotorCard (Sección A) ─────────────────────────────────────────────────────
function MotorCard({ sol }: { sol: Solicitud }) {
  const [open, setOpen] = useState(false);
  const rec = sol.ia_recomendacion;
  if (!rec) {
    return (
      <div style={{ borderRadius: 12, border: `1px solid ${C.g200}`, padding: 16, background: C.white }}>
        <p style={{ fontSize: 13, color: C.g500 }}>Sin recomendación del motor para este caso.</p>
      </div>
    );
  }
  const s = MOTOR_SEM[rec.decision] ?? MOTOR_SEM.revisar;
  const iconPath = s.icon;
  return (
    <div style={{ borderRadius: 12, overflow: 'hidden', border: `1px solid ${s.color}30` }}>
      <div style={{ background: s.bg, padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 11, color: C.g500, fontWeight: 500, letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: 3 }}>
            Sugerencia automática · solo informativa
          </div>
          <div style={{ fontSize: 14, fontWeight: 600, color: s.color }}>
            {rec.decision === 'aprobar' ? 'Recomendación: Aprobar' : rec.decision === 'rechazar' ? 'Recomendación: Rechazar' : 'Revisión manual sugerida'}
          </div>
          <div style={{ fontSize: 12, color: C.g700, marginTop: 2 }}>
            Score: <strong>{rec.score}</strong> · {rec.motivo}
          </div>
        </div>
        <div title="Indicador visual — no es un botón" style={{
          width: 48, height: 48, borderRadius: '50%', background: C.white,
          border: `2.5px solid ${s.color}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'default', flexShrink: 0,
        }}>
          <svg width="22" height="22" viewBox="0 0 20 20" fill="none">
            <path d={iconPath} stroke={s.color} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </div>
      <div style={{ background: C.white, padding: '0 16px' }}>
        <button
          onClick={() => setOpen(o => !o)}
          style={{
            width: '100%', background: 'none', border: 'none', borderBottom: `1px solid ${C.g200}`,
            padding: '12px 0', display: 'flex', justifyContent: 'space-between', cursor: 'pointer',
            fontSize: 13, color: C.blue, fontFamily: 'Roboto', fontWeight: 500,
          }}
        >
          ¿Cómo se calcula esta sugerencia?
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ transform: open ? 'rotate(180deg)' : 'none', transition: '0.2s' }}>
            <path d="M2 5l5 5 5-5" stroke={C.blue} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        {open && (
          <div style={{ padding: '12px 0 16px' }}>
            <p style={{ fontSize: 12, color: C.g700, lineHeight: 1.6, marginBottom: 14 }}>
              El motor pondera 5 factores. Cada porcentaje indica cuánto pesa ese factor en la recomendación final.
            </p>
            {([
              ['Historial crediticio',   35],
              ['Capacidad de pago',      25],
              ['Nivel de endeudamiento', 20],
              ['Estabilidad laboral',    12],
              ['Garantía del vehículo',   8],
            ] as [string, number][]).map(([label, pct]) => (
              <div key={label} style={{ marginBottom: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 12, color: C.g700 }}>{label}</span>
                  <span style={{ fontSize: 12, color: C.g500, fontWeight: 500 }}>{pct}%</span>
                </div>
                <div style={{ height: 6, borderRadius: 3, background: C.g200 }}>
                  <div style={{ height: '100%', width: `${pct * 100 / 35}%`, borderRadius: 3, background: s.color, transition: 'width 0.4s ease' }} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── ClientTabs (Sección B) ────────────────────────────────────────────────────
function ClientTabs({ sol }: { sol: Solicitud }) {
  const [tab, setTab] = useState(0);
  const tabs = ['Info personal', 'Comportamiento financiero', 'Vehículo', 'Documentos', 'RUNT'];
  const dc = sol.integraciones.datacredito;
  const runt = sol.integraciones.runt;

  return (
    <div style={{ borderRadius: 12, background: C.white, overflow: 'hidden', border: `1px solid ${C.g200}` }}>
      <div style={{ display: 'flex', borderBottom: `1px solid ${C.g200}`, overflowX: 'auto' }}>
        {tabs.map((t, i) => (
          <button
            key={t} onClick={() => setTab(i)}
            style={{
              flex: '1 0 auto', padding: '10px 14px', background: 'none', border: 'none',
              borderBottom: tab === i ? `2px solid ${C.magenta}` : '2px solid transparent',
              fontSize: 12, fontWeight: tab === i ? 600 : 400,
              color: tab === i ? C.magenta : C.g700, cursor: 'pointer', fontFamily: 'Roboto', whiteSpace: 'nowrap',
            }}
          >
            {t}
          </button>
        ))}
      </div>
      <div style={{ padding: 16 }}>
        {tab === 0 && (
          <>
            {[
              ['Nombre completo', sol.cliente],
              ['Cédula', sol.cedula],
              ['Vehículo', sol.vehiculo],
              ['Monto solicitado', fmt(sol.monto)],
              ['Plazo', `${sol.plazoMeses} meses`],
            ].map(([l, v]) => (
              <div key={l} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: `1px solid ${C.g200}`, fontSize: 13 }}>
                <span style={{ color: C.g500 }}>{l}</span>
                <span style={{ color: C.g900, fontWeight: 500 }}>{v}</span>
              </div>
            ))}
          </>
        )}
        {tab === 1 && (
          dc.estado === 'ok' && dc.data ? (
            <>
              {[
                ['Score', String((dc.data as Record<string, unknown>).score ?? '—')],
                ['Estado', String((dc.data as Record<string, unknown>).estado ?? '—')],
                ['Obligaciones vigentes', String((dc.data as Record<string, unknown>).obligacionesVigentes ?? '—')],
                ['Meses en mora', String((dc.data as Record<string, unknown>).mora ?? '0')],
              ].map(([l, v]) => (
                <div key={l} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: `1px solid ${C.g200}`, fontSize: 13 }}>
                  <span style={{ color: C.g500 }}>{l}</span>
                  <span style={{ color: C.g900, fontWeight: 500 }}>{v}</span>
                </div>
              ))}
            </>
          ) : (
            <p style={{ fontSize: 13, color: C.g500, padding: '8px 0' }}>Consultar DataCrédito para ver el historial financiero.</p>
          )
        )}
        {tab === 2 && (
          <>
            {[
              ['Vehículo', sol.vehiculo],
              ['Monto a financiar', fmt(sol.monto)],
              ['Cuota estimada', `${fmt(sol.cuota)}/mes`],
            ].map(([l, v]) => (
              <div key={l} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: `1px solid ${C.g200}`, fontSize: 13 }}>
                <span style={{ color: C.g500 }}>{l}</span>
                <span style={{ color: C.g900, fontWeight: 500 }}>{v}</span>
              </div>
            ))}
          </>
        )}
        {tab === 3 && (
          <>
            {sol.docs.map(doc => (
              <div key={doc.nombre} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: `1px solid ${C.g200}`, fontSize: 13 }}>
                <span style={{ color: C.g500 }}>{doc.nombre}</span>
                <span style={{
                  color: doc.estado === 'validado' ? C.success : doc.estado === 'rechazado' ? C.danger : C.warn,
                  fontWeight: 500,
                }}>
                  {doc.estado === 'validado' ? '✓ Validado' : doc.estado === 'rechazado' ? '✕ Rechazado' : '⏳ Pendiente'}
                </span>
              </div>
            ))}
            {sol.docs.length === 0 && <p style={{ fontSize: 13, color: C.g500 }}>Sin documentos registrados.</p>}
          </>
        )}
        {tab === 4 && (
          runt.estado === 'ok' && runt.data ? (
            <>
              <div style={{ background: C.successL, borderRadius: 8, padding: '8px 12px', marginBottom: 12, fontSize: 12, color: C.success, fontWeight: 500 }}>
                ✓ RUNT consultado — Sin novedades
              </div>
              {[
                ['Propietario', String((runt.data as Record<string, unknown>).propietario ?? '—')],
                ['Gravámenes', String((runt.data as Record<string, unknown>).gravamenes ?? '0')],
                ['SOAT', String((runt.data as Record<string, unknown>).soat ?? '—')],
                ['Revisión técnica', String((runt.data as Record<string, unknown>).revisionTecnica ?? '—')],
              ].map(([l, v]) => (
                <div key={l} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: `1px solid ${C.g200}`, fontSize: 13 }}>
                  <span style={{ color: C.g500 }}>{l}</span>
                  <span style={{ color: C.g900, fontWeight: 500 }}>{v}</span>
                </div>
              ))}
            </>
          ) : (
            <p style={{ fontSize: 13, color: C.g500, padding: '8px 0' }}>Consultar RUNT para ver el estado del vehículo.</p>
          )
        )}
      </div>
    </div>
  );
}

// ── IntegrationsSection (Sección C) ──────────────────────────────────────────
type IntegStatus = 'pendiente' | 'cargando' | 'ok' | 'error';

const INTEG_ENDPOINTS: Record<string, string> = {
  'RUNT':        '/api/integraciones/runt',
  'DataCrédito': '/api/integraciones/datacredito',
  'Automas':     '/api/integraciones/automas',
  'SOI':         '/api/integraciones/soi',
};

function IntegrationsSection({ sol }: { sol: Solicitud }) {
  const initStatus = useCallback((s: Solicitud): Record<string, IntegStatus> => ({
    'RUNT':        s.integraciones.runt.estado        === 'ok' ? 'ok' : 'pendiente',
    'DataCrédito': s.integraciones.datacredito.estado === 'ok' ? 'ok' : 'pendiente',
    'Automas':     s.integraciones.automas.estado      === 'ok' ? 'ok' : 'pendiente',
    'SOI':         s.integraciones.soi.estado          === 'ok' ? 'ok' : 'pendiente',
  }), []);

  const initResults = useCallback((s: Solicitud): Record<string, unknown> => {
    const r: Record<string, unknown> = {};
    if (s.integraciones.runt.estado === 'ok')        r['RUNT']        = s.integraciones.runt.data;
    if (s.integraciones.datacredito.estado === 'ok') r['DataCrédito'] = s.integraciones.datacredito.data;
    if (s.integraciones.automas.estado === 'ok')     r['Automas']     = s.integraciones.automas.data;
    if (s.integraciones.soi.estado === 'ok')         r['SOI']         = s.integraciones.soi.data;
    return r;
  }, []);

  const [statuses, setStatuses] = useState<Record<string, IntegStatus>>(() => initStatus(sol));
  const [results, setResults]   = useState<Record<string, unknown>>(() => initResults(sol));

  useEffect(() => {
    setStatuses(initStatus(sol));
    setResults(initResults(sol));
  }, [sol.id, initStatus, initResults, sol]);

  async function consultar(nombre: string) {
    setStatuses(p => ({ ...p, [nombre]: 'cargando' }));
    const payload = nombre === 'RUNT'
      ? { vehiculo: sol.vehiculo }
      : { cedula: sol.cedula };
    try {
      const res = await fetch(INTEG_ENDPOINTS[nombre], {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json() as { data?: unknown };
      setStatuses(p => ({ ...p, [nombre]: 'ok' }));
      setResults(p => ({ ...p, [nombre]: data.data ?? data }));
    } catch {
      setStatuses(p => ({ ...p, [nombre]: 'error' }));
    }
  }

  const names = ['RUNT', 'DataCrédito', 'Automas', 'SOI'];

  return (
    <div style={{ borderRadius: 12, background: C.white, border: `1px solid ${C.g200}`, overflow: 'hidden' }}>
      {names.map((nombre, i) => {
        const st = statuses[nombre] ?? 'pendiente';
        const dot = st === 'ok' ? C.success : st === 'cargando' ? C.warn : st === 'error' ? C.danger : C.g500;
        const res = results[nombre] as Record<string, unknown> | undefined;
        return (
          <div key={nombre} style={{
            display: 'flex', alignItems: 'center', gap: 12, padding: '11px 16px',
            borderBottom: i < names.length - 1 ? `1px solid ${C.g200}` : 'none',
          }}>
            {st === 'cargando' ? (
              <div style={{ width: 8, height: 8, borderRadius: '50%', border: `2px solid ${C.g200}`, borderTopColor: C.warn, animation: 'spin 0.7s linear infinite', flexShrink: 0 }} />
            ) : (
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: dot, flexShrink: 0, display: 'inline-block' }} />
            )}
            <span style={{ fontSize: 13, fontWeight: 500, color: C.g900, width: 100, flexShrink: 0 }}>{nombre}</span>
            <div style={{ flex: 1, fontSize: 12, color: C.g500 }}>
              {st === 'cargando' && 'Consultando…'}
              {st === 'ok' && res && <span>
                {nombre === 'DataCrédito' && `Score ${res.score} — ${res.estado}`}
                {nombre === 'RUNT'        && `${res.propietario}, SOAT ${res.soat}`}
                {nombre === 'Automas'     && `Embargos: ${res.embargos}, ${res.listasRestrictivas}`}
                {nombre === 'SOI'         && `Aportes ${res.aportes}`}
              </span>}
              {st === 'ok' && !res && 'Consultado OK'}
              {st === 'pendiente' && 'Sin consultar'}
              {st === 'error' && 'Error al consultar'}
            </div>
            {st === 'pendiente' && (
              <button
                onClick={() => consultar(nombre)}
                style={{
                  fontSize: 11, color: C.white, background: C.blue, border: 'none',
                  borderRadius: 6, padding: '4px 10px', cursor: 'pointer', fontFamily: 'Roboto', flexShrink: 0,
                }}
              >
                Consultar
              </button>
            )}
            {st === 'error' && (
              <button
                onClick={() => consultar(nombre)}
                style={{
                  fontSize: 11, color: C.blue, background: 'none', border: `1px solid ${C.blue}`,
                  borderRadius: 5, padding: '3px 8px', cursor: 'pointer', fontFamily: 'Roboto', flexShrink: 0,
                }}
              >
                Reintentar
              </button>
            )}
            {st === 'ok' && (
              <span style={{ fontSize: 11, color: C.success, flexShrink: 0 }}>✓</span>
            )}
          </div>
        );
      })}
      <div style={{ padding: '10px 16px', background: C.g50, fontSize: 11, color: C.g500 }}>
        Si alguna fuente está caída, puedes decidir sin ella dejando constancia del motivo.
      </div>
    </div>
  );
}

// ── ActionZone (Sección D) ────────────────────────────────────────────────────
type ActionMode = 'aceptar' | 'anular' | 'rechazar' | 'segunda' | null;

interface ActionZoneProps {
  solId: string;
  cliente: string;
  onEnviar: (comentario: string) => Promise<void>;
  onAnular: (motivo: string, categoria: string) => Promise<void>;
  onRechazar: (motivo: string) => Promise<void>;
  onSegunda: () => void;
}

function ActionZone({ solId, cliente, onEnviar, onAnular, onRechazar, onSegunda }: ActionZoneProps) {
  const [mode, setMode] = useState<ActionMode>(null);
  const [comentario, setComentario]   = useState('');
  const [anularMotivo, setAnularMotivo] = useState('');
  const [categoria, setCategoria]     = useState('');
  const [rechazarMotivo, setRechazarMotivo] = useState('');
  const [confirm, setConfirm] = useState<ActionMode>(null);
  const [loading, setLoading] = useState(false);

  const anularOk = anularMotivo.length >= 30 && !!categoria;
  const rechazarOk = rechazarMotivo.length >= 10;

  const options: [ActionMode, string, string][] = [
    ['aceptar',  'Aceptar recomendación',   'Coincides con el motor'],
    ['anular',   'Anular recomendación',     'No coincides'],
    ['rechazar', 'Rechazar caso',            'Cierra el caso'],
    ['segunda',  'Pedir segunda opinión',    'Otro analista revisa'],
  ];

  async function handleConfirm() {
    if (!confirm) return;
    setLoading(true);
    try {
      if (confirm === 'aceptar') await onEnviar(comentario);
      if (confirm === 'anular')  await onAnular(anularMotivo, categoria);
      if (confirm === 'rechazar') await onRechazar(rechazarMotivo);
      if (confirm === 'segunda') onSegunda();
    } finally {
      setLoading(false);
      setConfirm(null);
    }
  }

  return (
    <div style={{ borderRadius: 12, background: C.white, border: `1px solid ${C.g200}`, padding: 16 }}>
      <p style={{ fontSize: 14, fontWeight: 600, color: C.g900, marginBottom: 6 }}>Acción del analista</p>
      <p style={{ fontSize: 12, color: C.g500, marginBottom: 14, lineHeight: 1.5 }}>
        <strong>Aceptar</strong> = estoy de acuerdo con la recomendación del motor.&nbsp;
        <strong>Anular</strong> = no estoy de acuerdo y propongo otra decisión.&nbsp;
        <strong>Rechazar</strong> = el caso no debe avanzar al coordinador.
      </p>

      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
        {options.map(([m, label, sub]) => (
          <button
            key={m}
            onClick={() => setMode(mode === m ? null : m)}
            style={{
              flex: '1 1 calc(50% - 5px)', minWidth: 140, padding: '10px 8px', borderRadius: 9,
              fontSize: 12, fontWeight: 500, cursor: 'pointer', fontFamily: 'Roboto',
              border: mode === m ? `2px solid ${C.magenta}` : `1px solid ${C.g200}`,
              background: mode === m ? C.magentaL : C.white,
              color: mode === m ? C.magenta : C.g700,
              transition: 'all 0.15s', textAlign: 'left',
            }}
          >
            <div style={{ fontWeight: 600 }}>{label}</div>
            <div style={{ fontSize: 11, color: mode === m ? C.magenta : C.g500, marginTop: 2 }}>{sub}</div>
          </button>
        ))}
      </div>

      {mode && mode !== 'segunda' && (() => {
        const resultados: Record<string, { bg: string; border: string; icon: string; title: string; body: string }> = {
          aceptar:  { bg: C.successL, border: '#86efac', icon: '✓', title: 'Recomendación aceptada',  body: 'Coincides con el motor. El caso pasa al coordinador con tu validación.' },
          anular:   { bg: C.warnL,    border: '#fcd34d', icon: '⇄', title: 'Recomendación anulada',   body: 'Tu override quedó registrado con motivo y categoría conforme a SARLAFT.' },
          rechazar: { bg: C.dangerL,  border: '#fca5a5', icon: '✕', title: 'Caso rechazado',           body: 'El caso se cierra. Esta acción se puede deshacer 30 segundos.' },
        };
        const r = resultados[mode];
        if (!r) return null;
        return (
          <div style={{ borderRadius: 10, border: `1px solid ${r.border}`, background: r.bg, padding: '12px 14px', display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 4 }}>
            <span style={{ fontSize: 18, lineHeight: 1, flexShrink: 0 }}>{r.icon}</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: C.g900, marginBottom: 2 }}>{r.title}</div>
              <div style={{ fontSize: 12, color: C.g700, lineHeight: 1.5 }}>{r.body}</div>
            </div>
            <button
              onClick={() => setMode(null)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 11, color: C.g500, flexShrink: 0, padding: '2px 4px', fontFamily: 'Roboto' }}
            >
              Cambiar
            </button>
          </div>
        );
      })()}

      {mode === 'aceptar' && (
        <div>
          <textarea
            value={comentario}
            onChange={e => setComentario(e.target.value)}
            placeholder="Comentarios para el coordinador (opcional)"
            style={{ width: '100%', borderRadius: 8, border: `1px solid ${C.g200}`, padding: 10, fontSize: 13, fontFamily: 'Roboto', resize: 'none', height: 72, outline: 'none' }}
          />
          <button
            onClick={() => setConfirm('aceptar')}
            style={{ marginTop: 10, width: '100%', padding: 12, borderRadius: 9, background: C.magenta, color: '#fff', fontSize: 14, fontWeight: 600, border: 'none', cursor: 'pointer', fontFamily: 'Roboto', boxShadow: `0 4px 12px ${C.magenta}40` }}
          >
            ✓ Validar y enviar al coordinador
          </button>
        </div>
      )}

      {mode === 'anular' && (
        <div>
          <textarea
            value={anularMotivo}
            onChange={e => setAnularMotivo(e.target.value)}
            placeholder="Motivo de la anulación (mínimo 30 caracteres)"
            style={{ width: '100%', borderRadius: 8, border: `1px solid ${anularMotivo.length > 0 && anularMotivo.length < 30 ? C.danger : C.g200}`, padding: 10, fontSize: 13, fontFamily: 'Roboto', resize: 'none', height: 72, outline: 'none' }}
          />
          {anularMotivo.length > 0 && anularMotivo.length < 30 && (
            <p style={{ fontSize: 11, color: C.danger, marginTop: 4 }}>{30 - anularMotivo.length} caracteres más requeridos</p>
          )}
          <select
            value={categoria}
            onChange={e => setCategoria(e.target.value)}
            style={{ width: '100%', marginTop: 10, padding: '9px 10px', borderRadius: 8, border: `1px solid ${C.g200}`, fontSize: 13, fontFamily: 'Roboto', color: categoria ? C.g900 : C.g500, background: C.white, outline: 'none' }}
          >
            <option value="">Categoría del motivo</option>
            <option>Señal de riesgo no capturada por el motor</option>
            <option>Información adicional del cliente verificada</option>
            <option>Error en los datos de entrada del motor</option>
            <option>Criterio regulatorio específico</option>
          </select>
          <p style={{ fontSize: 11, color: C.g500, marginTop: 8 }}>Los overrides quedan registrados en auditoría conforme a SARLAFT.</p>
          <button
            disabled={!anularOk}
            onClick={() => setConfirm('anular')}
            style={{ marginTop: 10, width: '100%', padding: 12, borderRadius: 9, background: anularOk ? C.warn : C.g200, color: anularOk ? '#fff' : C.g500, fontSize: 14, fontWeight: 600, border: 'none', cursor: anularOk ? 'pointer' : 'not-allowed', fontFamily: 'Roboto' }}
          >
            Anular y enviar al coordinador
          </button>
        </div>
      )}

      {mode === 'rechazar' && (
        <div>
          <textarea
            value={rechazarMotivo}
            onChange={e => setRechazarMotivo(e.target.value)}
            placeholder="Motivo del rechazo (requerido)"
            style={{ width: '100%', borderRadius: 8, border: `1px solid ${C.g200}`, padding: 10, fontSize: 13, fontFamily: 'Roboto', resize: 'none', height: 72, outline: 'none' }}
          />
          <button
            disabled={!rechazarOk}
            onClick={() => setConfirm('rechazar')}
            style={{ marginTop: 10, width: '100%', padding: 12, borderRadius: 9, background: rechazarOk ? C.danger : C.g200, color: rechazarOk ? '#fff' : C.g500, fontSize: 14, fontWeight: 600, border: 'none', cursor: rechazarOk ? 'pointer' : 'not-allowed', fontFamily: 'Roboto' }}
          >
            ✕ Rechazar caso
          </button>
        </div>
      )}

      {mode === 'segunda' && (
        <div>
          <p style={{ fontSize: 12, color: C.g700, lineHeight: 1.6, marginBottom: 10 }}>
            Envía el caso a otro analista senior para que dé su lectura. <strong>No transfiere</strong> el caso al coordinador — tú mantienes la decisión final.
          </p>
          <textarea
            placeholder="Pregunta o contexto (opcional)"
            style={{ width: '100%', borderRadius: 8, border: `1px solid ${C.g200}`, padding: 10, fontSize: 13, fontFamily: 'Roboto', resize: 'none', height: 60, outline: 'none' }}
          />
          <button
            onClick={() => setConfirm('segunda')}
            style={{ marginTop: 10, width: '100%', padding: 12, borderRadius: 9, background: C.blue, color: '#fff', fontSize: 14, fontWeight: 600, border: 'none', cursor: 'pointer', fontFamily: 'Roboto' }}
          >
            Enviar a otro analista
          </button>
        </div>
      )}

      {confirm && (
        <ConfirmModal
          title={
            confirm === 'aceptar'  ? '¿Enviar al coordinador?' :
            confirm === 'anular'   ? '¿Confirmar anulación?' :
            confirm === 'segunda'  ? '¿Enviar a segunda opinión?' :
            '¿Rechazar este caso?'
          }
          description={
            confirm === 'aceptar'  ? `El caso de ${cliente} pasa a la cola del coordinador con tu validación.` :
            confirm === 'anular'   ? 'Quedará registrado tu override con el motivo y categoría.' :
            confirm === 'segunda'  ? 'El caso se enviará a otro analista. Tú mantienes la decisión final.' :
            `El caso de ${cliente} se cierra. Esta acción se puede deshacer durante los próximos 5 segundos.`
          }
          confirmLabel={
            confirm === 'aceptar'  ? 'Sí, enviar' :
            confirm === 'anular'   ? 'Sí, anular' :
            confirm === 'segunda'  ? 'Sí, enviar' :
            'Sí, rechazar'
          }
          variant={confirm === 'rechazar' ? 'danger' : 'default'}
          onConfirm={handleConfirm}
          onCancel={() => setConfirm(null)}
        />
      )}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function AnalistaCola() {
  const router = useRouter();
  const { solicitudes, cambiarEstado, refetch } = useSolicitudes();
  const isMobile = useIsMobile();
  const [selId, setSelId] = useState<string | null>(null);
  const [filter, setFilter] = useState<'todos' | 'nuevos' | 'devueltos'>('todos');
  const [toasts, setToasts] = useState<Array<{ id: number; msg: string; onUndo: () => void }>>([]);

  useEffect(() => {
    const t = setInterval(refetch, 5000);
    return () => clearInterval(t);
  }, [refetch]);

  const cola = solicitudes.filter(s =>
    s.status === 'en_analisis' || s.status === 'devuelta_analista'
  );

  const filtradas =
    filter === 'nuevos'   ? cola.filter(s => s.status === 'en_analisis') :
    filter === 'devueltos' ? cola.filter(s => s.status === 'devuelta_analista') :
    cola;

  const sel = selId ? solicitudes.find(s => s.id === selId) ?? null : null;

  function pushToast(msg: string, onUndo: () => void) {
    const id = Date.now();
    setToasts(t => [...t, { id, msg, onUndo }]);
  }

  async function handleLogout() {
    await fetch('/api/auth/session', { method: 'DELETE' });
    router.push('/login');
  }

  async function handleEnviar(comentario: string) {
    if (!sel) return;
    await cambiarEstado(sel.id, 'en_coordinacion', comentario ? { motivo: comentario } : undefined);
    const id = sel.id; const cliente = sel.cliente;
    setSelId(null);
    pushToast(
      `Caso ${id} (${cliente}) enviado al coordinador`,
      () => cambiarEstado(id, 'en_analisis').catch(() => refetch()),
    );
  }

  async function handleAnular(motivo: string, categoria: string) {
    if (!sel) return;
    await cambiarEstado(sel.id, 'en_coordinacion', {
      analista_override: true,
      motivoAnulacion: `[${categoria}] ${motivo}`,
    });
    const id = sel.id; const cliente = sel.cliente;
    setSelId(null);
    pushToast(
      `Caso ${id} (${cliente}) enviado — override registrado`,
      () => cambiarEstado(id, 'en_analisis').catch(() => refetch()),
    );
  }

  async function handleRechazar(motivo: string) {
    if (!sel) return;
    await cambiarEstado(sel.id, 'rechazada', { motivo });
    const id = sel.id; const cliente = sel.cliente;
    setSelId(null);
    pushToast(
      `Caso ${id} (${cliente}) rechazado`,
      () => cambiarEstado(id, 'en_analisis').catch(() => refetch()),
    );
  }

  function handleSegunda() {
    pushToast('Segunda opinión no disponible en el prototipo.', () => {});
  }

  async function handleReset() {
    await fetch('/api/reset', { method: 'POST' });
    await refetch();
    pushToast('Demo reiniciado.', () => {});
  }

  const sectionLabel = { fontSize: 11, fontWeight: 600, textTransform: 'uppercase' as const, letterSpacing: '0.7px', color: C.g500, marginBottom: 8 };

  // ── Render derecho ────────────────────────────────────────────────────────
  const rightPanel = sel ? (
    <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div>
        <div style={{ fontSize: 18, fontWeight: 700, color: C.g900 }}>{sel.cliente}</div>
        <div style={{ fontSize: 13, color: C.g500, marginTop: 2 }}>
          {sel.id} · {fmt(sel.monto)} · {sel.plazoMeses} meses
        </div>
      </div>
      <div>
        <p style={sectionLabel}>A — Motor de decisión</p>
        <MotorCard sol={sel} />
      </div>
      <div>
        <p style={sectionLabel}>B — Datos del cliente</p>
        <ClientTabs key={sel.id} sol={sel} />
      </div>
      <div>
        <p style={sectionLabel}>C — Consultas externas</p>
        <IntegrationsSection key={sel.id} sol={sel} />
      </div>
      <div>
        <p style={sectionLabel}>D — Acción</p>
        <ActionZone
          key={sel.id}
          solId={sel.id}
          cliente={sel.cliente}
          onEnviar={handleEnviar}
          onAnular={handleAnular}
          onRechazar={handleRechazar}
          onSegunda={handleSegunda}
        />
      </div>
      <div style={{ height: 24 }} />
    </div>
  ) : (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12 }}>
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke={C.g200} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="3" />
        <path d="M3 9h18M9 21V9" />
      </svg>
      <p style={{ fontSize: 14, color: C.g500 }}>Selecciona un caso de la cola para revisarlo</p>
    </div>
  );

  // ── Pills ─────────────────────────────────────────────────────────────────
  const pillFilters: [typeof filter, string][] = [
    ['todos', `Todos (${cola.length})`],
    ['nuevos', `Nuevos (${cola.filter(s => s.status === 'en_analisis').length})`],
    ['devueltos', `Devueltos (${cola.filter(s => s.status === 'devuelta_analista').length})`],
  ];

  const leftPanel = (
    <div style={{ width: !isMobile ? 300 : '100%', borderRight: !isMobile ? `1px solid ${C.g200}` : 'none', display: 'flex', flexDirection: 'column', background: C.white, flexShrink: 0 }}>
      <div style={{ padding: '14px 16px', borderBottom: `1px solid ${C.g200}`, flexShrink: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: C.g900, marginBottom: 10 }}>Mi cola</div>
        <div style={{ display: 'flex', gap: 6 }}>
          {pillFilters.map(([v, label]) => (
            <button
              key={v}
              onClick={() => setFilter(v)}
              style={{
                padding: '5px 10px', borderRadius: 20, fontSize: 11, fontWeight: 500, cursor: 'pointer', fontFamily: 'Roboto',
                background: filter === v ? C.g900 : C.g50, color: filter === v ? C.white : C.g700,
                border: filter === v ? 'none' : `1px solid ${C.g200}`,
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {filtradas.length === 0 ? (
          <div style={{ padding: 24, textAlign: 'center' }}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke={C.g200} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: 10 }}>
              <rect x="3" y="3" width="18" height="18" rx="3" />
              <path d="M3 9h18M9 21V9" />
            </svg>
            <p style={{ fontSize: 13, color: C.g500 }}>No hay casos pendientes</p>
          </div>
        ) : (
          filtradas.map(s => (
            <CaseItem key={s.id} sol={s} selected={s.id === selId} onClick={() => setSelId(s.id)} />
          ))
        )}
      </div>
    </div>
  );

  return (
    <>
      <style>{`@keyframes spin{to{transform:rotate(360deg);}}`}</style>
      <NavBar
        rol="analista"
        activeLabel="Cola de análisis"
        tabs={TABS}
        onLogout={handleLogout}
        onReset={handleReset}
      />

      {!isMobile ? (
        <div style={{ display: 'flex', height: 'calc(100vh - 52px)', marginTop: 52 }}>
          {leftPanel}
          {rightPanel}
        </div>
      ) : (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-start', background: '#EDECEA', paddingTop: 20, paddingBottom: 20, minHeight: 'calc(100vh - 52px)', marginTop: 52, overflowY: 'auto' }}>
          <div style={{ width: 390, background: C.white, borderRadius: 24, overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}>
            {selId && sel ? (
              <div>
                <div style={{ padding: '12px 16px', borderBottom: `1px solid ${C.g200}`, display: 'flex', alignItems: 'center', gap: 10 }}>
                  <button onClick={() => setSelId(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.g700, fontFamily: 'Roboto', fontSize: 13, display: 'flex', alignItems: 'center', gap: 4 }}>
                    ← Volver a la cola
                  </button>
                </div>
                <div style={{ overflowY: 'auto', maxHeight: 'calc(100vh - 120px)', padding: '16px', display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div>
                    <div style={{ fontSize: 17, fontWeight: 700, color: C.g900 }}>{sel.cliente}</div>
                    <div style={{ fontSize: 12, color: C.g500, marginTop: 2 }}>{sel.id} · {fmt(sel.monto)}</div>
                  </div>
                  <div><p style={sectionLabel}>A — Motor de decisión</p><MotorCard sol={sel} /></div>
                  <div><p style={sectionLabel}>B — Datos del cliente</p><ClientTabs key={sel.id} sol={sel} /></div>
                  <div><p style={sectionLabel}>C — Consultas externas</p><IntegrationsSection key={sel.id} sol={sel} /></div>
                  <div>
                    <p style={sectionLabel}>D — Acción</p>
                    <ActionZone key={sel.id} solId={sel.id} cliente={sel.cliente} onEnviar={handleEnviar} onAnular={handleAnular} onRechazar={handleRechazar} onSegunda={handleSegunda} />
                  </div>
                </div>
              </div>
            ) : (
              <div>
                {leftPanel}
              </div>
            )}
          </div>
        </div>
      )}

      {toasts.map(t => (
        <Toast key={t.id} message={t.msg} onUndo={t.onUndo} onClose={() => setToasts(p => p.filter(x => x.id !== t.id))} />
      ))}
    </>
  );
}
