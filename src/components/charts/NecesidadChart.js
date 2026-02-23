import React, { useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Sector, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { fmt, fmtShort } from '../../utils/formatters';
import { colorBg } from '../../utils/colorUtils';
import { ChartPanel } from '../ui/ChartPanel';

const NECESIDAD_ORDER = ['Necesario','Importante','Moderado','Prescindible'];

const ActiveShape = ({ cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill, payload, percent }) => (
  <g>
    <text x={cx} y={cy - 14} textAnchor="middle" fill="var(--text-primary)" fontFamily="var(--font-display)" fontSize={13} fontWeight={700}>{payload.name}</text>
    <text x={cx} y={cy + 10} textAnchor="middle" fill={fill} fontFamily="var(--font-mono)" fontSize={14} fontWeight={600}>{fmt(payload.value)}</text>
    <text x={cx} y={cy + 30} textAnchor="middle" fill="var(--text-secondary)" fontFamily="var(--font-body)" fontSize={11}>{payload.count} gastos · {Math.round(percent*100)}%</text>
    <Sector cx={cx} cy={cy} innerRadius={innerRadius} outerRadius={outerRadius+8} startAngle={startAngle} endAngle={endAngle} fill={fill} />
    <Sector cx={cx} cy={cy} innerRadius={outerRadius+12} outerRadius={outerRadius+16} startAngle={startAngle} endAngle={endAngle} fill={fill} opacity={0.4} />
  </g>
);

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div style={{ background:'var(--bg-panel)', border:'1px solid var(--border-accent)', borderRadius:10, padding:'12px 16px', fontFamily:'var(--font-body)' }}>
      <div style={{ fontWeight:600, color: d.color, marginBottom:6 }}>{d.name}</div>
      <div style={{ fontSize:13, color:'var(--text-secondary)' }}>Total: <span style={{ fontFamily:'var(--font-mono)', color:'var(--text-primary)' }}>{fmt(d.value)}</span></div>
      <div style={{ fontSize:13, color:'var(--text-secondary)' }}>Gastos: <span style={{ fontFamily:'var(--font-mono)', color:'var(--text-primary)' }}>{d.count}</span></div>
    </div>
  );
};

export const NecesidadChart = ({ data = [] }) => {
  const [activeIdx, setActiveIdx] = useState(0);
  const [view, setView] = useState('donut');
  const sorted = [...data].filter(d => d && d.value > 0).sort((a,b) => NECESIDAD_ORDER.indexOf(a.name) - NECESIDAD_ORDER.indexOf(b.name));
  const total = sorted.reduce((s,d) => s + d.value, 0);
  if (sorted.length === 0) return null;

  const ICONS = { 'Necesario':'✓','Importante':'●','Moderado':'◆','Prescindible':'✗' };
  const DESCS = {
    'Necesario':    'No puedes prescindir de este gasto',
    'Importante':   'Relevante pero podría diferirse',
    'Moderado':     'Conveniente pero prescindible',
    'Prescindible': 'Lujo o gasto evitable',
  };

  return (
    <ChartPanel
      title="Análisis de Necesidad"
      subtitle="Clasificación del gasto por nivel de necesidad"
      action={
        <div style={{ display:'flex', gap:4 }}>
          {[['donut','Donut'],['bars','Barras']].map(([v,l]) => (
            <button key={v} onClick={() => setView(v)} style={{
              padding:'5px 12px', borderRadius:99, fontSize:12, fontFamily:'var(--font-body)', cursor:'pointer',
              border:'1px solid', transition:'all 0.15s',
              background: view===v ? 'var(--accent-dim)' : 'transparent',
              borderColor: view===v ? 'var(--border-accent)' : 'var(--border)',
              color: view===v ? 'var(--accent)' : 'var(--text-muted)',
            }}>{l}</button>
          ))}
        </div>
      }
    >
      {view === 'donut' ? (
        <div style={{ display:'flex', gap:16, alignItems:'center' }}>
          <div style={{ flex:'0 0 200px', height:200 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={sorted} cx="50%" cy="50%" innerRadius={60} outerRadius={88}
                  dataKey="value" activeIndex={activeIdx} activeShape={ActiveShape}
                  onMouseEnter={(_,i) => setActiveIdx(i)}>
                  {sorted.map((d,i) => <Cell key={i} fill={d.color} stroke="none" />)}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div style={{ flex:1, display:'flex', flexDirection:'column', gap:10 }}>
            {sorted.map((d,i) => (
              <div key={d.name}
                style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 12px', borderRadius:10, cursor:'pointer', background: activeIdx===i ? 'var(--bg-hover)' : 'transparent', transition:'background 0.15s' }}
                onMouseEnter={() => setActiveIdx(i)}>
                <div style={{ width:28, height:28, borderRadius:8, background: colorBg(d.color, 0.18), border:`1px solid ${d.color}80`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, color:d.color, flexShrink:0 }}>{ICONS[d.name]||'?'}</div>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:13, fontWeight:500, color:'var(--text-primary)' }}>{d.name}</div>
                  <div style={{ fontSize:10, color:'var(--text-muted)' }}>{DESCS[d.name]}</div>
                </div>
                <div style={{ textAlign:'right' }}>
                  <div style={{ fontFamily:'var(--font-mono)', fontSize:12, color:'var(--text-primary)' }}>{fmt(d.value)}</div>
                  <div style={{ fontFamily:'var(--font-mono)', fontSize:10, color:'var(--text-muted)' }}>{total > 0 ? Math.round(d.value/total*100) : 0}%</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={sorted} layout="vertical" barCategoryGap="25%">
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
            <XAxis type="number" tickFormatter={fmtShort} tick={{ fill:'var(--text-secondary)', fontFamily:'var(--font-mono)', fontSize:10 }} axisLine={false} tickLine={false} />
            <YAxis type="category" dataKey="name" width={100} tick={{ fill:'var(--text-secondary)', fontFamily:'var(--font-body)', fontSize:12 }} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} cursor={{ fill:'rgba(255,255,255,0.02)' }} />
            <Bar dataKey="value" name="Total gastado" radius={[0,4,4,0]}>
              {sorted.map((d,i) => <Cell key={i} fill={d.color} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </ChartPanel>
  );
};
