type LogLevel = 'DEBUG' | 'INFO' | 'ERROR';

const LEVELS: Record<LogLevel, number> = { DEBUG: 0, INFO: 1, ERROR: 2 };

const configuredLevel: LogLevel = (() => {
  const raw = (process.env.LOG_LEVEL ?? 'INFO').toUpperCase();
  if (raw in LEVELS) return raw as LogLevel;
  process.stderr.write(`[WARN] LOG_LEVEL="${raw}" no válido. Usando INFO.\n`);
  return 'INFO';
})();

function isEnabled(level: LogLevel): boolean {
  return LEVELS[level] >= LEVELS[configuredLevel];
}

function timestamp(): string {
  return new Date().toISOString();
}

function write(level: LogLevel, label: string, message: string): void {
  if (isEnabled(level)) {
    process.stderr.write(`[${timestamp()}] [${level.padEnd(5)}] [${label}] ${message}\n`);
  }
}

// ── INFO ─────────────────────────────────────────────────────────────────────

export function logRequest(tool: string, params?: Record<string, unknown>): void {
  const paramStr = params && Object.keys(params).length > 0 ? ` ${JSON.stringify(params)}` : '';
  write('INFO', 'REQUEST', `${tool}${paramStr}`);
}

export function logSuccess(tool: string, durationMs: number): void {
  write('INFO', 'OK     ', `${tool} (${durationMs}ms)`);
}

export function logError(tool: string, error: unknown, durationMs: number): void {
  const message = error instanceof Error ? error.message : String(error);
  write('ERROR', 'ERROR  ', `${tool} (${durationMs}ms) — ${message}`);
}

// ── DEBUG ────────────────────────────────────────────────────────────────────

export function logDebugHttp(
  method: string,
  url: string,
  params?: Record<string, unknown>,
  body?: unknown,
): void {
  const paramStr = params && Object.keys(params).length > 0 ? ` params=${JSON.stringify(params)}` : '';
  write('DEBUG', 'HTTP→  ', `${method} ${url}${paramStr}`);
  if (body !== undefined && body !== null) {
    write('DEBUG', 'BODY→  ', JSON.stringify(body));
  }
}

export function logDebugResponse(url: string, status: number, durationMs: number, body?: unknown): void {
  write('DEBUG', 'HTTP←  ', `${status} ${url} (${durationMs}ms)`);
  if (body !== undefined && body !== null) {
    write('DEBUG', 'BODY←  ', JSON.stringify(body));
  }
}
