# Finscope — Especificación para Spec-Driven Development (SDD)

**Proyecto:** Finscope — CRM de originación proactiva de crédito vehicular
**Contexto:** Proyecto final, asignatura Sistemas de Información (2025982) · UNAL · Banco Finandina
**Tipo de entregable:** Prototipo funcional (Hito 3) — debe funcionar y demostrar el flujo completo
**Versión del spec:** 1.0
**Stack:** Next.js (App Router) + TypeScript + Tailwind + Firebase Auth · Deploy en Vercel

---

## 0. Cómo leer este documento

Este es el contrato técnico único del proyecto. Cualquier agente (Claude Code) o persona que construya
una pantalla debe regirse por él. El orden de autoridad ante una duda es:

1. **La carpeta `reference/`** (los HTML originales) — fuente de verdad **visual y de interacción**.
2. **Este `SPEC.md`** — fuente de verdad **arquitectónica, de datos y de alcance**.
3. El criterio del desarrollador — solo para lo que ninguno de los dos cubra.

Si el SPEC y un HTML de `reference/` se contradicen en un detalle visual, **gana el HTML**.
Si se contradicen en arquitectura, datos o alcance, **gana el SPEC**.

---

## 1. Objetivo y criterio de éxito

Construir una aplicación web navegable que demuestre, de punta a punta, el flujo de originación de
crédito vehicular de Finandina a través de los distintos roles internos. El valor que se demuestra no es
la velocidad del trámite, sino la **visibilidad del proceso entre roles**: una solicitud nace, se analiza,
se decide, se revisa y se desembolsa, y cada rol ve su parte en tiempo (casi) real.

**El prototipo se considera terminado cuando:**

- Un usuario puede iniciar sesión y el sistema lo enruta a la vista de su rol.
- El Ejecutivo puede radicar una solicitud nueva (P5) y verla aparecer en su dashboard (P6).
- Esa solicitud avanza de estado al pasar por Analista (P3) → Coordinador (P4) → Operativo (P7) → Desembolso (P8).
- Cada cambio de estado se refleja en el dashboard del Ejecutivo (P6).
- Las consultas a fuentes externas (DataCrédito, RUNT, Automas, SOI) están **simuladas** y muestran
  un estado de carga seguido de un resultado coherente.
- El estilo visual es **idéntico** al de los HTML de `reference/`.

---

## 2. Restricciones duras (NO negociables)

1. **Fidelidad visual absoluta.** Ver §4. Ni un color, fuente, radio, sombra o animación distinto.
2. **La única integración externa real es la autenticación (Firebase Auth).** Todo lo demás se simula.
3. **Todo el "backend" vive en route handlers de Next.js** (`app/api/**`). No hay base de datos externa,
   no hay Firestore, no hay servicios de terceros más allá de Firebase Auth.
4. **Debe funcionar en el demo.** Reliabilidad sobre pureza arquitectónica. Ver §8 (caveat de Vercel).
5. **Las integraciones no se desarrollan, se simulan.** El profesor entiende y acepta esto explícitamente.
6. Idioma de toda la UI y los textos: **español**.

---

## 3. Mapa de archivos de referencia (`reference/`)

Todos los HTML originales van en una carpeta `reference/` en la raíz del repo. Son **solo lectura**: nunca
se editan; son la fuente de fidelidad visual. La columna "Autoridad" indica qué archivo manda para cada
pantalla cuando existe más de una versión.

| Pantalla | Archivo autoritativo en `reference/` | Rol | ¿Se construye en Next.js? |
|---|---|---|---|
| P1+P2 Cliente (B2C) | `Finscope Prototype v2 - RITE.html` | Cliente | **No** — se enlaza como HTML estático |
| P3 Analista | `Finscope P3 - Analista v2 - RITE.html` | Analista de crédito | **Sí** |
| P4 Coordinador | `Finscope P4 - Coordinador v2 - RITE.html` | Coordinador de crédito | **Sí** |
| P5 Radicación | `Finscope P5 - Ejecutivo.html` | Ejecutivo comercial | **Sí** |
| P6 Dashboard | `Finscope P6 - Ejecutivo Dashboard.html` | Ejecutivo comercial | **Sí** |
| P7 Operativo | `Finscope P7 - Operativo.html` | Analista operativo | **Sí** |
| P8 Desembolso | `Finscope P8 - Desembolso.html` | Analista de desembolso | **Sí** |
| P9 Excepción | `Finscope P9 - Excepcion.html` | Cliente (edge case) | No |
| P10 Espera | `Finscope P10 - Espera.html` | Cliente | No (se reemplaza por loaders) |
| P11 QR | `Finscope P11 - QR.html` | Cliente / Concesionario | No |
| Frame iOS compartido | `ios-frame.jsx` | — | **Sí** — se porta a `components/ios/` |

