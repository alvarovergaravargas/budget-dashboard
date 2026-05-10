import React from 'react';
import { fmt, fmtPct } from '../../utils/formatters';
import { ChartPanel } from './ChartPanel';
import { TrendingUp, TrendingDown, Minus, Award, AlertCircle, Zap, Target, Activity } from 'lucide-react';

const Stat = ({ icon: Icon, label, value, sub, color = 'var(--accent)', highlight = false, vertical = false }) => {
  if (vertical) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '9px 12px', borderRadius: 10,
        background: highlight ? `${color}10` : 'var(--bg-panel)',
        border: `1px solid ${highlight ? color + '40' : 'var(--border)'}`,
      }}>
        <div style={{ width: 26, height: 26, borderRadius: 7, flexShrink: 0, background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={12} color={color} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: 'var(--font-body)', fontSize: 10, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>{label}</div>
          {sub && <div style={{ fontFamily: 'var(--font-body)', fontSize: 10, color: 'var(--text-muted)', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{sub}</div>}
        </div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 700, color, flexShrink: 0 }}>{value}</div>
      </div>
    );
  }

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', gap: 6,
      padding: '14px 16px',
      background: highlight ? `${color}10` : 'var(--bg-panel)',
      borderRadius: 12,
      border: `1px solid ${highlight ? color + '40' : 'var(--border)'}`,
      flex: '1 1 150px',
      minWidth: 0,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
        <div style={{ width: 28, height: 28, borderRadius: 8, flexShrink: 0, background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={14} color={color} />
        </div>
        <span style={{ fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 500, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
          {label}
        </span>
      </div>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700, color, lineHeight: 1, letterSpacing: '-0.02em' }}>
        {value}
      </div>
      {sub && (
        <div style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.3 }}>
          {sub}
        </div>
      )}
    </div>
  );
};

export const InsightsSection = ({ quinceналData = [], necesidadData = [], categoryData = [], summary = {}, allTransactions = [], vertical = false }) => {
  const quincenasConGasto = quinceналData.filter(q => q.gasto > 0);
  if (quincenasConGasto.length === 0) return null;

  const { totalExpenses = 0 } = summary;

  // Promedio de gasto por quincena
  const promedioQuincenal = quincenasConGasto.length > 0
    ? totalExpenses / quincenasConGasto.length
    : 0;

  // Mejor quincena (menor ejecución, entre las que tienen presupuesto)
  const mejorQ = quincenasConGasto
    .filter(q => q.presupuesto > 0)
    .reduce((best, q) => (!best || q.ejecucion < best.ejecucion ? q : best), null);

  // % quincenas en verde
  const qOK = quincenasConGasto.filter(q => q.status === 'ok').length;
  const pctOK = quincenasConGasto.length > 0
    ? Math.round((qOK / quincenasConGasto.length) * 100)
    : 0;

  // % gasto prescindible
  const prescindibleVal = necesidadData.find(n => n.name === 'Prescindible')?.value || 0;
  const pctPrescindible = totalExpenses > 0
    ? Math.round((prescindibleVal / totalExpenses) * 100)
    : 0;

  // Tendencia: última quincena vs la anterior (ambas con gasto)
  const lastTwo = quincenasConGasto.slice(-2);
  let tendenciaPct = null;
  let TendIcon = Minus;
  let tendColor = 'var(--text-muted)';
  if (lastTwo.length === 2 && lastTwo[0].gasto > 0) {
    tendenciaPct = ((lastTwo[1].gasto - lastTwo[0].gasto) / lastTwo[0].gasto) * 100;
    if (tendenciaPct > 5)  { TendIcon = TrendingUp;   tendColor = 'var(--danger)'; }
    if (tendenciaPct < -5) { TendIcon = TrendingDown;  tendColor = 'var(--accent)'; }
  }

  // Categorías excedidas
  const catExcedidas = categoryData.filter(c => c.status === 'over').length;

  // Ticket promedio por transacción
  const ticketPromedio = allTransactions.length > 0
    ? totalExpenses / allTransactions.length
    : 0;

  const statProps = { vertical };
  const listStyle = vertical
    ? { display: 'flex', flexDirection: 'column', gap: 6 }
    : { display: 'flex', gap: 10, flexWrap: 'wrap' };

  return (
    <ChartPanel
      title="Indicadores de Consumo"
      subtitle="Métricas derivadas de tus hábitos financieros — año completo"
    >
      <div style={listStyle}>

        <Stat
          {...statProps}
          icon={Activity}
          label="Promedio quincenal"
          value={fmt(promedioQuincenal)}
          sub={`Sobre ${quincenasConGasto.length} quincena${quincenasConGasto.length > 1 ? 's' : ''} con gasto`}
          color="var(--blue)"
        />

        <Stat
          {...statProps}
          icon={Award}
          label="Mejor quincena"
          value={mejorQ ? `${mejorQ.q}` : '—'}
          sub={mejorQ ? `${fmtPct(mejorQ.ejecucion)} ejecutado · ${fmt(mejorQ.gasto)}` : 'Sin datos'}
          color="var(--accent)"
          highlight={!!mejorQ}
        />

        <Stat
          {...statProps}
          icon={Target}
          label="Quincenas OK"
          value={`${qOK} / ${quincenasConGasto.length}`}
          sub={`${pctOK}% dentro del presupuesto`}
          color={pctOK >= 70 ? 'var(--accent)' : pctOK >= 50 ? 'var(--warn)' : 'var(--danger)'}
        />

        <Stat
          {...statProps}
          icon={AlertCircle}
          label="Gasto prescindible"
          value={`${pctPrescindible}%`}
          sub={`${fmt(prescindibleVal)} en gastos evitables`}
          color={pctPrescindible <= 10 ? 'var(--accent)' : pctPrescindible <= 20 ? 'var(--warn)' : 'var(--danger)'}
        />

        {catExcedidas > 0 && (
          <Stat
            {...statProps}
            icon={TrendingUp}
            label="Categ. excedidas"
            value={String(catExcedidas)}
            sub={`${catExcedidas} categoría${catExcedidas > 1 ? 's' : ''} sobre presupuesto`}
            color="var(--danger)"
            highlight
          />
        )}

        {tendenciaPct !== null && (
          <Stat
            {...statProps}
            icon={TendIcon}
            label="Tendencia"
            value={`${tendenciaPct > 0 ? '+' : ''}${Math.round(tendenciaPct)}%`}
            sub={`${lastTwo[1]?.q} vs ${lastTwo[0]?.q} — gasto ${tendenciaPct > 0 ? 'aumentó' : 'bajó'}`}
            color={tendColor}
          />
        )}

        <Stat
          {...statProps}
          icon={Zap}
          label="Ticket promedio"
          value={fmt(ticketPromedio)}
          sub={`Por transacción · ${allTransactions.length} registros`}
          color="var(--purple)"
        />

      </div>
    </ChartPanel>
  );
};
