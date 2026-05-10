import React from 'react';
import { fmt, fmtPct, statusColor } from '../../utils/formatters';
import { quincenaToLabel } from '../../services/googleSheetsService';
import { useBreakpoint } from '../../hooks/useBreakpoint';

const StatBox = ({ label, value, color, small }) => (
  <div style={{ background: 'var(--bg-panel)', borderRadius: 10, padding: small ? '7px 10px' : '10px 14px' }}>
    <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-body)', marginBottom: 3 }}>{label}</div>
    <div style={{ fontFamily: 'var(--font-mono)', fontSize: small ? 11 : 13, color, fontWeight: 600 }}>{value}</div>
  </div>
);

export const QuincenaKPI = ({ currentQ, currentQData, prevQ, prevQData }) => {
  const { isMobile } = useBreakpoint();
  if (!currentQData && !currentQ) return null;

  const meta      = quincenaToLabel(currentQ);
  const color     = currentQData ? statusColor(currentQData.status) : 'var(--accent)';
  const prevMeta  = prevQ ? quincenaToLabel(prevQ) : null;
  const prevColor = prevQData ? statusColor(prevQData.status) : 'var(--text-muted)';

  return (
    <div style={{
      background: 'var(--bg-card)', border: `1px solid ${color}40`, borderRadius: 'var(--radius-lg)',
      padding: isMobile ? '16px' : '20px 24px', position: 'relative', overflow: 'hidden',
    }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, ${color}, transparent)` }} />

      {/* ── Quincena actual ──────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, gap: 8 }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: 4 }}>Quincena Actual</div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: isMobile ? 17 : 22, fontWeight: 800, color, letterSpacing: '-0.02em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {currentQ} · {meta?.short}
          </div>
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: isMobile ? 22 : 28, fontWeight: 700, color, lineHeight: 1 }}>{fmtPct(currentQData?.ejecucion || 0)}</div>
          <div style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>ejecutado</div>
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ height: 6, background: 'var(--bg-panel)', borderRadius: 99, overflow: 'hidden', marginBottom: 14 }}>
        <div style={{ height: '100%', width: `${Math.min(currentQData?.ejecucion || 0, 100)}%`, background: `linear-gradient(90deg, ${color}80, ${color})`, borderRadius: 99, transition: 'width 1s ease' }} />
      </div>

      {/* Stats grid — quincena actual */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 }}>
        <StatBox label="Presupuesto" value={fmt(currentQData?.presupuesto || 0)} color="var(--text-secondary)" small={isMobile} />
        <StatBox label="Gastado"     value={fmt(currentQData?.gasto || 0)}       color="var(--text-primary)"   small={isMobile} />
        <StatBox label="Saldo"       value={fmt(currentQData?.saldo || 0)}       color={(currentQData?.saldo || 0) < 0 ? 'var(--danger)' : 'var(--accent)'} small={isMobile} />
      </div>

      {/* ── Quincena anterior ────────────────────────────────────────────────── */}
      {prevQData && prevQData.gasto > 0 && (
        <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, gap: 8 }}>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontFamily: 'var(--font-body)', fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 3 }}>Quincena Anterior</div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: isMobile ? 14 : 16, fontWeight: 700, color: prevColor, letterSpacing: '-0.01em' }}>
                {prevQ} · {prevMeta?.short}
              </div>
            </div>
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: isMobile ? 16 : 20, fontWeight: 700, color: prevColor, lineHeight: 1 }}>{fmtPct(prevQData.ejecucion)}</div>
              <div style={{ fontFamily: 'var(--font-body)', fontSize: 10, color: 'var(--text-muted)', marginTop: 3 }}>ejecutado</div>
            </div>
          </div>

          {/* Mini progress bar */}
          <div style={{ height: 4, background: 'var(--bg-base)', borderRadius: 99, overflow: 'hidden', marginBottom: 10 }}>
            <div style={{ height: '100%', width: `${Math.min(prevQData.ejecucion, 100)}%`, background: `linear-gradient(90deg, ${prevColor}70, ${prevColor})`, borderRadius: 99 }} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 }}>
            <StatBox label="Presupuesto" value={fmt(prevQData.presupuesto)} color="var(--text-muted)"  small />
            <StatBox label="Gastado"     value={fmt(prevQData.gasto)}       color="var(--text-secondary)" small />
            <StatBox label="Saldo"       value={fmt(prevQData.saldo)}       color={prevQData.saldo < 0 ? 'var(--danger)' : prevColor} small />
          </div>
        </div>
      )}
    </div>
  );
};