**Archivos solo-referencia (no autoritativos, conservar pero no usar para construir):**
`Finscope Prototype.html` (v1), `Finscope P3 - Analista.html` (v1), `Finscope P4 - Coordinador.html` (v1).

> **Nota sobre versiones:** para P3 y P4 existe una versión vieja (v1) y la versión corregida tras
> testing de usabilidad (v2 - RITE). **Siempre se usa la v2 - RITE.** La v1 queda en `reference/` solo
> como historial; jamás se porta.

---

## 4. Sistema de diseño (fidelidad exacta)

### 4.1 Regla de fidelidad (crítica)

Los HTML de referencia **no usan clases de Tailwind**: usan **estilos en línea** con un objeto JS de
colores llamado `C` y funciones helper. Para garantizar "ni un detalle distinto":

- **Se portan los componentes reusando sus estilos en línea exactos y la constante `C`.**
- **NO se reescriben los estilos a utilidades de Tailwind.** Traducir introduce desviaciones de píxel.
- Tailwind queda disponible en el proyecto **solo para andamiaje de layout nuevo** (p. ej. la página de
  login, que no tiene HTML de referencia). Nunca para reestilizar una pantalla portada.
- La constante `C` y los helpers viven en `lib/theme.ts` y se importan en cada pantalla.

### 4.2 Paleta de color (superset autoritativo)

Tomado de `Finscope P3/P4 v2 - RITE` (el conjunto más completo). Las pantallas más simples usan un
subconjunto; usar siempre este objeto completo.

```ts
// lib/theme.ts
export const C = {
  magenta:  '#ee252a',
  magentaL: 'rgba(238,37,42,0.08)',
  success:  '#16a34a',
  successL: '#dcfce7',
  warn:     '#f59e0b',
  warnL:    '#fffbeb',
  danger:   '#dc2626',
  dangerL:  '#fef2f2',
  blue:     '#3f5cdd',
  blueL:    '#eff4ff',
  yellow:   '#FFAE00',
  g900:     '#212121',
  g700:     '#616161',
  g500:     '#9E9E9E',
  g200:     '#EEEEEE',
  g50:      '#FAFAFA',
  white:    '#FFFFFF',
} as const;
```

### 4.3 Fondos y superficies

| Uso | Valor |
|---|---|
| `body` | `#F5F4F2` |
| Contenedor de página (canvas gris detrás de las tarjetas/marcos) | `#EDECEA` |
| Tarjetas | `#FFFFFF` |
| Fondo del dispositivo iOS (light) | `#F2F2F7` |

### 4.4 Tipografía

- Fuente única: **Roboto**, pesos **300, 400, 500, 700**.
- Import (en `globals.css`): `@import url('https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&display=swap');`
- El frame iOS usa, internamente y solo dentro del marco, `-apple-system, system-ui` (no tocar; viene
  del `ios-frame.jsx`).

### 4.5 CSS global (copiar literal a `globals.css`)

```css
@import url('https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
body{font-family:'Roboto',sans-serif;background:#F5F4F2;}
::-webkit-scrollbar{width:5px;}
::-webkit-scrollbar-thumb{background:#DEDBD7;border-radius:3px;}
input,select,textarea{font-family:'Roboto',sans-serif;}
@keyframes fadeIn{from{opacity:0;transform:translateY(8px);}to{opacity:1;transform:none;}}
@keyframes fadeUp{from{opacity:0;transform:translateY(10px);}to{opacity:1;transform:none;}}
@keyframes pop{from{opacity:0;transform:scale(0.9);}to{opacity:1;transform:scale(1);}}
@keyframes spin{to{transform:rotate(360deg);}}
@keyframes slideIn{from{transform:translateX(100%);}to{transform:translateX(0);}}
@keyframes countDown{from{stroke-dashoffset:0;}to{stroke-dashoffset:283;}}
input[type=range]{-webkit-appearance:none;height:4px;border-radius:2px;outline:none;cursor:pointer;background:transparent;}
input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:22px;height:22px;border-radius:50%;background:#ee252a;box-shadow:0 2px 6px rgba(238,37,42,.35);cursor:pointer;}
```

