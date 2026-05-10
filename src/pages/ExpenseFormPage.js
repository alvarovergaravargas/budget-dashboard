import React, { useState, useMemo, useRef, useCallback } from 'react';
import { useDashboard } from '../hooks/useDashboard';
import { Header } from '../components/layout/Header';
import { dateToQuincena, NECESIDAD_CONFIG } from '../services/googleSheetsService';
import { writeExpenseRow, writeExpenseViaScript, hasWriteAccess } from '../services/sheetsWriteService';
import { uploadInvoice } from '../services/googleDriveService';
import { useGoogleAuth, hasOAuthAccess } from '../hooks/useGoogleAuth';
import { fmt } from '../utils/formatters';
import { useBreakpoint } from '../hooks/useBreakpoint';
import {
  Upload, Check, AlertCircle, ExternalLink, Plus,
  FileText, X, RefreshCw,
} from 'lucide-react';

const today = new Date().toISOString().split('T')[0];

const DEFAULT_CATS = [
  'Educación', 'Mercado', 'Ocio', 'Ropa', 'Salud',
  'Servicios', 'Tecnología', 'Transporte', 'Vivienda',
];

const NECESIDAD_ORDER = ['Necesario', 'Importante', 'Moderado', 'Prescindible'];

const INP = {
  background:   'var(--bg-panel)',
  border:       '1px solid var(--border)',
  borderRadius: 10,
  padding:      '11px 14px',
  color:        'var(--text-primary)',
  fontFamily:   'var(--font-body)',
  fontSize:     14,
  width:        '100%',
  outline:      'none',
};

// ── Labelled form field ───────────────────────────────────────────────────────
const Field = ({ label, hint, children }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
    <label style={{
      fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 600,
      letterSpacing: '0.07em', textTransform: 'uppercase', color: 'var(--text-muted)',
    }}>
      {label}
    </label>
    {children}
    {hint && (
      <span style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.4 }}>
        {hint}
      </span>
    )}
  </div>
);

// ── Necesidad chip grid ────────────────────────────────────────────────────────
const NecesidadPicker = ({ value, onChange }) => (
  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 8 }}>
    {NECESIDAD_ORDER.map(nec => {
      const cfg    = NECESIDAD_CONFIG[nec];
      const active = value === nec;
      return (
        <button
          key={nec}
          type="button"
          onClick={() => onChange(nec)}
          style={{
            padding: '9px 12px', borderRadius: 9, cursor: 'pointer',
            border:      `1px solid ${active ? cfg.color : 'var(--border)'}`,
            background:  active ? `${cfg.color}18` : 'transparent',
            color:       active ? cfg.color : 'var(--text-muted)',
            fontFamily:  'var(--font-body)', fontSize: 12,
            fontWeight:  active ? 700 : 400,
            transition:  'all 0.15s',
            display:     'flex', alignItems: 'center', gap: 7,
          }}
        >
          <span style={{ fontSize: 13 }}>{cfg.icon}</span>
          {nec}
        </button>
      );
    })}
  </div>
);

// ── File drop zone ────────────────────────────────────────────────────────────
const FileZone = ({ file, preview, onFile, onClear }) => {
  const inputRef  = useRef();
  const [drag, setDrag] = useState(false);

  const pick = (f) => { if (f) onFile(f); };

  if (file) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: 12, borderRadius: 10,
        border: '1px solid rgba(0,229,160,0.3)', background: 'rgba(0,229,160,0.05)',
      }}>
        {preview
          ? <img src={preview} alt="preview" style={{ width: 60, height: 60, objectFit: 'cover', borderRadius: 8, flexShrink: 0 }} />
          : (
            <div style={{ width: 60, height: 60, borderRadius: 8, background: 'var(--bg-panel)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <FileText size={26} color="var(--text-muted)" />
            </div>
          )
        }
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {file.name}
          </div>
          <div style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--text-muted)', marginTop: 3 }}>
            {(file.size / 1024).toFixed(0)} KB · {(file.type.split('/')[1] || 'archivo').toUpperCase()}
          </div>
        </div>
        <button onClick={onClear} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: 'var(--text-muted)', flexShrink: 0, display: 'flex' }}>
          <X size={16} />
        </button>
      </div>
    );
  }

  return (
    <div
      onClick={() => inputRef.current?.click()}
      onDragOver={e => { e.preventDefault(); setDrag(true); }}
      onDragLeave={() => setDrag(false)}
      onDrop={e => { e.preventDefault(); setDrag(false); pick(e.dataTransfer.files[0]); }}
      style={{
        border:        `1.5px dashed ${drag ? 'var(--accent)' : 'var(--border)'}`,
        borderRadius:  10,
        padding:       '22px 16px',
        display:       'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
        cursor:        'pointer', transition: 'all 0.15s',
        background:    drag ? 'rgba(0,229,160,0.04)' : 'transparent',
      }}
    >
      <Upload size={22} color={drag ? 'var(--accent)' : 'var(--text-muted)'} />
      <div style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--text-secondary)', textAlign: 'center', lineHeight: 1.5 }}>
        Arrastra la foto o PDF de la factura
        <br />
        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>o haz clic para seleccionar · JPG, PNG, PDF</span>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*,.pdf"
        style={{ display: 'none' }}
        onChange={e => pick(e.target.files[0])}
      />
    </div>
  );
};

