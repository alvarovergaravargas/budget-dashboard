import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

export const ErrorState = ({ message, onRetry }) => (
  <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:'60vh', gap:20, textAlign:'center', padding:32 }}>
    <div style={{ width:64, height:64, borderRadius:'50%', background:'var(--danger-dim)', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <AlertCircle size={28} color="var(--danger)" />
    </div>
    <div>
      <div style={{ fontFamily:'var(--font-display)', fontSize:22, fontWeight:700, marginBottom:8 }}>Error al cargar datos</div>
      <div style={{ fontFamily:'var(--font-body)', fontSize:14, color:'var(--text-secondary)', maxWidth:460, lineHeight:1.7 }}>{message}</div>
    </div>
    <div style={{ fontFamily:'var(--font-body)', fontSize:13, color:'var(--text-muted)', background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:12, padding:'12px 20px', maxWidth:500, textAlign:'left', lineHeight:1.8 }}>
      <strong style={{ color:'var(--text-secondary)' }}>Verifica que:</strong><br/>
      1. El <code style={{ background:'var(--bg-panel)', padding:'1px 6px', borderRadius:4 }}>REACT_APP_GOOGLE_API_KEY</code> es válido<br/>
      2. El <code style={{ background:'var(--bg-panel)', padding:'1px 6px', borderRadius:4 }}>REACT_APP_SPREADSHEET_ID</code> es correcto<br/>
      3. Tu Google Sheet está compartido como "Cualquiera con el enlace"<br/>
      4. La Google Sheets API está habilitada en tu proyecto de Google Cloud
    </div>
    <button
      onClick={onRetry}
      style={{ display:'flex', alignItems:'center', gap:8, padding:'10px 24px', background:'var(--accent-dim)', border:'1px solid var(--border-accent)', borderRadius:99, color:'var(--accent)', fontFamily:'var(--font-body)', fontSize:14, cursor:'pointer' }}
    >
      <RefreshCw size={15} /> Reintentar
    </button>
  </div>
);