### 4.6 Helpers (copiar literal a `lib/theme.ts`)

```ts
// Cuota mensual a tasa efectiva anual 15.2%
export function calcCuota(monto: number, plazoMeses: number): number {
  const r = Math.pow(1.152, 1 / 12) - 1;
  return Math.round(monto * r / (1 - Math.pow(1 + r, -plazoMeses)));
}
export const fmt = (n: number) => '$' + n.toLocaleString('es-CO');
export const fmtMiles = (n: number) => Number(n).toLocaleString('es-CO');
```

### 4.7 Patrones recurrentes (de los HTML)

- **NavBar interna (desktop):** alto `52px`, fondo blanco, `border-bottom: 1px solid #EEEEEE`, fija arriba.
- **Logo:** imagen `imagen.png` en una "pastilla" blanca (`borderRadius:7, padding:3`, sombra suave) +
  texto "Finscope" (peso 700, `letterSpacing:-0.4px`). En Next.js la imagen va en `public/imagen.png`
  y se referencia como `/imagen.png` (en los HTML está como `uploads/imagen.png`).
- **Toggle Desktop/Móvil:** presente en P3–P8. Conmuta entre layout de escritorio y el frame iOS.
- **Marco iOS:** `<IOSDevice width={375} height={812}>`. Componente portado de `ios-frame.jsx`.
- **Semáforo:** `green` `#22c55e`, `yellow` `#f59e0b`, `red` `#ef4444` con fondos `#f0fdf4`, `#fffbeb`, `#fef2f2`.
- **Toast** y **ConfirmModal:** patrones ya implementados en P3/P4 v2; reusar tal cual.

---

## 5. Stack técnico (fijado)

| Capa | Tecnología | Versión sugerida |
|---|---|---|
| Framework | Next.js (App Router) | 14.x |
| Lenguaje | TypeScript | 5.x |
| Estilos (andamiaje) | Tailwind CSS | 3.x |
| Estilos (pantallas) | Estilos en línea + `lib/theme.ts` | — |
| Auth | Firebase Authentication (Email/Password) | firebase 10.x |
| Verificación server | firebase-admin (session cookies) | 12.x |
| Estado de sesión (datos) | React Context (`SolicitudesProvider`) + route handlers | — |
| Deploy | Vercel | — |
| Runtime | Node.js | 20.x |

---

## 6. Estructura de archivos