// ── Success card ───────────────────────────────────────────────────────────────
const SuccessCard = ({ entry, driveUrl, onNew }) => (
  <div style={{
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 22,
    padding: '44px 28px', background: 'var(--bg-card)',
    border: '1px solid rgba(0,229,160,0.25)', borderRadius: 20,
  }}>
    <div style={{
      width: 60, height: 60, borderRadius: '50%',
      background: 'rgba(0,229,160,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <Check size={30} color="var(--accent)" />
    </div>

    <div style={{ textAlign: 'center' }}>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 800, color: 'var(--accent)', marginBottom: 4 }}>
        Gasto registrado
      </div>
      <div style={{ fontFamily: 'var(--font-body)', fontSize: 15, color: 'var(--text-secondary)' }}>
        {entry.establecimiento}
      </div>
    </div>

    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%', maxWidth: 340 }}>
      {[
        ['Monto',     fmt(entry.monto)],
        ['Fecha',     entry.fecha],
        ['Categoría', entry.categoria],
        ['Necesidad', entry.necesidad],
        ['Quincena',  entry.quincena],
      ].map(([k, v]) => (
        <div key={k} style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 7, borderBottom: '1px solid var(--border)' }}>
          <span style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--text-muted)' }}>{k}</span>
          <span style={{ fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>{v}</span>
        </div>
      ))}
    </div>

    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, width: '100%', maxWidth: 340 }}>
      {driveUrl && (
        <a
          href={driveUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'flex', alignItems: 'center', gap: 7,
            padding: '9px 18px', borderRadius: 9, width: '100%', justifyContent: 'center',
            border: '1px solid rgba(0,229,160,0.3)', color: 'var(--accent)',
            fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 600, textDecoration: 'none',
          }}
        >
          <ExternalLink size={14} /> Ver factura en Drive
        </a>
      )}
      <button
        onClick={onNew}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
          padding: '10px 24px', borderRadius: 10, border: 'none', width: '100%',
          background: 'var(--accent)', color: '#080c18',
          fontSize: 14, fontWeight: 700, fontFamily: 'var(--font-body)', cursor: 'pointer',
        }}
      >
        <Plus size={16} /> Registrar otro gasto
      </button>
    </div>
  </div>
);

