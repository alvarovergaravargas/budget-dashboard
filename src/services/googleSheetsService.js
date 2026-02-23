/**
 * googleSheetsService.js — BudgetOS Personal
 * ──────────────────────────────────────────────────────────────────────────────
 * Integración con Google Sheets API v4 (API Key pública, sin OAuth).
 *
 * ESTRUCTURA DE TU GOOGLE SHEET (2 pestañas):
 * ─────────────────────────────────────────────
 *
 * Pestaña 1 → "Presupuesto"
 * ┌────────────────┬──────────────┬───────┬─────────────┬──────────────────────┐
 * │ Quincena       │ Periodo      │  Año  │  Categoria  │   Presupuesto (USD)  │
 * ├────────────────┼──────────────┼───────┼─────────────┼──────────────────────┤
 * │ Q1             │ Ene 1-15     │ 2025  │ Mercado     │ 150                  │
 * │ Q1             │ Ene 1-15     │ 2025  │ Transporte  │ 80                   │
 * │ Q2             │ Ene 16-31    │ 2025  │ Mercado     │ 150                  │
 * └────────────────┴──────────────┴───────┴─────────────┴──────────────────────┘
 *   Quincena: Q1..Q24 (2 por mes × 12 meses)
 *   Periodo:  texto descriptivo libre ("Ene 1-15")
 *
 * Pestaña 2 → "Gastos"
 * ┌────────────┬─────────────────┬──────────────────┬─────────┬─────────────┬───────────┬──────────────────────────────────────┐
 * │ Fecha      │ Establecimiento │ Monto (USD)      │Categoria│  Necesidad  │ Quincena  │ Descripcion                          │
 * ├────────────┼─────────────────┼──────────────────┼─────────┼─────────────┼───────────┼──────────────────────────────────────┤
 * │ 2025-01-03 │ Super Xtra      │ 45.50            │ Mercado │ Necesario   │ Q1        │ Compras de la semana                 │
 * │ 2025-01-08 │ Terpel          │ 30.00            │Transporte│ Necesario  │ Q1        │ Gasolina                             │
 * │ 2025-01-11 │ Escuela         │ 120.00           │Educación│ Importante  │ Q1        │ Mensualidad colegio                  │
 * └────────────┴─────────────────┴──────────────────┴─────────┴─────────────┴───────────┴──────────────────────────────────────┘
 *
 * Valores válidos para "Necesidad":
 *   Necesario   → Gasto esencial, no se puede evitar
 *   Importante  → Relevante pero podría diferirse
 *   Moderado    → Conveniente pero prescindible
 *   Prescindible→ Capricho / lujo / evitable
 */

const API_KEY        = process.env.REACT_APP_GOOGLE_API_KEY;
const SPREADSHEET_ID = process.env.REACT_APP_SPREADSHEET_ID;
const SHEET_BUDGET   = process.env.REACT_APP_SHEET_PRESUPUESTO || 'Presupuesto';
const SHEET_EXPENSES = process.env.REACT_APP_SHEET_GASTOS      || 'Gastos';
const BASE_URL       = 'https://sheets.googleapis.com/v4/spreadsheets';

// ─── NECESIDAD CONFIG ──────────────────────────────────────────────────────────
export const NECESIDAD_CONFIG = {
  'Necesario':    { score: 4, color: '#00e5a0', label: 'Necesario',    icon: '✓' },
  'Importante':   { score: 3, color: '#3b82f6', label: 'Importante',   icon: '●' },
  'Moderado':     { score: 2, color: '#f5a623', label: 'Moderado',     icon: '◆' },
  'Prescindible': { score: 1, color: '#ff4d6d', label: 'Prescindible', icon: '✗' },
};

// ─── FETCH ─────────────────────────────────────────────────────────────────────

const fetchSheet = async (sheetName) => {
  const url = `${BASE_URL}/${SPREADSHEET_ID}/values/${encodeURIComponent(sheetName)}!A:Z?key=${API_KEY}`;
  const res = await fetch(url);
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error?.message || `Error al leer "${sheetName}"`);
  }
  const data = await res.json();
  return toObjects(data.values || []);
};

const toObjects = (rows) => {
  if (rows.length < 2) return [];
  const headers = rows[0].map(h => h.trim());
  return rows.slice(1)
    .filter(row => row.some(cell => cell !== ''))
    .map(row => {
      const obj = {};
      headers.forEach((h, i) => { obj[h] = (row[i] ?? '').toString().trim(); });
      return obj;
    });
};

