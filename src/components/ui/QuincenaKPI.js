import React from 'react';
import { fmt, fmtPct, statusColor } from '../../utils/formatters';
import { quincenaToLabel } from '../../services/googleSheetsService';

export const QuincenaKPI = ({ currentQ, currentQData }) => {
  if (!currentQData && !currentQ) return null;
  const meta = quincenaToLabel(currentQ);
  const color = currentQData ? statusColor(currentQData.status) : 'var(--accent)';

  return (
    <div style={{
      background:'var(--bg-card)', border:`1px solid ${color}40`, borderRadius:'var(--radius-lg)',
      padding:'20px 24px', position:'relative', overflow:'hidden',
    }}>
      {/* Glow stripe */}
      <div style={{ position:'absolute', top:0, left:0, right:0, height:2, background:`linear-gradient(90deg, ${color}, transparent)` }} />

      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
        <div>
          <div style={{ fontFamily:'var(--font-body)', fontSize:11, fontWeight:600, letterSpacing:'0.08em', textTransform:'uppercase', color:'var(--text-secondary)', marginBottom:4 }}>Quincena Actual</div>
          <div style={{ fontFamily:'var(--font-display)', fontSize:22, fontWeight:800, color, letterSpacing:'-0.02em' }}>{currentQ} · {meta?.short}</div>
        </div>
        <div style={{ textAlign:'right' }}>
          <div style={{ fontFamily:'var(--font-mono)', fontSize:28, fontWeight:700, color, lineHeight:1 }}>{fmtPct(currentQData?.ejecucion || 0)}</div>
          <div style={{ fontFamily:'var(--font-body)', fontSize:11, color:'var(--text-muted)', marginTop:4 }}>ejecutado</div>
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ height:6, background:'var(--bg-panel)', borderRadius:99, overflow:'hidden', marginBottom:14 }}>
        <div style={{ height:'100%', width:`${Math.min(currentQData?.ejecucion || 0, 100)}%`, background:`linear-gradient(90deg, ${color}80, ${color})`, borderRadius:99, transition:'width 1s ease' }} />
      </div>

      {/* Stats grid */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8 }}>
        {[
          { label:'Presupuesto', value: fmt(currentQData?.presupuesto || 0), color: 'var(--text-secondary)' },
          { label:'Gastado',     value: fmt(currentQData?.gasto || 0),       color: 'var(--text-primary)' },
          { label:'Saldo',       value: fmt(currentQData?.saldo || 0),       color: (currentQData?.saldo || 0) < 0 ? 'var(--danger)' : 'var(--accent)' },
        ].map(item => (
          <div key={item.label} style={{ background:'var(--bg-panel)', borderRadius:10, padding:'10px 14px' }}>
            <div style={{ fontSize:10, color:'var(--text-muted)', fontFamily:'var(--font-body)', marginBottom:4 }}>{item.label}</div>
            <div style={{ fontFamily:'var(--font-mono)', fontSize:13, color:item.color, fontWeight:600 }}>{item.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
};