// ── Apps Script update guide ───────────────────────────────────────────────────
const ScriptGuide = () => (
  <div style={{
    background: 'var(--bg-card)', border: '1px solid var(--border)',
    borderRadius: 14, padding: '18px 22px', display: 'flex', flexDirection: 'column', gap: 12,
  }}>
    <div style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>
      Actualizar Apps Script para habilitar registro sin OAuth
    </div>
    <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
      Reemplaza tu script actual por este (maneja tanto Presupuesto como Gastos). Luego crea una
      <strong style={{ color: 'var(--text-primary)' }}> nueva implementación</strong> para que aplique.
    </div>
    <pre style={{
      margin: 0, padding: '14px 16px', borderRadius: 10,
      background: 'var(--bg-panel)', border: '1px solid var(--border)',
      fontFamily: 'var(--font-mono)', fontSize: 10, color: '#7ee8b5',
      overflowX: 'auto', lineHeight: 1.7,
    }}>{`function doGet(e) {
  const p = e.parameter;
  return p.type === 'expense' ? writeExpense(p) : writeBudget(p);
}

function writeBudget(p) {
  const s = SpreadsheetApp.getActiveSpreadsheet()
    .getSheetByName('Presupuesto');
  s.appendRow([p.quincena, p.periodo, '', p.año,
               p.categoria, Number(p.monto), p.descripcion || '']);
  return ok();
}

function writeExpense(p) {
  const s = SpreadsheetApp.getActiveSpreadsheet()
    .getSheetByName('Gastos');
  s.appendRow([
    new Date().toLocaleString('es-CO'), // Timestamp
    p.fecha,
    p.establecimiento,
    Number(p.monto),
    p.categoria,
    p.necesidad,
    p.descripcion || '',
    p.archivo     || '',  // Carga de Archivo
    p.quincena
  ]);
  return ok();
}

function ok() {
  return ContentService
    .createTextOutput(JSON.stringify({ ok: true }))
    .setMimeType(ContentService.MimeType.JSON);
}`}</pre>
  </div>
);

// ── OAuth setup guide ─────────────────────────────────────────────────────────
const OAuthGuide = () => (
  <div style={{
    display: 'flex', gap: 12, alignItems: 'flex-start',
    background: 'rgba(59,130,246,0.07)', border: '1px solid rgba(59,130,246,0.25)',
    borderRadius: 12, padding: '14px 18px',
  }}>
    <AlertCircle size={16} color="var(--blue)" style={{ flexShrink: 0, marginTop: 2 }} />
    <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
      <strong style={{ color: 'var(--blue)' }}>Para subir archivos a Drive</strong> necesitas un{' '}
      <strong>Client ID de OAuth2</strong>. Ve a Google Cloud Console → Credenciales →
      Crear credencial → ID de cliente de OAuth → Aplicación web. Agrega tu dominio en
      "Orígenes de JavaScript autorizados" y copia el Client ID en{' '}
      <code style={{ fontFamily: 'var(--font-mono)', fontSize: 11, background: 'var(--bg-panel)', padding: '1px 5px', borderRadius: 4 }}>
        REACT_APP_GOOGLE_CLIENT_ID
      </code>{' '}
      (en <code style={{ fontFamily: 'var(--font-mono)', fontSize: 11, background: 'var(--bg-panel)', padding: '1px 5px', borderRadius: 4 }}>.env</code> y en Netlify).
    </div>
  </div>
);

