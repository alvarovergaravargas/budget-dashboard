import React, { useState, useMemo, useRef, useCallback } from 'react';
import { useDashboard } from '../hooks/useDashboard';
import { Header } from '../components/layout/Header';
import { quincenaToLabel } from '../services/googleSheetsService';
import { writeBudgetRow, hasWriteAccess } from '../services/sheetsWriteService';
import { fmt } from '../utils/formatters';
import { useBreakpoint } from '../hooks/useBreakpoint';
import {
  Plus, Check, Trash2, ChevronDown, RefreshCw,
  Settings, AlertCircle, Send,
} from 'lucide-react';

const MONTHS = [
  'Enero','Febrero','Marzo','Abril','Mayo','Junio',
  'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre',
];
const MONTHS_S = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];

const DEFAULT_CATS = [
  'Educación','Mercado','Ocio','Ropa','Salud',
  'Servicios','Tecnología','Transporte','Vivienda',
];

let _uid = 0;
const uid = () => ++_uid;

// ── Setup banner (shown when Apps Script URL is not configured) ────────────────
const SetupBanner = () => (
  <div style={{
    display: 'flex', alignItems: 'flex-start', gap: 12,
    background: 'rgba(245,166,35,0.07)', border: '1px solid rgba(245,166,35,0.25)',
    borderRadius: 12, padding: '14px 18px',
  }}>
    <Settings size={16} color="var(--warn)" style={{ flexShrink: 0, marginTop: 2 }} />
    <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
      <span style={{ color: 'var(--warn)', fontWeight: 600 }}>
        Integración no configurada ·{' '}
      </span>
      Puedes crear y editar el presupuesto localmente. Para sincronizar con Google Sheets,
      configura un Apps Script Web App y añade{' '}
      <code style={{ fontFamily: 'var(--font-mono)', fontSize: 11, background: 'var(--bg-panel)', padding: '1px 5px', borderRadius: 4 }}>
        REACT_APP_APPS_SCRIPT_URL
      </code>{' '}
      a tu{' '}
      <code style={{ fontFamily: 'var(--font-mono)', fontSize: 11, background: 'var(--bg-panel)', padding: '1px 5px', borderRadius: 4 }}>
        .env
      </code>.
      Consulta las instrucciones al final de esta página.
    </div>
  </div>
);

// ── Single budget line item ────────────────────────────────────────────────────
const EntryRow = ({ categoria, descripcion, monto, isPending, status, onDelete }) => (
  <div style={{
    display: 'flex', alignItems: 'center', gap: 8,
    padding: '7px 10px', borderRadius: 8,
    background: isPending ? 'rgba(0,229,160,0.05)' : 'var(--bg-panel)',
    border: `1px solid ${isPending ? 'rgba(0,229,160,0.18)' : 'var(--border)'}`,
  }}>
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{
        fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 600,
        color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
      }}>
        {categoria}
      </div>
      {descripcion && (
        <div style={{
          fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--text-muted)',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {descripcion}
        </div>
      )}
    </div>
    <span style={{
      fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 700, flexShrink: 0,
      color: isPending ? 'var(--accent)' : 'var(--text-secondary)',
    }}>
      {fmt(monto)}
    </span>
    {isPending && status === 'saving' && (
      <RefreshCw size={12} color="var(--warn)" style={{ animation: 'spin 1s linear infinite', flexShrink: 0 }} />
    )}
    {isPending && status === 'saved' && <Check size={12} color="var(--accent)" style={{ flexShrink: 0 }} />}
    {isPending && status === 'error' && <AlertCircle size={12} color="var(--danger)" style={{ flexShrink: 0 }} />}
    {isPending && !status && onDelete && (
      <button
        onClick={onDelete}
        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, color: 'var(--text-muted)', display: 'flex', flexShrink: 0 }}
      >
        <Trash2 size={12} />
      </button>
    )}
  </div>
);

