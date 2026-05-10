import React from 'react';
import { Calendar, ChevronRight } from 'lucide-react';
import { useBreakpoint } from '../../hooks/useBreakpoint';

const Chip = ({ active, onClick, children, color }) => {
  const baseColor = color || 'var(--accent)';
  return (
    <button
      onClick={onClick}
      style={{
        padding: '5px 12px',
        borderRadius: 99,
        fontSize: 12,
        fontFamily: 'var(--font-body)',
        fontWeight: active ? 600 : 400,
        cursor: 'pointer',
        border: '1px solid',
        transition: 'all 0.15s',
        whiteSpace: 'nowrap',
        background: active ? `${baseColor}20` : 'transparent',
        borderColor: active ? baseColor : 'var(--border)',
        color: active ? baseColor : 'var(--text-muted)',
      }}
    >
      {children}
    </button>
  );
};

export const PeriodFilter = ({ quinceналData = [], period, onChange }) => {
  const { isMobile } = useBreakpoint();

  // Build unique months that have any data (budget or gasto)
  const months = [];
  const seen = new Set();
  quinceналData
    .filter(q => q.presupuesto > 0 || q.gasto > 0)
    .sort((a, b) => a.monthIdx - b.monthIdx)
    .forEach(q => {
      const key = `${q.año}-${q.monthIdx}`;
      if (!seen.has(key)) {
        seen.add(key);
        months.push({ monthIdx: q.monthIdx, month: q.month, short: q.month?.substring(0, 3) });
      }
    });

  // Quincenas within selected month (for sub-filter)
  const subQuincenas = period.type !== 'all'
    ? quinceналData.filter(q =>
        q.monthIdx === (period.monthIdx ?? -1) &&
        (q.presupuesto > 0 || q.gasto > 0)
      )
    : [];

  const isMonthActive = (idx) =>
    (period.type === 'month' && period.monthIdx === idx) ||
    (period.type === 'quincena' && period.monthIdx === idx);

  return (
    <div style={{
      background: 'var(--bg-panel)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius-md)',
      padding: isMobile ? '10px 12px' : '12px 20px',
      display: 'flex',
      flexDirection: 'column',
      gap: 10,
    }}>
      {/* Row 1: año / meses */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
          <Calendar size={13} color="var(--text-muted)" />
          <span style={{ fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
            {isMobile ? 'Período' : 'Ver por período'}
          </span>
        </div>

        <Chip active={period.type === 'all'} onClick={() => onChange({ type: 'all' })}>
          {isMobile ? 'Todo' : 'Año completo'}
        </Chip>

        {months.map(m => (
          <Chip
            key={m.monthIdx}
            active={isMonthActive(m.monthIdx)}
            onClick={() => onChange({ type: 'month', monthIdx: m.monthIdx })}
          >
            {isMobile ? m.short : m.month?.substring(0, 3)}
          </Chip>
        ))}
      </div>

      {/* Row 2: sub-filtro por quincena dentro del mes */}
      {subQuincenas.length > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingTop: 8, borderTop: '1px solid var(--border)', flexWrap: 'wrap' }}>
          <ChevronRight size={12} color="var(--text-muted)" />
          <span style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--text-muted)' }}>Quincena:</span>

          <Chip
            active={period.type === 'month'}
            onClick={() => onChange({ type: 'month', monthIdx: period.monthIdx })}
            color="var(--purple)"
          >
            Ambas
          </Chip>

          {subQuincenas.map(q => (
            <Chip
              key={q.q}
              active={period.type === 'quincena' && period.value === q.q}
              onClick={() => onChange({ type: 'quincena', value: q.q, monthIdx: q.monthIdx })}
              color="var(--purple)"
            >
              {q.q} · {q.half === 1 ? '1-15' : '16-31'}
            </Chip>
          ))}
        </div>
      )}
    </div>
  );
};
