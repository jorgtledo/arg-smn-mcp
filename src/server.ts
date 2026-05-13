import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { registerLocationTools } from './tools/index.js';

export function createServer(): McpServer {
  const server = new McpServer({
    name: 'Servicio Meteorológico Nacional Argentino',
    version: '1.0.0',
    description:
      'Servidor MCP que expone la API pública del Servicio Meteorológico Nacional Argentino (SMN). ' +
      'Permite consultar clima actual, pronósticos de hasta 8 días, y buscar localidades para ' +
      'cualquier punto de Argentina.',
    websiteUrl: 'https://www.smn.gob.ar',
  });

  registerLocationTools(server);

  return server;
}
