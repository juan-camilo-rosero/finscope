# Finscope

CRM de originación proactiva de crédito vehicular — Banco Finandina.  
Proyecto final, asignatura Sistemas de Información (2025982) · UNAL.

> **Estado actual:** fase "base — sin pantallas". El proyecto compila y arranca mostrando placeholders.

## Instalación

```bash
npm install
```

## Variables de entorno

Copia `.env.example` a `.env.local` y rellena los valores de tu proyecto Firebase:

```bash
cp .env.example .env.local
```

| Variable | Descripción |
|---|---|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | API Key del proyecto Firebase |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Auth domain (ej. `proyecto.firebaseapp.com`) |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | ID del proyecto |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | Storage bucket |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Messaging sender ID |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | App ID |
| `FIREBASE_SERVICE_ACCOUNT` | Service account JSON en base64 (`base64 -w 0 serviceAccount.json`) |

## Correr en desarrollo

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000).

## Build de producción

```bash
npm run build
npm start
```

## Estructura

```
app/              → App Router de Next.js
  (auth)/login    → Página de login
  (protected)/    → Rutas protegidas por rol
  api/            → Route handlers (backend en memoria)
components/       → ios/, shell/, ui/
context/          → SolicitudesProvider (Fase 3)
lib/              → theme, types, roles, store, firebase/
data/             → seed.ts (8 solicitudes de ejemplo)
reference/        → HTML de referencia (solo lectura, no editar)
spec/             → SPEC.md (contrato del proyecto)
```
