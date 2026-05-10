import { useState, useCallback } from 'react';

const CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID;

// Scopes: Drive (file upload) + Sheets (write expense rows)
const SCOPES = [
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/spreadsheets',
].join(' ');

export const hasOAuthAccess = () => Boolean(CLIENT_ID);

export const useGoogleAuth = () => {
  const [accessToken, setAccessToken] = useState(null);

  const getToken = useCallback(() => {
    if (accessToken) return Promise.resolve(accessToken);

    return new Promise((resolve, reject) => {
      if (!CLIENT_ID) {
        reject(new Error('REACT_APP_GOOGLE_CLIENT_ID no está configurada. Ve las instrucciones de configuración.'));
        return;
      }
      if (!window.google?.accounts?.oauth2) {
        reject(new Error('Google Identity Services aún no cargó. Recarga la página e intenta de nuevo.'));
        return;
      }

      const client = window.google.accounts.oauth2.initTokenClient({
        client_id: CLIENT_ID,
        scope: SCOPES,
        callback: (resp) => {
          if (resp.error) {
            reject(new Error(resp.error_description || resp.error));
            return;
          }
          setAccessToken(resp.access_token);
          // Clear token 60s before it expires (default lifetime: 3600s)
          setTimeout(() => setAccessToken(null), (resp.expires_in - 60) * 1000);
          resolve(resp.access_token);
        },
      });

      client.requestAccessToken();
    });
  }, [accessToken]);

  return { accessToken, getToken };
};
