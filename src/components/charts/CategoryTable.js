import React, { useState } from 'react';
import { fmt, fmtPct, statusColor, necesidadColor } from '../../utils/formatters';
import { ChartPanel } from '../ui/ChartPanel';
import { ChevronDown, ChevronUp } from 'lucide-react';

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

  return (
    <ChartPanel title="Detalle por Categoría" subtitle="Ejecución del presupuesto quincenal acumulado">
      <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
        {/* Header */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 110px 110px 90px 80px 75px', gap:12, padding:'6px 12px', fontSize:10, fontWeight:600, letterSpacing:'0.08em', textTransform:'uppercase', color:'var(--text-muted)', fontFamily:'var(--font-body)' }}>
          <span>Categoría</span><span style={{textAlign:'right'}}>Presupuesto</span><span style={{textAlign:'right'}}>Gastado</span><span style={{textAlign:'right'}}>Saldo</span><span style={{textAlign:'right'}}>Ejec.</span><span style={{textAlign:'right'}}>Estado</span>
        </div>

        {data.map(row => (
          <div key={row.name}>
            <div
              style={{ display:'grid', gridTemplateColumns:'1fr 110px 110px 90px 80px 75px', gap:12, padding:'12px', borderRadius:12, background:'var(--bg-panel)', border:'1px solid var(--border)', cursor: row.items?.length ? 'pointer':'default', transition:'all 0.15s' }}
              onClick={() => setExpanded(expanded===row.name ? null : row.name)}
              onMouseEnter={e => { e.currentTarget.style.borderColor='rgba(255,255,255,0.1)'; e.currentTarget.style.background='var(--bg-hover)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor='var(--border)'; e.currentTarget.style.background='var(--bg-panel)'; }}
            >
              <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                <div style={{ width:8, height:8, borderRadius:'50%', background:statusColor(row.status), flexShrink:0, boxShadow:`0 0 6px ${statusColor(row.status)}` }} />
                <div style={{ flex:1 }}>
                  <div style={{ fontWeight:500, fontSize:14, color:'var(--text-primary)', marginBottom:4 }}>{row.name}</div>
                  <ProgressBar pct={row.ejecucion} status={row.status} />
                </div>
                {row.items?.length > 0 && (
                  <div style={{ color:'var(--text-muted)', marginLeft:4 }}>
                    {expanded===row.name ? <ChevronUp size={13}/> : <ChevronDown size={13}/>}
                  </div>
                )}
              </div>
              <div style={{ textAlign:'right', fontFamily:'var(--font-mono)', fontSize:12, color:'var(--text-secondary)', display:'flex', alignItems:'center', justifyContent:'flex-end' }}>{fmt(row.presupuesto)}</div>
              <div style={{ textAlign:'right', fontFamily:'var(--font-mono)', fontSize:12, color:'var(--text-primary)', display:'flex', alignItems:'center', justifyContent:'flex-end' }}>{fmt(row.gasto)}</div>
              <div style={{ textAlign:'right', fontFamily:'var(--font-mono)', fontSize:12, color: row.saldo<0?'var(--danger)':'var(--accent)', display:'flex', alignItems:'center', justifyContent:'flex-end' }}>{fmt(row.saldo)}</div>
              <div style={{ textAlign:'right', fontFamily:'var(--font-mono)', fontSize:13, color:statusColor(row.status), fontWeight:600, display:'flex', alignItems:'center', justifyContent:'flex-end' }}>{fmtPct(row.ejecucion)}</div>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'flex-end' }}><Badge status={row.status}/></div>
            </div>

            {/* Expanded items */}
            {expanded===row.name && row.items?.length > 0 && (
              <div style={{ marginTop:3, marginLeft:18, background:'var(--bg-panel)', border:'1px solid var(--border)', borderRadius:10, overflow:'hidden' }}>
                <div style={{ display:'grid', gridTemplateColumns:'85px 1fr 120px 90px 100px', gap:12, padding:'8px 14px', fontSize:10, color:'var(--text-muted)', fontFamily:'var(--font-body)', fontWeight:600, letterSpacing:'0.07em', textTransform:'uppercase', borderBottom:'1px solid var(--border)' }}>
                  <span>Fecha</span><span>Descripción / Establecimiento</span><span>Necesidad</span><span style={{textAlign:'right'}}>Monto</span><span>Quincena</span>
                </div>
                {row.items.map((item, i) => {
                  const nec = item._necesidad || item.Necesidad || '';
                  const nc = necesidadColor(nec);
                  return (
                    <div key={i} style={{ display:'grid', gridTemplateColumns:'85px 1fr 120px 90px 100px', gap:12, padding:'9px 14px', fontSize:12, borderBottom: i<row.items.length-1?'1px solid var(--border)':'none' }}>
                      <span style={{ fontFamily:'var(--font-mono)', fontSize:10, color:'var(--text-muted)' }}>{item._fecha || item['Fecha del Gasto'] || '—'}</span>
                      <div>
                        <div style={{ color:'var(--text-primary)', fontSize:12 }}>{item._establecimiento || item.Establecimiento || '—'}</div>
                        {(item._descripcion || item['Descripcion o Detalles Adicionales']) && (
                          <div style={{ color:'var(--text-muted)', fontSize:11, marginTop:1 }}>{item._descripcion || item['Descripcion o Detalles Adicionales']}</div>
                        )}
                      </div>
                      <span>
                        <span style={{ background:`color-mix(in srgb,${nc} 15%,transparent)`, color:nc, borderRadius:99, padding:'2px 8px', fontSize:10, fontWeight:600 }}>
                          {NECESIDAD_ICONS[nec]||'?'} {nec||'—'}
                        </span>
                      </span>
                      <span style={{ fontFamily:'var(--font-mono)', fontSize:12, color:'var(--text-primary)', textAlign:'right' }}>{fmt(item._monto || 0)}</span>
                      <span style={{ fontFamily:'var(--font-mono)', fontSize:10, color:'var(--text-muted)' }}>{item._quincena || '—'}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </div>
    </ChartPanel>
  );
};
