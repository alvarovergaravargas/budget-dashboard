import React from 'react';

export const ChartPanel = ({ title, subtitle, children, style = {}, action }) => (
  <div style={{
    background: 'var(--bg-card)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-lg)',
    padding: '24px',
    display: 'flex',
    flexDirection: 'column',
    gap: 20,
    ...style,
  }}>
    <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between' }}>
      <div>
        <div style={{ fontFamily:'var(--font-display)', fontSize:16, fontWeight:700, color:'var(--text-primary)' }}>{title}</div>
        {subtitle && <div style={{ fontFamily:'var(--font-body)', fontSize:12, color:'var(--text-secondary)', marginTop:4 }}>{subtitle}</div>}
      </div>
      {action}
    </div>
    {children}
  </div>
);
