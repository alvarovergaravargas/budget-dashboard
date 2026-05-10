import React, { useState } from 'react';
import { useDashboard } from '../hooks/useDashboard';
import { useFilteredData, periodLabel } from '../hooks/useFilteredData';
import { Header } from '../components/layout/Header';
import { KPICard } from '../components/ui/KPICard';
import { QuincenaKPI } from '../components/ui/QuincenaKPI';
import { PeriodFilter } from '../components/ui/PeriodFilter';
import { InsightsSection } from '../components/ui/InsightsSection';
import { LoadingSkeleton } from '../components/ui/LoadingSkeleton';
import { ErrorState } from '../components/ui/ErrorState';
import { QuincenaTimeline } from '../components/charts/QuincenaTimeline';
import { NecesidadChart } from '../components/charts/NecesidadChart';
import { EstablecimientoChart } from '../components/charts/EstablecimientoChart';
import { DonutChart } from '../components/charts/DonutChart';
import { CategoryTable } from '../components/charts/CategoryTable';
import { TransactionFeed } from '../components/charts/TransactionFeed';
import { ExecutionGauge } from '../components/charts/ExecutionGauge';
import { DollarSign, TrendingDown, TrendingUp, AlertTriangle, Database, Filter } from 'lucide-react';

const fmt = (n) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(n || 0);

const SectionLabel = ({ children, tag }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
    <div style={{ fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-muted)', paddingLeft: 2 }}>
      {children}
    </div>
    {tag && (
      <span style={{ fontFamily: 'var(--font-body)', fontSize: 10, fontWeight: 600, color: 'var(--purple)', background: 'rgba(167,139,250,0.12)', border: '1px solid rgba(167,139,250,0.3)', borderRadius: 99, padding: '2px 8px' }}>
        {tag}
      </span>
    )}
  </div>
);

const EmptyState = ({ message = 'Sin datos aún' }) => (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 20px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', gap: 12 }}>
    <Database size={28} color="var(--text-muted)" />
    <div style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--text-muted)', textAlign: 'center' }}>{message}</div>
  </div>
);

class ChartErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { hasError: false }; }
  static getDerivedStateFromError() { return { hasError: true }; }
  render() {
    if (this.state.hasError) return <EmptyState message="Error al renderizar esta gráfica" />;
    return this.props.children;
  }
}

const Safe = ({ children }) => <ChartErrorBoundary>{children}</ChartErrorBoundary>;