// ── Form to add a new budget item ─────────────────────────────────────────────
const AddEntryForm = ({ categories, onAdd, onCancel }) => {
  const [cat, setCat]         = useState(categories[0] || '');
  const [customCat, setCustom] = useState('');
  const [desc, setDesc]       = useState('');
  const [monto, setMonto]     = useState('');

  const isCustom = cat === '__nuevo__';
  const finalCat = isCustom ? customCat.trim() : cat;
  const isValid  = finalCat.length > 0 && parseFloat(monto) > 0;

  const inputStyle = {
    background: 'var(--bg-base)', border: '1px solid var(--border)', borderRadius: 8,
    padding: '8px 10px', color: 'var(--text-primary)', fontFamily: 'var(--font-body)',
    fontSize: 12, width: '100%', outline: 'none',
  };

  const submit = (e) => {
    e.preventDefault();
    if (!isValid) return;
    onAdd({ categoria: finalCat, descripcion: desc.trim(), monto: parseFloat(monto) });
    setCat(categories[0] || '');
    setCustom('');
    setDesc('');
    setMonto('');
  };

  return (
    <form onSubmit={submit} style={{
      background: 'rgba(0,229,160,0.04)', border: '1px solid rgba(0,229,160,0.15)',
      borderRadius: 10, padding: 12, display: 'flex', flexDirection: 'column', gap: 8,
    }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 100px', gap: 8 }}>
        <select value={cat} onChange={e => setCat(e.target.value)} style={inputStyle}>
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
          <option value="__nuevo__">+ Nueva categoría</option>
        </select>
        <input
          type="number" min="0.01" step="0.01" placeholder="Monto"
          value={monto} onChange={e => setMonto(e.target.value)}
          style={{ ...inputStyle, fontFamily: 'var(--font-mono)' }}
        />
      </div>
      {isCustom && (
        <input
          type="text" placeholder="Nombre de categoría"
          value={customCat} onChange={e => setCustom(e.target.value)}
          style={inputStyle} autoFocus
        />
      )}
      <input
        type="text" placeholder="Descripción (opcional)"
        value={desc} onChange={e => setDesc(e.target.value)}
        style={inputStyle}
      />
      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
        <button type="button" onClick={onCancel} style={{
          padding: '6px 12px', borderRadius: 7, border: '1px solid var(--border)',
          background: 'transparent', color: 'var(--text-muted)', fontSize: 12,
          fontFamily: 'var(--font-body)', cursor: 'pointer',
        }}>
          Cancelar
        </button>
        <button type="submit" disabled={!isValid} style={{
          padding: '6px 16px', borderRadius: 7, border: 'none',
          background: isValid ? 'var(--accent)' : 'var(--bg-panel)',
          color: isValid ? '#080c18' : 'var(--text-muted)',
          fontSize: 12, fontWeight: 600, fontFamily: 'var(--font-body)',
          cursor: isValid ? 'pointer' : 'default',
        }}>
          Agregar
        </button>
      </div>
    </form>
  );
};

// ── Panel for a single quincena (Q1 or Q2 within a month) ────────────────────
const QuincenaPanel = ({ quincena, existing, pending, categories, onAdd, onDelete }) => {
  const [showForm, setShowForm] = useState(false);
  const meta = quincenaToLabel(quincena);

  const totalExisting = existing.reduce((s, b) => s + b._presupuesto, 0);
  const totalPending  = pending.reduce((s, e) => s + e.monto, 0);
  const total = totalExisting + totalPending;

  const handleAdd = (entry) => { onAdd(entry); setShowForm(false); };

  return (
    <div style={{
      background: 'var(--bg-card)', border: '1px solid var(--border)',
      borderRadius: 14, padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 10,
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
        <div>
          <div style={{
            fontFamily: 'var(--font-body)', fontSize: 10, fontWeight: 600,
            letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 3,
          }}>
            {quincena}
          </div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>
            {meta?.half === 1 ? '1 — 15' : '16 — 31'}
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{
            fontFamily: 'var(--font-mono)', fontSize: 18, fontWeight: 700, lineHeight: 1,
            color: total > 0 ? 'var(--accent)' : 'var(--text-muted)',
          }}>
            {fmt(total)}
          </div>
          <div style={{ fontFamily: 'var(--font-body)', fontSize: 10, color: 'var(--text-muted)', marginTop: 3 }}>
            {existing.length + pending.length} ítem{existing.length + pending.length !== 1 ? 's' : ''}
          </div>
        </div>
      </div>

      {/* Existing entries from Google Sheets */}
      {existing.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          <div style={{
            fontFamily: 'var(--font-body)', fontSize: 10, fontWeight: 600,
            letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-muted)',
          }}>
            En Google Sheets
          </div>
          {existing.map((b, i) => (
            <EntryRow
              key={i}
              categoria={b._categoria}
              descripcion={b['Comentario'] || b['Descripcion'] || b['Descripción'] || ''}
              monto={b._presupuesto}
            />
          ))}
        </div>
      )}

      {/* Pending (local) entries */}
      {pending.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          <div style={{
            fontFamily: 'var(--font-body)', fontSize: 10, fontWeight: 600,
            letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--accent)',
          }}>
            Nuevas entradas
          </div>
          {pending.map(e => (
            <EntryRow
              key={e._id}
              categoria={e.categoria}
              descripcion={e.descripcion}
              monto={e.monto}
              isPending
              status={e._status}
              onDelete={!e._status ? () => onDelete(e._id) : undefined}
            />
          ))}
        </div>
      )}

      {/* Add form or button */}
      {showForm
        ? <AddEntryForm categories={categories} onAdd={handleAdd} onCancel={() => setShowForm(false)} />
        : (
          <button
            onClick={() => setShowForm(true)}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              padding: '8px', borderRadius: 8, border: '1px dashed var(--border)',
              background: 'transparent', color: 'var(--text-muted)', fontSize: 12,
              fontFamily: 'var(--font-body)', cursor: 'pointer',
            }}
            onMouseOver={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.color = 'var(--accent)'; }}
            onMouseOut={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-muted)'; }}
          >
            <Plus size={13} /> Agregar ítem
          </button>
        )
      }
    </div>
  );
};

