import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { fmtShort, fmt } from '../../utils/formatters';
import { ChartPanel } from '../ui/ChartPanel';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background:'var(--bg-panel)', border:'1px solid var(--border-accent)', borderRadius:10, padding:'12px 16px', fontFamily:'var(--font-body)' }}>
      <div style={{ fontWeight:600, marginBottom:8 }}>{label}</div>
      {payload.map(p => (
        <div key={p.name} style={{ fontSize:13, color:'var(--text-secondary)', marginBottom:4, display:'flex', justifyContent:'space-between', gap:16 }}>
          <span>{p.name}</span>
          <span style={{ fontFamily:'var(--font-mono)', color:'var(--text-primary)' }}>{fmt(p.value)}</span>
        </div>
      ))}
    </div>
  );
};

export const TrendChart = ({ data }) => (
  <ChartPanel
    title="Tendencia de Gasto Acumulado"
    subtitle="Evolución del consumo total a lo largo del tiempo"
  >
    <ResponsiveContainer width="100%" height={280}>
      <AreaChart data={data}>
        <defs>
          <linearGradient id="gradAccum" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor="#00e5a0" stopOpacity={0.25} />
            <stop offset="95%" stopColor="#00e5a0" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="gradBudget" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor="#3b82f6" stopOpacity={0.15} />
            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
        <XAxis dataKey="name" tick={{ fill:'var(--text-secondary)', fontFamily:'var(--font-body)', fontSize:12 }} axisLine={false} tickLine={false} />
        <YAxis tickFormatter={fmtShort} tick={{ fill:'var(--text-secondary)', fontFamily:'var(--font-mono)', fontSize:11 }} axisLine={false} tickLine={false} width={55} />
        <Tooltip content={<CustomTooltip />} />
        <Area type="monotone" dataKey="presupuesto" name="Presupuesto" stroke="var(--blue)" strokeWidth={2} fill="url(#gradBudget)" strokeDasharray="5 5" />
        <Area type="monotone" dataKey="acumulado" name="Gasto acumulado" stroke="var(--accent)" strokeWidth={2.5} fill="url(#gradAccum)" dot={{ r:4, fill:'var(--accent)', strokeWidth:0 }} activeDot={{ r:6, fill:'var(--accent)' }} />
      </AreaChart>
    </ResponsiveContainer>
  </ChartPanel>
);