```
finscope/
├── SPEC.md                        ← este documento
├── README.md
├── .env.example
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
├── middleware.ts                  ← protege rutas y enruta por rol
├── reference/                     ← todos los HTML (solo lectura)
│   ├── Finscope Prototype v2 - RITE.html
│   ├── Finscope P3 - Analista v2 - RITE.html
│   ├── Finscope P4 - Coordinador v2 - RITE.html
│   ├── Finscope P5 - Ejecutivo.html
│   ├── Finscope P6 - Ejecutivo Dashboard.html
│   ├── Finscope P7 - Operativo.html
│   ├── Finscope P8 - Desembolso.html
│   ├── Finscope P9 - Excepcion.html
│   ├── Finscope P10 - Espera.html
│   ├── Finscope P11 - QR.html
│   ├── ios-frame.jsx
│   └── (v1: Prototype.html, P3 Analista.html, P4 Coordinador.html — historial)
├── public/
│   ├── imagen.png                 ← logo Finscope
│   └── cliente/                   ← P1+P2 v2 - RITE servido como estático (opcional)
├── app/
│   ├── layout.tsx                 ← html, body, fuentes, SolicitudesProvider
│   ├── globals.css
│   ├── (auth)/
│   │   └── login/page.tsx         ← login (sin HTML de referencia, diseño coherente con la marca)
│   ├── (protected)/
│   │   ├── layout.tsx             ← valida sesión; shell con NavBar
│   │   ├── ejecutivo/
│   │   │   ├── dashboard/page.tsx ← P6
│   │   │   └── radicar/page.tsx   ← P5
│   │   ├── analista/
│   │   │   └── cola/page.tsx      ← P3
│   │   ├── coordinador/
│   │   │   └── cola/page.tsx      ← P4
│   │   ├── operativo/
│   │   │   └── cola/page.tsx      ← P7
│   │   └── desembolso/
│   │       └── cola/page.tsx      ← P8
│   └── api/
│       ├── auth/session/route.ts          ← POST (login→cookie), DELETE (logout)
│       ├── solicitudes/route.ts           ← GET lista, POST crear
│       ├── solicitudes/[id]/route.ts      ← GET detalle, PATCH cambiar estado
│       └── integraciones/
│           ├── datacredito/route.ts       ← POST simulado
│           ├── runt/route.ts              ← POST simulado
│           ├── automas/route.ts           ← POST simulado
│           └── soi/route.ts               ← POST simulado
├── components/
│   ├── ios/IOSDevice.tsx          ← portado de ios-frame.jsx
│   ├── shell/NavBar.tsx
│   ├── shell/DeviceToggle.tsx
│   └── ui/                        ← Toast, ConfirmModal, Logo, etc. (reusados de los HTML)
├── context/
│   └── SolicitudesProvider.tsx
├── lib/
│   ├── theme.ts                   ← C + helpers
│   ├── types.ts
│   ├── roles.ts                   ← mapa email→rol
│   ├── store.ts                   ← seed + mutaciones (servidor)
│   ├── firebase/client.ts
│   └── firebase/admin.ts
└── data/
    └── seed.ts                    ← solicitudes de ejemplo
```

---

## 7. Modelo de datos

### 7.1 Tipos (`lib/types.ts`)

```ts
export type Role = 'ejecutivo' | 'analista' | 'coordinador' | 'operativo' | 'desembolso';

export type Status =
  | 'radicada'
  | 'en_analisis'
  | 'en_coordinacion'
  | 'devuelta_analista'
  | 'aprobada'
  | 'rechazada'
  | 'revision_operativa'
  | 'desembolso_programado'
  | 'desembolsada';

export type Semaforo = 'green' | 'yellow' | 'red';
export type Tipo = 'Pre-aprobado' | 'Nuevo' | 'Renovación';

export interface TimelineEvent {
  label: string;
  date: string;     // texto legible, p. ej. "26 abr"
  done?: boolean;
  active?: boolean;
}

export interface IntegracionResultado {
  estado: 'pendiente' | 'ok' | 'error';
  data?: Record<string, unknown>;
  consultadoEn?: string;
}

export interface Solicitud {
  id: string;                 // SOL-2024-0891
  cliente: string;
  cedula: string;
  monto: number;
  plazoMeses: number;
  cuota: number;
  vehiculo: string;           // "Renault Duster 2024"
  tipo: Tipo;
  status: Status;
  semaforo: Semaforo;         // derivado de status (ver 7.3)
  ejecutivo: string;
  analista?: string;
  coordinador?: string;
  docs: { nombre: string; estado: 'pendiente' | 'validado' | 'rechazado'; motivo?: string }[];
  integraciones: {
    datacredito: IntegracionResultado;
    runt: IntegracionResultado;
    automas: IntegracionResultado;
    soi: IntegracionResultado;
  };
  timeline: TimelineEvent[];
  updated: string;            // "Hace 2 h"
  createdAt: string;          // ISO
}
```

### 7.2 Máquina de estados

```
radicada
  └─(auto, al radicar)→ en_analisis
en_analisis
  ├─(analista recomienda)→ en_coordinacion
  └─(analista pide docs)→ devuelta_analista        [opcional MVP]
devuelta_analista
  └─(analista reenvía)→ en_coordinacion
en_coordinacion
  ├─(coordinador aprueba)→ aprobada
  ├─(coordinador rechaza)→ rechazada               [terminal]
  └─(coordinador devuelve)→ devuelta_analista
aprobada
  └─(auto / operativo toma)→ revision_operativa
revision_operativa
  └─(operativo valida docs)→ desembolso_programado
desembolso_programado
  └─(desembolso ejecuta)→ desembolsada             [terminal]
```

