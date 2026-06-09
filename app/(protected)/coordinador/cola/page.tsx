'use client';
import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import NavBar from '../../../../components/shell/NavBar';
import { useIsMobile } from '../../../../hooks/useIsMobile';
import Toast from '../../../../components/ui/Toast';
import ConfirmModal from '../../../../components/ui/ConfirmModal';
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
  en_coordinacion:   'Pendiente revisión',
  devuelta_analista: 'Devuelto al analista',
  aprobada:          'Aprobado',
  rechazada:         'Rechazado',
};

function StatusBadge({ status }: { status: Status }) {
  const map: Record<Status, { color: string; bg: string }> = {
    en_coordinacion:   { color: C.blue,    bg: C.blueL    },
    devuelta_analista: { color: C.warn,    bg: C.warnL    },
    aprobada:          { color: C.success, bg: C.successL },
    rechazada:         { color: C.danger,  bg: C.dangerL  },
    radicada:          { color: C.g500,    bg: C.g50      },
    en_analisis:       { color: C.g500,    bg: C.g50      },
  };
  const s = map[status];
  return (
    <span style={{
      fontSize: 11, fontWeight: 600, color: s.color, background: s.bg,
      padding: '3px 8px', borderRadius: 12, border: `1px solid ${s.color}30`, whiteSpace: 'nowrap',
    }}>
      {STATUS_LABEL[status]}
    </span>
  );
}

function OriginBadge({ origen }: { origen: Solicitud['origen'] }) {
  if (origen === 'finscope_ia') {
    return (
      <span style={{ fontSize: 10, fontWeight: 600, background: C.blueL, color: C.blue, borderRadius: 5, padding: '2px 6px', whiteSpace: 'nowrap' }}>
        ⚡ IA
      </span>
    );
  }
  return (
    <span style={{ fontSize: 10, fontWeight: 500, background: C.g50, color: C.g500, borderRadius: 5, padding: '2px 6px', border: `1px solid ${C.g200}`, whiteSpace: 'nowrap' }}>
      Conces.
    </span>
  );
}

function QueueRow({ sol, selected, onClick }: { sol: Solicitud; selected: boolean; onClick: () => void }) {
  return (
    <tr
      onClick={onClick}
      style={{
        cursor: 'pointer',
        background: selected ? C.blueL : C.white,
        borderLeft: selected ? `3px solid ${C.blue}` : '3px solid transparent',
      }}
    >
      <td style={{ padding: '12px 14px' }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: C.g900 }}>{sol.cliente}</div>
        <div style={{ fontSize: 11, color: C.g500, fontWeight: 400, marginTop: 2 }}>{sol.id}</div>
        <div style={{ marginTop: 4, display: 'flex', gap: 5, flexWrap: 'wrap', alignItems: 'center' }}>
          <OriginBadge origen={sol.origen} />
          {sol.analista_override && (
            <div style={{ fontSize: 10, color: C.warn, fontWeight: 600 }}>⚠ Override del analista</div>
          )}
        </div>
      </td>
      <td style={{ padding: '12px 14px' }}>
        <div style={{ fontSize: 13, color: C.g700 }}>{fmt(sol.monto)}</div>
        <div style={{ fontSize: 11, color: C.g500, marginTop: 2 }}>{sol.plazoMeses} meses</div>
      </td>
      <td style={{ padding: '12px 14px' }}>
        <StatusBadge status={sol.status} />
      </td>
      <td style={{ padding: '12px 14px', fontSize: 11, color: C.g500 }}>{sol.updated}</td>
      <td style={{ padding: '12px 14px', textAlign: 'right' }}>
        <span style={{ fontSize: 18, color: C.g500 }}>›</span>
      </td>
    </tr>
  );
}

const IA_CHIP = {
  aprobar:  { bg: C.successL, color: C.success },
  revisar:  { bg: C.warnL,    color: C.warn    },
  rechazar: { bg: C.dangerL,  color: C.danger  },
} as const;

