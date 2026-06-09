// Pastilla blanca con logo + texto "Finscope" — portado de NavBar en P3/P4 reference
interface LogoProps {
  size?: 'sm' | 'md';
}

export default function Logo({ size = 'md' }: LogoProps) {
  const imgSize = size === 'sm' ? 20 : 26;
  const fontSize = size === 'sm' ? 14 : 17;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{
        background: '#fff', borderRadius: 7, padding: 3,
        boxShadow: '0 1px 4px rgba(0,0,0,0.10)', display: 'flex',
      }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSNeXv430JYlhQn-ZR5_n8_rNfgFfjvDVcW0Wv0YexVpbxpplcAREANAGBi&s=10" width={imgSize} height={imgSize} alt="Finscope" style={{ display: 'block' }} />
      </div>
      <span style={{ fontWeight: 700, fontSize, color: '#212121', letterSpacing: '-0.4px' }}>
        Finscope
      </span>
    </div>
  );
}