// ── Apps Script setup guide ────────────────────────────────────────────────────
const SetupGuide = () => (
  <div style={{
    background: 'var(--bg-card)', border: '1px solid var(--border)',
    borderRadius: 14, padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 14,
  }}>
    <div style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>
      Configurar integración con Google Sheets (Apps Script)
    </div>
    <ol style={{ paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 6, margin: 0 }}>
      {[
        'Abre tu Google Sheet → Extensiones → Apps Script',
        'Elimina el código existente y pega el script de abajo',
        'Clic en Implementar → Nueva implementación → Aplicación web',
        'Ejecutar como: Yo · Quién tiene acceso: Cualquier usuario',
        'Copia la URL de la aplicación generada',
        'Añade REACT_APP_APPS_SCRIPT_URL=<url> a tu .env y en Netlify → Environment variables',
        'Redespliega la app en Netlify para que tome la nueva variable',
      ].map((step, i) => (
        <li key={i} style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
          {step}
        </li>
      ))}
    </ol>
    <pre style={{
      margin: 0, padding: '16px', borderRadius: 10,
      background: 'var(--bg-panel)', border: '1px solid var(--border)',
      fontFamily: 'var(--font-mono)', fontSize: 11, color: '#7ee8b5',
      overflowX: 'auto', lineHeight: 1.7,
    }}>{`function doGet(e) {
  try {
    const p = e.parameter;
    const sheet = SpreadsheetApp
      .getActiveSpreadsheet()
      .getSheetByName('Presupuesto');
    // Columnas: A:Quincena | B:Fecha | C:# | D:Año | E:Categoria | F:Presupuesto (USD) | G:Comentario
    sheet.appendRow([
      p.quincena,         // A: Quincena
      p.periodo,          // B: Fecha
      '',                 // C: # (vacío)
      p.año,              // D: Año
      p.categoria,        // E: Categoria
      Number(p.monto),    // F: Presupuesto (USD)
      p.descripcion || '' // G: Comentario
    ]);
    return ContentService
      .createTextOutput(JSON.stringify({ ok: true }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ error: String(err) }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}`}</pre>
    <div style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.5 }}>
      Nota: la columna <strong style={{ color: 'var(--text-secondary)' }}>Descripcion</strong> se añadirá
      como 6ª columna en la pestaña Presupuesto. No afecta el cálculo del dashboard.
    </div>
  </div>
);

