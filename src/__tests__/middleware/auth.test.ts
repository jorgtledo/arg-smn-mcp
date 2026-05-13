import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Request, Response, NextFunction } from 'express';

vi.mock('../../utils/logger.js', () => ({
  logRequest: vi.fn(),
}));

import { createAuthMiddleware } from '../../middleware/auth.js';

const API_KEY = 'clave-de-prueba-123';

function makeReq(key?: string): Partial<Request> {
  return {
    headers: key !== undefined ? { 'x-api-key': key } : {},
    ip: '127.0.0.1',
    path: '/test',
  };
}

function makeRes() {
  const res = { status: vi.fn(), json: vi.fn() };
  res.status.mockReturnValue(res);
  res.json.mockReturnValue(res);
  return res;
}

describe('createAuthMiddleware', () => {
  let middleware: ReturnType<typeof createAuthMiddleware>;

  beforeEach(() => {
    middleware = createAuthMiddleware(API_KEY);
  });

  it('llama a next() cuando la clave es correcta', () => {
    const req = makeReq(API_KEY);
    const res = makeRes();
    const next = vi.fn();

    middleware(req as Request, res as unknown as Response, next as NextFunction);

    expect(next).toHaveBeenCalledOnce();
    expect(res.status).not.toHaveBeenCalled();
  });

  it('responde 401 cuando no se envía la clave', () => {
    const req = makeReq();
    const res = makeRes();
    const next = vi.fn();

    middleware(req as Request, res as unknown as Response, next as NextFunction);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: 'Unauthorized' }),
    );
    expect(next).not.toHaveBeenCalled();
  });

  it('responde 403 cuando la clave es incorrecta', () => {
    const req = makeReq('clave-incorrecta');
    const res = makeRes();
    const next = vi.fn();

    middleware(req as Request, res as unknown as Response, next as NextFunction);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: 'Forbidden' }),
    );
    expect(next).not.toHaveBeenCalled();
  });

  it('acepta distintas claves configuradas por instancia', () => {
    const otherMiddleware = createAuthMiddleware('otra-clave');
    const req = makeReq('otra-clave');
    const res = makeRes();
    const next = vi.fn();

    otherMiddleware(req as Request, res as unknown as Response, next as NextFunction);

    expect(next).toHaveBeenCalledOnce();
  });

  it('rechaza la clave correcta en otra instancia', () => {
    const otherMiddleware = createAuthMiddleware('otra-clave');
    const req = makeReq(API_KEY);
    const res = makeRes();
    const next = vi.fn();

    otherMiddleware(req as Request, res as unknown as Response, next as NextFunction);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });
});