// ── Main page ─────────────────────────────────────────────────────────────────
export const ExpenseFormPage = ({ onNavigate }) => {
  const { data, isDemo, lastSync, loading, refresh } = useDashboard();
  const { isMobile } = useBreakpoint();
  const { accessToken, getToken } = useGoogleAuth();

  const categories = useMemo(() => {
    const fromData = (data?.allBudgets || []).map(b => b._categoria).filter(Boolean);
    return [...new Set([...fromData, ...DEFAULT_CATS])].sort();
  }, [data]);

  const establecimientos = useMemo(() => {
    const fromData = (data?.allTransactions || []).map(t => t.establecimiento).filter(Boolean);
    return [...new Set(fromData)].sort();
  }, [data]);

  const [form, setForm] = useState({
    fecha:           today,
    establecimiento: '',
    monto:           '',
    categoria:       '',
    necesidad:       'Necesario',
    descripcion:     '',
  });
  const [file,        setFile]        = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [status,      setStatus]      = useState('idle'); // idle | uploading | saving | success | error
  const [errorMsg,    setErrorMsg]    = useState('');
  const [savedEntry,  setSavedEntry]  = useState(null);
  const [driveUrl,    setDriveUrl]    = useState(null);

  const quincena = useMemo(() => dateToQuincena(form.fecha) || '—', [form.fecha]);

  const set = useCallback((k, v) => setForm(f => ({ ...f, [k]: v })), []);

  const handleFile = useCallback((f) => {
    setFile(f);
    if (f.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = ev => setFilePreview(ev.target.result);
      reader.readAsDataURL(f);
    } else {
      setFilePreview(null);
    }
  }, []);

  const clearFile = useCallback(() => { setFile(null); setFilePreview(null); }, []);

  const reset = () => {
    setForm({ fecha: today, establecimiento: '', monto: '', categoria: '', necesidad: 'Necesario', descripcion: '' });
    setFile(null); setFilePreview(null);
    setStatus('idle'); setErrorMsg('');
    setSavedEntry(null); setDriveUrl(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const monto = parseFloat(form.monto);
    if (!form.establecimiento.trim() || !monto || !form.categoria) return;

    setStatus('saving');
    setErrorMsg('');
    let archivoUrl = '';

    try {
      // Step 1 — upload file to Drive (requires OAuth)
      if (file) {
        setStatus('uploading');
        const token = await getToken();           // triggers OAuth popup if needed
        archivoUrl  = await uploadInvoice(file, token, {
          fecha:           form.fecha,
          establecimiento: form.establecimiento,
        });
        setDriveUrl(archivoUrl);
        setStatus('saving');
      }

      // Step 2 — write expense row
      const payload = {
        fecha:           form.fecha,
        establecimiento: form.establecimiento.trim(),
        monto,
        categoria:       form.categoria,
        necesidad:       form.necesidad,
        descripcion:     form.descripcion.trim(),
        archivoUrl,
        quincena,
      };

      // If we already have an OAuth token (from the upload), use Sheets API directly.
      // Otherwise fall back to Apps Script GET (no file in this path).
      const token = accessToken;
      if (token) {
        await writeExpenseRow(token, payload);
      } else if (hasWriteAccess()) {
        await writeExpenseViaScript(payload);
      } else {
        throw new Error('No hay método de escritura configurado. Configura REACT_APP_APPS_SCRIPT_URL o REACT_APP_GOOGLE_CLIENT_ID.');
      }

      setSavedEntry({ ...payload });
      setStatus('success');
    } catch (err) {
      setErrorMsg(err.message || 'Error desconocido');
      setStatus('saving'); // reset to allow retry
      setStatus('error');
    }
  };

  const isBusy  = status === 'uploading' || status === 'saving';
  const isValid = form.establecimiento.trim() && parseFloat(form.monto) > 0 && form.categoria;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)' }}>
      <Header
        lastSync={lastSync} isDemo={isDemo} onRefresh={refresh} loading={loading}
        activePage="expenses" onNavigate={onNavigate}
      />

      <main className="dash-main" style={{ maxWidth: 680 }}>
        {/* ── Page title ──────────────────────────────────────────────────── */}
        <div>
          <h1 style={{
            fontFamily: 'var(--font-display)', fontSize: isMobile ? 22 : 28,
            fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em', margin: 0,
          }}>
            Registrar Factura
          </h1>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
            Registra el gasto y adjunta la foto o PDF de la factura · se guarda en Google Drive
          </p>
        </div>

        {/* ── Success state ────────────────────────────────────────────────── */}
        {status === 'success' && savedEntry ? (
          <SuccessCard entry={savedEntry} driveUrl={driveUrl} onNew={reset} />
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* ── Main form card ─────────────────────────────────────────── */}
            <div style={{
              background: 'var(--bg-card)', border: '1px solid var(--border)',
              borderRadius: 20, padding: isMobile ? '20px 16px' : '28px 32px',
              display: 'flex', flexDirection: 'column', gap: 22,
            }}>

              {/* Fecha + Monto */}
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 140px', gap: 16 }}>
                <Field label="Fecha del Gasto">
                  <input
                    type="date" value={form.fecha}
                    onChange={e => set('fecha', e.target.value)}
                    style={INP} required
                  />
                </Field>
                <Field label="Monto (USD)">
                  <input
                    type="number" min="0.01" step="0.01" placeholder="0.00"
                    value={form.monto} onChange={e => set('monto', e.target.value)}
                    style={{ ...INP, fontFamily: 'var(--font-mono)' }} required
                  />
                </Field>
              </div>

              {/* Establecimiento (con autocomplete desde histórico) */}
              <Field label="Establecimiento">
                <input
                  type="text"
                  list="est-list"
                  placeholder="Supermercado, restaurante, farmacia…"
                  value={form.establecimiento}
                  onChange={e => set('establecimiento', e.target.value)}
                  style={INP}
                  required
                />
                <datalist id="est-list">
                  {establecimientos.map(e => <option key={e} value={e} />)}
                </datalist>
              </Field>

              {/* Categoría */}
              <Field label="Categoría del Gasto">
                <select
                  value={form.categoria}
                  onChange={e => set('categoria', e.target.value)}
                  style={INP}
                  required
                >
                  <option value="" disabled>Seleccionar categoría…</option>
                  {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </Field>

              {/* Necesidad */}
              <Field label="Necesidad del Gasto">
                <NecesidadPicker value={form.necesidad} onChange={v => set('necesidad', v)} />
              </Field>

              {/* Descripción */}
              <Field
                label="Descripción / Detalles"
                hint="¿Qué se compró exactamente? ¿A quién se le pagó?"
              >
                <textarea
                  rows={3}
                  placeholder="Detalla el gasto: productos, servicios, persona…"
                  value={form.descripcion}
                  onChange={e => set('descripcion', e.target.value)}
                  style={{ ...INP, resize: 'vertical', lineHeight: 1.5 }}
                />
              </Field>

              {/* Archivo */}
              <Field
                label="Foto / PDF de Factura"
                hint={!hasOAuthAccess() ? '⚠ Añade REACT_APP_GOOGLE_CLIENT_ID para habilitar la carga a Google Drive' : undefined}
              >
                {hasOAuthAccess()
                  ? <FileZone file={file} preview={filePreview} onFile={handleFile} onClear={clearFile} />
                  : (
                    <div style={{
                      padding: '12px 14px', borderRadius: 10,
                      border: '1px solid var(--border)', background: 'var(--bg-panel)',
                      fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--text-muted)',
                    }}>
                      Carga de archivos no disponible — configura OAuth para habilitarla
                    </div>
                  )
                }
              </Field>
            </div>

            {/* ── Footer: quincena + submit ────────────────────────────── */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--text-muted)' }}>Quincena:</span>
                <span style={{
                  fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 700,
                  color: 'var(--accent)', background: 'rgba(0,229,160,0.1)',
                  border: '1px solid rgba(0,229,160,0.2)', borderRadius: 99, padding: '3px 12px',
                }}>
                  {quincena}
                </span>
                <span style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--text-muted)' }}>
                  (automático)
                </span>
              </div>

              <button
                type="submit"
                disabled={!isValid || isBusy}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '11px 30px', borderRadius: 11, border: 'none',
                  background: isValid && !isBusy ? 'var(--accent)' : 'var(--bg-panel)',
                  color:      isValid && !isBusy ? '#080c18' : 'var(--text-muted)',
                  fontSize: 14, fontWeight: 700, fontFamily: 'var(--font-body)',
                  cursor: isValid && !isBusy ? 'pointer' : 'default', transition: 'all 0.15s',
                }}
              >
                {status === 'uploading'
                  ? <><RefreshCw size={14} style={{ animation: 'spin 1s linear infinite' }} /> Subiendo a Drive…</>
                  : status === 'saving'
                  ? <><RefreshCw size={14} style={{ animation: 'spin 1s linear infinite' }} /> Guardando…</>
                  : 'Guardar gasto'
                }
              </button>
            </div>

            {/* ── Error banner ──────────────────────────────────────────── */}
            {status === 'error' && (
              <div style={{
                display: 'flex', alignItems: 'flex-start', gap: 10,
                padding: '12px 16px', borderRadius: 10,
                background: 'rgba(255,77,109,0.08)', border: '1px solid rgba(255,77,109,0.25)',
              }}>
                <AlertCircle size={16} color="var(--danger)" style={{ flexShrink: 0, marginTop: 1 }} />
                <span style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--danger)', lineHeight: 1.5 }}>
                  {errorMsg}
                </span>
              </div>
            )}
          </form>
        )}

        {/* ── Setup guides ─────────────────────────────────────────────────── */}
        {!hasOAuthAccess() && <OAuthGuide />}
        {!hasWriteAccess() && !hasOAuthAccess() && (
          <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--text-muted)', textAlign: 'center', padding: '8px 0' }}>
            Sin configuración de escritura. Configura Apps Script o Google OAuth para guardar datos.
          </div>
        )}
        {!hasWriteAccess() && <ScriptGuide />}
      </main>
    </div>
  );
};

export default ExpenseFormPage;
