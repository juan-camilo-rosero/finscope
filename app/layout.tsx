import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Finscope',
  description: 'CRM de originación proactiva de crédito vehicular — Banco Finandina',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
