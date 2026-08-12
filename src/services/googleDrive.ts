// @ts-nocheck
// src/services/googleDrive.ts
// ════════════════════════════════════════════════════════════════
// FitTrack V7 — Integração Google Drive (backup/restore cifrado)
// ════════════════════════════════════════════════════════════════

const CLIENT_ID = '757924195752-rh2pdglr4qk9ocrjbnpj5fogmi497up7.apps.googleusercontent.com';
const SCOPES = 'https://www.googleapis.com/auth/drive.file';
const DISCOVERY_DOC = 'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest';
const BACKUP_FOLDER = '.fittrack/backups';

export interface GoogleDriveToken {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  expiry_date: number;
}

let tokenClient: any = null;
let gisInited = false;

export async function initGoogleDrive() {
  if (typeof window === 'undefined') return;

  // Carregar a API do Google Identity Services (GIS)
  if (!document.querySelector('#google-identity-script')) {
    const script = document.createElement('script');
    script.id = 'google-identity-script';
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);
    await new Promise((resolve) => {
      script.onload = resolve;
    });
  }

  // Carregar a API do Google Drive (gapi)
  if (!document.querySelector('#google-drive-script')) {
    const script = document.createElement('script');
    script.id = 'google-drive-script';
    script.src = 'https://apis.google.com/js/api.js';
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);
    await new Promise((resolve) => {
      script.onload = resolve;
    });
  }

  await new Promise((resolve) => {
    (window as any).gapi.load('client', async () => {
      await (window as any).gapi.client.init({ discoveryDocs: [DISCOVERY_DOC] });
      resolve(true);
    });
  });

  tokenClient = (window as any).google.accounts.oauth2.initTokenClient({
    client_id: CLIENT_ID,
    scope: SCOPES,
    callback: (tokenResponse: any) => {
      if (tokenResponse.error) throw new Error(tokenResponse.error);
      localStorage.setItem(
        'google_drive_token',
        JSON.stringify({
          access_token: tokenResponse.access_token,
          expires_in: tokenResponse.expires_in,
          expiry_date: Date.now() + tokenResponse.expires_in * 1000,
        }),
      );
    },
  });
  gisInited = true;
}

export async function signInToGoogleDrive(): Promise<boolean> {
  if (!gisInited) await initGoogleDrive();
  return new Promise((resolve) => {
    tokenClient.callback = (resp: any) => {
      if (resp.error) resolve(false);
      else resolve(true);
    };
    tokenClient.requestAccessToken({ prompt: 'consent' });
  });
}

export async function signOutFromGoogleDrive() {
  localStorage.removeItem('google_drive_token');
  // Nota: revogar token no Google exigiria pedido HTTP, omitido por simplicidade
}

export function getStoredToken(): GoogleDriveToken | null {
  const raw = localStorage.getItem('google_drive_token');
  if (!raw) return null;
  const token = JSON.parse(raw);
  if (token.expiry_date < Date.now()) {
    localStorage.removeItem('google_drive_token');
    return null;
  }
  return token;
}

async function ensureToken(): Promise<string> {
  const token = getStoredToken();
  if (token) return token.access_token;
  await signInToGoogleDrive();
  const newToken = getStoredToken();
  if (!newToken) throw new Error('Não foi possível obter token');
  return newToken.access_token;
}

// ─── OPERAÇÕES DE FICHEIROS ─────────────────────────────────────────

export async function uploadBackup(blob: Blob, filename: string): Promise<string> {
  const token = await ensureToken();
  const metadata = {
    name: filename,
    parents: [BACKUP_FOLDER],
    mimeType: 'application/octet-stream',
  };
  const form = new FormData();
  form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
  form.append('file', blob);

  const response = await fetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart',
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: form,
    },
  );
  if (!response.ok) throw new Error(`Upload falhou: ${response.statusText}`);
  const data = await response.json();
  return data.id;
}

export async function listBackups(): Promise<{ id: string; name: string; createdTime: string }[]> {
  const token = await ensureToken();
  const query = `'${BACKUP_FOLDER}' in parents and trashed=false and name contains 'fittrack_backup_'`;
  const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=files(id,name,createdTime)&orderBy=createdTime desc`;
  const response = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (!response.ok) throw new Error(`Listagem falhou: ${response.statusText}`);
  const data = await response.json();
  return data.files || [];
}

export async function downloadBackup(fileId: string): Promise<ArrayBuffer> {
  const token = await ensureToken();
  const response = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) throw new Error(`Download falhou: ${response.statusText}`);
  return response.arrayBuffer();
}
