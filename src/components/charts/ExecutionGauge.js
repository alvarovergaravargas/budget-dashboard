import React from 'react';
import { RadialBarChart, RadialBar, ResponsiveContainer, PolarAngleAxis } from 'recharts';
import { fmtPct } from '../../utils/formatters';
import { ChartPanel } from '../ui/ChartPanel';

export const ExecutionGauge = ({ rate = 0, remaining = 0, total = 0 }) => {
  const safeRate   = isNaN(rate) || !isFinite(rate) ? 0 : rate;
  const color      = safeRate > 100 ? 'var(--danger)' : safeRate > 85 ? 'var(--warn)' : 'var(--accent)';
  const cappedRate = Math.min(Math.max(safeRate, 0), 100);
  const data       = [{ value: cappedRate > 0 ? cappedRate : 0.1 }];

  const fmtUSD = (n) => new Intl.NumberFormat('en-US', { style:'currency', currency:'USD', maximumFractionDigits:0 }).format(n || 0);

  return (
    <ChartPanel title="Ejecución Global" subtitle="Porcentaje del presupuesto ejecutado">
      {/*
        cy="62%" positions the arc center at ~62% from the top of the 200px container
        (≈124px from top), leaving ~76px below for the percentage text.
        innerRadius/outerRadius in px keep sizing predictable regardless of container width.
      */}
      <div style={{ position:'relative', height:200 }}>
        <ResponsiveContainer width="100%" height="100%">
          <RadialBarChart
            cx="50%" cy="62%"
            innerRadius={58} outerRadius={92}
            startAngle={180} endAngle={0}
            data={data}
          >
            <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
            <RadialBar
              background={{ fill:'var(--bg-panel)' }}
              dataKey="value"
              cornerRadius={6}
              fill={color}
            />
          </RadialBarChart>
        </ResponsiveContainer>

        {/* Percentage — sits below the arc, clear of the gauge visual */}
        <div style={{ position:'absolute', bottom:8, left:0, right:0, textAlign:'center' }}>
          <div style={{ fontFamily:'var(--font-display)', fontSize:34, fontWeight:800, color, lineHeight:1, letterSpacing:'-0.03em' }}>
            {fmtPct(safeRate)}
          </div>
          <div style={{ fontFamily:'var(--font-body)', fontSize:12, color:'var(--text-secondary)', marginTop:5 }}>
            ejecutado
          </div>
        </div>

        {/* Range labels */}
        <div style={{ position:'absolute', bottom:0, left:14, fontSize:10, fontFamily:'var(--font-mono)', color:'var(--text-muted)' }}>0%</div>
        <div style={{ position:'absolute', bottom:0, right:14, fontSize:10, fontFamily:'var(--font-mono)', color:'var(--text-muted)' }}>100%</div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, paddingTop:8, borderTop:'1px solid var(--border)' }}>
        {[
          { label:'Total presupuesto', value: fmtUSD(total) },
          { label:'Saldo disponible',  value: fmtUSD(remaining), highlight: remaining < 0 },
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
