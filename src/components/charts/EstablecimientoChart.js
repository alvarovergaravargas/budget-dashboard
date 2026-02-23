import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, Cell } from 'recharts';
import { fmt, fmtShort } from '../../utils/formatters';
import { ChartPanel } from '../ui/ChartPanel';

const COLORS = ['#00e5a0','#3b82f6','#a78bfa','#f5a623','#ff4d6d','#34d399','#60a5fa','#c084fc'];

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div style={{ background:'var(--bg-panel)', border:'1px solid var(--border-accent)', borderRadius:10, padding:'12px 16px', fontFamily:'var(--font-body)' }}>
      <div style={{ fontWeight:600, marginBottom:6, color:'var(--text-primary)' }}>{d.name}</div>
      <div style={{ fontSize:13, color:'var(--text-secondary)' }}>Total: <span style={{ fontFamily:'var(--font-mono)', color:'var(--text-primary)' }}>{fmt(d.total)}</span></div>
      <div style={{ fontSize:13, color:'var(--text-secondary)' }}>Visitas: <span style={{ fontFamily:'var(--font-mono)', color:'var(--text-primary)' }}>{d.count}</span></div>
      <div style={{ fontSize:13, color:'var(--text-secondary)' }}>Categoría: <span style={{ color:'var(--text-primary)' }}>{d.categoria}</span></div>
    </div>
  );
};

export const EstablecimientoChart = ({ data = [] }) => {
  if (!data || data.length === 0) return null;
  return (
  <ChartPanel title="Top Establecimientos" subtitle="Dónde se concentra más el gasto">
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} layout="vertical" barCategoryGap="20%">
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
        <XAxis type="number" tickFormatter={fmtShort} tick={{ fill:'var(--text-secondary)', fontFamily:'var(--font-mono)', fontSize:10 }} axisLine={false} tickLine={false} />
        <YAxis type="category" dataKey="name" width={100} tick={{ fill:'var(--text-secondary)', fontFamily:'var(--font-body)', fontSize:11 }} axisLine={false} tickLine={false} />
        <Tooltip content={<CustomTooltip />} cursor={{ fill:'rgba(255,255,255,0.02)' }} />
        <Bar dataKey="total" name="Gasto total" radius={[0,5,5,0]}>
          {data.map((_,i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  </ChartPanel>
  );
};
