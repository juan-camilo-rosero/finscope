'use client';
import { useState } from 'react';
import Logo from '../../../components/shell/Logo';
import DeviceToggle from '../../../components/shell/DeviceToggle';
import { C } from '../../../lib/theme';

// ─── Constantes ───────────────────────────────────────────────────────────────

const SECTIONS = [
  'Datos del cliente',
  'Datos laborales y financieros',
  'Datos del vehículo',
  'Documentos',
];

type UploadSt = 'empty' | 'done';

interface FormData {
  tipoDoc: string; numDoc: string; nombre: string; fechaNac: string;
  correo: string; celular: string; autocompletado: boolean;
  tipoContrato: string; empresa: string; ingresos: string; egresos: string;
  tipoVeh: string; marca: string; modelo: string; anio: string;
  valorComercial: string; cuotaInicial: string; plazo: string; concesionario: string;
  uploads: Record<string, UploadSt>;
}

const EMPTY: FormData = {
  tipoDoc: '', numDoc: '', nombre: '', fechaNac: '',
  correo: '', celular: '', autocompletado: false,
  tipoContrato: '', empresa: '', ingresos: '', egresos: '',
  tipoVeh: '', marca: '', modelo: '', anio: '',
  valorComercial: '', cuotaInicial: '', plazo: '', concesionario: '',
  uploads: {},
};

// ─── Primitivos de formulario ─────────────────────────────────────────────────

function Field({ label, type = 'text', value, onChange, placeholder = '', error = '', hint = '', required = false }: {
  label: string; type?: string; value: string; onChange: (v: string) => void;
  placeholder?: string; error?: string; hint?: string; required?: boolean;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      <label style={{ fontSize: 13, fontWeight: 500, color: C.g700 }}>
        {label}{required && <span style={{ color: C.magenta }}> *</span>}
      </label>
      <input
        type={type} value={value} onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          padding: '10px 12px', borderRadius: 9,
          border: `1px solid ${error ? '#ef4444' : C.g200}`,
          fontSize: 14, color: C.g900, outline: 'none',
          background: C.white, transition: 'border 0.15s', fontFamily: 'Roboto',
          width: '100%', boxSizing: 'border-box',
        }}
        onFocus={e => { e.currentTarget.style.borderColor = error ? '#ef4444' : C.magenta; }}
        onBlur={e => { e.currentTarget.style.borderColor = error ? '#ef4444' : C.g200; }}
      />
      {error && <span style={{ fontSize: 12, color: '#ef4444' }}>{error}</span>}
      {hint && !error && <span style={{ fontSize: 12, color: C.g500 }}>{hint}</span>}
    </div>
  );
}