**Transiciones obligatorias para el demo (camino feliz):**
`radicada → en_analisis → en_coordinacion → aprobada → revision_operativa → desembolso_programado → desembolsada`.

### 7.3 Derivación del semáforo

```ts
function semaforoDe(status: Status): Semaforo {
  switch (status) {
    case 'aprobada':
    case 'desembolso_programado':
    case 'desembolsada':            return 'green';
    case 'en_analisis':
    case 'en_coordinacion':
    case 'revision_operativa':      return 'yellow';
    case 'devuelta_analista':
    case 'rechazada':
    case 'radicada':                return 'red';
  }
}
```

### 7.4 Filtros por pantalla

| Pantalla | Muestra solicitudes en estado |
|---|---|
| P6 Ejecutivo | todas las del ejecutivo (su portafolio) |
| P3 Analista | `en_analisis`, `devuelta_analista` |
| P4 Coordinador | `en_coordinacion` (+ recientes `aprobada`/`rechazada`/`devuelta_analista`) |
| P7 Operativo | `revision_operativa` |
| P8 Desembolso | `desembolso_programado` |

### 7.5 Datos semilla (`data/seed.ts`)

Mínimo 8 solicitudes que cubran todos los estados, para que cada pantalla tenga contenido al arrancar:

| id | cliente | tipo | status | semáforo |
|---|---|---|---|---|
| SOL-2024-0891 | Carlos Mejía | Pre-aprobado | en_analisis | yellow |
| SOL-2024-0892 | Ana Rodríguez | Nuevo | devuelta_analista | red |
| SOL-2024-0897 | Laura Herrera | Pre-aprobado | en_coordinacion | yellow |
| SOL-2024-0872 | Juan Pérez | Nuevo | en_coordinacion | yellow |
| SOL-2024-0903 | Mateo García | Nuevo | aprobada | green |
| SOL-2024-0875 | Patricia Cárdenas | Renovación | revision_operativa | yellow |
| SOL-2024-0871 | Natalia Ruiz | Renovación | desembolso_programado | green |
| SOL-2024-0845 | Ricardo Blanco | Nuevo | rechazada | red |

Montos, plazos, vehículos y cédulas: tomar valores coherentes con los que aparecen en los HTML de
referencia (catálogo de vehículos en `Finscope Prototype v2 - RITE.html`, montos en P4).

---

## 8. Arquitectura de backend (route handlers de Next.js)

### 8.1 Principio

Todo el "backend" son route handlers en `app/api/**`. No hay base de datos. El estado de las solicitudes
durante una sesión de demo vive en **dos lugares coordinados**:

- **`lib/store.ts`** — store en memoria del servidor, inicializado desde `data/seed.ts`. Sirve las
  respuestas de los route handlers y aplica las mutaciones (crear, cambiar estado), incluida la lógica de
  la máquina de estados (§7.2) y la derivación del semáforo (§7.3).
- **`context/SolicitudesProvider.tsx`** — Context de cliente que es la **fuente de verdad de la UI durante
  la sesión**. Se hidrata al montar desde `GET /api/solicitudes` y se actualiza de forma optimista en cada
  mutación, además de llamar al route handler correspondiente.

### 8.2 Caveat de Vercel (leer antes de construir)

En Vercel (serverless), la memoria de `lib/store.ts` **no se comparte de forma garantizada entre
invocaciones**: una solicitud creada en una lambda puede no existir en la siguiente. Por eso la **UI no
depende del store del servidor para conservar el estado de la sesión** — depende del Context de cliente.

El reparto de responsabilidades es:

- **Context de cliente** → conserva el estado vivo de la demo (lo que el jurado ve). 100% confiable.
- **Route handlers** → ejecutan la **lógica** (validación de transición, derivación de semáforo, simulación
  de integraciones) y devuelven el objeto actualizado. Es aquí donde "el back está en rutas de Next".

> Para una demo local (servidor `next dev` corriendo en una sola máquina) el store en memoria sí persiste
> y todo funciona también del lado servidor. La doble fuente es el seguro para el deploy en Vercel.

### 8.3 Endpoints

