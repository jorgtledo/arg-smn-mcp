import axios from 'axios';
import { logDebugHttp, logDebugResponse } from '../utils/logger.js';

const TOKEN_URL = 'https://ws2.smn.gob.ar/';
// El token dura 1 hora (3600s). Lo renovamos 5 minutos antes de que expire.
const REFRESH_MARGIN_MS = 5 * 60 * 1000;

interface CachedToken {
  value: string;
  expiresAt: number;
}

let cached: CachedToken | null = null;

function parseExpiry(token: string): number {
  try {
    const payload = token.split('.')[1];
    const decoded = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as { exp: number };
    return decoded.exp * 1000;
  } catch {
    // Si no puede parsear, fuerza renovación en 55 min
    return Date.now() + 55 * 60 * 1000;
  }
}

async function fetchToken(): Promise<string> {
  logDebugHttp('GET', TOKEN_URL);
  const start = Date.now();

  const response = await axios.get<string>(TOKEN_URL, {
    responseType: 'text',
    timeout: 15000,
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:150.0) Gecko/20100101 Firefox/150.0',
      Accept: 'text/html',
    },
  });

  logDebugResponse(TOKEN_URL, response.status, Date.now() - start);

  const match = /localStorage\.setItem\('token',\s*'([^']+)'\)/.exec(response.data);
  if (!match?.[1]) {
    throw new Error('No se pudo extraer el JWT del HTML de ws2.smn.gob.ar');
  }

  return match[1];
}

export async function getToken(): Promise<string> {
  const now = Date.now();

  if (cached && cached.expiresAt - REFRESH_MARGIN_MS > now) {
    return cached.value;
  }

  const token = await fetchToken();
  cached = { value: token, expiresAt: parseExpiry(token) };

  const expiresIn = Math.round((cached.expiresAt - now) / 1000 / 60);
  process.stderr.write(`[${new Date().toISOString()}] [INFO ] [TOKEN ] JWT renovado, expira en ~${expiresIn} min\n`);

  return cached.value;
}
