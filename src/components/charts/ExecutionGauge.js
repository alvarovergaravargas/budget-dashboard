import React from 'react';
import { RadialBarChart, RadialBar, ResponsiveContainer, PolarAngleAxis } from 'recharts';
import { fmtPct } from '../../utils/formatters';
import { ChartPanel } from '../ui/ChartPanel';

export const ExecutionGauge = ({ rate, remaining, total }) => {
  const color = rate > 100 ? 'var(--danger)' : rate > 85 ? 'var(--warn)' : 'var(--accent)';
  const cappedRate = Math.min(rate, 100);
  const data = [{ value: cappedRate }];

  return (
    <ChartPanel title="Ejecución Global" subtitle="Porcentaje del presupuesto ejecutado">
      <div style={{ position:'relative', height:200 }}>
        <ResponsiveContainer width="100%" height="100%">
          <RadialBarChart
            cx="50%" cy="80%"
            innerRadius="60%" outerRadius="90%"
            startAngle={180} endAngle={0}
            data={data}
          >
            <PolarAngleAxis type="number" domain={[0,100]} tick={false} />
            <RadialBar
              background={{ fill:'var(--bg-panel)' }}
              dataKey="value"
              cornerRadius={8}
              fill={color}
            />
          </RadialBarChart>
        </ResponsiveContainer>

        {/* Center text */}
        <div style={{ position:'absolute', bottom:30, left:0, right:0, textAlign:'center' }}>
          <div style={{ fontFamily:'var(--font-display)', fontSize:38, fontWeight:800, color, lineHeight:1, letterSpacing:'-0.03em' }}>{fmtPct(rate)}</div>
          <div style={{ fontFamily:'var(--font-body)', fontSize:12, color:'var(--text-secondary)', marginTop:6 }}>ejecutado</div>
        </div>

        {/* Labels */}
        <div style={{ position:'absolute', bottom:0, left:16, fontSize:11, fontFamily:'var(--font-mono)', color:'var(--text-muted)' }}>0%</div>
        <div style={{ position:'absolute', bottom:0, right:16, fontSize:11, fontFamily:'var(--font-mono)', color:'var(--text-muted)' }}>100%</div>
      </div>

      {/* Legend */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, paddingTop:8, borderTop:'1px solid var(--border)' }}>
        {[
          { label:'Total presupuesto', value: new Intl.NumberFormat('es-CO',{style:'currency',currency:'COP',maximumFractionDigits:0}).format(total) },
          { label:'Saldo disponible',  value: new Intl.NumberFormat('es-CO',{style:'currency',currency:'COP',maximumFractionDigits:0}).format(remaining), highlight: remaining < 0 },
        ].map(item => (
          <div key={item.label} style={{ background:'var(--bg-panel)', borderRadius:10, padding:'10px 14px' }}>
            <div style={{ fontSize:11, color:'var(--text-muted)', fontFamily:'var(--font-body)', marginBottom:4 }}>{item.label}</div>
            <div style={{ fontFamily:'var(--font-mono)', fontSize:13, color: item.highlight ? 'var(--danger)' : 'var(--text-primary)', fontWeight:500 }}>{item.value}</div>
          </div>
        ))}
      </div>
    </ChartPanel>
  );
};
