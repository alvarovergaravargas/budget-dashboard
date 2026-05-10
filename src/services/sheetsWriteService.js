const APPS_SCRIPT_URL = process.env.REACT_APP_APPS_SCRIPT_URL;

export const hasWriteAccess = () => Boolean(APPS_SCRIPT_URL);

/**
 * Appends a budget row to the "Presupuesto" sheet via Google Apps Script Web App.
 * Uses no-cors mode (fire-and-forget) — response is opaque but the row is written.
 *
 * Required Apps Script (see planner setup guide in BudgetPlannerPage):
 *   function doGet(e) {
 *     const p = e.parameter;
 *     // A:Quincena | B:Fecha | C:# | D:Año | E:Categoria | F:Presupuesto (USD) | G:Comentario
 *     SpreadsheetApp.getActiveSpreadsheet()
 *       .getSheetByName('Presupuesto')
 *       .appendRow([p.quincena, p.periodo, '', p.año, p.categoria, Number(p.monto), p.descripcion || '']);
 *     return ContentService.createTextOutput(JSON.stringify({ ok: true }))
 *       .setMimeType(ContentService.MimeType.JSON);
 *   }
 */
export const writeBudgetRow = async ({ quincena, periodo, año, categoria, monto, descripcion }) => {
  if (!APPS_SCRIPT_URL) throw new Error('REACT_APP_APPS_SCRIPT_URL no configurada');
  // Use GET + URL params: POST bodies are lost when Apps Script redirects (302).
  // A GET request is a "simple" CORS request — no preflight, no body loss on redirect.
  const params = new URLSearchParams({
    quincena,
    periodo,
    año,
    categoria,
    monto:       String(monto),
    descripcion: descripcion || '',
  });
  await fetch(`${APPS_SCRIPT_URL}?${params}`, { mode: 'no-cors' });
  // no-cors: response is opaque — assumed success if fetch doesn't throw
};

// ─── EXPENSE WRITE (Gastos sheet) ──────────────────────────────────────────────
// Columns: Timestamp | Fecha del Gasto | Establecimiento | Monto (USD) |
//          Categoria del Gasto | Necesidad | Descripción o Detalles Adicionales |
//          Carga de Archivo | Quincena

/**
 * Writes an expense row via Google Sheets API using an OAuth2 access token.
 * Used when the user has authenticated (e.g. after uploading a file to Drive).
 */
export const writeExpenseRow = async (
  token,
  { fecha, establecimiento, monto, categoria, necesidad, descripcion, archivoUrl, quincena }
) => {
  const spreadsheetId = process.env.REACT_APP_SPREADSHEET_ID;
  const sheetName     = process.env.REACT_APP_SHEET_GASTOS || 'Gastos';
  const timestamp     = new Date().toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' });

  const values = [[
    timestamp,
    fecha,
    establecimiento,
    monto,
    categoria,
    necesidad,
    descripcion || '',
    archivoUrl  || '',
    quincena,
  ]];

  const range = encodeURIComponent(`${sheetName}!A:I`);
  const url   = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`;

  const res = await fetch(url, {
    method:  'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body:    JSON.stringify({ values }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Sheets API error ${res.status}`);
  }
};

/**
 * Writes an expense row via Apps Script GET (no OAuth required, text-only).
 * Falls back to this path when the user has not authenticated with Google OAuth.
 * Requires the Apps Script to handle type=expense (see ExpenseFormPage setup guide).
 */
export const writeExpenseViaScript = async (
  { fecha, establecimiento, monto, categoria, necesidad, descripcion, archivoUrl, quincena }
) => {
  if (!APPS_SCRIPT_URL) throw new Error('REACT_APP_APPS_SCRIPT_URL no configurada');
  const params = new URLSearchParams({
    type:            'expense',
    fecha,
    establecimiento,
    monto:           String(monto),
    categoria,
    necesidad,
    descripcion:     (descripcion || '').substring(0, 500),
    archivo:         archivoUrl || '',
    quincena,
  });
  await fetch(`${APPS_SCRIPT_URL}?${params}`, { mode: 'no-cors' });
};
