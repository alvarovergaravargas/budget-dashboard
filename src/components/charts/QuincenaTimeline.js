import React, { useState } from 'react';
import { BarChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ComposedChart } from 'recharts';
import { fmtShort, fmt } from '../../utils/formatters';
import { statusColor } from '../../utils/formatters';
import { ChartPanel } from '../ui/ChartPanel';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  const p = payload[0]?.payload;
  return (
    <div style={{ background:'var(--bg-panel)', border:'1px solid var(--border-accent)', borderRadius:12, padding:'14px 18px', fontFamily:'var(--font-body)', minWidth:200 }}>
      <div style={{ fontFamily:'var(--font-display)', fontWeight:700, fontSize:14, marginBottom:10, color:'var(--text-primary)' }}>{p?.q} · {label}</div>
      {payload.map(pl => (
        <div key={pl.name} style={{ display:'flex', justifyContent:'space-between', gap:20, fontSize:13, marginBottom:5 }}>
          <span style={{ color: pl.color || pl.fill }}>{pl.name}</span>
          <span style={{ fontFamily:'var(--font-mono)', color:'var(--text-primary)' }}>{fmt(pl.value)}</span>
        </div>
      ))}
      {p && p.saldo !== undefined && (
        <div style={{ marginTop:10, paddingTop:10, borderTop:'1px solid var(--border)', fontSize:12 }}>
          <div style={{ display:'flex', justifyContent:'space-between' }}>
            <span style={{ color:'var(--text-muted)' }}>Saldo</span>
            <span style={{ fontFamily:'var(--font-mono)', color: p.saldo < 0 ? 'var(--danger)' : 'var(--accent)' }}>{fmt(p.saldo)}</span>
          </div>
          {p.ejecucion !== undefined && (
            <div style={{ display:'flex', justifyContent:'space-between', marginTop:4 }}>
              <span style={{ color:'var(--text-muted)' }}>Ejecución</span>
              <span style={{ fontFamily:'var(--font-mono)', color: statusColor(p.status) }}>{p.ejecucion}%</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const CustomTick = ({ x, y, payload, data }) => {
  const item = data?.find(d => d.name === payload.value);
  return (
    <g transform={`translate(${x},${y})`}>
      <text x={0} y={0} dy={14} textAnchor="middle" fill="var(--text-secondary)" fontFamily="var(--font-mono)" fontSize={9}>
        {item?.q || payload.value}
      </text>
      {item?.half === 1 && item?.month && (
        <text x={0} y={0} dy={26} textAnchor="middle" fill="var(--text-muted)" fontFamily="var(--font-body)" fontSize={10}>
          {item.month.substring(0,3)}
        </text>
      )}
    </g>
  );
};

export const QuincenaTimeline = ({ data: rawData = [] }) => {
  const [view, setView] = useState('bars');

  // Sanitize — ensure all numeric fields are valid numbers
  const data = (rawData || [])
    .filter(d => d && typeof d === 'object')
    .map(d => ({
      ...d,
      name:        String(d.name || d.q || ''),
      presupuesto: Number(d.presupuesto) || 0,
      gasto:       Number(d.gasto)       || 0,
      saldo:       Number(d.saldo)       || 0,
      acumuladoP:  Number(d.acumuladoP)  || 0,
      acumuladoG:  Number(d.acumuladoG)  || 0,
      ejecucion:   Number(d.ejecucion)   || 0,
    }))
    .filter(d => d.name && (d.presupuesto > 0 || d.gasto > 0));

  if (data.length === 0) return null;

  return (
    <ChartPanel
      title="Timeline Quincenal"
      subtitle={view === 'bars' ? 'Presupuesto vs Gasto por quincena' : 'Acumulado anual presupuesto vs gasto'}
      action={
        <div style={{ display:'flex', gap:4 }}>
          {[['bars','Quincenal'],['accumulated','Acumulado']].map(([v,l]) => (
            <button key={v} onClick={() => setView(v)} style={{
              padding:'5px 12px', borderRadius:99, fontSize:12, fontFamily:'var(--font-body)',
              cursor:'pointer', border:'1px solid', transition:'all 0.15s',
              background: view===v ? 'var(--accent-dim)' : 'transparent',
              borderColor: view===v ? 'var(--border-accent)' : 'var(--border)',
              color: view===v ? 'var(--accent)' : 'var(--text-muted)',
            }}>{l}</button>
          ))}
        </div>
      }
    >
      <ResponsiveContainer width="100%" height={320}>
        {view === 'bars' ? (
          <BarChart data={data} barCategoryGap="25%" barGap={2}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis dataKey="name" tick={<CustomTick data={data} />} axisLine={false} tickLine={false} height={36} interval={0} />
            <YAxis tickFormatter={fmtShort} tick={{ fill:'var(--text-secondary)', fontFamily:'var(--font-mono)', fontSize:10 }} axisLine={false} tickLine={false} width={50} />
            <Tooltip content={<CustomTooltip />} cursor={{ fill:'rgba(255,255,255,0.02)' }} />
            <Legend wrapperStyle={{ fontFamily:'var(--font-body)', fontSize:12, paddingTop:12 }} />
            <Bar dataKey="presupuesto" name="Presupuesto" fill="var(--blue)"   radius={[3,3,0,0]} fillOpacity={0.7} />
            <Bar dataKey="gasto"       name="Gasto Real"  fill="var(--accent)" radius={[3,3,0,0]} />
          </BarChart>
        ) : (
          <ComposedChart data={data}>
            <defs>
              <linearGradient id="gAP" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#3b82f6" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}   />
              </linearGradient>
              <linearGradient id="gAG" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#00e5a0" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#00e5a0" stopOpacity={0}    />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis dataKey="name" tick={<CustomTick data={data} />} axisLine={false} tickLine={false} height={36} interval={0} />
            <YAxis tickFormatter={fmtShort} tick={{ fill:'var(--text-secondary)', fontFamily:'var(--font-mono)', fontSize:10 }} axisLine={false} tickLine={false} width={55} />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontFamily:'var(--font-body)', fontSize:12, paddingTop:12 }} />
            <Bar  dataKey="acumuladoP" name="Presupuesto acum." fill="url(#gAP)" stroke="#3b82f6" strokeWidth={1.5} radius={[3,3,0,0]} fillOpacity={0.6} />
            <Line dataKey="acumuladoG" name="Gasto acumulado"   stroke="#00e5a0" strokeWidth={2.5} dot={{ r:3, fill:'#00e5a0', strokeWidth:0 }} activeDot={{ r:5 }} type="monotone" />
          </ComposedChart>
        )}
      </ResponsiveContainer>
    </ChartPanel>
  );
};

export default QuincenaTimeline;
