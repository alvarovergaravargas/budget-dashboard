import React from 'react';
import { RefreshCw, Sheet, AlertCircle } from 'lucide-react';

export const Header = ({ lastSync, isDemo, onRefresh, loading }) => (
  <header style={{
    display:'flex', alignItems:'center', justifyContent:'space-between',
    padding:'20px 32px', borderBottom:'1px solid var(--border)',
    background:'var(--bg-panel)', position:'sticky', top:0, zIndex:100,
    backdropFilter:'blur(12px)',
  }}>
    {/* Logo / Brand */}
    <div style={{ display:'flex', alignItems:'center', gap:14 }}>
      <div style={{
        width:38, height:38, borderRadius:10,
        background:'linear-gradient(135deg, var(--accent), #00b8ff)',
        display:'flex', alignItems:'center', justifyContent:'center',
        boxShadow:'0 0 20px var(--accent-glow)',
      }}>
        <Sheet size={18} color="#000" />
      </div>
      <div>
        <div style={{ fontFamily:'var(--font-display)', fontSize:18, fontWeight:800, letterSpacing:'-0.02em', color:'var(--text-primary)' }}>BudgetOS</div>
        <div style={{ fontFamily:'var(--font-body)', fontSize:11, color:'var(--text-muted)' }}>Dashboard Financiero</div>
      </div>
    </div>

    {/* Right controls */}
    <div style={{ display:'flex', alignItems:'center', gap:12 }}>
      {isDemo && (
        <div style={{ display:'flex', alignItems:'center', gap:6, background:'var(--warn-dim)', border:'1px solid rgba(245,166,35,0.3)', borderRadius:99, padding:'6px 14px' }}>
          <AlertCircle size={13} color="var(--warn)" />
          <span style={{ fontFamily:'var(--font-body)', fontSize:12, color:'var(--warn)' }}>Modo demo · Configura tus credenciales</span>
        </div>
      )}

      {lastSync && (
        <div style={{ fontFamily:'var(--font-mono)', fontSize:11, color:'var(--text-muted)' }}>
          Sync: {lastSync.toLocaleTimeString('es-CO', { hour:'2-digit', minute:'2-digit' })}
        </div>
      )}

      <button
        onClick={onRefresh}
        disabled={loading}
        style={{
          display:'flex', alignItems:'center', gap:7, padding:'8px 16px',
          background:'var(--accent-dim)', border:'1px solid var(--border-accent)',
          borderRadius:99, color:'var(--accent)', fontFamily:'var(--font-body)',
          fontSize:13, fontWeight:500, cursor: loading ? 'not-allowed' : 'pointer',
          opacity: loading ? 0.6 : 1, transition:'all 0.15s',
        }}
        onMouseEnter={e => !loading && (e.currentTarget.style.background = 'rgba(0,229,160,0.2)')}
        onMouseLeave={e => (e.currentTarget.style.background = 'var(--accent-dim)')}
      >
        <RefreshCw size={14} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
        {loading ? 'Cargando...' : 'Actualizar'}
      </button>
    </div>

    <style>{`@keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }`}</style>
  </header>
);