function Sel({ label, value, onChange, opts, required = false }: {
  label: string; value: string; onChange: (v: string) => void;
  opts: string[]; required?: boolean;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      <label style={{ fontSize: 13, fontWeight: 500, color: C.g700 }}>
        {label}{required && <span style={{ color: C.magenta }}> *</span>}
      </label>
      <select
        value={value} onChange={e => onChange(e.target.value)}
        style={{
          padding: '10px 12px', borderRadius: 9, border: `1px solid ${C.g200}`,
          fontSize: 14, color: value ? C.g900 : C.g500,
          background: C.white, outline: 'none', cursor: 'pointer', fontFamily: 'Roboto',
          width: '100%', boxSizing: 'border-box',
        }}
      >
        <option value="">Seleccionar...</option>
        {opts.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}

function UploadZone({ label, state, onUpload }: { label: string; state: UploadSt; onUpload: () => void }) {
  return (
    <div
      onClick={state !== 'done' ? onUpload : undefined}
      style={{
        borderRadius: 10, border: `1.5px dashed ${state === 'done' ? C.magenta : C.g200}`,
        background: state === 'done' ? C.magentaL : C.g50,
        padding: '14px 16px', display: 'flex', alignItems: 'center',
        gap: 12, cursor: state !== 'done' ? 'pointer' : 'default', transition: 'all 0.2s',
      }}
    >
      <div style={{
        width: 36, height: 36, borderRadius: 8,
        background: state === 'done' ? C.magenta : C.g200,
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>
        {state === 'done' ? (
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M3 9l5 5 7-7" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        ) : (
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M9 3v10M4 8l5-5 5 5" stroke={C.g500} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M2 15h14" stroke={C.g500} strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        )}
      </div>
      <div>
        <div style={{ fontSize: 13, fontWeight: 500, color: state === 'done' ? C.magenta : C.g900 }}>{label}</div>
        <div style={{ fontSize: 12, color: C.g500 }}>{state === 'done' ? 'Cargado correctamente' : 'Haz clic para adjuntar'}</div>
      </div>
    </div>
  );
}

// ─── Contenido por sección ────────────────────────────────────────────────────

function FormContent({ section, data, setData, mobile = false }: {
  section: number; data: FormData;
  setData: React.Dispatch<React.SetStateAction<FormData>>;
  mobile?: boolean;
}) {
  const g2: React.CSSProperties = { display: 'grid', gridTemplateColumns: mobile ? '1fr' : '1fr 1fr', gap: 16 };

  if (section === 0) {
    const correoErr = data.correo && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.correo) ? 'Correo inválido' : '';
    const celErr = data.celular && data.celular.replace(/\D/g, '').length !== 10 && data.celular.length > 0
      ? 'Debe tener 10 dígitos' : '';
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={g2}>
          <Sel label="Tipo de documento" value={data.tipoDoc} required
            onChange={v => setData(d => ({ ...d, tipoDoc: v }))}
            opts={['Cédula de ciudadanía', 'Cédula de extranjería', 'NIT', 'Pasaporte']}
          />
          <Field label="Número de documento" value={data.numDoc} placeholder="Ej. 1075234891" required
            onChange={v => {
              const auto = v === '1075234891';
              setData(d => ({ ...d, numDoc: v, nombre: auto ? 'Alejandro Torres' : d.nombre, autocompletado: auto }));
            }}
          />
        </div>
        {data.autocompletado && (
          <div style={{
            background: '#f0fdf4', border: '1px solid #86efac', borderRadius: 9,
            padding: '10px 14px', fontSize: 13, color: '#166534',
          }}>
            ✓ Este cliente ya está en nuestra base. Cargamos sus datos. Verifica antes de continuar.
          </div>
        )}
        <div style={g2}>
          <Field label="Nombre completo" value={data.nombre} placeholder="Nombre y apellidos" required
            onChange={v => setData(d => ({ ...d, nombre: v }))} />
          <Field label="Fecha de nacimiento" type="date" value={data.fechaNac} required
            onChange={v => setData(d => ({ ...d, fechaNac: v }))} />
        </div>
        <div style={g2}>
          <Field label="Correo electrónico" type="email" value={data.correo}
            placeholder="ejemplo@correo.com" required error={correoErr}
            onChange={v => setData(d => ({ ...d, correo: v }))} />
          <Field label="Celular" value={data.celular} placeholder="3XX XXX XXXX"
            required error={celErr}
            onChange={v => setData(d => ({ ...d, celular: v }))} />
        </div>
      </div>
    );
  }

  if (section === 1) {
    const ing = parseInt(data.ingresos.replace(/\D/g, '') || '0');
    const egr = parseInt(data.egresos.replace(/\D/g, '') || '0');
    const ajustada = ing > 0 && (ing - egr) < 3_000_000;
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={g2}>
          <Sel label="Tipo de contrato" value={data.tipoContrato} required
            onChange={v => setData(d => ({ ...d, tipoContrato: v }))}
            opts={['Término indefinido', 'Término fijo', 'Prestación de servicios', 'Independiente']}
          />
          <Field label="Empresa" value={data.empresa} placeholder="Nombre de la empresa" required
            onChange={v => setData(d => ({ ...d, empresa: v }))} />
        </div>
        <div style={g2}>
          <Field label="Ingresos mensuales" value={data.ingresos} placeholder="$0"
            hint="Antes de deducciones" required
            onChange={v => setData(d => ({ ...d, ingresos: v }))} />
          <Field label="Egresos fijos mensuales" value={data.egresos} placeholder="$0" required
            onChange={v => setData(d => ({ ...d, egresos: v }))} />
        </div>
        {ajustada && (
          <div style={{
            background: '#fffbeb', border: '1px solid #fcd34d', borderRadius: 9,
            padding: '10px 14px', fontSize: 13, color: '#92400e',
          }}>
            ⚠️ La capacidad de pago parece ajustada. Puedes continuar, pero el análisis tomará más tiempo.
          </div>
        )}
      </div>
    );
  }

  if (section === 2) {
    const valor = parseInt(data.valorComercial.replace(/\D/g, '') || '0');
    const inicial = parseInt(data.cuotaInicial.replace(/\D/g, '') || '0');
    const financiar = valor - inicial;
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={g2}>
          <Sel label="Tipo de vehículo" value={data.tipoVeh} required
            onChange={v => setData(d => ({ ...d, tipoVeh: v }))} opts={['Nuevo', 'Usado']} />
          <Sel label="Marca" value={data.marca} required
            onChange={v => setData(d => ({ ...d, marca: v }))}
            opts={['Mazda', 'Toyota', 'Chevrolet', 'Renault', 'KIA', 'Nissan', 'Ford', 'Hyundai']}
          />
        </div>
        <div style={g2}>
          <Field label="Modelo" value={data.modelo} placeholder="Ej. CX-5 Grand Touring 2024" required
            onChange={v => setData(d => ({ ...d, modelo: v }))} />
          <Field label="Año" value={data.anio} placeholder="2024" required
            onChange={v => setData(d => ({ ...d, anio: v }))} />
        </div>
        <div style={g2}>
          <Field label="Valor comercial" value={data.valorComercial} placeholder="$138.000.000" required
            onChange={v => setData(d => ({ ...d, valorComercial: v }))} />
          <Field label="Cuota inicial" value={data.cuotaInicial} placeholder="$27.600.000" required
            onChange={v => setData(d => ({ ...d, cuotaInicial: v }))} />
        </div>
        {financiar > 0 && (
          <div style={{
            background: C.magentaL, borderRadius: 9, padding: '12px 16px',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <span style={{ fontSize: 13, color: C.g700 }}>Monto a financiar</span>
            <span style={{ fontSize: 18, fontWeight: 700, color: C.magenta }}>
              ${financiar.toLocaleString('es-CO')}
            </span>
          </div>
        )}
        <div style={g2}>
          <Sel label="Plazo de financiación" value={data.plazo} required
            onChange={v => setData(d => ({ ...d, plazo: v }))}
            opts={['12 meses', '24 meses', '36 meses', '48 meses', '60 meses']}
          />
          <Sel label="Concesionario" value={data.concesionario} required
            onChange={v => setData(d => ({ ...d, concesionario: v }))}
            opts={[
              'Mazda Colombia — Bogotá Norte',
              'Mazda Colombia — Bogotá Sur',
              'Grupo Automotriz Andino',
              'Motorex S.A.',
              'Automotores El Cóndor',
            ]}
          />
        </div>
      </div>
    );
  }

  if (section === 3) {
    const docs: Array<[string, string]> = data.autocompletado
      ? [['Cédula actualizada', 'ced'], ['Documentos del vehículo', 'veh'], ['Cotización del concesionario', 'cot']]
      : [['Cédula de ciudadanía', 'ced'], ['Certificado laboral', 'cert'], ['Extractos bancarios (3 meses)', 'ext'], ['Documentos del vehículo', 'veh']];
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <p style={{ fontSize: 13, color: C.g700 }}>
          {data.autocompletado
            ? 'Cliente existente — solo se requieren documentos actualizados.'
            : 'Cliente nuevo — se requieren todos los documentos de la lista.'}
        </p>
        {docs.map(([label, key]) => (
          <UploadZone key={key} label={label}
            state={(data.uploads[key] as UploadSt) ?? 'empty'}
            onUpload={() => setData(d => ({ ...d, uploads: { ...d.uploads, [key]: 'done' } }))}
          />
        ))}
      </div>
    );
  }

  return null;
}

// ─── Side card (resumen, solo desktop) ───────────────────────────────────────

function SideCard({ data }: { data: FormData }) {
  const valor = parseInt(data.valorComercial.replace(/\D/g, '') || '0');
  const inicial = parseInt(data.cuotaInicial.replace(/\D/g, '') || '0');
  const financiar = valor - inicial;
  const rows: Array<[string, string]> = [
    ['Cliente', data.nombre || '—'],
    ['Vehículo', data.marca && data.modelo ? `${data.marca} ${data.modelo}` : '—'],
    ['Valor comercial', valor ? `$${valor.toLocaleString('es-CO')}` : '—'],
    ['Cuota inicial', inicial ? `$${inicial.toLocaleString('es-CO')}` : '—'],
    ['Monto a financiar', financiar > 0 ? `$${financiar.toLocaleString('es-CO')}` : '—'],
  ];
  return (
    <div style={{ width: 260, flexShrink: 0 }}>
      <div style={{
        background: C.white, borderRadius: 14, padding: 18,
        border: `1px solid ${C.g200}`, boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
      }}>
        <p style={{
          fontSize: 12, fontWeight: 600, color: C.g500, textTransform: 'uppercase',
          letterSpacing: '0.7px', marginBottom: 14,
        }}>Resumen de la solicitud</p>
        {rows.map(([l, v]) => (
          <div key={l} style={{
            display: 'flex', justifyContent: 'space-between',
            padding: '7px 0', borderBottom: `1px solid ${C.g200}`, fontSize: 13,
          }}>
            <span style={{ color: C.g500 }}>{l}</span>
            <span style={{
              color: C.g900, fontWeight: 500, textAlign: 'right',
              maxWidth: 130, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>{v}</span>
          </div>
        ))}
        {financiar > 0 && (
          <div style={{ marginTop: 12, background: C.magentaL, borderRadius: 8, padding: '10px 12px', textAlign: 'center' }}>
            <div style={{ fontSize: 11, color: C.g500 }}>Monto a financiar</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: C.magenta }}>
              ${financiar.toLocaleString('es-CO')}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Página principal ─────────────────────────────────────────────────────────

export default function ClienteRadicar() {
  const [device, setDevice] = useState<'desktop' | 'mobile'>('desktop');
  const [data, setData] = useState<FormData>(EMPTY);
  const [section, setSection] = useState(0);
  const [modal, setModal] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [successId, setSuccessId] = useState<string | null>(null);

  const requiredDocs = data.autocompletado ? 3 : 4;
  const uploadedCount = Object.values(data.uploads).filter(v => v === 'done').length;

  const sectionFill = [
    !!(data.tipoDoc && data.numDoc && data.nombre && data.correo && data.celular
      && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.correo)
      && data.celular.replace(/\D/g, '').length === 10),
    !!(data.tipoContrato && data.empresa && data.ingresos && data.egresos),
    !!(data.marca && data.modelo && data.anio && data.valorComercial && data.cuotaInicial && data.plazo && data.concesionario),
    uploadedCount >= requiredDocs,
  ];
  const pct = Math.round(sectionFill.filter(Boolean).length / 4 * 100);
  const allFilled = sectionFill.every(Boolean);

  async function handleRadicar() {
    setLoading(true);
    try {
      const plazoNum = parseInt(data.plazo.replace(/\D/g, ''));
      const body = {
        flujo: 'nuevo' as const,
        origen: 'concesionario' as const,
        cliente: data.nombre,
        cedula: data.numDoc,
        vehiculo: `${data.marca} ${data.modelo} ${data.anio}`,
        monto: parseInt(data.valorComercial.replace(/\D/g, '')),
        plazoMeses: plazoNum,
        tipo: (data.tipoVeh || 'Nuevo') as 'Nuevo' | 'Usado',
      };
      const res = await fetch('/api/solicitudes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const json = await res.json() as { id?: string };
      setSuccessId(json.id ?? 'SOL-NUEVA');
      setModal(false);
    } finally {
      setLoading(false);
    }
  }

  function resetForm() {
    setData(EMPTY);
    setSection(0);
    setModal(false);
    setConfirmed(false);
    setSuccessId(null);
  }

  // ── Header ────────────────────────────────────────────────────────────────
  const header = (
    <div style={{
      height: 52, background: C.white, borderBottom: `1px solid ${C.g200}`,
      display: 'flex', alignItems: 'center', padding: '0 20px',
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
    }}>
      <Logo />
      <span style={{ marginLeft: 12, fontSize: 13, color: C.g500 }}>Solicitud de crédito vehicular</span>
      <div style={{ flex: 1 }} />
      <DeviceToggle device={device} onChange={setDevice} />
    </div>
  );

  // ── Success ───────────────────────────────────────────────────────────────
  if (successId) return (
    <>
      {header}
      <div style={{
        marginTop: 52, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        minHeight: 'calc(100vh - 52px)', gap: 20, padding: 24,
        background: '#F5F4F2',
      }}>
        <div style={{
          width: 72, height: 72, borderRadius: '50%',
          background: C.magentaL, border: `2px solid ${C.magenta}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
            <path d="M6 16l8 8 12-12" stroke={C.magenta} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <div style={{ textAlign: 'center' }}>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: C.g900, marginBottom: 8 }}>Solicitud radicada</h2>
          <p style={{ fontSize: 14, color: C.g700 }}>
            Número de solicitud: <strong>{successId}</strong>
          </p>
          <p style={{ fontSize: 13, color: C.g500, marginTop: 6 }}>
            El analista de crédito recibirá la solicitud para su evaluación.
          </p>
        </div>
        <button
          onClick={resetForm}
          style={{
            padding: '12px 28px', borderRadius: 9, background: C.magenta,
            color: '#fff', fontSize: 14, fontWeight: 600,
            border: 'none', cursor: 'pointer', fontFamily: 'Roboto',
          }}
        >
          Radicar otra solicitud
        </button>
      </div>
    </>
  );

  // ── Progress bar (shared) ─────────────────────────────────────────────────
  const progressBar = (mobile: boolean) => (
    <div style={{
      background: C.white, borderBottom: `1px solid ${C.g200}`,
      padding: mobile ? '12px 16px' : '14px 32px', flexShrink: 0,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <span style={{ fontSize: mobile ? 13 : 14, fontWeight: 600, color: C.g900 }}>
          {mobile ? 'Nueva solicitud' : 'Nueva solicitud de crédito vehicular'}
        </span>
        <span style={{ fontSize: 13, color: C.g500 }}>{pct}% completado</span>
      </div>
      <div style={{ display: 'flex', gap: mobile ? 4 : 6 }}>
        {SECTIONS.map((s, i) => (
          <div key={s} onClick={() => setSection(i)}
            style={{ flex: 1, cursor: 'pointer' }}>
            <div style={{
              height: 4, borderRadius: 2,
              background: sectionFill[i] ? C.magenta : i === section ? C.g700 : C.g200,
              transition: 'background 0.3s', marginBottom: 5,
            }} />
            {!mobile && (
              <span style={{
                fontSize: 11, fontWeight: i === section ? 600 : 400,
                color: i === section ? C.g900 : C.g500,
              }}>{i + 1}. {s}</span>
            )}
          </div>
        ))}
      </div>
      {mobile && (
        <div style={{ marginTop: 6, fontSize: 12, color: C.g500 }}>
          Paso {section + 1} de 4: {SECTIONS[section]}
        </div>
      )}
    </div>
  );

  // ── Nav buttons ───────────────────────────────────────────────────────────
  const navButtons = (mobile: boolean) => (
    <div style={{
      display: 'flex', justifyContent: 'space-between', gap: 10,
      ...(mobile ? {
        padding: '12px 16px', background: C.white,
        borderTop: `1px solid ${C.g200}`, flexShrink: 0,
      } : {}),
    }}>
      <button
        disabled={section === 0}
        onClick={() => setSection(s => s - 1)}
        style={{
          padding: '10px 20px', borderRadius: 9,
          background: section === 0 ? C.g50 : C.white,
          border: `1px solid ${C.g200}`,
          fontSize: 13, color: section === 0 ? C.g500 : C.g700,
          cursor: section === 0 ? 'not-allowed' : 'pointer', fontFamily: 'Roboto',
        }}
      >← Anterior</button>
      {section < 3
        ? (
          <button
            onClick={() => setSection(s => s + 1)}
            style={{
              padding: '10px 20px', borderRadius: 9, background: C.magenta,
              color: '#fff', fontSize: 13, fontWeight: 600,
              border: 'none', cursor: 'pointer', fontFamily: 'Roboto',
              boxShadow: `0 3px 8px rgba(238,37,42,0.25)`,
            }}
          >Siguiente →</button>
        ) : (
          <button
            disabled={!allFilled}
            onClick={() => { setConfirmed(false); setModal(true); }}
            style={{
              padding: '10px 24px', borderRadius: 9,
              background: allFilled ? C.magenta : C.g200,
              color: allFilled ? '#fff' : C.g500,
              fontSize: 13, fontWeight: 600, border: 'none',
              cursor: allFilled ? 'pointer' : 'not-allowed', fontFamily: 'Roboto',
              boxShadow: allFilled ? `0 4px 12px rgba(238,37,42,0.25)` : 'none',
            }}
          >Radicar solicitud</button>
        )}
    </div>
  );

  // ── Modal de confirmación (con checkbox) ──────────────────────────────────
  const confirmModal = modal && (
    <div
      onClick={() => setModal(false)}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
        zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 20,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: C.white, borderRadius: 16, padding: 28,
          maxWidth: 480, width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
        }}
      >
        <h3 style={{ fontSize: 16, fontWeight: 700, color: C.g900, marginBottom: 6 }}>Confirmar radicación</h3>
        <p style={{ fontSize: 13, color: C.g700, lineHeight: 1.6, marginBottom: 16 }}>
          Revisa el resumen antes de enviar. Esta solicitud pasará al analista de crédito para su evaluación.
        </p>
        {([
          ['Cliente', data.nombre],
          ['Vehículo', `${data.marca} ${data.modelo} ${data.anio}`],
          ['Monto a financiar', `$${(parseInt(data.valorComercial.replace(/\D/g, '') || '0') - parseInt(data.cuotaInicial.replace(/\D/g, '') || '0')).toLocaleString('es-CO')}`],
        ] as Array<[string, string]>).map(([l, v]) => (
          <div key={l} style={{
            display: 'flex', justifyContent: 'space-between',
            padding: '7px 0', borderBottom: `1px solid ${C.g200}`, fontSize: 13,
          }}>
            <span style={{ color: C.g500 }}>{l}</span>
            <span style={{ color: C.g900, fontWeight: 500 }}>{v}</span>
          </div>
        ))}
        <div
          onClick={() => setConfirmed(c => !c)}
          style={{ display: 'flex', gap: 12, alignItems: 'flex-start', marginTop: 16, cursor: 'pointer' }}
        >
          <div style={{
            width: 20, height: 20, borderRadius: 5,
            border: `2px solid ${confirmed ? C.magenta : C.g200}`,
            background: confirmed ? C.magenta : C.white,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0, transition: 'all 0.15s',
          }}>
            {confirmed && (
              <svg width="11" height="8" viewBox="0 0 11 8" fill="none">
                <path d="M1 4l3 3 6-6" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </div>
          <span style={{ fontSize: 13, color: C.g700, lineHeight: 1.5 }}>
            Confirmo que revisé la información con el cliente y es correcta.
          </span>
        </div>
        <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
          <button
            disabled={!confirmed || loading}
            onClick={handleRadicar}
            style={{
              flex: 1, padding: 12, borderRadius: 9,
              background: confirmed && !loading ? C.magenta : C.g200,
              color: confirmed && !loading ? '#fff' : C.g500,
              fontSize: 14, fontWeight: 600, border: 'none',
              cursor: confirmed && !loading ? 'pointer' : 'not-allowed',
              fontFamily: 'Roboto',
            }}
          >
            {loading ? 'Radicando...' : 'Radicar solicitud'}
          </button>
          <button
            onClick={() => setModal(false)}
            style={{
              flex: 1, padding: 12, borderRadius: 9, background: C.g50,
              color: C.g700, fontSize: 14, border: `1px solid ${C.g200}`,
              cursor: 'pointer', fontFamily: 'Roboto',
            }}
          >Revisar</button>
        </div>
      </div>
    </div>
  );

  // ── Desktop layout ────────────────────────────────────────────────────────
  const desktopView = (
    <div style={{ marginTop: 52, display: 'flex', flexDirection: 'column', height: 'calc(100vh - 52px)' }}>
      {progressBar(false)}
      <div style={{ flex: 1, overflowY: 'auto', padding: '24px 32px', display: 'flex', gap: 24, background: '#F5F4F2' }}>
        <div style={{ flex: 1 }}>
          <div style={{
            background: C.white, borderRadius: 14, padding: 24,
            boxShadow: '0 2px 8px rgba(0,0,0,0.05)', border: `1px solid ${C.g200}`, marginBottom: 20,
          }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, color: C.g900, marginBottom: 20 }}>
              {section + 1}. {SECTIONS[section]}
            </h3>
            <FormContent section={section} data={data} setData={setData} />
          </div>
          {navButtons(false)}
        </div>
        <SideCard data={data} />
      </div>
    </div>
  );

  // ── Mobile layout ─────────────────────────────────────────────────────────
  const mobileView = (
    <div style={{
      display: 'flex', justifyContent: 'center', alignItems: 'flex-start',
      background: '#EDECEA', padding: 20,
      minHeight: 'calc(100vh - 52px)', marginTop: 52, overflowY: 'auto',
    }}>
      <div style={{
        width: 390, background: C.white, borderRadius: 24,
        overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
        display: 'flex', flexDirection: 'column', minHeight: 680,
      }}>
        {progressBar(true)}
        <div style={{ flex: 1, overflowY: 'auto', padding: 16, background: C.g50 }}>
          <div style={{ background: C.white, borderRadius: 12, padding: 16, boxShadow: '0 1px 6px rgba(0,0,0,0.05)' }}>
            <FormContent section={section} data={data} setData={setData} mobile />
          </div>
        </div>
        {navButtons(true)}
      </div>
    </div>
  );

  return (
    <>
      {header}
      {device === 'desktop' ? desktopView : mobileView}
      {confirmModal}
    </>
  );
}