| Método | Ruta | Función |
|---|---|---|
| `POST` | `/api/auth/session` | Recibe ID token de Firebase, lo verifica con admin, crea cookie de sesión |
| `DELETE` | `/api/auth/session` | Cierra sesión (borra cookie) |
| `GET` | `/api/solicitudes` | Lista (acepta `?status=` y `?ejecutivo=`) |
| `POST` | `/api/solicitudes` | Crea (desde P5). Asigna id, `status='en_analisis'`, semáforo, timeline inicial |
| `GET` | `/api/solicitudes/[id]` | Detalle |
| `PATCH` | `/api/solicitudes/[id]` | Cambia estado. Valida transición contra §7.2. Recalcula semáforo. Agrega evento al timeline |
| `POST` | `/api/integraciones/datacredito` | Simulado (§9) |
| `POST` | `/api/integraciones/runt` | Simulado (§9) |
| `POST` | `/api/integraciones/automas` | Simulado (§9) |
| `POST` | `/api/integraciones/soi` | Simulado (§9) |

---

## 9. Integraciones simuladas

Cada endpoint de `/api/integraciones/*` espera ~800–1400 ms (latencia simulada) y devuelve un resultado
fijo coherente. La UI muestra un loader (`spin`) durante la espera y luego el resultado. Una pequeña
probabilidad de "error" es opcional para demostrar el manejo de excepciones (reintentar), pero por defecto
siempre responde `ok` para que la demo no falle.

```ts
// Patrón base para cada handler
const delay = (ms: number) => new Promise(r => setTimeout(r, ms));

export async function POST(req: Request) {
  const body = await req.json();
  await delay(1200);
  return Response.json({
    estado: 'ok',
    consultadoEn: new Date().toISOString(),
    data: { /* payload simulado, ver tabla */ },
  });
}
```

| Integración | Entrada | Payload simulado (`data`) |
|---|---|---|
| DataCrédito | `cedula` | `{ score: 748, estado: 'Al día', obligacionesVigentes: 3, mora: 0 }` |
| RUNT | `placa` o `vehiculo` | `{ propietario: 'Coincide', gravamenes: 0, soat: 'Vigente', revisionTecnica: 'Vigente' }` |
| Automas | `cedula` | `{ embargos: 0, listasRestrictivas: 'Sin coincidencias' }` |
| SOI | `cedula` | `{ aportes: 'Al día', ultimoPago: '2026-04' }` |

> Importante: estos valores son fijos por diseño. No conectar a ningún servicio real. El profesor acepta
> que las integraciones estén simuladas; lo que se evalúa es el flujo y la arquitectura, no el dato real.

---

## 10. Autenticación y roles

### 10.1 Modelo

- **Firebase Authentication**, proveedor **Email/Password**.
- Usuarios de demo creados manualmente en la consola de Firebase (§ checklist).
- **El rol no se guarda en Firebase** (no usamos custom claims ni Firestore): se resuelve en el servidor
  con un mapa `email → rol` en `lib/roles.ts`. Fuente única de verdad del rol.

```ts
// lib/roles.ts
import type { Role } from './types';
export const ROLE_BY_EMAIL: Record<string, Role> = {
  'ejecutivo@finscope.co':   'ejecutivo',
  'analista@finscope.co':    'analista',
  'coordinador@finscope.co': 'coordinador',
  'operativo@finscope.co':   'operativo',
  'desembolso@finscope.co':  'desembolso',
};
export const HOME_BY_ROLE: Record<Role, string> = {
  ejecutivo:   '/ejecutivo/dashboard',
  analista:    '/analista/cola',
  coordinador: '/coordinador/cola',
  operativo:   '/operativo/cola',
  desembolso:  '/desembolso/cola',
};
```

### 10.2 Flujo de sesión

1. El cliente hace login con el SDK de Firebase (email/password) → obtiene un **ID token**.
2. El cliente hace `POST /api/auth/session` con el ID token.
3. El handler lo verifica con **firebase-admin** (`verifyIdToken`) y crea una **cookie de sesión** httpOnly.
4. `middleware.ts` lee la cookie en cada request a `(protected)/**`:
   - sin cookie válida → redirige a `/login`.
   - con cookie → resuelve el rol vía `ROLE_BY_EMAIL` y verifica que la ruta corresponde al rol; si no,
     redirige a `HOME_BY_ROLE[rol]`.
