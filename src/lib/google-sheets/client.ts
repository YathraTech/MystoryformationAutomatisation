import { SignJWT, importPKCS8 } from 'jose';

const SCOPES = 'https://www.googleapis.com/auth/spreadsheets';
const TOKEN_URL = 'https://oauth2.googleapis.com/token';

let cachedToken: { token: string; expiresAt: number } | null = null;

/** Returns true if Google Sheets credentials are configured (not placeholders) */
export function isGoogleSheetsConfigured(): boolean {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || '';
  const key = process.env.GOOGLE_PRIVATE_KEY || '';
  const sheetId = process.env.GOOGLE_SPREADSHEET_ID || '';

  return (
    !!email &&
    !email.includes('your-service-account') &&
    !!key &&
    !key.includes('REPLACE_WITH') &&
    !!sheetId &&
    !sheetId.includes('your-spreadsheet')
  );
}

/** Convert a 0-based column index to A1 notation (0=A, 25=Z, 26=AA, etc.) */
export function colToLetter(col: number): string {
  let letter = '';
  let c = col;
  while (c >= 0) {
    letter = String.fromCharCode(65 + (c % 26)) + letter;
    c = Math.floor(c / 26) - 1;
  }
  return letter;
}

async function getAccessToken(): Promise<string> {
  if (cachedToken && Date.now() < cachedToken.expiresAt - 60_000) {
    return cachedToken.token;
  }

  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL!;
  const rawKey = process.env.GOOGLE_PRIVATE_KEY!.replace(/\\n/g, '\n');
  const privateKey = await importPKCS8(rawKey, 'RS256');

  const now = Math.floor(Date.now() / 1000);
  const jwt = await new SignJWT({
    iss: email,
    scope: SCOPES,
    aud: TOKEN_URL,
  })
    .setProtectedHeader({ alg: 'RS256', typ: 'JWT' })
    .setIssuedAt(now)
    .setExpirationTime(now + 3600)
    .sign(privateKey);

  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Google token error: ${res.status} ${text}`);
  }

  const data = await res.json();
  cachedToken = {
    token: data.access_token,
    expiresAt: Date.now() + data.expires_in * 1000,
  };

  return cachedToken.token;
}

const SHEETS_BASE = 'https://sheets.googleapis.com/v4/spreadsheets';

function getSheetName(): string {
  return process.env.GOOGLE_SHEET_NAME || 'Inscriptions CPF';
}

export async function getSheetData(range: string): Promise<string[][]> {
  const token = await getAccessToken();
  const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID!;
  const fullRange = `'${getSheetName()}'!${range}`;

  const res = await fetch(
    `${SHEETS_BASE}/${spreadsheetId}/values/${encodeURIComponent(fullRange)}`,
    {
      headers: { Authorization: `Bearer ${token}` },
      next: { revalidate: 0 },
    }
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Sheets read error: ${res.status} ${text}`);
  }

  const data = await res.json();
  return data.values || [];
}

export async function updateSheetCell(
  row: number,
  col: number,
  value: string
): Promise<void> {
  const token = await getAccessToken();
  const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID!;

  const colLetter = colToLetter(col);
  const range = `'${getSheetName()}'!${colLetter}${row}`;

  const res = await fetch(
    `${SHEETS_BASE}/${spreadsheetId}/values/${encodeURIComponent(range)}?valueInputOption=USER_ENTERED`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ values: [[value]] }),
    }
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Sheets write error: ${res.status} ${text}`);
  }
}

export async function updateSheetRow(
  row: number,
  colStart: number,
  values: string[]
): Promise<void> {
  const token = await getAccessToken();
  const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID!;

  const startCol = colToLetter(colStart);
  const endCol = colToLetter(colStart + values.length - 1);
  const range = `'${getSheetName()}'!${startCol}${row}:${endCol}${row}`;

  const res = await fetch(
    `${SHEETS_BASE}/${spreadsheetId}/values/${encodeURIComponent(range)}?valueInputOption=USER_ENTERED`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ values: [values] }),
    }
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Sheets write error: ${res.status} ${text}`);
  }
}

/** Append a new row at the end of the sheet */
export async function appendSheetRow(values: string[]): Promise<void> {
  const token = await getAccessToken();
  const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID!;
  const range = `'${getSheetName()}'!A:A`;

  const res = await fetch(
    `${SHEETS_BASE}/${spreadsheetId}/values/${encodeURIComponent(range)}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ values: [values] }),
    }
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Sheets append error: ${res.status} ${text}`);
  }
}
