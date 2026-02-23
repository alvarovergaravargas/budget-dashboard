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
import { DollarSign, TrendingDown, TrendingUp, AlertTriangle } from 'lucide-react';

const fmt = (n) => new Intl.NumberFormat('en-US', { style:'currency', currency:'USD', minimumFractionDigits:2 }).format(n || 0);

const GRID = (cols, gap = 16) => ({ display:'grid', gridTemplateColumns:cols, gap });

const SectionLabel = ({ children }) => (
  <div style={{ fontFamily:'var(--font-display)', fontSize:13, fontWeight:700, letterSpacing:'0.12em', textTransform:'uppercase', color:'var(--text-muted)', marginBottom:4, paddingLeft:2 }}>
    {children}
  </div>
);

export const DashboardPage = () => {
  const { data, loading, error, isDemo, lastSync, refresh } = useDashboard();

  return (
    <div style={{ minHeight:'100vh', background:'var(--bg-base)' }}>
      <Header lastSync={lastSync} isDemo={isDemo} onRefresh={refresh} loading={loading} />

      {loading && <LoadingSkeleton />}
      {error   && <ErrorState message={error} onRetry={refresh} />}

      {!loading && !error && data && (
        <main style={{ padding:'28px 32px', display:'flex', flexDirection:'column', gap:24, maxWidth:1600, margin:'0 auto' }}>

          {/* ══ KPIs GLOBALES ════════════════════════════════════════════════ */}
          <section>
            <SectionLabel>Resumen Anual</SectionLabel>
            <div style={GRID('repeat(4,1fr)')}>
              <KPICard label="Presupuesto Total" value={fmt(data.summary.totalBudget)}
                sub="Suma de todas las quincenas presupuestadas"
                icon={DollarSign} color="var(--blue)" delay={0} />
              <KPICard label="Gasto Ejecutado" value={fmt(data.summary.totalExpenses)}
                sub={`${Math.round(data.summary.executionRate)}% del presupuesto total`}
                icon={TrendingDown} color="var(--accent)" delay={80} />
              <KPICard label="Saldo Disponible" value={fmt(data.summary.remaining)}
                sub={data.summary.remaining < 0 ? '⚠ Sobre presupuesto' : 'Disponible para gastar'}
                icon={TrendingUp} color={data.summary.remaining < 0 ? 'var(--danger)' : '#a78bfa'} delay={160} />
              <KPICard label="Gastos Prescindibles" 
                value={fmt((data.necesidadData.find(n=>n.name==='Prescindible')?.value)||0)}
                sub="Gastos que podrían evitarse"
                icon={AlertTriangle} color="var(--warn)" delay={240} />
            </div>
          </section>

          {/* ══ QUINCENA ACTUAL + GAUGE ══════════════════════════════════════ */}
          <section>
            <SectionLabel>Quincena en Curso</SectionLabel>
            <div style={GRID('1fr 320px')}>
              <QuincenaKPI currentQ={data.currentQ} currentQData={data.currentQData} />
              <ExecutionGauge rate={data.summary.executionRate} remaining={data.summary.remaining} total={data.summary.totalBudget} />
            </div>
          </section>

          {/* ══ TIMELINE QUINCENAL ════════════════════════════════════════════ */}
          <section>
            <SectionLabel>Evolución Quincenal</SectionLabel>
            <QuincenaTimeline data={data.quinceналData} />
          </section>

          {/* ══ NECESIDAD + ESTABLECIMIENTOS ════════════════════════════════ */}
          <section>
            <SectionLabel>Análisis de Comportamiento</SectionLabel>
            <div style={GRID('1fr 1fr')}>
              <NecesidadChart data={data.necesidadData} />
              <EstablecimientoChart data={data.topEstablecimientos} />
            </div>
          </section>

          {/* ══ CATEGORÍAS + DONUT ═══════════════════════════════════════════ */}
          <section>
            <SectionLabel>Distribución por Categoría</SectionLabel>
            <div style={GRID('3fr 2fr')}>
              <CategoryTable data={data.categoryData} />
              <DonutChart data={data.donutData} />
            </div>
          </section>

          {/* ══ TRAZABILIDAD ════════════════════════════════════════════════ */}
          <section>
            <SectionLabel>Trazabilidad de Gastos</SectionLabel>
            <TransactionFeed data={data.recentTransactions} />
          </section>

          {/* Footer */}
          <div style={{ textAlign:'center', padding:'16px 0 8px', fontFamily:'var(--font-mono)', fontSize:11, color:'var(--text-muted)', borderTop:'1px solid var(--border)' }}>
            BudgetOS · Google Sheets API · Presupuesto Quincenal · {isDemo ? '⚠ MODO DEMO' : '● Live'}
          </div>
        </main>
      )}
    </div>
  );
};