const num = (v) => {
  const cleaned = String(v).replace(/[$,\s]/g, '').replace(',', '.');
  return parseFloat(cleaned) || 0;
};

// ─── MAIN FETCH ────────────────────────────────────────────────────────────────

export const fetchDashboardData = async () => {
  const [budgetRows, expenseRows] = await Promise.all([
    fetchSheet(SHEET_BUDGET),
    fetchSheet(SHEET_EXPENSES),
  ]);
  return processDashboardData(budgetRows, expenseRows);
};

// ─── QUINCENAL HELPERS ─────────────────────────────────────────────────────────

/**
 * Convierte una fecha a su quincena (Q1-Q24)
 * Q1 = Ene 1-15, Q2 = Ene 16-31, Q3 = Feb 1-15 ...
 */
export const dateToQuincena = (dateStr) => {
  const d = new Date(dateStr);
  if (isNaN(d)) return null;
  const month = d.getMonth(); // 0-11
  const day   = d.getDate();
  const half  = day <= 15 ? 0 : 1;
  return `Q${month * 2 + half + 1}`;
};

export const quincenaToLabel = (q) => {
  if (!q) return '';
  const idx   = parseInt(q.replace('Q','')) - 1;
  const month = Math.floor(idx / 2);
  const half  = idx % 2;
  const MONTHS = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
  const FULL   = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
  if (isNaN(month) || month > 11) return q;
  return { short: `${MONTHS[month]} ${half ? '16-31':'1-15'}`, month: FULL[month], half: half + 1, monthIdx: month, qNum: idx + 1 };
};

// ─── PROCESSING ────────────────────────────────────────────────────────────────