5. Tras login exitoso, el cliente redirige a `HOME_BY_ROLE[rol]`.

### 10.3 Reglas de acceso por ruta

| Prefijo de ruta | Rol permitido |
|---|---|
| `/ejecutivo/**` | ejecutivo |
| `/analista/**` | analista |
| `/coordinador/**` | coordinador |
| `/operativo/**` | operativo |
| `/desembolso/**` | desembolso |

> Para el demo es válido que un mismo evaluador navegue entre roles cerrando e iniciando sesión con
> distintos usuarios. No se exige multi-rol simultáneo.

---

## 11. Especificación por pantalla

Para **todas**: portar reusando los estilos en línea y la estructura del HTML autoritativo de `reference/`.
Conservar el toggle Desktop/Móvil y el frame iOS donde el HTML los tenga. Sustituir los datos hardcodeados
del HTML por datos del Context (`useSolicitudes()`), y las acciones por llamadas al route handler.

### P6 — Dashboard Ejecutivo (`/ejecutivo/dashboard`)
- **Fuente:** `Finscope P6 - Ejecutivo Dashboard.html`.
- **Construir:** tabla/lista del portafolio con semáforo, columna de etapa y acción; **Drawer** lateral de
  detalle con **timeline**. Filtros por estado.
- **Datos:** todas las solicitudes del ejecutivo, desde el Context.
- **Interacción clave:** al cambiar de estado una solicitud (en otra pantalla/rol), al volver aquí debe
  reflejarse. Refresco por **polling cada 5 s** a `GET /api/solicitudes` (no usar Realtime).
- **Prioridad:** máxima. Es el argumento del producto.

### P5 — Radicación (`/ejecutivo/radicar`)
- **Fuente:** `Finscope P5 - Ejecutivo.html`.
- **Construir:** formulario de 4 secciones (datos cliente / laborales-financieros / vehículo / documentos).
- **Simplificación permitida:** reducir a ~12 campos núcleo (Must-Have). Mantener el aspecto y la estructura
  de secciones del HTML.
- **Acción:** al enviar → `POST /api/solicitudes` → crea con `status='en_analisis'` → toast de éxito →
  redirige al dashboard (P6), donde aparece la nueva solicitud.

### P3 — Analista (`/analista/cola`)
- **Fuente:** `Finscope P3 - Analista v2 - RITE.html`.
- **Construir:** cola de casos + panel de detalle con tabs (Info personal / Comportamiento financiero /
  Vehículo / Documentos / RUNT) + bloque de motores/integraciones + zona de acción (recomendar).
- **Integraciones:** botones "Consultar DataCrédito / RUNT / Automas / SOI" → llaman a `/api/integraciones/*`
  (simulado, §9), muestran loader y luego resultado.
- **Acción:** "Enviar a coordinación" → `PATCH /api/solicitudes/[id]` con `status='en_coordinacion'`.
- **Usar Toast y ConfirmModal** ya presentes en el HTML v2.

### P4 — Coordinador (`/coordinador/cola`)
- **Fuente:** `Finscope P4 - Coordinador v2 - RITE.html`.
- **Construir:** tabla de casos (estados: enviado/devuelto/aprobado/rechazado) + panel de decisión.
- **Acciones:** Aprobar → `aprobada`; Devolver → `devuelta_analista` (con motivo); Rechazar → `rechazada`.
  Todas vía `PATCH`. Toast con opción de deshacer (como en el HTML).

### P7 — Operativo (`/operativo/cola`)
- **Fuente:** `Finscope P7 - Operativo.html`.
- **Construir:** cola de expedientes + panel de validación de documentos (validar/rechazar con motivo).
- **Acción:** "Enviar a desembolso" → `PATCH` con `status='desembolso_programado'`.
- **Nota de reuso:** P7 y P8 comparten estructura (cola + acción de confirmación). Extraer un componente
  base común y parametrizarlo.

### P8 — Desembolso (`/desembolso/cola`)
- **Fuente:** `Finscope P8 - Desembolso.html`.
- **Construir:** cola de desembolsos + Drawer con datos de transferencia + botón ejecutar (con ConfirmModal).
- **Acción:** "Ejecutar desembolso" → `PATCH` con `status='desembolsada'` → estado final, animación de éxito.

