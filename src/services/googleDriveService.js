const FOLDER_NAME = 'BudgetOS · Facturas';

const getOrCreateFolder = async (token) => {
  const q = encodeURIComponent(
    `name='${FOLDER_NAME}' and mimeType='application/vnd.google-apps.folder' and trashed=false`
  );
  const res = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=${q}&fields=files(id)`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  const data = await res.json();
  if (data.files?.length) return data.files[0].id;

  // Folder doesn't exist — create it
  const create = await fetch('https://www.googleapis.com/drive/v3/files', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: FOLDER_NAME,
      mimeType: 'application/vnd.google-apps.folder',
    }),
  });
  const folder = await create.json();
  if (!folder.id) throw new Error('No se pudo crear la carpeta en Drive');
  return folder.id;
};

/**
 * Uploads a file (image or PDF) to the "BudgetOS · Facturas" Drive folder.
 * Returns the webViewLink (shareable URL) of the uploaded file.
 */
export const uploadInvoice = async (file, token, { fecha, establecimiento }) => {
  const folderId = await getOrCreateFolder(token);

  const ext      = file.name.split('.').pop().toLowerCase();
  const safeName = (establecimiento || 'factura')
    .normalize('NFD').replace(/[̀-ͯ]/g, '') // remove accents
    .replace(/[^a-z0-9]/gi, '_')
    .substring(0, 30);
  const fileName = `${fecha}_${safeName}.${ext}`;

  const metadata = { name: fileName, parents: [folderId] };
  const body = new FormData();
  body.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
  body.append('file', file);

  const upload = await fetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,webViewLink',
    { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body }
  );
  if (!upload.ok) {
    const err = await upload.json().catch(() => ({}));
    throw new Error(err.error?.message || `Error al subir archivo: ${upload.status}`);
  }
  const { id, webViewLink } = await upload.json();

  // Make file viewable by anyone with the link
  await fetch(`https://www.googleapis.com/drive/v3/files/${id}/permissions`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ role: 'reader', type: 'anyone' }),
  });

  return webViewLink;
};