// ── Main page ─────────────────────────────────────────────────────────────────
export const BudgetPlannerPage = ({ onNavigate }) => {
  const { data, loading, isDemo, lastSync, refresh } = useDashboard();
  const { isMobile } = useBreakpoint();

  const thisYear = new Date().getFullYear();
  const [year, setYear]           = useState(thisYear);
  const [openMonth, setOpenMonth] = useState(null);     // monthIdx 0-11, or null
  const [pending, setPending]     = useState({});        // { 'Q1': [entry…] }
  const [saving, setSaving]       = useState(false);
  const panelRef = useRef(null);

  // Budget rows filtered by selected year
  const allBudgets = useMemo(
    () => (data?.allBudgets || []).filter(b => b._año === String(year)),
    [data, year]
  );

  // Merged category list from existing data + defaults
  const categories = useMemo(() => {
    const fromData = (data?.allBudgets || []).map(b => b._categoria).filter(Boolean);
    return [...new Set([...fromData, ...DEFAULT_CATS])].sort();
  }, [data]);

  // Per-month summary (for compact cards)
  const monthSummary = useMemo(() => MONTHS.map((_, idx) => {
    const q1 = `Q${idx * 2 + 1}`;
    const q2 = `Q${idx * 2 + 2}`;
    const existing = allBudgets.filter(b => b._quincena === q1 || b._quincena === q2);
    const pend     = [...(pending[q1] || []), ...(pending[q2] || [])];
    const totalBudget    = existing.reduce((s, b) => s + b._presupuesto, 0) + pend.reduce((s, e) => s + e.monto, 0);
    const unsavedCount   = pend.filter(e => !e._status || e._status === 'error').length;
    return { q1, q2, totalBudget, itemCount: existing.length + pend.length, unsavedCount };
  }), [allBudgets, pending]);

  const toggleMonth = (idx) => {
    setOpenMonth(prev => prev === idx ? null : idx);
    setTimeout(() => panelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 80);
  };

  const addEntry = useCallback((quincena, entry) => {
    setPending(prev => ({
      ...prev,
      [quincena]: [...(prev[quincena] || []), { ...entry, _id: uid() }],
    }));
  }, []);

  const deleteEntry = useCallback((quincena, id) => {
    setPending(prev => ({
      ...prev,
      [quincena]: (prev[quincena] || []).filter(e => e._id !== id),
    }));
  }, []);

  const saveMonth = async (monthIdx) => {
    if (!hasWriteAccess()) {
      alert('Configura REACT_APP_APPS_SCRIPT_URL en tu .env para guardar en Google Sheets.\nVe las instrucciones al final de la página.');
      return;
    }
    const q1 = `Q${monthIdx * 2 + 1}`;
    const q2 = `Q${monthIdx * 2 + 2}`;
    const toSave = [
      ...(pending[q1] || []).filter(e => !e._status).map(e => ({ ...e, _q: q1 })),
      ...(pending[q2] || []).filter(e => !e._status).map(e => ({ ...e, _q: q2 })),
    ];
    if (!toSave.length) return;

    setSaving(true);

    // Mark all as saving
    setPending(prev => {
      const next = { ...prev };
      [q1, q2].forEach(q => {
        if (next[q]) next[q] = next[q].map(e => e._status ? e : { ...e, _status: 'saving' });
      });
      return next;
    });

    const results = await Promise.allSettled(
      toSave.map(e => {
        const meta = quincenaToLabel(e._q);
        return writeBudgetRow({
          quincena:    e._q,
          periodo:     meta?.short || e._q,
          año:         String(year),
          categoria:   e.categoria,
          monto:       e.monto,
          descripcion: e.descripcion || '',
        });
      })
    );

    // Update status per entry
    const statusMap = {};
    toSave.forEach((e, i) => {
      statusMap[e._id] = results[i].status === 'fulfilled' ? 'saved' : 'error';
    });

    setPending(prev => {
      const next = { ...prev };
      [q1, q2].forEach(q => {
        if (next[q]) next[q] = next[q].map(e => statusMap[e._id] ? { ...e, _status: statusMap[e._id] } : e);
      });
      return next;
    });

    const allOk = results.every(r => r.status === 'fulfilled');
    if (allOk) {
      setTimeout(() => {
        setPending(prev => {
          const next = { ...prev };
          [q1, q2].forEach(q => {
            if (next[q]) next[q] = next[q].filter(e => e._status !== 'saved');
          });
          return next;
        });
        refresh();
      }, 1800);
    }

    setSaving(false);
  };

  // Data for the currently open month's expanded panel
  const openMonthData = openMonth !== null ? (() => {
    const { q1, q2, unsavedCount } = monthSummary[openMonth];
    return {
      q1, q2,
      q1Existing: allBudgets.filter(b => b._quincena === q1),
      q2Existing: allBudgets.filter(b => b._quincena === q2),
      q1Pending:  pending[q1] || [],
      q2Pending:  pending[q2] || [],
      hasPending: unsavedCount > 0,
    };
  })() : null;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)' }}>
      <Header
        lastSync={lastSync} isDemo={isDemo} onRefresh={refresh} loading={loading}
        activePage="planner" onNavigate={onNavigate}
      />

      <main className="dash-main">
        {/* ── Page title + year selector ─────────────────────────────────────── */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{
              fontFamily: 'var(--font-display)', fontSize: isMobile ? 22 : 28, fontWeight: 800,
              color: 'var(--text-primary)', letterSpacing: '-0.02em', margin: 0,
            }}>
              Planificador de Presupuesto
            </h1>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
              Define el presupuesto quincenal por mes · sincroniza con Google Sheets
            </p>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            {[thisYear - 1, thisYear, thisYear + 1].map(y => (
              <button key={y} onClick={() => setYear(y)} style={{
                padding: '6px 14px', borderRadius: 99, fontSize: 12,
                fontFamily: 'var(--font-mono)', fontWeight: 600, cursor: 'pointer',
                border: '1px solid', transition: 'all 0.15s',
                background: year === y ? 'rgba(0,229,160,0.15)' : 'transparent',
                borderColor: year === y ? 'var(--accent)' : 'var(--border)',
                color: year === y ? 'var(--accent)' : 'var(--text-muted)',
              }}>{y}</button>
            ))}
          </div>
        </div>

        {!hasWriteAccess() && <SetupBanner />}

        {loading && (
          <div style={{ textAlign: 'center', padding: '40px 0', fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--text-muted)' }}>
            Cargando datos…
          </div>
        )}

        {!loading && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {/* ── Month card grid ───────────────────────────────────────────── */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? 'repeat(2,1fr)' : 'repeat(4,1fr)',
              gap: 10,
            }}>
              {MONTHS.map((name, idx) => {
                const { totalBudget, itemCount, unsavedCount } = monthSummary[idx];
                const isOpen = openMonth === idx;
                return (
                  <button
                    key={idx}
                    onClick={() => toggleMonth(idx)}
                    style={{
                      background: isOpen ? 'rgba(0,229,160,0.07)' : 'var(--bg-card)',
                      border: `1px solid ${isOpen ? 'rgba(0,229,160,0.4)' : 'var(--border)'}`,
                      borderRadius: 14, padding: '14px 16px', cursor: 'pointer',
                      textAlign: 'left', transition: 'all 0.15s',
                      display: 'flex', flexDirection: 'column', gap: 6,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{
                        fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 800,
                        color: isOpen ? 'var(--accent)' : 'var(--text-primary)',
                      }}>
                        {isMobile ? MONTHS_S[idx] : name}
                      </span>
                      <ChevronDown
                        size={14}
                        color={isOpen ? 'var(--accent)' : 'var(--text-muted)'}
                        style={{ transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}
                      />
                    </div>
                    <div style={{
                      fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 700,
                      color: totalBudget > 0 ? 'var(--text-secondary)' : 'var(--text-muted)',
                    }}>
                      {totalBudget > 0 ? fmt(totalBudget) : '—'}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                      {itemCount > 0 && (
                        <span style={{ fontFamily: 'var(--font-body)', fontSize: 10, color: 'var(--text-muted)' }}>
                          {itemCount} ítem{itemCount !== 1 ? 's' : ''}
                        </span>
                      )}
                      {unsavedCount > 0 && (
                        <span style={{
                          fontFamily: 'var(--font-body)', fontSize: 10, fontWeight: 600,
                          color: 'var(--warn)', background: 'rgba(245,166,35,0.1)',
                          border: '1px solid rgba(245,166,35,0.2)', borderRadius: 99, padding: '1px 7px',
                        }}>
                          {unsavedCount} sin guardar
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* ── Expanded month detail panel ───────────────────────────────── */}
            {openMonthData && (
              <div
                ref={panelRef}
                style={{
                  background: 'var(--bg-panel)', border: '1px solid rgba(0,229,160,0.2)',
                  borderRadius: 16, padding: isMobile ? '16px 14px' : '22px 24px',
                  display: 'flex', flexDirection: 'column', gap: 16,
                }}
              >
                {/* Panel header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
                  <div>
                    <div style={{
                      fontFamily: 'var(--font-display)', fontSize: isMobile ? 17 : 20,
                      fontWeight: 800, color: 'var(--accent)', letterSpacing: '-0.01em',
                    }}>
                      {MONTHS[openMonth]} {year}
                    </div>
                    <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                      {openMonthData.q1} · días 1-15 &nbsp;·&nbsp; {openMonthData.q2} · días 16-31
                    </div>
                  </div>
                  {openMonthData.hasPending && (
                    <button
                      onClick={() => saveMonth(openMonth)}
                      disabled={saving}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 7,
                        padding: '9px 20px', borderRadius: 9, border: 'none',
                        background: 'var(--accent)', color: '#080c18',
                        fontSize: 13, fontWeight: 700, fontFamily: 'var(--font-body)',
                        cursor: saving ? 'default' : 'pointer', opacity: saving ? 0.7 : 1,
                        transition: 'opacity 0.15s',
                      }}
                    >
                      {saving
                        ? <><RefreshCw size={14} style={{ animation: 'spin 1s linear infinite' }} /> Guardando…</>
                        : <><Send size={14} /> Guardar en Sheets</>
                      }
                    </button>
                  )}
                </div>

                {/* Q1 + Q2 side by side */}
                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 16 }}>
                  <QuincenaPanel
                    quincena={openMonthData.q1}
                    existing={openMonthData.q1Existing}
                    pending={openMonthData.q1Pending}
                    categories={categories}
                    onAdd={e => addEntry(openMonthData.q1, e)}
                    onDelete={id => deleteEntry(openMonthData.q1, id)}
                  />
                  <QuincenaPanel
                    quincena={openMonthData.q2}
                    existing={openMonthData.q2Existing}
                    pending={openMonthData.q2Pending}
                    categories={categories}
                    onAdd={e => addEntry(openMonthData.q2, e)}
                    onDelete={id => deleteEntry(openMonthData.q2, id)}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Apps Script setup guide ────────────────────────────────────────── */}
        {!hasWriteAccess() && <SetupGuide />}
      </main>
    </div>
  );
};

export default BudgetPlannerPage;