function CaseDetailPanel({
  sol, onAprobar, onDevolver, onRechazar,
}: {
  sol: Solicitud;
  onAprobar: () => void;
  onDevolver: (motivo: string) => void;
  onRechazar: () => void;
}) {
  const [confirm, setConfirm] = useState<null | 'aprobar' | 'devolver' | 'rechazar'>(null);
  const [motivoDev, setMotivoDev] = useState('');
  const [showDevolverForm, setShowDevolverForm] = useState(false);

  const rec = sol.ia_recomendacion;

  const integ = [
    {
      n: 'DataCrédito',
      s: sol.integraciones.datacredito.estado === 'ok',
      msg: sol.integraciones.datacredito.data
        ? `Score: ${(sol.integraciones.datacredito.data as Record<string, unknown>).score}`
        : 'No consultado',
    },
    {
      n: 'RUNT',
      s: sol.integraciones.runt.estado === 'ok',
      msg: sol.integraciones.runt.data ? 'Sin gravámenes' : 'No consultado',
    },
    {
      n: 'Automas',
      s: sol.integraciones.automas.estado === 'ok',
      msg: sol.integraciones.automas.data ? 'Sin embargos' : 'No consultado',
    },
    {
      n: 'SOI',
      s: sol.integraciones.soi.estado === 'ok',
      msg: sol.integraciones.soi.data ? 'Aportes al día' : 'No consultado',
    },
  ];

  const sectionStyle = {
    borderRadius: 12, background: C.white, border: `1px solid ${C.g200}`, padding: 16,
  } as const;

  const isDecision = sol.status === 'en_coordinacion';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* ── Contenido scrolleable ──────────────────────────────────────────── */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Cabecera */}
      <div>
        <div style={{ fontSize: 18, fontWeight: 700, color: C.g900 }}>{sol.cliente}</div>
        <div style={{ fontSize: 13, color: C.g500, marginTop: 2 }}>
          {sol.id} · {fmt(sol.monto)} · {sol.plazoMeses} meses
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <StatusBadge status={sol.status} />
          {sol.analista_override && (
            <span style={{
              fontSize: 11, color: C.warn, fontWeight: 600, background: C.warnL,
              padding: '3px 8px', borderRadius: 12, border: `1px solid ${C.warn}30`,
            }}>
              ⚠ Override del analista
            </span>
          )}
        </div>
      </div>

      {/* A — Perfil */}
      <div style={sectionStyle}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <p style={{ fontSize: 11, fontWeight: 600, color: C.g500, textTransform: 'uppercase', letterSpacing: '0.7px' }}>
            A — Perfil del cliente
          </p>
          <span style={{ fontSize: 11, color: C.g500 }}>CC {sol.cedula}</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0 }}>
          {[
            ['Score crediticio', sol.integraciones.datacredito.data
              ? String((sol.integraciones.datacredito.data as Record<string, unknown>).score) : '—'],
            ['Vehículo',       sol.vehiculo],
            ['Monto',          fmt(sol.monto)],
            ['Plazo',          `${sol.plazoMeses} meses`],
            ['Cuota estimada', fmt(sol.cuota)],
            ['Cédula',         sol.cedula],
          ].map(([l, v], i) => (
            <div
              key={l}
              style={{
                padding: '8px 0',
                borderBottom: i < 4 ? `1px solid ${C.g200}` : 'none',
                paddingRight: i % 2 === 0 ? 12 : 0,
                paddingLeft: i % 2 === 1 ? 12 : 0,
                borderLeft: i % 2 === 1 ? `1px solid ${C.g200}` : 'none',
              }}
            >
              <div style={{ fontSize: 11, color: C.g500, marginBottom: 2 }}>{l}</div>
              <div style={{ fontSize: 13, color: C.g900, fontWeight: 500 }}>{v}</div>
            </div>
          ))}
        </div>
      </div>

      {/* B — IA o Analista */}
      {sol.flujo === 'prospectado' && rec ? (
        <div style={{
          borderRadius: 12,
          background: rec.decision === 'aprobar' ? C.successL : C.blueL,
          border: `1px solid ${rec.decision === 'aprobar' ? C.success + '40' : C.blue + '30'}`,
          padding: 16,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <p style={{ fontSize: 11, fontWeight: 600, color: C.g500, textTransform: 'uppercase', letterSpacing: '0.7px' }}>
              B — Detección IA · Finscope
            </p>
            <span style={{
              fontSize: 11, fontWeight: 600, padding: '3px 9px', borderRadius: 10,
              background: IA_CHIP[rec.decision].bg, color: IA_CHIP[rec.decision].color,
              textTransform: 'uppercase', letterSpacing: '0.5px',
            }}>
              {rec.decision} · Score {rec.score}
            </span>
          </div>
          <p style={{ fontSize: 13, color: C.g700, lineHeight: 1.5 }}>{rec.motivo}</p>
          <p style={{ fontSize: 11, color: C.g500, marginTop: 8 }}>
            Generado el {new Date(rec.generadoEn).toLocaleDateString('es-CO')}
          </p>
        </div>
      ) : sol.flujo === 'nuevo' ? (
        <div style={sectionStyle}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <p style={{ fontSize: 11, fontWeight: 600, color: C.g500, textTransform: 'uppercase', letterSpacing: '0.7px' }}>
              B — Recomendación del analista
            </p>
            <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 9px', borderRadius: 10, background: C.blueL, color: C.blue }}>
              Analista
            </span>
          </div>
          {sol.analista_override && sol.motivoAnulacion ? (
            <>
              <div style={{ borderRadius: 12, background: C.warnL, border: `1px solid ${C.warn}40`, padding: 14, marginBottom: 10 }}>
                <p style={{ fontSize: 12, fontWeight: 600, color: C.warn, marginBottom: 4 }}>Motivo del override</p>
                <p style={{ fontSize: 13, color: C.g700 }}>{sol.motivoAnulacion}</p>
              </div>
            </>
          ) : (
            <p style={{ fontSize: 13, color: sol.analista ? C.g700 : C.g500, lineHeight: 1.5 }}>
              {sol.analista ? `Validado por ${sol.analista}` : 'Sin observaciones del analista'}
            </p>
          )}
        </div>
      ) : null}

      {/* C — Documentos */}
      <div style={sectionStyle}>
        <p style={{ fontSize: 11, fontWeight: 600, color: C.g500, textTransform: 'uppercase', letterSpacing: '0.7px', marginBottom: 10 }}>
          C — Documentos cargados
        </p>
        {sol.docs.map((d, i) => (
          <div
            key={d.nombre}
            style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '7px 0', borderBottom: i < sol.docs.length - 1 ? `1px solid ${C.g200}` : 'none',
              fontSize: 13,
            }}
          >
            <span style={{ color: C.g900 }}>{d.nombre}</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 500, color: d.estado === 'validado' ? C.success : d.estado === 'rechazado' ? C.danger : C.warn }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: d.estado === 'validado' ? C.success : d.estado === 'rechazado' ? C.danger : C.warn }} />
              {d.estado === 'validado' ? 'Validado' : d.estado === 'rechazado' ? (d.motivo ?? 'Rechazado') : 'Por validar'}
            </span>
          </div>
        ))}
      </div>

      {/* D — Consultas externas */}
      <div style={sectionStyle}>
        <p style={{ fontSize: 11, fontWeight: 600, color: C.g500, textTransform: 'uppercase', letterSpacing: '0.7px', marginBottom: 10 }}>
          D — Consultas externas
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {integ.map(it => (
            <div key={it.n} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', background: C.g50, borderRadius: 8, border: `1px solid ${C.g200}` }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: it.s ? C.success : C.warn, flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 500, color: C.g900 }}>{it.n}</div>
                <div style={{ fontSize: 11, color: C.g500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{it.msg}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* E/F — Crédito + Trazabilidad */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div style={sectionStyle}>
          <p style={{ fontSize: 11, fontWeight: 600, color: C.g500, textTransform: 'uppercase', letterSpacing: '0.7px', marginBottom: 10 }}>
            E — Detalle del crédito
          </p>
          {[
            ['Vehículo',    sol.vehiculo],
            ['Monto',       fmt(sol.monto)],
            ['Plazo',       `${sol.plazoMeses} meses`],
            ['Cuota mensual', fmt(sol.cuota)],
            ['Origen',      sol.origen === 'finscope_ia' ? 'Finscope IA' : 'Concesionario'],
          ].map(([l, v], i) => (
            <div key={l} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: i < 4 ? `1px solid ${C.g200}` : 'none', fontSize: 12 }}>
              <span style={{ color: C.g500 }}>{l}</span>
              <span style={{ color: C.g900, fontWeight: 500, textAlign: 'right', maxWidth: '60%' }}>{v}</span>
            </div>
          ))}
        </div>
        <div style={sectionStyle}>
          <p style={{ fontSize: 11, fontWeight: 600, color: C.g500, textTransform: 'uppercase', letterSpacing: '0.7px', marginBottom: 10 }}>
            F — Trazabilidad
          </p>
          {sol.timeline.map((t, i) => (
            <div key={i} style={{ display: 'flex', gap: 10, paddingBottom: i < sol.timeline.length - 1 ? 10 : 0 }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: i === sol.timeline.length - 1 ? C.magenta : C.g500, marginTop: 5 }} />
                {i < sol.timeline.length - 1 && <div style={{ width: 1, flex: 1, background: C.g200, marginTop: 2 }} />}
              </div>
              <div style={{ flex: 1, paddingBottom: i < sol.timeline.length - 1 ? 6 : 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 12, color: C.g900, fontWeight: i === sol.timeline.length - 1 ? 600 : 400 }}>{t.label}</span>
                  {sol.analista_override && t.label === 'En coordinación' && (
                    <span style={{ fontSize: 10, color: C.warn, fontWeight: 600, background: C.warnL, padding: '2px 6px', borderRadius: 10, border: `1px solid ${C.warn}30` }}>
                      ⚠ Override
                    </span>
                  )}
                </div>
                <div style={{ fontSize: 11, color: C.g500, marginTop: 1 }}>{t.date}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      </div>{/* fin contenido scrolleable */}

      {/* ── Barra de decisión sticky al fondo ─────────────────────────────── */}
      {isDecision && (
        <div style={{
          flexShrink: 0, padding: '14px 24px', background: C.white,
          borderTop: `2px solid ${C.g200}`,
          boxShadow: '0 -4px 16px rgba(0,0,0,0.06)',
          display: 'flex', flexDirection: 'column', gap: 10,
        }}>
          <p style={{ fontSize: 12, fontWeight: 600, color: C.g500, textTransform: 'uppercase', letterSpacing: '0.6px', margin: 0 }}>
            Decisión final
          </p>

          {/* Formulario de devolución (se expande hacia arriba visualmente) */}
          {showDevolverForm && (
            <div style={{ background: C.warnL, borderRadius: 9, padding: 12, border: `1px solid ${C.warn}30` }}>
              <p style={{ fontSize: 12, color: C.g700, marginBottom: 8 }}>Indica qué falta validar:</p>
              <textarea
                value={motivoDev}
                onChange={e => setMotivoDev(e.target.value)}
                placeholder="p. ej. Faltan certificados de ingresos del último trimestre"
                style={{
                  width: '100%', borderRadius: 7, border: `1px solid ${C.g200}`,
                  padding: 9, fontSize: 12, fontFamily: 'Roboto',
                  resize: 'none', height: 64, outline: 'none', boxSizing: 'border-box',
                }}
              />
              <button
                disabled={motivoDev.length < 10}
                onClick={() => setConfirm('devolver')}
                style={{
                  marginTop: 8, width: '100%', padding: 10, borderRadius: 7,
                  background: motivoDev.length >= 10 ? C.warn : C.g200,
                  color: motivoDev.length >= 10 ? '#fff' : C.g500,
                  fontSize: 13, fontWeight: 600, border: 'none',
                  cursor: motivoDev.length >= 10 ? 'pointer' : 'not-allowed',
                  fontFamily: 'Roboto',
                }}
              >
                Confirmar devolución
              </button>
            </div>
          )}

          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={() => setConfirm('aprobar')}
              style={{
                flex: 2, padding: 13, borderRadius: 9, background: C.success, color: '#fff',
                fontSize: 14, fontWeight: 600, border: 'none', cursor: 'pointer',
                fontFamily: 'Roboto', boxShadow: `0 4px 12px ${C.success}40`,
              }}
            >
              ✓ Aprobar
            </button>
            {sol.flujo === 'nuevo' && (
              <button
                onClick={() => setShowDevolverForm(f => !f)}
                style={{
                  flex: 1, padding: 11, borderRadius: 9, background: showDevolverForm ? C.warnL : 'transparent',
                  color: C.warn, fontSize: 13, fontWeight: 500, border: `1.5px solid ${C.warn}`,
                  cursor: 'pointer', fontFamily: 'Roboto',
                }}
              >
                ↺ Devolver
              </button>
            )}
            <button
              onClick={() => setConfirm('rechazar')}
              style={{
                flex: 1, padding: 11, borderRadius: 9, background: 'transparent', color: C.danger,
                fontSize: 13, fontWeight: 500, border: `1.5px solid ${C.danger}`,
                cursor: 'pointer', fontFamily: 'Roboto',
              }}
            >
              ✕ Rechazar
            </button>
          </div>
        </div>
      )}

      {/* Modales de confirmación */}
      {confirm === 'aprobar' && (
        <ConfirmModal
          title="¿Aprobar este caso?"
          description={`Confirma la aprobación de ${fmt(sol.monto)} para ${sol.cliente}.`}
          confirmLabel="Sí, aprobar"
          onConfirm={async () => { await onAprobar(); setConfirm(null); }}
          onCancel={() => setConfirm(null)}
        />
      )}
      {confirm === 'devolver' && (
        <ConfirmModal
          title="¿Devolver al analista?"
          description="El caso volverá a la cola del analista con tu comentario."
          confirmLabel="Sí, devolver"
          onConfirm={async () => { await onDevolver(motivoDev); setConfirm(null); setShowDevolverForm(false); }}
          onCancel={() => setConfirm(null)}
        />
      )}
      {confirm === 'rechazar' && (
        <ConfirmModal
          title="¿Rechazar definitivamente?"
          description="El cliente recibirá notificación. Esta acción cierra el caso y no se puede deshacer pasados los 30 s del undo."
          confirmLabel="Sí, rechazar"
          variant="danger"
          onConfirm={async () => { await onRechazar(); setConfirm(null); }}
          onCancel={() => setConfirm(null)}
        />
      )}
    </div>
  );
}

function ColaContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { solicitudes, loading, cambiarEstado, refetch } = useSolicitudes();
  const isMobile = useIsMobile();
  const [sel, setSel] = useState<string | null>(null);
  const [filterOrigen, setFilterOrigen] = useState<'todos' | 'ia' | 'nuevo'>('todos');
  const [toasts, setToasts] = useState<Array<{ id: number; msg: string; type?: 'success' | 'error'; onUndo?: () => void }>>([]);

  const cola = solicitudes.filter(s => s.status === 'en_coordinacion');

  const idParam = searchParams.get('id');
  useEffect(() => {
    if (!idParam) return;
    const found = solicitudes.find(s => s.id === idParam && s.status === 'en_coordinacion');
    if (found) setSel(idParam);
  }, [idParam, solicitudes]);

  const filtered = cola.filter(s => {
    if (filterOrigen === 'ia')    return s.origen === 'finscope_ia';
    if (filterOrigen === 'nuevo') return s.flujo === 'nuevo';
    return true;
  });

  const selSol = sel ? solicitudes.find(s => s.id === sel) ?? null : null;

  async function handleLogout() {
    await fetch('/api/auth/session', { method: 'DELETE' });
    router.push('/login');
  }

  async function handleReset() {
    await fetch('/api/reset', { method: 'POST' });
    await refetch();
    pushToast('Demo reiniciado.', () => {});
  }

  function pushToast(msg: string, undo?: () => void, type: 'success' | 'error' = 'success') {
    const id = Date.now();
    setToasts(t => [...t, { id, msg, type, onUndo: undo }]);
  }

  async function onAprobar() {
    if (!selSol) return;
    const { id, cliente } = selSol;
    try {
      await cambiarEstado(id, 'aprobada');
      setSel(null);
      pushToast(
        `Caso ${id} (${cliente}) aprobado`,
        () => { cambiarEstado(id, 'en_coordinacion').catch(() => refetch()); },
      );
    } catch (err) {
      await refetch();
      setSel(null);
      pushToast(err instanceof Error ? err.message : 'Error al aprobar — cola actualizada', undefined, 'error');
    }
  }

  async function onDevolver(motivo: string) {
    if (!selSol) return;
    const { id } = selSol;
    try {
      await cambiarEstado(id, 'devuelta_analista', { motivo });
      setSel(null);
      pushToast(
        `Caso ${id} devuelto al analista`,
        () => { cambiarEstado(id, 'en_coordinacion').catch(() => refetch()); },
      );
    } catch (err) {
      await refetch();
      setSel(null);
      pushToast(err instanceof Error ? err.message : 'Error al devolver — cola actualizada', undefined, 'error');
    }
  }

  async function onRechazar() {
    if (!selSol) return;
    const { id } = selSol;
    try {
      await cambiarEstado(id, 'rechazada');
      setSel(null);
      pushToast(
        `Caso ${id} rechazado`,
        () => { cambiarEstado(id, 'en_coordinacion').catch(() => refetch()); },
      );
    } catch (err) {
      await refetch();
      setSel(null);
      pushToast(err instanceof Error ? err.message : 'Error al rechazar — cola actualizada', undefined, 'error');
    }
  }

  const queueTable = (
    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
      <thead>
        <tr style={{ background: C.g50, position: 'sticky', top: 0, zIndex: 1 }}>
          {['Cliente', 'Monto', 'Estado', 'Tiempo', ''].map((h, i) => (
            <th key={i} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: C.g500, textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: `1px solid ${C.g200}` }}>
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {filtered.map(sol => (
          <QueueRow key={sol.id} sol={sol} selected={sol.id === sel} onClick={() => setSel(sol.id)} />
        ))}
      </tbody>
    </table>
  );

  const desktopContent = (
    <div style={{ display: 'flex', height: 'calc(100vh - 52px)', marginTop: 52 }}>
      {/* Cola izquierda */}
      <div style={{ width: '42%', display: 'flex', flexDirection: 'column', background: C.white, borderRight: `1px solid ${C.g200}` }}>
        <div style={{ padding: '14px 20px', borderBottom: `1px solid ${C.g200}`, flexShrink: 0 }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, color: C.g900, marginBottom: 12 }}>
            Cola de coordinación — {filtered.length} casos
          </h2>
          <div style={{ display: 'flex', gap: 8 }}>
            {([['todos', 'Todos'], ['ia', '⚡ IA'], ['nuevo', 'Concesionario']] as const).map(([v, l]) => (
              <button
                key={v}
                onClick={() => setFilterOrigen(v)}
                style={{
                  padding: '6px 12px', borderRadius: 8,
                  border: `1px solid ${filterOrigen === v ? C.magenta : C.g200}`,
                  background: filterOrigen === v ? C.magentaL : C.g50,
                  color: filterOrigen === v ? C.magenta : C.g700,
                  fontSize: 12, cursor: 'pointer', fontFamily: 'Roboto',
                  fontWeight: filterOrigen === v ? 600 : 400,
                }}
              >
                {l}
              </button>
            ))}
          </div>
        </div>
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {loading ? (
            <div style={{ padding: '8px 0' }}>
              {[1, 2, 3, 4].map(i => (
                <div key={i} style={{ padding: '12px 14px', borderBottom: `1px solid ${C.g200}`, display: 'flex', flexDirection: 'column', gap: 7 }}>
                  <div style={{ height: 13, width: '60%', borderRadius: 6, background: C.g200, animation: 'pulse 1.4s ease-in-out infinite' }} />
                  <div style={{ height: 11, width: '35%', borderRadius: 6, background: C.g200, animation: 'pulse 1.4s ease-in-out infinite', animationDelay: '0.2s' }} />
                  <div style={{ display: 'flex', gap: 6 }}>
                    <div style={{ height: 18, width: 52, borderRadius: 10, background: C.g200, animation: 'pulse 1.4s ease-in-out infinite', animationDelay: '0.4s' }} />
                    <div style={{ height: 18, width: 38, borderRadius: 10, background: C.g200, animation: 'pulse 1.4s ease-in-out infinite', animationDelay: '0.5s' }} />
                  </div>
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: 32, textAlign: 'center', color: C.g500, fontSize: 14 }}>
              No hay casos pendientes de decisión
            </div>
          ) : queueTable}
        </div>
      </div>

      {/* Panel de detalle derecho */}
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', background: C.g50 }}>
        {selSol ? (
          <CaseDetailPanel
            sol={selSol}
            onAprobar={onAprobar}
            onDevolver={onDevolver}
            onRechazar={onRechazar}
          />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: C.g500, fontSize: 14, gap: 8 }}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke={C.g200} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
            </svg>
            Selecciona un caso de la cola
          </div>
        )}
      </div>
    </div>
  );

  const mobileContent = (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: C.g50 }}>
      {!sel ? (
        <>
          <div style={{ padding: '14px 16px', background: C.white, borderBottom: `1px solid ${C.g200}` }}>
            <h2 style={{ fontSize: 16, fontWeight: 600, color: C.g900, marginBottom: 6 }}>
              Mi cola — {cola.length} casos
            </h2>
            <p style={{ fontSize: 11, color: C.g500 }}>Toca un caso para ver el detalle y decidir.</p>
          </div>
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {cola.map(sol => (
              <div
                key={sol.id}
                onClick={() => setSel(sol.id)}
                style={{
                  padding: '14px 16px', background: C.white, borderBottom: `1px solid ${C.g200}`,
                  cursor: 'pointer', display: 'flex', gap: 12, alignItems: 'flex-start',
                  borderLeft: sol.origen === 'finscope_ia' ? `3px solid ${C.blue}` : '3px solid transparent',
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <span style={{ fontSize: 14, fontWeight: 600, color: C.g900 }}>{sol.cliente}</span>
                    <span style={{ fontSize: 11, color: C.g500 }}>{sol.updated}</span>
                  </div>
                  <div style={{ fontSize: 12, color: C.g500, marginBottom: 8 }}>{sol.id} · {fmt(sol.monto)}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <StatusBadge status={sol.status} />
                    <OriginBadge origen={sol.origen} />
                  </div>
                </div>
                <span style={{ fontSize: 18, color: C.g500, paddingTop: 2 }}>›</span>
              </div>
            ))}
          </div>
        </>
      ) : selSol ? (
        <div style={{ flex: 1, overflowY: 'auto' }}>
          <button
            onClick={() => setSel(null)}
            style={{
              background: C.white, border: 'none', borderBottom: `1px solid ${C.g200}`,
              padding: '12px 16px', width: '100%', display: 'flex', alignItems: 'center',
              gap: 8, color: C.magenta, fontSize: 14, cursor: 'pointer', fontFamily: 'Roboto',
            }}
          >
            <svg width="8" height="14" viewBox="0 0 8 14" fill="none">
              <path d="M6 2L2 7l4 5" stroke={C.magenta} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Volver a la cola
          </button>
          <CaseDetailPanel
            sol={selSol}
            onAprobar={onAprobar}
            onDevolver={onDevolver}
            onRechazar={onRechazar}
          />
        </div>
      ) : null}
    </div>
  );

  return (
    <>
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}`}</style>
      <NavBar
        rol="coordinador"
        activeLabel="Cola de decisión"
        tabs={TABS}
        onLogout={handleLogout}
        onReset={handleReset}
      />
      {!isMobile
        ? desktopContent
        : (
          <div style={{
            marginTop: 52, background: '#EDECEA', minHeight: 'calc(100vh - 52px)',
            display: 'flex', justifyContent: 'center', alignItems: 'flex-start',
            padding: 20, overflowY: 'auto',
          }}>
            <div style={{
              width: 390, background: C.white, borderRadius: 24,
              overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
              minHeight: 760, display: 'flex', flexDirection: 'column',
            }}>
              {mobileContent}
            </div>
          </div>
        )
      }
      {toasts.map(t => (
        <Toast key={t.id} message={t.msg} type={t.type} onUndo={t.onUndo} onClose={() => setToasts(p => p.filter(x => x.id !== t.id))} />
      ))}
    </>
  );
}

export default function CoordinadorCola() {
  return (
    <Suspense fallback={
      <div style={{ marginTop: 52, padding: 32, color: C.g500, fontFamily: 'Roboto', fontSize: 14 }}>
        Cargando cola…
      </div>
    }>
      <ColaContent />
    </Suspense>
  );
}