export const DashboardPage = () => {
  const { data, loading, error, isDemo, lastSync, refresh } = useDashboard();
  const [period, setPeriod] = useState({ type: 'all' });

  // Derived filtered data (null when period === 'all')
  const filteredStats = useFilteredData(data, period);

  if (!data && !loading && !error) return null;

  // Merge full data with filtered overrides
  const view = filteredStats ? { ...data, ...filteredStats } : data;

  const quinceналData      = data?.quinceналData      || [];
  const categoryData       = view?.categoryData       || [];
  const necesidadData      = view?.necesidadData      || [];
  const topEstablecimientos= view?.topEstablecimientos|| [];
  const recentTransactions = view?.recentTransactions || [];
  const donutData          = view?.donutData          || [];
  const summary            = view?.summary            || { totalBudget: 0, totalExpenses: 0, remaining: 0, executionRate: 0 };

  // Previous quincena relative to current
  const currentQNum = data?.currentQ ? parseInt(data.currentQ.replace('Q', '')) : 0;
  const prevQ       = currentQNum > 1 ? `Q${currentQNum - 1}` : null;
  const prevQData   = prevQ ? quinceналData.find(q => q.q === prevQ) : null;

  // Period tag for filtered sections
  const activePeriodLabel = period.type !== 'all'
    ? periodLabel(period, quinceналData)
    : null;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)' }}>
      <Header lastSync={lastSync} isDemo={isDemo} onRefresh={refresh} loading={loading} />

      {loading && <LoadingSkeleton />}
      {error   && <ErrorState message={error} onRetry={refresh} />}

      {!loading && !error && data && (
        <main className="dash-main">

          {/* ══ KPIs ANUALES ═══════════════════════════════════════════════════ */}
          <section>
            <SectionLabel tag={activePeriodLabel}>
              {period.type === 'all' ? 'Resumen Anual' : 'Resumen del Período'}
            </SectionLabel>
            <div className="grid-kpi">
              <KPICard label="Presupuesto Total"   value={fmt(summary.totalBudget)}   sub={period.type === 'all' ? 'Suma de todas las quincenas' : `Presupuesto ${activePeriodLabel}`} icon={DollarSign}    color="var(--blue)"   />
              <KPICard label="Gasto Ejecutado"      value={fmt(summary.totalExpenses)} sub={`${Math.round(summary.executionRate)}% del presupuesto`}              icon={TrendingDown}  color="var(--accent)" />
              <KPICard label="Saldo Disponible"     value={fmt(summary.remaining)}     sub={summary.remaining < 0 ? '⚠ Sobre presupuesto' : 'Disponible para gastar'} icon={TrendingUp}  color={summary.remaining < 0 ? 'var(--danger)' : '#a78bfa'} />
              <KPICard label="Gastos Prescindibles" value={fmt((necesidadData.find(n => n.name === 'Prescindible')?.value) || 0)} sub="Gastos que podrían evitarse" icon={AlertTriangle} color="var(--warn)" />
            </div>
          </section>

          {/* ══ QUINCENA ACTUAL + GAUGE ════════════════════════════════════════ */}
          <section>
            <SectionLabel>Quincena en Curso</SectionLabel>
            <div className="grid-quincena">
              <Safe>
                <QuincenaKPI
                  currentQ={data.currentQ}
                  currentQData={data.currentQData}
                  prevQ={prevQ}
                  prevQData={prevQData}
                />
              </Safe>
              <Safe>
                <ExecutionGauge
                  rate={data.summary?.executionRate}
                  remaining={data.summary?.remaining}
                  total={data.summary?.totalBudget}
                />
              </Safe>
            </div>
          </section>

          {/* ══ INDICADORES DE CONSUMO ════════════════════════════════════════ */}
          <section>
            <SectionLabel>Indicadores de Consumo</SectionLabel>
            <Safe>
              <InsightsSection
                quinceналData={quinceналData}
                necesidadData={data?.necesidadData || []}
                categoryData={data?.categoryData   || []}
                summary={data?.summary             || {}}
                allTransactions={data?.allTransactions || []}
              />
            </Safe>
          </section>

          {/* ══ FILTRO DE PERÍODO ════════════════════════════════════════════ */}
          <section>
            <SectionLabel>
              <Filter size={12} style={{ display: 'inline', marginRight: 6, verticalAlign: 'middle' }} />
              Filtrar por Período
            </SectionLabel>
            <PeriodFilter
              quinceналData={quinceналData}
              period={period}
              onChange={setPeriod}
            />
          </section>

          {/* ══ TIMELINE (siempre muestra el año completo) ═══════════════════ */}
          <section>
            <SectionLabel>Evolución Quincenal</SectionLabel>
            {quinceналData.length > 0
              ? <Safe><QuincenaTimeline data={quinceналData} highlightQ={period.type === 'quincena' ? period.value : null} /></Safe>
              : <EmptyState message="Agrega datos de presupuesto en tu Google Sheet para ver el timeline" />
            }
          </section>

          {/* ══ NECESIDAD + ESTABLECIMIENTOS ══════════════════════════════════ */}
          <section>
            <SectionLabel tag={activePeriodLabel}>Análisis de Comportamiento</SectionLabel>
            <div className="grid-halves">
              {necesidadData.length > 0
                ? <Safe><NecesidadChart data={necesidadData} /></Safe>
                : <EmptyState message="Sin gastos registrados en este período" />
              }
              {topEstablecimientos.length > 0
                ? <Safe><EstablecimientoChart data={topEstablecimientos} /></Safe>
                : <EmptyState message="Sin establecimientos en este período" />
              }
            </div>
          </section>

          {/* ══ CATEGORÍAS + DONUT ════════════════════════════════════════════ */}
          <section>
            <SectionLabel tag={activePeriodLabel}>Distribución por Categoría</SectionLabel>
            <div className="grid-cat">
              {categoryData.length > 0
                ? <Safe><CategoryTable data={categoryData} /></Safe>
                : <EmptyState message="Sin categorías en este período" />
              }
              {donutData.length > 0
                ? <Safe><DonutChart data={donutData} /></Safe>
                : <EmptyState message="Sin gastos para mostrar distribución" />
              }
            </div>
          </section>

          {/* ══ TRAZABILIDAD ══════════════════════════════════════════════════ */}
          <section>
            <SectionLabel tag={activePeriodLabel}>Trazabilidad de Gastos</SectionLabel>
            {recentTransactions.length > 0
              ? <Safe><TransactionFeed data={recentTransactions} /></Safe>
              : <EmptyState message="Sin transacciones en este período" />
            }
          </section>

          <div style={{ textAlign: 'center', padding: '16px 0 8px', fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)', borderTop: '1px solid var(--border)' }}>
            BudgetOS · Google Sheets API · Presupuesto Quincenal · {isDemo ? '⚠ MODO DEMO' : '● Live'}
          </div>
        </main>
      )}
    </div>
  );
};

export default DashboardPage;
