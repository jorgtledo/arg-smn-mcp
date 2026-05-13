import type { Request, Response, NextFunction } from 'express';
import { logRequest } from '../utils/logger.js';

export function createAuthMiddleware(apiKey: string) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const providedKey = req.headers['x-api-key'];

    if (!providedKey) {
      logRequest('AUTH', { result: 'missing_key', ip: req.ip, path: req.path });
      res.status(401).json({ error: 'Unauthorized', message: 'Se requiere el header x-api-key.' });
      return;
    }

    if (providedKey !== apiKey) {
      logRequest('AUTH', { result: 'invalid_key', ip: req.ip, path: req.path });
      res.status(403).json({ error: 'Forbidden', message: 'API Key inválida.' });
      return;
    }

    next();
  };
}
