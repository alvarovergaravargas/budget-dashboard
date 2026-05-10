import React from 'react';

export const ChartPanel = ({ title, subtitle, children, style = {}, action }) => (
  <div className="chart-panel" style={style}>
    <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:12 }}>
      <div style={{ minWidth:0 }}>
        <div style={{ fontFamily:'var(--font-display)', fontSize:16, fontWeight:700, color:'var(--text-primary)' }}>{title}</div>
        {subtitle && <div style={{ fontFamily:'var(--font-body)', fontSize:12, color:'var(--text-secondary)', marginTop:4 }}>{subtitle}</div>}
      </div>
      {action && <div style={{ flexShrink:0 }}>{action}</div>}
    </div>
    {children}
  </div>
);