### Login (`/login`)
- **Sin HTML de referencia.** Diseñar coherente con la marca: fondo `#EDECEA`, tarjeta blanca, logo Finscope,
  campos email/contraseña con el estilo de `Field` de P5, botón magenta (`C.magenta`). Sobrio y minimalista.

### P1+P2 Cliente (enlace estático, no se porta)
- Copiar `Finscope Prototype v2 - RITE.html` (y `ios-frame.jsx`) a `public/cliente/` y enlazarlo desde un
  punto visible (p. ej. un botón "Ver experiencia cliente" en el login o en el dashboard) que lo abra en
  pestaña nueva. Sirve para mostrar el flujo B2C en el demo sin costo de desarrollo.

---

## 12. Fuera de alcance (explícito)

- Desarrollo real de cualquier integración externa distinta de Firebase Auth.
- Base de datos / persistencia real más allá del estado de sesión.
- P9 (Excepción), P10 (Espera), P11 (QR) como pantallas Next.js. P10 se sustituye por loaders/skeletons.
- Pantalla cliente B2C (P1+P2) como app Next.js (solo enlace estático).
- Multi-rol simultáneo en una misma sesión.
- Notificaciones reales (WhatsApp/email), tokenización, generación de QR funcional.
- Tests automatizados (no exigidos para el entregable; opcionales).

---

## 13. Definición de "terminado" (checklist de aceptación)

- [ ] El proyecto compila (`next build`) y corre (`next dev`) sin errores.
- [ ] `/login` autentica contra Firebase y enruta por rol.
- [ ] Rutas protegidas: sin sesión redirigen a login; con sesión equivocada redirigen al home del rol.
- [ ] P6 lista el portafolio con semáforos correctos y abre el Drawer con timeline.
- [ ] P5 radica una solicitud y aparece en P6 sin recargar manualmente (polling).
- [ ] P3 consulta integraciones simuladas (loader → resultado) y envía a coordinación.
- [ ] P4 aprueba/devuelve/rechaza y el cambio se ve reflejado.
- [ ] P7 valida documentos y envía a desembolso.
- [ ] P8 ejecuta desembolso (estado final + éxito).
- [ ] Camino feliz completo recorrido por los 5 roles en una sola demo.
- [ ] Comparación lado a lado con cada HTML de `reference/`: **sin diferencias visuales**.
- [ ] Deploy en Vercel funcionando con variables de entorno.

---

## 14. Orden de construcción (fases)

> Esta es la secuencia de prompts/tareas para Claude Code. Cada fase termina con algo verificable.

0. **Base (este es el primer prompt).** Scaffold Next.js + TS + Tailwind, estructura de carpetas, `globals.css`,
   `lib/theme.ts`, `lib/types.ts`, `lib/roles.ts`, `data/seed.ts`, `lib/store.ts`, stubs de firebase,
   `middleware.ts` esqueleto, stubs de todos los route handlers, páginas vacías con placeholder, `.env.example`,
   `README.md`. **No se construye ninguna pantalla.** Debe compilar y correr mostrando placeholders.
1. **Frame y primitivos.** Portar `ios-frame.jsx` → `components/ios/IOSDevice.tsx`. Crear `Logo`, `NavBar`,
   `DeviceToggle`, `Toast`, `ConfirmModal` en `components/ui` reusando estilos de los HTML.
2. **Auth real.** Firebase client + admin, `/api/auth/session`, `middleware.ts` completo, página de login,
   redirección por rol. Verificar acceso protegido.
3. **Datos + Context.** `SolicitudesProvider`, `GET/POST /api/solicitudes`, `PATCH /api/solicitudes/[id]`
   con máquina de estados y semáforo. Polling.
4. **P6 Dashboard.** Pantalla ancla.
5. **P5 Radicación** → crea y aparece en P6.
6. **P3 Analista** + integraciones simuladas.
7. **P4 Coordinador.**
8. **P7 + P8** (componente de cola compartido).
9. **Login → enlace a cliente B2C estático.** Pulido y verificación de fidelidad pantalla por pantalla.
10. **Deploy Vercel** + variables de entorno + smoke test del camino feliz.

---

*Fin del SPEC v1.0*
