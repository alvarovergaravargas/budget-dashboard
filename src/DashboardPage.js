import React from 'react';
import { useDashboard } from '../hooks/useDashboard';
import { Header } from '../components/layout/Header';
import { KPICard } from '../components/ui/KPICard';
import { QuincenaKPI } from '../components/ui/QuincenaKPI';
import { LoadingSkeleton } from '../components/ui/LoadingSkeleton';
import { ErrorState } from '../components/ui/ErrorState';
import { QuincenaTimeline } from '../components/charts/QuincenaTimeline';
import { NecesidadChart } from '../components/charts/NecesidadChart';
import { EstablecimientoChart } from '../components/charts/EstablecimientoChart';
import { DonutChart } from '../components/charts/DonutChart';
import { CategoryTable } from '../components/charts/CategoryTable';
import { TransactionFeed } from '../components/charts/TransactionFeed';
import { ExecutionGauge } from '../components/charts/ExecutionGauge';
import { DollarSign, TrendingDown, TrendingUp, AlertTriangle, Database } from 'lucide-react';

const fmt = (n) => new Intl.NumberFormat('en-US', { style:'currency', currency:'USD', minimumFractionDigits:2 }).format(n || 0);

const GRID = (cols, gap = 16) => ({ display:'grid', gridTemplateColumns:cols, gap });

const SectionLabel = ({ children }) => (
  <div style={{ fontFamily:'var(--font-display)', fontSize:13, fontWeight:700, letterSpacing:'0.12em', textTransform:'uppercase', color:'var(--text-muted)', marginBottom:4, paddingLeft:2 }}>
    {children}
  </div>
);

// Shown when a section has no data yet
const EmptyState = ({ message = 'Sin datos aún' }) => (
  <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'40px 20px', background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:'var(--radius-lg)', gap:12 }}>
    <Database size={28} color="var(--text-muted)" />
    <div style={{ fontFamily:'var(--font-body)', fontSize:13, color:'var(--text-muted)', textAlign:'center' }}>{message}</div>
  </div>
);

// Safe wrapper — catches render errors in charts
class ChartErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { hasError: false }; }
  static getDerivedStateFromError() { return { hasError: true }; }
  render() {
    if (this.state.hasError) return <EmptyState message="Error al renderizar esta gráfica" />;
    return this.props.children;
  }
}

const Safe = ({ children, fallback }) => (
  <ChartErrorBoundary>
    {children}
  </ChartErrorBoundary>
);

export const DashboardPage = () => {
  const { data, loading, error, isDemo, lastSync, refresh } = useDashboard();

  // Safely access data with fallbacks
  const quinceналData      = data?.quinceналData      || [];
  const monthlyData        = data?.monthlyData        || [];
  const categoryData       = data?.categoryData       || [];
  const necesidadData      = data?.necesidadData      || [];
  const topEstablecimientos= data?.topEstablecimientos|| [];
  const recentTransactions = data?.recentTransactions || [];
  const donutData          = data?.donutData          || [];
  const summary            = data?.summary            || { totalBudget:0, totalExpenses:0, remaining:0, executionRate:0 };

  return (
    <div style={{ minHeight:'100vh', background:'var(--bg-base)' }}>
      <Header lastSync={lastSync} isDemo={isDemo} onRefresh={refresh} loading={loading} />

      {loading && <LoadingSkeleton />}
      {error   && <ErrorState message={error} onRetry={refresh} />}

      {!loading && !error && data && (
        <main style={{ padding:'28px 32px', display:'flex', flexDirection:'column', gap:24, maxWidth:1600, margin:'0 auto' }}>

          {/* ══ KPIs ══════════════════════════════════════════════════════════ */}
          <section>
            <SectionLabel>Resumen Anual</SectionLabel>
            <div style={GRID('repeat(4,1fr)')}>
              <KPICard label="Presupuesto Total"   value={fmt(summary.totalBudget)}   sub="Suma de todas las quincenas"         icon={DollarSign}    color="var(--blue)"   />
              <KPICard label="Gasto Ejecutado"      value={fmt(summary.totalExpenses)} sub={`${Math.round(summary.executionRate)}% del presupuesto`} icon={TrendingDown} color="var(--accent)" />
              <KPICard label="Saldo Disponible"     value={fmt(summary.remaining)}     sub={summary.remaining < 0 ? '⚠ Sobre presupuesto' : 'Disponible para gastar'} icon={TrendingUp} color={summary.remaining < 0 ? 'var(--danger)' : '#a78bfa'} />
              <KPICard label="Gastos Prescindibles" value={fmt((necesidadData.find(n=>n.name==='Prescindible')?.value)||0)} sub="Gastos que podrían evitarse" icon={AlertTriangle} color="var(--warn)" />
            </div>
          </section>

          {/* ══ QUINCENA ACTUAL + GAUGE ═══════════════════════════════════════ */}
          <section>
            <SectionLabel>Quincena en Curso</SectionLabel>
            <div style={GRID('1fr 320px')}>
              <Safe><QuincenaKPI currentQ={data.currentQ} currentQData={data.currentQData} /></Safe>
              <Safe><ExecutionGauge rate={summary.executionRate} remaining={summary.remaining} total={summary.totalBudget} /></Safe>
            </div>
          </section>

          {/* ══ TIMELINE ══════════════════════════════════════════════════════ */}
          <section>
            <SectionLabel>Evolución Quincenal</SectionLabel>
            {quinceналData.length > 0
              ? <Safe><QuincenaTimeline data={quinceналData} /></Safe>
              : <EmptyState message="Agrega datos de presupuesto en tu Google Sheet para ver el timeline" />
            }
          </section>

          {/* ══ NECESIDAD + ESTABLECIMIENTOS ══════════════════════════════════ */}
          <section>
            <SectionLabel>Análisis de Comportamiento</SectionLabel>
            <div style={GRID('1fr 1fr')}>
              {necesidadData.length > 0
                ? <Safe><NecesidadChart data={necesidadData} /></Safe>
                : <EmptyState message="Sin gastos registrados aún" />
              }
              {topEstablecimientos.length > 0
                ? <Safe><EstablecimientoChart data={topEstablecimientos} /></Safe>
                : <EmptyState message="Sin establecimientos registrados aún" />
              }
            </div>
          </section>

          {/* ══ CATEGORÍAS + DONUT ════════════════════════════════════════════ */}
          <section>
            <SectionLabel>Distribución por Categoría</SectionLabel>
            <div style={GRID('3fr 2fr')}>
              {categoryData.length > 0
                ? <Safe><CategoryTable data={categoryData} /></Safe>
                : <EmptyState message="Sin categorías de presupuesto aún" />
              }
              {donutData.length > 0
                ? <Safe><DonutChart data={donutData} /></Safe>
                : <EmptyState message="Sin gastos para mostrar distribución" />
              }
            </div>
          </section>

          {/* ══ TRAZABILIDAD ══════════════════════════════════════════════════ */}
          <section>
            <SectionLabel>Trazabilidad de Gastos</SectionLabel>
            {recentTransactions.length > 0
              ? <Safe><TransactionFeed data={recentTransactions} /></Safe>
              : <EmptyState message="Sin transacciones registradas aún" />
            }
          </section>

          <div style={{ textAlign:'center', padding:'16px 0 8px', fontFamily:'var(--font-mono)', fontSize:11, color:'var(--text-muted)', borderTop:'1px solid var(--border)' }}>
            BudgetOS · Google Sheets API · Presupuesto Quincenal · {isDemo ? '⚠ MODO DEMO' : '● Live'}
          </div>
        </main>
      )}
    </div>
  );
};
