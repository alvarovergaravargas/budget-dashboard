import React, { useState } from 'react';
import { fmt, fmtPct, statusColor, necesidadColor } from '../../utils/formatters';
import { ChartPanel } from '../ui/ChartPanel';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { useBreakpoint } from '../../hooks/useBreakpoint';

const NECESIDAD_ICONS = { 'Necesario':'✓','Importante':'●','Moderado':'◆','Prescindible':'✗' };

const ProgressBar = ({ pct, status }) => {
  const color = statusColor(status);
  const capped = Math.min(pct, 100);
  return (
    <div style={{ width:'100%', height:5, background:'var(--bg-base)', borderRadius:99, overflow:'hidden' }}>
      <div style={{ height:'100%', width:`${capped}%`, background:`linear-gradient(90deg, ${color}70, ${color})`, borderRadius:99, transition:'width 0.8s ease' }} />
    </div>
  );
};

const Badge = ({ status }) => {
  const map = { over:['#ff4d6d','var(--danger-dim)','Excedido'], warning:['#f5a623','var(--warn-dim)','En riesgo'], ok:['#00e5a0','var(--accent-dim)','OK'] };
  const [c, bg, l] = map[status] || map.ok;
  return <span style={{ background:bg, color:c, borderRadius:99, padding:'2px 10px', fontSize:11, fontWeight:600 }}>{l}</span>;
};

