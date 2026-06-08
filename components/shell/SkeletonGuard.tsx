'use client';
import { useSolicitudes } from '../../context/SolicitudesProvider';
import { C } from '../../lib/theme';

export default function SkeletonGuard({ children }: { children: React.ReactNode }) {
  const { loading } = useSolicitudes();

  if (loading) {
    return (
      <div style={{ padding: 32, display: 'flex', flexDirection: 'column', gap: 12, marginTop: 52 }}>
        {[1, 2, 3].map(i => (
          <div key={i} style={{ height: 56, borderRadius: 10, background: C.g200, animation: 'fadeIn 0.3s ease' }} />
        ))}
      </div>
    );
  }

  return <>{children}</>;
}
