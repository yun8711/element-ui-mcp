# Element-UI MCP Server

[![中文文档](https://img.shields.io/badge/文档-中文-blue)](README.zh-CN.md)

A Model Context Protocol (MCP) server that provides comprehensive information about Element-UI v2.15.14 components. This server enables AI assistants to query Element-UI component documentation, properties, events, and usage examples.

## Project Introduction

Vue.js is an extremely powerful frontend framework, and Element-UI is one of the most popular and mature UI component libraries from the Vue 2 era. Although the Vue ecosystem has now entered the Vue 3 era, with Element-UI's last commit being on August 24, 2023, there are still many projects based on Vue 2 + Element-UI that continue to be maintained and iterated.

To enable large language models to more accurately understand Element-UI's components, properties, events, and examples when reading, generating, and completing code, and to further improve our development efficiency in maintaining legacy projects, I drew inspiration from the practices of other excellent component libraries and built this Element-UI dedicated MCP Server.

I hope it will be useful in your daily development and save more time for fellow developers who continue to maintain Vue 2 projects.


## Features

- 📋 **List Components** - Get a complete list of all Element-UI components
- 🔍 **Search Components** - Search components by name or description
- 📖 **Component Details** - Get detailed information about specific components
- ⚙️ **Component Properties** - Access all props, types, and defaults for components
- 🎯 **Component Events** - View all events and their parameters
- 📝 **Usage Examples** - Extract code examples from component documentation

## Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/element-ui-mcp.git
cd element-ui-mcp

# Install dependencies
pnpm install

# Build the project
pnpm run build
```

## MCP API

The server provides 6 MCP API:

### 1. `list_components`
Lists all available Element-UI components.

### 2. `search_components`
Search for components by keyword.

**Parameters:**
- `keyword`: Search term
- `limit` (optional): Maximum number of results

### 3. `get_component`
Get detailed information about a specific component.

**Parameters:**
- `tagName`: Component tag name (e.g., "el-button")

### 4. `get_component_props`
Get all properties for a specific component.

**Parameters:**
- `tagName`: Component tag name
- `propName` (optional): Specific property name

### 5. `get_component_events`
Get all events for a specific component.

**Parameters:**
- `tagName`: Component tag name
- `eventName` (optional): Specific event name

### 6. `get_component_examples`
Get usage examples for a specific component.

**Parameters:**
- `tagName`: Component tag name
- `exampleIndex` (optional): Index of specific example

## MCP Integration

To use this server with MCP-compatible clients, you can configure it in two ways:

### Option 1: Local Installation
If you have cloned and built the project locally:

```json
{
  "mcpServers": {
    "element-ui": {
      "command": "node",
      "args": ["/path/to/element-ui-mcp/stdio.js"]
    }
  }
}
```

### Option 2: Global Installation (Recommended)
Install the package globally and use npx:

```bash
npm install -g element-ui-mcp
```

Then configure in your MCP client:

```json
{
  "mcpServers": {
    "element-ui": {
      "command": "npx",
      "args": ["-y", "element-ui-mcp"]
    }
  }
}
```

The npx approach is recommended as it automatically manages the package and ensures you're using the latest version.

## Data Source

The component data is extracted from Element-UI v2.15.14 documentation and type definitions, including:

- Component properties and types
- Event definitions
- Usage examples from documentation
- TypeScript definitions

## License

MIT
