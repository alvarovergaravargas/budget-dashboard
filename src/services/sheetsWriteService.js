const APPS_SCRIPT_URL = process.env.REACT_APP_APPS_SCRIPT_URL;

export const hasWriteAccess = () => Boolean(APPS_SCRIPT_URL);

/**
 * Appends a budget row to the "Presupuesto" sheet via Google Apps Script Web App.
 * Uses no-cors mode (fire-and-forget) — response is opaque but the row is written.
 *
 * Required Apps Script (see planner setup guide in BudgetPlannerPage):
 *   function doPost(e) {
 *     const d = JSON.parse(e.postData.contents);
 *     SpreadsheetApp.getActiveSpreadsheet()
 *       .getSheetByName('Presupuesto')
 *       .appendRow([d.quincena, d.periodo, d.año, d.categoria, Number(d.monto), d.descripcion || '']);
 *     return ContentService.createTextOutput(JSON.stringify({ ok: true }))
 *       .setMimeType(ContentService.MimeType.JSON);
 *   }
 */
export const writeBudgetRow = async ({ quincena, periodo, año, categoria, monto, descripcion }) => {
  if (!APPS_SCRIPT_URL) throw new Error('REACT_APP_APPS_SCRIPT_URL no configurada');
  await fetch(APPS_SCRIPT_URL, {
    method: 'POST',
    mode: 'no-cors',
    body: JSON.stringify({ quincena, periodo, año, categoria, monto, descripcion: descripcion || '' }),
  });
  // no-cors: response.type === 'opaque', assumed success if fetch doesn't throw
};
