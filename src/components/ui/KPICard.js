import React from 'react';

const styles = {
  card: {
    background: 'var(--bg-card)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-lg)',
    padding: '24px 28px',
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    position: 'relative',
    overflow: 'hidden',
    transition: 'border-color 0.2s',
    cursor: 'default',
  },
  accent: { position:'absolute', top:0, left:0, right:0, height:2, borderRadius:'99px 99px 0 0' },
  label: { fontFamily:'var(--font-body)', fontSize:12, fontWeight:500, letterSpacing:'0.08em', textTransform:'uppercase', color:'var(--text-secondary)' },
  value: { fontFamily:'var(--font-display)', fontSize:32, fontWeight:700, lineHeight:1, letterSpacing:'-0.02em' },
  sub: { fontFamily:'var(--font-mono)', fontSize:12, color:'var(--text-secondary)', marginTop:4 },
  iconWrap: { position:'absolute', top:20, right:20, width:36, height:36, borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center', background:'rgba(255,255,255,0.06)' },
};

export const KPICard = ({ label, value, sub, icon: Icon, color = 'var(--accent)' }) => {
  const [hovered, setHovered] = React.useState(false);

  return (
    <div
      style={{ ...styles.card, borderColor: hovered ? color : 'var(--border)' }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div style={{ ...styles.accent, background: `linear-gradient(90deg, ${color}, transparent)` }} />
      {Icon && (
        <div style={styles.iconWrap}>
          <Icon size={18} color={color} />
        </div>
      )}
      <div style={styles.label}>{label}</div>
      <div style={{ ...styles.value, color }}>{value}</div>
      {sub && <div style={styles.sub}>{sub}</div>}
    </div>
  );
};
