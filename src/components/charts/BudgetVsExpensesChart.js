import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
import { fmtShort, fmt } from '../../utils/formatters';
import { ChartPanel } from '../ui/ChartPanel';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background:'var(--bg-panel)', border:'1px solid var(--border-accent)', borderRadius:10, padding:'12px 16px', fontFamily:'var(--font-body)', minWidth:180 }}>
      <div style={{ fontWeight:600, marginBottom:8, color:'var(--text-primary)' }}>{label}</div>
      {payload.map(p => (
        <div key={p.name} style={{ display:'flex', justifyContent:'space-between', gap:16, fontSize:13, color:'var(--text-secondary)', marginBottom:4 }}>
          <span style={{ color: p.fill }}>{p.name}</span>
          <span style={{ fontFamily:'var(--font-mono)', color:'var(--text-primary)' }}>{fmt(p.value)}</span>
        </div>
      ))}
      {payload.length === 2 && (
        <div style={{ borderTop:'1px solid var(--border)', marginTop:8, paddingTop:8, fontSize:12, color: payload[1].value > payload[0].value ? 'var(--danger)' : 'var(--accent)' }}>
          {payload[1].value > payload[0].value ? '⚠ Sobrepresupuesto' : `✓ Saldo: ${fmt(payload[0].value - payload[1].value)}`}
        </div>
      )}
    </div>
  );
};

export const BudgetVsExpensesChart = ({ data }) => (
  <ChartPanel
    title="Presupuesto vs Consumo por Mes"
    subtitle="Comparativa mensual de ejecución presupuestaria"
  >
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} barCategoryGap="30%" barGap={4}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
        <XAxis dataKey="name" tick={{ fill:'var(--text-secondary)', fontFamily:'var(--font-body)', fontSize:12 }} axisLine={false} tickLine={false} />
        <YAxis tickFormatter={fmtShort} tick={{ fill:'var(--text-secondary)', fontFamily:'var(--font-mono)', fontSize:11 }} axisLine={false} tickLine={false} width={55} />
        <Tooltip content={<CustomTooltip />} cursor={{ fill:'rgba(255,255,255,0.02)' }} />
        <Legend wrapperStyle={{ fontFamily:'var(--font-body)', fontSize:13, paddingTop:12 }} />
        <Bar dataKey="presupuesto" name="Presupuesto" fill="var(--blue)" radius={[4,4,0,0]} fillOpacity={0.8} />
        <Bar dataKey="gasto" name="Gasto Real" fill="var(--accent)" radius={[4,4,0,0]} />
      </BarChart>
    </ResponsiveContainer>
  </ChartPanel>
);
