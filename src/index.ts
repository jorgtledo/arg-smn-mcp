import { randomUUID } from 'node:crypto';
import express from 'express';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { createServer } from './server.js';
import { createAuthMiddleware } from './middleware/auth.js';

const PORT = Number.parseInt(process.env.PORT ?? '3000', 10);
const HOST = '0.0.0.0';

const API_KEY = process.env.API_KEY ?? (() => {
  const generated = randomUUID();
  process.stderr.write(`\n⚠  API_KEY no definida. Usando clave generada: ${generated}\n`);
  process.stderr.write('   Define la variable de entorno API_KEY para usar una clave fija.\n\n');
  return generated;
})();

const app = express();
app.use(express.json());

const auth = createAuthMiddleware(API_KEY);

// ── Health check (sin autenticación) ─────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', server: 'arg-smn-mcp', version: '1.0.0' });
});

// ── Streamable HTTP Transport — clientes modernos (Cursor, Claude Desktop) ──
app.all('/mcp', auth, async (req, res) => {
  const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });
  const mcpServer = createServer();

  await mcpServer.connect(transport);
  await transport.handleRequest(req, res, req.body);

  res.on('finish', () => {
    void mcpServer.close();
  });
});

// ── SSE Transport — n8n y clientes legacy ────────────────────────────────────
const sseTransports = new Map<string, SSEServerTransport>();

app.get('/sse', auth, async (_req, res) => {
  const transport = new SSEServerTransport('/messages', res);
  const mcpServer = createServer();

  sseTransports.set(transport.sessionId, transport);

  res.on('close', () => {
    sseTransports.delete(transport.sessionId);
    void mcpServer.close();
  });

  await mcpServer.connect(transport);
});

app.post('/messages', auth, async (req, res) => {
  const sessionId = req.query['sessionId'] as string | undefined;
  const transport = sessionId ? sseTransports.get(sessionId) : undefined;

  if (!transport) {
    res.status(404).json({ error: 'Session not found' });
    return;
  }

  await transport.handlePostMessage(req, res);
});

// ── Start ─────────────────────────────────────────────────────────────────────
app.listen(PORT, HOST, () => {
  process.stderr.write(`\narg-smn-mcp escuchando en http://${HOST}:${PORT}\n`);
  process.stderr.write(`  [Streamable HTTP]  POST http://${HOST}:${PORT}/mcp\n`);
  process.stderr.write(`  [SSE — n8n]        GET  http://${HOST}:${PORT}/sse\n`);
  process.stderr.write(`  [Health]           GET  http://${HOST}:${PORT}/health\n`);
  process.stderr.write(`  Autenticación:     header x-api-key requerido\n\n`);
});
