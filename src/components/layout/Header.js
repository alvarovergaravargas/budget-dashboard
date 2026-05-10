import React from 'react';
import { RefreshCw, Sheet, AlertCircle, LayoutDashboard, CalendarRange, Receipt } from 'lucide-react';
import { useBreakpoint } from '../../hooks/useBreakpoint';

const NAV_TABS = [
  { id: 'dashboard', label: 'Dashboard',    icon: LayoutDashboard },
  { id: 'planner',   label: 'Planificador', icon: CalendarRange   },
  { id: 'expenses',  label: 'Facturas',     icon: Receipt         },
];

export const Header = ({ lastSync, isDemo, onRefresh, loading, activePage, onNavigate }) => {
  const { isMobile } = useBreakpoint();

  return (
    <header className="app-header">
      {/* Logo / Brand */}
      <div style={{ display:'flex', alignItems:'center', gap: isMobile ? 10 : 14, minWidth:0 }}>
        <div style={{
          width: isMobile ? 32 : 38,
          height: isMobile ? 32 : 38,
          borderRadius:10, flexShrink:0,
          background:'linear-gradient(135deg, var(--accent), #00b8ff)',
          display:'flex', alignItems:'center', justifyContent:'center',
          boxShadow:'0 0 20px var(--accent-glow)',
        }}>
          <Sheet size={isMobile ? 15 : 18} color="#000" />
        </div>
        <div style={{ minWidth:0 }}>
          <div style={{ fontFamily:'var(--font-display)', fontSize: isMobile ? 16 : 18, fontWeight:800, letterSpacing:'-0.02em', color:'var(--text-primary)' }}>BudgetOS</div>
          {!isMobile && <div style={{ fontFamily:'var(--font-body)', fontSize:11, color:'var(--text-muted)' }}>Dashboard Financiero</div>}
        </div>
      </div>

      {/* Nav tabs (shown when navigation is available) */}
      {onNavigate && (
        <nav style={{ display:'flex', gap:4, flexShrink:0 }}>
          {NAV_TABS.map(({ id, label, icon: Icon }) => {
            const active = activePage === id;
            return (
              <button
                key={id}
                onClick={() => onNavigate(id)}
                style={{
                  display:'flex', alignItems:'center', gap:6,
                  padding: isMobile ? '7px 10px' : '7px 14px',
                  borderRadius:9, border:'none', cursor:'pointer',
                  background: active ? 'rgba(0,229,160,0.12)' : 'transparent',
                  color: active ? 'var(--accent)' : 'var(--text-muted)',
                  fontFamily:'var(--font-body)', fontSize:13,
                  fontWeight: active ? 600 : 400, transition:'all 0.15s',
                }}
              >
                <Icon size={14} />
                {!isMobile && label}
              </button>
            );
          })}
        </nav>
      )}

      {/* Right controls */}
      <div style={{ display:'flex', alignItems:'center', gap: isMobile ? 8 : 12, flexShrink:0 }}>
        {isDemo && (
          <div style={{ display:'flex', alignItems:'center', gap:6, background:'var(--warn-dim)', border:'1px solid rgba(245,166,35,0.3)', borderRadius:99, padding: isMobile ? '5px 10px' : '6px 14px' }}>
            <AlertCircle size={13} color="var(--warn)" />
            {!isMobile && <span style={{ fontFamily:'var(--font-body)', fontSize:12, color:'var(--warn)' }}>Modo demo · Configura tus credenciales</span>}
          </div>
        )}

        {lastSync && !isMobile && (
          <div style={{ fontFamily:'var(--font-mono)', fontSize:11, color:'var(--text-muted)' }}>
            Sync: {lastSync.toLocaleTimeString('es-CO', { hour:'2-digit', minute:'2-digit' })}
          </div>
        )}

        <button
          onClick={onRefresh}
          disabled={loading}
          style={{
            display:'flex', alignItems:'center', gap:7,
            padding: isMobile ? '9px 12px' : '8px 16px',
            background:'var(--accent-dim)', border:'1px solid var(--border-accent)',
            borderRadius:99, color:'var(--accent)', fontFamily:'var(--font-body)',
            fontSize:13, fontWeight:500, cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.6 : 1, transition:'all 0.15s',
          }}
          onMouseEnter={e => !loading && (e.currentTarget.style.background = 'rgba(0,229,160,0.2)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'var(--accent-dim)')}
        >
          <RefreshCw size={14} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
          {!isMobile && (loading ? 'Cargando...' : 'Actualizar')}
        </button>
      </div>

      <style>{`@keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }`}</style>
    </header>
  );
};