export const CategoryTable = ({ data }) => {
  const [expanded, setExpanded] = useState(null);
  const { isMobile, isTablet, isDesktop } = useBreakpoint();

  // Desktop: Categoría | Presupuesto | Gastado | Saldo | Ejec. | Estado
  // Tablet:  Categoría | Gastado | Ejec. | Estado
  // Mobile:  Categoría | Gastado | Estado
  const showPresupuesto = isDesktop;
  const showSaldo       = isDesktop;
  const showEjecucion   = !isMobile;

  const gridCols = isMobile
    ? '1fr 85px 65px'
    : isTablet
    ? '1fr 100px 72px 68px'
    : '1fr 110px 110px 90px 80px 75px';

  const headStyle = {
    display:'grid', gridTemplateColumns:gridCols, gap:12,
    padding:'6px 12px', fontSize:10, fontWeight:600,
    letterSpacing:'0.08em', textTransform:'uppercase',
    color:'var(--text-muted)', fontFamily:'var(--font-body)',
  };

  return (
    <ChartPanel title="Detalle por Categoría" subtitle="Ejecución del presupuesto quincenal acumulado">
      <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
        {/* Header */}
        <div style={headStyle}>
          <span>Categoría</span>
          {showPresupuesto && <span style={{textAlign:'right'}}>Presupuesto</span>}
          <span style={{textAlign:'right'}}>Gastado</span>
          {showSaldo && <span style={{textAlign:'right'}}>Saldo</span>}
          {showEjecucion && <span style={{textAlign:'right'}}>Ejec.</span>}
          <span style={{textAlign:'right'}}>Estado</span>
        </div>

        {data.map(row => (
          <div key={row.name}>
            <div
              style={{ display:'grid', gridTemplateColumns:gridCols, gap:12, padding:'12px', borderRadius:12, background:'var(--bg-panel)', border:'1px solid var(--border)', cursor: row.items?.length ? 'pointer':'default', transition:'all 0.15s' }}
              onClick={() => setExpanded(expanded===row.name ? null : row.name)}
              onMouseEnter={e => { e.currentTarget.style.borderColor='rgba(255,255,255,0.1)'; e.currentTarget.style.background='var(--bg-hover)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor='var(--border)'; e.currentTarget.style.background='var(--bg-panel)'; }}
            >
              {/* Categoría + barra */}
              <div style={{ display:'flex', alignItems:'center', gap:10, minWidth:0 }}>
                <div style={{ width:8, height:8, borderRadius:'50%', background:statusColor(row.status), flexShrink:0, boxShadow:`0 0 6px ${statusColor(row.status)}` }} />
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontWeight:500, fontSize: isMobile ? 12 : 14, color:'var(--text-primary)', marginBottom:4, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{row.name}</div>
                  <ProgressBar pct={row.ejecucion} status={row.status} />
                </div>
                {row.items?.length > 0 && (
                  <div style={{ color:'var(--text-muted)', marginLeft:4, flexShrink:0 }}>
                    {expanded===row.name ? <ChevronUp size={13}/> : <ChevronDown size={13}/>}
                  </div>
                )}
              </div>

              {showPresupuesto && (
                <div style={{ textAlign:'right', fontFamily:'var(--font-mono)', fontSize:12, color:'var(--text-secondary)', display:'flex', alignItems:'center', justifyContent:'flex-end' }}>{fmt(row.presupuesto)}</div>
              )}
              <div style={{ textAlign:'right', fontFamily:'var(--font-mono)', fontSize:12, color:'var(--text-primary)', display:'flex', alignItems:'center', justifyContent:'flex-end' }}>{fmt(row.gasto)}</div>
              {showSaldo && (
                <div style={{ textAlign:'right', fontFamily:'var(--font-mono)', fontSize:12, color: row.saldo<0?'var(--danger)':'var(--accent)', display:'flex', alignItems:'center', justifyContent:'flex-end' }}>{fmt(row.saldo)}</div>
              )}
              {showEjecucion && (
                <div style={{ textAlign:'right', fontFamily:'var(--font-mono)', fontSize:13, color:statusColor(row.status), fontWeight:600, display:'flex', alignItems:'center', justifyContent:'flex-end' }}>{fmtPct(row.ejecucion)}</div>
              )}
              <div style={{ display:'flex', alignItems:'center', justifyContent:'flex-end' }}><Badge status={row.status}/></div>
            </div>

            {/* Expanded items */}
            {expanded===row.name && row.items?.length > 0 && (
              <ExpandedItems items={row.items} isMobile={isMobile} isTablet={isTablet} />
            )}
          </div>
        ))}
      </div>
    </ChartPanel>
  );
};

const ExpandedItems = ({ items, isMobile, isTablet }) => {
  // Desktop: Fecha | Descripción | Necesidad | Monto | Quincena
  // Tablet:  Fecha | Descripción | Monto
  // Mobile:  card layout (no grid)
  const gridCols = isTablet
    ? '80px 1fr 90px'
    : '85px 1fr 120px 90px 100px';

  return (
    <div style={{ marginTop:3, marginLeft: isMobile ? 0 : 18, background:'var(--bg-panel)', border:'1px solid var(--border)', borderRadius:10, overflow:'hidden' }}>
      {!isMobile && (
        <div style={{ display:'grid', gridTemplateColumns:gridCols, gap:12, padding:'8px 14px', fontSize:10, color:'var(--text-muted)', fontFamily:'var(--font-body)', fontWeight:600, letterSpacing:'0.07em', textTransform:'uppercase', borderBottom:'1px solid var(--border)' }}>
          <span>Fecha</span>
          <span>Descripción / Establecimiento</span>
          {!isTablet && <span>Necesidad</span>}
          <span style={{textAlign:'right'}}>Monto</span>
          {!isTablet && <span>Quincena</span>}
        </div>
      )}

      {items.map((item, i) => {
        const nec = item._necesidad || item.Necesidad || '';
        const nc  = necesidadColor(nec);
        const fecha = item._fecha || item['Fecha del Gasto'] || '—';
        const est   = item._establecimiento || item.Establecimiento || '—';
        const desc  = item._descripcion || item['Descripcion o Detalles Adicionales'] || '';
        const monto = item._monto || 0;
        const quin  = item._quincena || '—';
        const borderB = i < items.length - 1 ? '1px solid var(--border)' : 'none';

        if (isMobile) {
          return (
            <div key={i} style={{ padding:'10px 12px', borderBottom: borderB }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:8 }}>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ color:'var(--text-primary)', fontSize:12, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{est}</div>
                  {desc && <div style={{ color:'var(--text-muted)', fontSize:11, marginTop:2, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{desc}</div>}
                </div>
                <div style={{ fontFamily:'var(--font-mono)', fontSize:12, color:'var(--text-primary)', fontWeight:600, flexShrink:0 }}>{fmt(monto)}</div>
              </div>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:6 }}>
                <span style={{ fontFamily:'var(--font-mono)', fontSize:10, color:'var(--text-muted)' }}>{fecha}</span>
                {nec && (
                  <span style={{ background:'rgba(255,255,255,0.06)', color:nc, borderRadius:99, padding:'2px 8px', fontSize:10, fontWeight:600 }}>
                    {NECESIDAD_ICONS[nec]||'?'} {nec}
                  </span>
                )}
              </div>
            </div>
          );
        }

        return (
          <div key={i} style={{ display:'grid', gridTemplateColumns:gridCols, gap:12, padding:'9px 14px', fontSize:12, borderBottom: borderB }}>
            <span style={{ fontFamily:'var(--font-mono)', fontSize:10, color:'var(--text-muted)', display:'flex', alignItems:'center' }}>{fecha}</span>
            <div style={{ minWidth:0, display:'flex', flexDirection:'column', justifyContent:'center' }}>
              <div style={{ color:'var(--text-primary)', fontSize:12, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{est}</div>
              {desc && <div style={{ color:'var(--text-muted)', fontSize:11, marginTop:1, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{desc}</div>}
            </div>
            {!isTablet && (
              <span style={{ display:'flex', alignItems:'center' }}>
                <span style={{ background:'rgba(255,255,255,0.06)', color:nc, borderRadius:99, padding:'2px 8px', fontSize:10, fontWeight:600 }}>
                  {NECESIDAD_ICONS[nec]||'?'} {nec||'—'}
                </span>
              </span>
            )}
            <span style={{ fontFamily:'var(--font-mono)', fontSize:12, color:'var(--text-primary)', textAlign:'right', display:'flex', alignItems:'center', justifyContent:'flex-end' }}>{fmt(monto)}</span>
            {!isTablet && (
              <span style={{ fontFamily:'var(--font-mono)', fontSize:10, color:'var(--text-muted)', display:'flex', alignItems:'center' }}>{quin}</span>
            )}
          </div>
        );
      })}
    </div>
  );
};
