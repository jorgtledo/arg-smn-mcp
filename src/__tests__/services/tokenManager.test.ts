import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

function makeJwt(expSec: number): string {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(JSON.stringify({ exp: expSec })).toString('base64url');
  return `${header}.${payload}.firma-falsa`;
}

function mockPlaywright(evaluate: ReturnType<typeof vi.fn>, extras?: { waitForFunction?: ReturnType<typeof vi.fn> }) {
  const page = {
    goto: vi.fn().mockResolvedValue(undefined),
    waitForFunction: extras?.waitForFunction ?? vi.fn().mockResolvedValue(undefined),
    evaluate,
  };
  const context = {
    newPage: vi.fn().mockResolvedValue(page),
  };
  const browser = {
    newContext: vi.fn().mockResolvedValue(context),
    close: vi.fn().mockResolvedValue(undefined),
  };
  const launch = vi.fn().mockResolvedValue(browser);

  vi.doMock('playwright', () => ({
    chromium: { launch },
  }));
  vi.doMock('../../utils/logger.js', () => ({
    logDebugHttp: vi.fn(),
    logDebugResponse: vi.fn(),
    logDebug: vi.fn(),
  }));

  return { launch, browser, page };
}

describe('tokenManager.getToken', () => {
  let stderrSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.resetModules();
    stderrSpy = vi.spyOn(process.stderr, 'write').mockImplementation(() => true);
  });

  afterEach(() => {
    stderrSpy.mockRestore();
    vi.clearAllMocks();
  });

  it('obtiene el token desde localStorage y lo devuelve', async () => {
    const expSec = Math.floor(Date.now() / 1000) + 3600;
    const fakeJwt = makeJwt(expSec);
    mockPlaywright(vi.fn().mockResolvedValue(fakeJwt));

    const { getToken } = await import('../../services/tokenManager.js');
    const token = await getToken();

    expect(token).toBe(fakeJwt);
  });

  it('usa el caché en llamadas sucesivas sin reabrir el navegador', async () => {
    const expSec = Math.floor(Date.now() / 1000) + 3600;
    const fakeJwt = makeJwt(expSec);
    const { launch } = mockPlaywright(vi.fn().mockResolvedValue(fakeJwt));

    const { getToken } = await import('../../services/tokenManager.js');

    const t1 = await getToken();
    const t2 = await getToken();

    expect(t1).toBe(fakeJwt);
    expect(t2).toBe(fakeJwt);
    expect(launch).toHaveBeenCalledOnce();
  });

  it('renueva el token cuando está dentro del margen de expiración (< 5 min)', async () => {
    const expiredSec = Math.floor(Date.now() / 1000) + 60; // expira en 1 min
    const freshSec = Math.floor(Date.now() / 1000) + 3600;
    const expiredJwt = makeJwt(expiredSec);
    const freshJwt = makeJwt(freshSec);

    const evaluate = vi.fn().mockResolvedValueOnce(expiredJwt).mockResolvedValueOnce(freshJwt);
    const { launch } = mockPlaywright(evaluate);

    const { getToken } = await import('../../services/tokenManager.js');

    const t1 = await getToken();
    expect(t1).toBe(expiredJwt);

    const t2 = await getToken();
    expect(t2).toBe(freshJwt);
    expect(launch).toHaveBeenCalledTimes(2);
  });

  it('lanza error cuando localStorage no contiene el token', async () => {
    mockPlaywright(
      vi.fn().mockResolvedValue(null),
      {
        waitForFunction: vi.fn().mockRejectedValue(new Error('page.waitForFunction: Timeout 45000ms exceeded')),
      },
    );

    const { getToken } = await import('../../services/tokenManager.js');

    await expect(getToken()).rejects.toThrow('No se pudo extraer el JWT');
  });

  it('usa 55 min de expiración cuando el JWT no tiene payload decodificable', async () => {
    const invalidJwt = 'cabecera.carga-invalida-no-es-base64url.firma';
    const { launch } = mockPlaywright(vi.fn().mockResolvedValue(invalidJwt));

    const { getToken } = await import('../../services/tokenManager.js');
    const token = await getToken();

    expect(token).toBe(invalidJwt);

    const callsBefore = launch.mock.calls.length;
    await getToken();
    expect(launch.mock.calls.length).toBe(callsBefore);
  });
});