export const processDashboardData = (budgetRows, expenseRows) => {
  const currentYear = new Date().getFullYear().toString();

  // ── Enriquecer gastos con quincena derivada de fecha ──────────────────────────
  const expenses = expenseRows.map(r => ({
    ...r,
    _monto:      num(r['Monto (USD)'] || r.Monto || r['Monto']),
    _categoria:  r['Categoria del Gasto'] || r.Categoria || 'Sin categoría',
    _necesidad:  r['Necesidad'] || r['¿Cómo calificaría la necesidad de este gasto?'] || 'Moderado',
    _establecimiento: r['Establecimiento'] || r['Establecimiento donde se realizó el gasto'] || '—',
    _descripcion: r['Descripcion'] || r['Descripción o Detalles Adicionales'] || r['Descripcion o Detalles Adicionales'] || '',
    _fecha:       r['Fecha del Gasto'] || r.Fecha || '',
    _quincena:    r.Quincena || (r['Fecha del Gasto'] ? dateToQuincena(r['Fecha del Gasto']) : null) || r.Fecha ? dateToQuincena(r['Fecha del Gasto'] || r.Fecha) : null,
    _año:         r['Año'] || (r['Fecha del Gasto'] ? new Date(r['Fecha del Gasto']).getFullYear().toString() : currentYear),
  }));

  const budgets = budgetRows.map(r => ({
    ...r,
    _presupuesto: num(r['Presupuesto (USD)'] || r.Presupuesto),
    _categoria:   r['Categoria'] || r['Categoría'] || 'Sin categoría',
    _quincena:    r.Quincena || r.Q || '',
    _año:         r['Año'] || currentYear,
  }));

  // ── Totales globales ──────────────────────────────────────────────────────────
  const totalBudget   = budgets.reduce((s, r) => s + r._presupuesto, 0);
  const totalExpenses = expenses.reduce((s, r) => s + r._monto, 0);
  const remaining     = totalBudget - totalExpenses;
  const executionRate = totalBudget > 0 ? (totalExpenses / totalBudget) * 100 : 0;

  // ── Por quincena (timeline anual) ─────────────────────────────────────────────
  const quinMap = {};
  // Inicializar las 24 quincenas del año con presupuesto
  budgets.forEach(r => {
    const qk = `${r._año}-${r._quincena}`;
    if (!quinMap[qk]) quinMap[qk] = { q: r._quincena, año: r._año, presupuesto: 0, gasto: 0, acumuladoP: 0, acumuladoG: 0 };
    quinMap[qk].presupuesto += r._presupuesto;
  });
  // Agregar gastos
  expenses.forEach(r => {
    if (!r._quincena) return;
    const qk = `${r._año}-${r._quincena}`;
    if (!quinMap[qk]) quinMap[qk] = { q: r._quincena, año: r._año, presupuesto: 0, gasto: 0, acumuladoP: 0, acumuladoG: 0 };
    quinMap[qk].gasto += r._monto;
  });

  let accP = 0, accG = 0;
  const quinceналData = Object.values(quinMap)
    .sort((a, b) => {
      if (a.año !== b.año) return String(a.año).localeCompare(String(b.año));
      return parseInt(a.q.replace('Q','')) - parseInt(b.q.replace('Q',''));
    })
    .map(q => {
      accP += q.presupuesto;
      accG += q.gasto;
      const meta = quincenaToLabel(q.q);
      return {
        ...q,
        name:       meta?.short || q.q,
        month:      meta?.month || '',
        half:       meta?.half || 1,
        monthIdx:   meta?.monthIdx ?? 0,
        saldo:      q.presupuesto - q.gasto,
        ejecucion:  q.presupuesto > 0 ? Math.round((q.gasto / q.presupuesto) * 100) : 0,
        acumuladoP: accP,
        acumuladoG: accG,
        status:     q.gasto > q.presupuesto ? 'over' : q.gasto / (q.presupuesto || 1) > 0.85 ? 'warning' : 'ok',
      };
    });

  // ── Por mes (agrupando las 2 quincenas) ───────────────────────────────────────
  const monthMap = {};
  quinceналData.forEach(q => {
    const mk = `${q.año}-${q.monthIdx}`;
    if (!monthMap[mk]) monthMap[mk] = { name: q.month?.substring(0,3) || '', month: q.month, monthIdx: q.monthIdx, año: q.año, presupuesto: 0, gasto: 0 };
    monthMap[mk].presupuesto += q.presupuesto;
    monthMap[mk].gasto       += q.gasto;
  });
  let mAccP = 0, mAccG = 0;
  const monthlyData = Object.values(monthMap)
    .sort((a, b) => a.año !== b.año ? String(a.año).localeCompare(String(b.año)) : a.monthIdx - b.monthIdx)
    .map(m => {
      mAccP += m.presupuesto;
      mAccG += m.gasto;
      return { ...m, saldo: m.presupuesto - m.gasto, acumuladoP: mAccP, acumuladoG: mAccG };
    });

  // ── Por categoría ─────────────────────────────────────────────────────────────
  const catMap = {};
  budgets.forEach(r => {
    const cat = r._categoria;
    if (!catMap[cat]) catMap[cat] = { budget: 0, expenses: 0, items: [] };
    catMap[cat].budget += r._presupuesto;
  });
  expenses.forEach(r => {
    const cat = r._categoria;
    if (!catMap[cat]) catMap[cat] = { budget: 0, expenses: 0, items: [] };
    catMap[cat].expenses += r._monto;
    catMap[cat].items.push(r);
  });

  const categoryData = Object.entries(catMap)
    .map(([name, d]) => ({
      name,
      presupuesto: d.budget,
      gasto:       d.expenses,
      saldo:       d.budget - d.expenses,
      ejecucion:   d.budget > 0 ? Math.round((d.expenses / d.budget) * 100) : 0,
      items:       d.items,
      status:      d.expenses > d.budget ? 'over' : d.expenses / (d.budget || 1) > 0.85 ? 'warning' : 'ok',
    }))
    .sort((a, b) => b.presupuesto - a.presupuesto);

  // ── Por necesidad ─────────────────────────────────────────────────────────────
  const necesidadMap = {};
  expenses.forEach(r => {
    const nec = r._necesidad || 'Moderado';
    if (!necesidadMap[nec]) necesidadMap[nec] = { count: 0, total: 0 };
    necesidadMap[nec].count++;
    necesidadMap[nec].total += r._monto;
  });
  const necesidadData = Object.entries(necesidadMap).map(([name, d]) => ({
    name,
    value:  d.total,
    count:  d.count,
    color:  NECESIDAD_CONFIG[name]?.color || '#8892a4',
    icon:   NECESIDAD_CONFIG[name]?.icon  || '?',
  })).sort((a, b) => (NECESIDAD_CONFIG[b.name]?.score || 0) - (NECESIDAD_CONFIG[a.name]?.score || 0));

  // ── Por establecimiento (top 8) ───────────────────────────────────────────────
  const estMap = {};
  expenses.forEach(r => {
    const est = r._establecimiento;
    if (!estMap[est]) estMap[est] = { total: 0, count: 0, categoria: r._categoria };
    estMap[est].total += r._monto;
    estMap[est].count++;
  });
  const topEstablecimientos = Object.entries(estMap)
    .map(([name, d]) => ({ name, ...d }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 8);

  // ── Transacciones recientes ───────────────────────────────────────────────────
  const recentTransactions = [...expenses]
    .filter(r => r._fecha)
    .sort((a, b) => new Date(b._fecha) - new Date(a._fecha))
    .slice(0, 20)
    .map((r, i) => ({
      id:               i,
      fecha:            r._fecha,
      establecimiento:  r._establecimiento,
      monto:            r._monto,
      categoria:        r._categoria,
      necesidad:        r._necesidad,
      descripcion:      r._descripcion,
      quincena:         r._quincena,
    }));

  // ── Donut distribución ────────────────────────────────────────────────────────
  const donutData = categoryData.filter(c => c.gasto > 0).map(c => ({ name: c.name, value: c.gasto }));

  // ── Quincena actual ───────────────────────────────────────────────────────────
  const currentQ    = dateToQuincena(new Date().toISOString().split('T')[0]);
  const currentQData = quinceналData.find(q => q.q === currentQ) || null;

  return {
    summary: { totalBudget, totalExpenses, remaining, executionRate },
    quinceналData,
    monthlyData,
    categoryData,
    necesidadData,
    topEstablecimientos,
    recentTransactions,
    donutData,
    currentQ,
    currentQData,
  };
};

// ─── MOCK DATA ─────────────────────────────────────────────────────────────────

export const getMockData = () => {
  const year = '2025';

  const budgetRows = [
    // Q1 — Ene 1-15
    { Quincena:'Q1','Año':year, Categoria:'Mercado',     'Presupuesto (USD)':'180' },
    { Quincena:'Q1','Año':year, Categoria:'Transporte',  'Presupuesto (USD)':'60'  },
    { Quincena:'Q1','Año':year, Categoria:'Educación',   'Presupuesto (USD)':'120' },
    { Quincena:'Q1','Año':year, Categoria:'Salud',       'Presupuesto (USD)':'50'  },
    { Quincena:'Q1','Año':year, Categoria:'Ocio',        'Presupuesto (USD)':'80'  },
    { Quincena:'Q1','Año':year, Categoria:'Servicios',   'Presupuesto (USD)':'90'  },
    // Q2 — Ene 16-31
    { Quincena:'Q2','Año':year, Categoria:'Mercado',     'Presupuesto (USD)':'180' },
    { Quincena:'Q2','Año':year, Categoria:'Transporte',  'Presupuesto (USD)':'60'  },
    { Quincena:'Q2','Año':year, Categoria:'Educación',   'Presupuesto (USD)':'120' },
    { Quincena:'Q2','Año':year, Categoria:'Salud',       'Presupuesto (USD)':'50'  },
    { Quincena:'Q2','Año':year, Categoria:'Ocio',        'Presupuesto (USD)':'80'  },
    { Quincena:'Q2','Año':year, Categoria:'Servicios',   'Presupuesto (USD)':'90'  },
    // Q3 — Feb 1-15
    { Quincena:'Q3','Año':year, Categoria:'Mercado',     'Presupuesto (USD)':'180' },
    { Quincena:'Q3','Año':year, Categoria:'Transporte',  'Presupuesto (USD)':'60'  },
    { Quincena:'Q3','Año':year, Categoria:'Educación',   'Presupuesto (USD)':'120' },
    { Quincena:'Q3','Año':year, Categoria:'Salud',       'Presupuesto (USD)':'50'  },
    { Quincena:'Q3','Año':year, Categoria:'Ocio',        'Presupuesto (USD)':'80'  },
    { Quincena:'Q3','Año':year, Categoria:'Servicios',   'Presupuesto (USD)':'90'  },
    // Q4 — Feb 16-28
    { Quincena:'Q4','Año':year, Categoria:'Mercado',     'Presupuesto (USD)':'180' },
    { Quincena:'Q4','Año':year, Categoria:'Transporte',  'Presupuesto (USD)':'60'  },
    { Quincena:'Q4','Año':year, Categoria:'Educación',   'Presupuesto (USD)':'120' },
    { Quincena:'Q4','Año':year, Categoria:'Salud',       'Presupuesto (USD)':'50'  },
    { Quincena:'Q4','Año':year, Categoria:'Ocio',        'Presupuesto (USD)':'80'  },
    { Quincena:'Q4','Año':year, Categoria:'Servicios',   'Presupuesto (USD)':'90'  },
  ];

  const gastoRows = [
    // Q1 — Enero 1-15
    { 'Fecha del Gasto':'2025-01-02', Establecimiento:'Super Xtra',       'Monto (USD)':'42.50',  'Categoria del Gasto':'Mercado',    Necesidad:'Necesario',    Quincena:'Q1', 'Descripcion o Detalles Adicionales':'Compras de la semana - frutas, verduras y lácteos' },
    { 'Fecha del Gasto':'2025-01-04', Establecimiento:'Terpel',           'Monto (USD)':'30.00',  'Categoria del Gasto':'Transporte', Necesidad:'Necesario',    Quincena:'Q1', 'Descripcion o Detalles Adicionales':'Gasolina para la semana' },
    { 'Fecha del Gasto':'2025-01-06', Establecimiento:'Escuela ABC',      'Monto (USD)':'120.00', 'Categoria del Gasto':'Educación',  Necesidad:'Necesario',    Quincena:'Q1', 'Descripcion o Detalles Adicionales':'Mensualidad colegio - hijo' },
    { 'Fecha del Gasto':'2025-01-08', Establecimiento:'Farmacia Cruz',    'Monto (USD)':'18.30',  'Categoria del Gasto':'Salud',      Necesidad:'Necesario',    Quincena:'Q1', 'Descripcion o Detalles Adicionales':'Medicamentos tensión' },
    { 'Fecha del Gasto':'2025-01-10', Establecimiento:'Netflix',          'Monto (USD)':'15.99',  'Categoria del Gasto':'Ocio',       Necesidad:'Moderado',     Quincena:'Q1', 'Descripcion o Detalles Adicionales':'Suscripción mensual Netflix' },
    { 'Fecha del Gasto':'2025-01-11', Establecimiento:'Super Xtra',       'Monto (USD)':'28.75',  'Categoria del Gasto':'Mercado',    Necesidad:'Necesario',    Quincena:'Q1', 'Descripcion o Detalles Adicionales':'Compras mitad de semana' },
    { 'Fecha del Gasto':'2025-01-12', Establecimiento:'Claro',            'Monto (USD)':'45.00',  'Categoria del Gasto':'Servicios',  Necesidad:'Necesario',    Quincena:'Q1', 'Descripcion o Detalles Adicionales':'Plan celular + internet' },
    { 'Fecha del Gasto':'2025-01-14', Establecimiento:'Restaurante El Patio','Monto (USD)':'38.00','Categoria del Gasto':'Ocio',      Necesidad:'Prescindible', Quincena:'Q1', 'Descripcion o Detalles Adicionales':'Almuerzo familiar fin de semana' },
    // Q2 — Enero 16-31
    { 'Fecha del Gasto':'2025-01-17', Establecimiento:'Super Xtra',       'Monto (USD)':'55.20',  'Categoria del Gasto':'Mercado',    Necesidad:'Necesario',    Quincena:'Q2', 'Descripcion o Detalles Adicionales':'Mercado semanal completo' },
    { 'Fecha del Gasto':'2025-01-19', Establecimiento:'Terpel',           'Monto (USD)':'30.00',  'Categoria del Gasto':'Transporte', Necesidad:'Necesario',    Quincena:'Q2', 'Descripcion o Detalles Adicionales':'Gasolina' },
    { 'Fecha del Gasto':'2025-01-22', Establecimiento:'Clínica Santa Fe', 'Monto (USD)':'85.00',  'Categoria del Gasto':'Salud',      Necesidad:'Importante',   Quincena:'Q2', 'Descripcion o Detalles Adicionales':'Consulta médica - control anual' },
    { 'Fecha del Gasto':'2025-01-24', Establecimiento:'Librería Nacional', 'Monto (USD)':'32.00', 'Categoria del Gasto':'Educación',  Necesidad:'Importante',   Quincena:'Q2', 'Descripcion o Detalles Adicionales':'Útiles escolares segundo semestre' },
    { 'Fecha del Gasto':'2025-01-26', Establecimiento:'Cinemark',         'Monto (USD)':'22.00',  'Categoria del Gasto':'Ocio',       Necesidad:'Prescindible', Quincena:'Q2', 'Descripcion o Detalles Adicionales':'Cine en familia - 2 personas' },
    { 'Fecha del Gasto':'2025-01-28', Establecimiento:'EAAB',             'Monto (USD)':'42.00',  'Categoria del Gasto':'Servicios',  Necesidad:'Necesario',    Quincena:'Q2', 'Descripcion o Detalles Adicionales':'Factura agua y alcantarillado' },
    { 'Fecha del Gasto':'2025-01-30', Establecimiento:'Super Xtra',       'Monto (USD)':'38.90',  'Categoria del Gasto':'Mercado',    Necesidad:'Necesario',    Quincena:'Q2', 'Descripcion o Detalles Adicionales':'Compras fin de mes' },
    // Q3 — Feb 1-15
    { 'Fecha del Gasto':'2025-02-02', Establecimiento:'Super Xtra',       'Monto (USD)':'48.60',  'Categoria del Gasto':'Mercado',    Necesidad:'Necesario',    Quincena:'Q3', 'Descripcion o Detalles Adicionales':'Mercado semanal' },
    { 'Fecha del Gasto':'2025-02-04', Establecimiento:'Terpel',           'Monto (USD)':'30.00',  'Categoria del Gasto':'Transporte', Necesidad:'Necesario',    Quincena:'Q3', 'Descripcion o Detalles Adicionales':'Gasolina' },
    { 'Fecha del Gasto':'2025-02-06', Establecimiento:'Escuela ABC',      'Monto (USD)':'120.00', 'Categoria del Gasto':'Educación',  Necesidad:'Necesario',    Quincena:'Q3', 'Descripcion o Detalles Adicionales':'Mensualidad febrero' },
    { 'Fecha del Gasto':'2025-02-08', Establecimiento:'Olimpica',         'Monto (USD)':'25.40',  'Categoria del Gasto':'Mercado',    Necesidad:'Moderado',     Quincena:'Q3', 'Descripcion o Detalles Adicionales':'Artículos de aseo y limpieza' },
    { 'Fecha del Gasto':'2025-02-10', Establecimiento:'Claro',            'Monto (USD)':'45.00',  'Categoria del Gasto':'Servicios',  Necesidad:'Necesario',    Quincena:'Q3', 'Descripcion o Detalles Adicionales':'Plan celular + internet' },
    { 'Fecha del Gasto':'2025-02-12', Establecimiento:'Gym FitLife',      'Monto (USD)':'35.00',  'Categoria del Gasto':'Salud',      Necesidad:'Moderado',     Quincena:'Q3', 'Descripcion o Detalles Adicionales':'Mensualidad gimnasio' },
    { 'Fecha del Gasto':'2025-02-14', Establecimiento:'Restaurante Mar',  'Monto (USD)':'65.00',  'Categoria del Gasto':'Ocio',       Necesidad:'Prescindible', Quincena:'Q3', 'Descripcion o Detalles Adicionales':'Cena especial San Valentín' },
    // Q4 — Feb 16-28
    { 'Fecha del Gasto':'2025-02-17', Establecimiento:'Super Xtra',       'Monto (USD)':'52.10',  'Categoria del Gasto':'Mercado',    Necesidad:'Necesario',    Quincena:'Q4', 'Descripcion o Detalles Adicionales':'Mercado quincenal' },
    { 'Fecha del Gasto':'2025-02-19', Establecimiento:'Terpel',           'Monto (USD)':'30.00',  'Categoria del Gasto':'Transporte', Necesidad:'Necesario',    Quincena:'Q4', 'Descripcion o Detalles Adicionales':'Gasolina' },
    { 'Fecha del Gasto':'2025-02-21', Establecimiento:'EPM',              'Monto (USD)':'68.00',  'Categoria del Gasto':'Servicios',  Necesidad:'Necesario',    Quincena:'Q4', 'Descripcion o Detalles Adicionales':'Factura de energía' },
    { 'Fecha del Gasto':'2025-02-23', Establecimiento:'Farmacia Cruz',    'Monto (USD)':'22.50',  'Categoria del Gasto':'Salud',      Necesidad:'Necesario',    Quincena:'Q4', 'Descripcion o Detalles Adicionales':'Vitaminas y medicamentos' },
    { 'Fecha del Gasto':'2025-02-25', Establecimiento:'Amazon',           'Monto (USD)':'89.99',  'Categoria del Gasto':'Ocio',       Necesidad:'Moderado',     Quincena:'Q4', 'Descripcion o Detalles Adicionales':'Libro + audífonos bluetooth' },
    { 'Fecha del Gasto':'2025-02-27', Establecimiento:'Super Xtra',       'Monto (USD)':'31.80',  'Categoria del Gasto':'Mercado',    Necesidad:'Necesario',    Quincena:'Q4', 'Descripcion o Detalles Adicionales':'Compras del fin de semana' },
  ];

  return processDashboardData(budgetRows, gastoRows);
};
