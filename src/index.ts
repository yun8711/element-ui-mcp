import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { registerListComponents } from './tools/list-components.js';
import { registerGetComponent } from './tools/get-component.js';
import { registerSearchComponents } from './tools/search-components.js';
import { registerGetComponentExamples } from './tools/get-component-examples.js';
import { registerGetComponentProps } from './tools/get-component-props.js';
import { registerGetComponentEvents } from './tools/get-component-events.js';
import { registerGetComponentSlots } from './tools/get-component-slots.js';
import { registerGetComponentMethods } from './tools/get-component-methods.js';

export function createServer() {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const VERSION = (
    JSON.parse(
      fs.readFileSync(path.join(__dirname, '../package.json'), 'utf8'),
    ) as { version: string }
  ).version;

  const server = new McpServer({
    name: 'element-ui-mcp',
    version: VERSION,
  });

  // Register tool modules
  registerListComponents(server);
  registerGetComponent(server);
  registerSearchComponents(server);
  registerGetComponentExamples(server);
  registerGetComponentProps(server);
  registerGetComponentEvents(server);
  registerGetComponentSlots(server);
  registerGetComponentMethods(server);

  return server;
}
