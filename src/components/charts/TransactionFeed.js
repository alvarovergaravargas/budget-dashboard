import React, { useState } from 'react';
import { fmt, fmtDate, necesidadColor } from '../../utils/formatters';
import { colorBg } from '../../utils/colorUtils';
import { ChartPanel } from '../ui/ChartPanel';
import { Search } from 'lucide-react';
import { useBreakpoint } from '../../hooks/useBreakpoint';

const NECESIDAD_ICONS = { 'Necesario':'✓','Importante':'●','Moderado':'◆','Prescindible':'✗' };
const CAT_COLORS = ['#00e5a0','#3b82f6','#a78bfa','#f5a623','#ff4d6d','#34d399'];
const colorFor = (str) => CAT_COLORS[Math.abs([...str].reduce((h,c)=>h*31+c.charCodeAt(0),0))%CAT_COLORS.length];

export const TransactionFeed = ({ data }) => {
  const [search, setSearch]       = useState('');
  const [filterNec, setFilterNec] = useState('');
  const { isMobile, isTablet, isDesktop } = useBreakpoint();

  const filtered = data.filter(tx => {
    const q = search.toLowerCase();
    const matchSearch = !q || tx.establecimiento?.toLowerCase().includes(q) || tx.descripcion?.toLowerCase().includes(q) || tx.categoria?.toLowerCase().includes(q);
    const matchNec = !filterNec || tx.necesidad === filterNec;
    return matchSearch && matchNec;
  });

  const necOptions = ['','Necesario','Importante','Moderado','Prescindible'];

  // Desktop: Fecha | Establecimiento | Categoría | Monto | Quincena | Necesidad
  // Tablet:  Fecha | Establecimiento | Monto | Necesidad
  // Mobile:  Establecimiento | Monto | Necesidad
  const showFecha     = !isMobile;
  const showCategoria = isDesktop;
  const showQuincena  = isDesktop;

  const gridCols = isMobile
    ? '1fr 80px 95px'
    : isTablet
    ? '75px 1fr 80px 95px'
    : '90px 1fr 130px 100px 90px 110px';

  const headStyle = {
    display:'grid', gridTemplateColumns:gridCols, gap:12,
    padding:'8px 14px', fontSize:10, fontFamily:'var(--font-body)',
    fontWeight:600, letterSpacing:'0.08em', textTransform:'uppercase', color:'var(--text-muted)',
  };

  return (
    <ChartPanel title="Trazabilidad de Gastos" subtitle={`${filtered.length} transacciones · Registros detallados`}>
      {/* Filters */}
      <div style={{ display:'flex', gap:10, alignItems:'center', flexWrap:'wrap' }}>
        <div style={{ flex:'1 1 160px', display:'flex', alignItems:'center', gap:8, background:'var(--bg-panel)', border:'1px solid var(--border)', borderRadius:99, padding:'7px 14px' }}>
          <Search size={13} color="var(--text-muted)" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={isMobile ? 'Buscar...' : 'Buscar por establecimiento, categoría...'}
            style={{ background:'transparent', border:'none', outline:'none', color:'var(--text-primary)', fontFamily:'var(--font-body)', fontSize:13, width:'100%' }}
          />
        </div>
        <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
          {necOptions.map(n => {
            const nc = n ? necesidadColor(n) : 'var(--accent)';
            const isActive = filterNec === n;
            return (
              <button key={n||'all'} onClick={() => setFilterNec(n)} style={{
                padding:'6px 10px', borderRadius:99, fontSize: isMobile ? 10 : 11, fontFamily:'var(--font-body)', cursor:'pointer', border:'1px solid', transition:'all 0.15s',
                background: isActive ? (n ? colorBg(nc, 0.15) : 'var(--accent-dim)') : 'transparent',
                borderColor: isActive ? (n ? nc : 'var(--border-accent)') : 'var(--border)',
                color: isActive ? (n ? nc : 'var(--accent)') : 'var(--text-muted)',
              }}>
                {isMobile && n ? (NECESIDAD_ICONS[n] || n) : (n || 'Todos')}
              </button>
            );
          })}
        </div>
      </div>

      {/* Header */}
      <div style={headStyle}>
        {showFecha     && <span>Fecha</span>}
        <span>Establecimiento</span>
        {showCategoria && <span>Categoría</span>}
        <span style={{textAlign:'right'}}>Monto</span>
        {showQuincena  && <span style={{textAlign:'center'}}>Quincena</span>}
        <span style={{textAlign:'center'}}>Necesidad</span>
      </div>

      {/* Rows */}
      <div style={{ display:'flex', flexDirection:'column', gap:3, maxHeight: isMobile ? 400 : 480, overflowY:'auto' }}>
        {filtered.length === 0 && (
          <div style={{ textAlign:'center', padding:'32px', color:'var(--text-muted)', fontFamily:'var(--font-body)' }}>No se encontraron transacciones</div>
        )}
        {filtered.map((tx, i) => {
          const catColor = colorFor(tx.categoria || '');
          const necColor = necesidadColor(tx.necesidad);
          return (
            <div key={tx.id ?? i}
              style={{ display:'grid', gridTemplateColumns:gridCols, gap:12, padding:'10px 14px', borderRadius:10, background: i%2===0 ? 'var(--bg-panel)' : 'transparent', transition:'background 0.12s', cursor:'default' }}
              onMouseEnter={e => e.currentTarget.style.background='var(--bg-hover)'}
              onMouseLeave={e => e.currentTarget.style.background = i%2===0 ? 'var(--bg-panel)':'transparent'}
            >
              {showFecha && (
                <div style={{ fontFamily:'var(--font-mono)', fontSize:11, color:'var(--text-muted)', display:'flex', alignItems:'center' }}>
                  {fmtDate(tx.fecha)}
                </div>
              )}

              <div style={{ overflow:'hidden', display:'flex', flexDirection:'column', justifyContent:'center' }}>
                <div style={{ fontSize:13, fontWeight:500, color:'var(--text-primary)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{tx.establecimiento}</div>
                {tx.descripcion && !isMobile && (
                  <div style={{ fontSize:11, color:'var(--text-muted)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', marginTop:2 }}>{tx.descripcion}</div>
                )}
              </div>

              {showCategoria && (
                <div style={{ display:'flex', alignItems:'center' }}>
                  <span style={{ background: colorBg(catColor, 0.15), color:catColor, borderRadius:99, padding:'2px 10px', fontSize:11, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', maxWidth:'100%' }}>{tx.categoria}</span>
                </div>
              )}

              <div style={{ fontFamily:'var(--font-mono)', fontSize:13, color:'var(--text-primary)', fontWeight:600, textAlign:'right', display:'flex', alignItems:'center', justifyContent:'flex-end' }}>
                {fmt(tx.monto)}
              </div>

              {showQuincena && (
                <div style={{ textAlign:'center', display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <span style={{ fontFamily:'var(--font-mono)', fontSize:11, color:'var(--text-muted)', background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:6, padding:'2px 8px' }}>{tx.quincena || '—'}</span>
                </div>
              )}

              <div style={{ textAlign:'center', display:'flex', alignItems:'center', justifyContent:'center' }}>
                <span style={{ background: colorBg(necColor, 0.15), color:necColor, borderRadius:99, padding:'2px 8px', fontSize:11, fontWeight:600, display:'flex', alignItems:'center', gap: isMobile ? 0 : 4, whiteSpace:'nowrap' }}>
                  <span>{NECESIDAD_ICONS[tx.necesidad]||'?'}</span>
                  {!isMobile && <span>{tx.necesidad || '—'}</span>}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </ChartPanel>
  );
};
