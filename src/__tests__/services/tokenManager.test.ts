import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

function makeJwt(expSec: number): string {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(JSON.stringify({ exp: expSec })).toString('base64url');
  return `${header}.${payload}.firma-falsa`;
}

function makeHtml(token: string): string {
  return `<html><script>localStorage.setItem('token', '${token}')</script></html>`;
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

  it('obtiene el token desde el HTML y lo devuelve', async () => {
    const expSec = Math.floor(Date.now() / 1000) + 3600;
    const fakeJwt = makeJwt(expSec);

    vi.doMock('axios', () => ({
      default: {
        get: vi.fn().mockResolvedValue({ status: 200, data: makeHtml(fakeJwt) }),
        isAxiosError: vi.fn().mockReturnValue(false),
        create: vi.fn(),
      },
    }));
    vi.doMock('../../utils/logger.js', () => ({
      logDebugHttp: vi.fn(),
      logDebugResponse: vi.fn(),
    }));

    const { getToken } = await import('../../services/tokenManager.js');
    const token = await getToken();

    expect(token).toBe(fakeJwt);
  });

  it('usa el caché en llamadas sucesivas sin rehacer la petición HTTP', async () => {
    const expSec = Math.floor(Date.now() / 1000) + 3600;
    const fakeJwt = makeJwt(expSec);
    const axiosGet = vi.fn().mockResolvedValue({ status: 200, data: makeHtml(fakeJwt) });

    vi.doMock('axios', () => ({
      default: {
        get: axiosGet,
        isAxiosError: vi.fn().mockReturnValue(false),
        create: vi.fn(),
      },
    }));
    vi.doMock('../../utils/logger.js', () => ({
      logDebugHttp: vi.fn(),
      logDebugResponse: vi.fn(),
    }));

    const { getToken } = await import('../../services/tokenManager.js');

    const t1 = await getToken();
    const t2 = await getToken();

    expect(t1).toBe(fakeJwt);
    expect(t2).toBe(fakeJwt);
    expect(axiosGet).toHaveBeenCalledOnce();
  });

  it('renueva el token cuando está dentro del margen de expiración (< 5 min)', async () => {
    const expiredSec = Math.floor(Date.now() / 1000) + 60; // expira en 1 min
    const freshSec = Math.floor(Date.now() / 1000) + 3600;
    const expiredJwt = makeJwt(expiredSec);
    const freshJwt = makeJwt(freshSec);

    const axiosGet = vi
      .fn()
      .mockResolvedValueOnce({ status: 200, data: makeHtml(expiredJwt) })
      .mockResolvedValueOnce({ status: 200, data: makeHtml(freshJwt) });

    vi.doMock('axios', () => ({
      default: {
        get: axiosGet,
        isAxiosError: vi.fn().mockReturnValue(false),
        create: vi.fn(),
      },
    }));
    vi.doMock('../../utils/logger.js', () => ({
      logDebugHttp: vi.fn(),
      logDebugResponse: vi.fn(),
    }));

    const { getToken } = await import('../../services/tokenManager.js');

    const t1 = await getToken();
    expect(t1).toBe(expiredJwt);

    const t2 = await getToken();
    expect(t2).toBe(freshJwt);
    expect(axiosGet).toHaveBeenCalledTimes(2);
  });

  it('lanza error cuando el HTML no contiene el token', async () => {
    vi.doMock('axios', () => ({
      default: {
        get: vi.fn().mockResolvedValue({ status: 200, data: '<html>sin token aquí</html>' }),
        isAxiosError: vi.fn().mockReturnValue(false),
        create: vi.fn(),
      },
    }));
    vi.doMock('../../utils/logger.js', () => ({
      logDebugHttp: vi.fn(),
      logDebugResponse: vi.fn(),
    }));

    const { getToken } = await import('../../services/tokenManager.js');

    await expect(getToken()).rejects.toThrow('No se pudo extraer el JWT');
  });

  it('usa 55 min de expiración cuando el JWT no tiene payload decodificable', async () => {
    const invalidJwt = 'cabecera.carga-invalida-no-es-base64url.firma';

    vi.doMock('axios', () => ({
      default: {
        get: vi.fn().mockResolvedValue({ status: 200, data: makeHtml(invalidJwt) }),
        isAxiosError: vi.fn().mockReturnValue(false),
        create: vi.fn(),
      },
    }));
    vi.doMock('../../utils/logger.js', () => ({
      logDebugHttp: vi.fn(),
      logDebugResponse: vi.fn(),
    }));

    const before = Date.now();
    const { getToken } = await import('../../services/tokenManager.js');
    const token = await getToken();
    const after = Date.now();

    expect(token).toBe(invalidJwt);

    // Verificar que el caché persiste (la segunda llamada no vuelve a pedir HTTP)
    // dado que la expiración fijada es 55 min en el futuro
    const { default: axios } = await import('axios');
    const callsBefore = vi.mocked(axios.get).mock.calls.length;
    await getToken();
    expect(vi.mocked(axios.get).mock.calls.length).toBe(callsBefore);

    void before; void after;
  });
});
