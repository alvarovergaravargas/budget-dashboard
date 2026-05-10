const APPS_SCRIPT_URL = process.env.REACT_APP_APPS_SCRIPT_URL;

export const hasWriteAccess = () => Boolean(APPS_SCRIPT_URL);

/**
 * Appends a budget row to the "Presupuesto" sheet via Google Apps Script Web App.
 * Uses no-cors mode (fire-and-forget) — response is opaque but the row is written.
 *
 * Required Apps Script (see planner setup guide in BudgetPlannerPage):
 *   function doGet(e) {
 *     const p = e.parameter;
 *     SpreadsheetApp.getActiveSpreadsheet()
 *       .getSheetByName('Presupuesto')
 *       .appendRow([p.quincena, p.periodo, p.año, p.categoria, Number(p.monto), p.descripcion || '']);
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
