import { chromium } from 'playwright';
import { logDebugHttp, logDebugResponse, logDebug } from '../utils/logger.js';

// Los consumidores ya incluyen el prefijo /v1 en cada ruta.
const API_BASE_URL = 'https://ws1.smn.gob.ar';

const TOKEN_URL = 'https://www.smn.gob.ar/';
// El token dura 1 hora (3600s). Lo renovamos 5 minutos antes de que expire.
const REFRESH_MARGIN_MS = 5 * 60 * 1000;
const BROWSER_TIMEOUT_MS = 60_000;
const TOKEN_WAIT_MS = 45_000;

interface CachedToken {
  value: string;
  expiresAt: number;
}

let cached: CachedToken | null = null;
let inflight: Promise<string> | null = null;

function parseExpiry(token: string): number {
  try {
    const payload = token.split('.')[1];
    const decoded = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as { exp: number };
    return decoded.exp * 1000;
  } catch {
    // Si no se puede analizar, fuerza la renovación en 55 min.
    return Date.now() + 55 * 60 * 1000;
  }
}

function browserLaunchOptions() {
  const headless = process.env.SMN_BROWSER_HEADLESS !== 'false';
  const executablePath = process.env.CHROME_PATH || undefined;

  return {
    headless,
    executablePath,
    args: [
      '--disable-blink-features=AutomationControlled',
      '--no-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--disable-software-rasterizer',
    ],
  };
}

async function fetchToken(): Promise<string> {
  logDebugHttp('GET', TOKEN_URL);
  const start = Date.now();

  const browser = await chromium.launch(browserLaunchOptions());

  try {
    const context = await browser.newContext({
      locale: 'es-AR',
      userAgent:
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
    });
    const page = await context.newPage();

    await page.goto(TOKEN_URL, { waitUntil: 'domcontentloaded', timeout: BROWSER_TIMEOUT_MS });

    await page.waitForFunction(() => window.localStorage.getItem('token'), { timeout: TOKEN_WAIT_MS });

    const token = await page.evaluate(() => window.localStorage.getItem('token'));
    logDebugResponse(TOKEN_URL, 200, Date.now() - start);

    if (!token) {
      throw new Error('No se pudo extraer el JWT del localStorage de www.smn.gob.ar');
    }

    logDebug('TOKEN  ', `JWT extraído: ${token}`);
    return token;
  } catch (error) {
    logDebugResponse(TOKEN_URL, 0, Date.now() - start);
    if (error instanceof Error && /waitForFunction|Timeout/i.test(error.message)) {
      throw new Error(
        'No se pudo extraer el JWT: Cloudflare bloqueó el navegador o el token no apareció en localStorage',
      );
    }
    throw error;
  } finally {
    await browser.close();
  }
}

async function fetchAndCache(): Promise<string> {
  const now = Date.now();
  const token = await fetchToken();
  cached = { value: token, expiresAt: parseExpiry(token) };

  const expiresIn = Math.round((cached.expiresAt - now) / 1000 / 60);
  process.stderr.write(`[${new Date().toISOString()}] [INFO ] [TOKEN ] JWT renovado, expira en ~${expiresIn} min\n`);

  return cached.value;
}

export async function getToken(): Promise<string> {
  const now = Date.now();

  if (cached && cached.expiresAt - REFRESH_MARGIN_MS > now) {
    return cached.value;
  }

  if (!inflight) {
    inflight = fetchAndCache().finally(() => {
      inflight = null;
    });
  }

  return inflight;
}

export interface BrowserFetchResponse {
  status: number;
  data: unknown;
}

/**
 * Hace un GET a la API del SMN desde dentro del navegador (Playwright),
 * para atravesar Cloudflare. Reutiliza el token cacheado.
 */
export async function fetchWithBrowser(path: string, params?: Record<string, string>): Promise<BrowserFetchResponse> {
  const token = await getToken();

  const qs = params ? '?' + new URLSearchParams(params).toString() : '';
  const url = `${API_BASE_URL}${path}${qs}`;

  logDebugHttp('GET', url);
  const start = Date.now();

  const browser = await chromium.launch(browserLaunchOptions());

  try {
    const context = await browser.newContext({
      locale: 'es-AR',
      userAgent:
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
    });
    const page = await context.newPage();

    // Navegar a la home para obtener las cookies de Cloudflare (cf_clearance).
    await page.goto(TOKEN_URL, { waitUntil: 'domcontentloaded', timeout: BROWSER_TIMEOUT_MS });

    // Esperar a que la app cargue completamente.
    await page.waitForFunction(() => window.localStorage.getItem('token'), { timeout: TOKEN_WAIT_MS });

    // Usar page.evaluate para hacer fetch desde el contexto de la página,
    // con los mismos headers que usaría la app web real.
    const result = await page.evaluate(
      async ({ url: fetchUrl, jwt }: { url: string; jwt: string }) => {
        const resp = await fetch(fetchUrl, {
          method: 'GET',
          headers: {
            Accept: 'application/json, text/plain, */*',
            Authorization: `JWT ${jwt}`,
          },
          credentials: 'include',
        });
        const data = await resp.json().catch(() => null);
        return { status: resp.status, data };
      },
      { url, jwt: token },
    );

    logDebugResponse(url, result.status, Date.now() - start, result.data);

    if (result.status < 200 || result.status >= 300) {
      throw new Error(`La API del SMN respondió HTTP ${result.status} para ${path}`);
    }

    return result;
  } catch (error) {
    logDebugResponse(url, 0, Date.now() - start);
    throw error;
  } finally {
    await browser.close();
  }
}
