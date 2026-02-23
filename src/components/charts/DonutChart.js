import React, { useState } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Sector } from 'recharts';
import { fmt, fmtPct } from '../../utils/formatters';
import { ChartPanel } from '../ui/ChartPanel';

const COLORS = ['#00e5a0','#3b82f6','#a78bfa','#f5a623','#ff4d6d','#34d399','#60a5fa','#c084fc'];

const ActiveShape = ({ cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill, payload, percent }) => (
  <g>
    <text x={cx} y={cy - 12} textAnchor="middle" fill="var(--text-primary)" fontFamily="var(--font-display)" fontSize={15} fontWeight={700}>{payload.name}</text>
    <text x={cx} y={cy + 14} textAnchor="middle" fill="var(--accent)" fontFamily="var(--font-mono)" fontSize={13}>{fmt(payload.value)}</text>
    <text x={cx} y={cy + 34} textAnchor="middle" fill="var(--text-secondary)" fontFamily="var(--font-body)" fontSize={11}>{fmtPct(percent * 100)}</text>
    <Sector cx={cx} cy={cy} innerRadius={innerRadius} outerRadius={outerRadius + 8} startAngle={startAngle} endAngle={endAngle} fill={fill} />
    <Sector cx={cx} cy={cy} innerRadius={outerRadius + 12} outerRadius={outerRadius + 16} startAngle={startAngle} endAngle={endAngle} fill={fill} opacity={0.4} />
  </g>
);

export const DonutChart = ({ data }) => {
  const [activeIdx, setActiveIdx] = useState(0);
  const total = data.reduce((s, d) => s + d.value, 0);

  return (
    <ChartPanel title="Distribución de Gastos" subtitle="Proporción por categoría">
      <div style={{ display:'flex', gap:24, alignItems:'center' }}>
        <div style={{ flex:'0 0 220px', height:220 }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%" cy="50%"
                innerRadius={65} outerRadius={95}
                dataKey="value"
                activeIndex={activeIdx}
                activeShape={ActiveShape}
                onMouseEnter={(_, i) => setActiveIdx(i)}
              >
                {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} stroke="none" />)}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div style={{ flex:1, display:'flex', flexDirection:'column', gap:8 }}>
          {data.map((d, i) => (
            <div
              key={d.name}
              style={{ display:'flex', alignItems:'center', gap:10, padding:'6px 10px', borderRadius:8, cursor:'pointer', background: activeIdx === i ? 'var(--bg-hover)' : 'transparent', transition:'background 0.15s' }}
              onMouseEnter={() => setActiveIdx(i)}
            >
              <div style={{ width:10, height:10, borderRadius:'50%', background: COLORS[i % COLORS.length], flexShrink:0 }} />
              <div style={{ flex:1, fontSize:13, color:'var(--text-secondary)' }}>{d.name}</div>
              <div style={{ fontFamily:'var(--font-mono)', fontSize:12, color:'var(--text-primary)' }}>{Math.round(d.value / total * 100)}%</div>
            </div>
          ))}
        </div>
      </div>
    </ChartPanel>
  );
};
