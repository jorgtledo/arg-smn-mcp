import { fetchWithBrowser } from './tokenManager.js';

interface GetConfig {
  params?: Record<string, string>;
}

interface BrowserResponse<T> {
  data: T;
}

/**
 * Cliente HTTP para la API del SMN.
 * Las requests se ejecutan dentro del navegador (Playwright) para
 * atravesar Cloudflare, igual que hace tokenManager para obtener el JWT.
 */
export const smn1Client = {
  async get<T = unknown>(url: string, config?: GetConfig): Promise<BrowserResponse<T>> {
    const params = { ...config?.params };

    // El typeahead oficial envía ambos valores para la búsqueda de localidades.
    if (url === '/georef/location/search' && params.name && !params.q) {
      params.q = params.name;
    }

    const result = await fetchWithBrowser(url, params);
    return { data: result.data as T };
  },
};
