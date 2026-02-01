import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

import { MedicalDatabase } from './database/db.js';
import { convertNLtoSQL, validateAndRefineSQL } from './llm/nl-to-sql.js';
import { generatePDFReport } from './utils/pdf-generator.js';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(__dirname, '../medical_data.db');

let db;

const server = new Server(
  {
    name: 'medical-query-server',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'query_patients',
        description: 'Query clinical trial data using natural language. Examples: "Find patients over 65 with serious adverse events", "Show all patients taking medication X", "Get lab results for diabetic patients"',
        inputSchema: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: 'Natural language query about patient/trial data',
            },
            generate_report: {
              type: 'boolean',
              description: 'Generate a PDF report of results',
              default: false,
            },
          },
          required: ['query'],
        },
      },
      {
        name: 'get_schema',
        description: 'View database structure and available tables/columns',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'get_stats',
        description: 'Get database statistics (record counts per table)',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
    ],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  if (!db) {
    try {
      db = new MedicalDatabase(DB_PATH);
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `❌ Database not found. Please run import first.\nError: ${error.message}`,
          },
        ],
        isError: true,
      };
    }
  }

  try {
    if (name === 'get_schema') {
      const schema = db.getSchema();
      return {
        content: [
          {
            type: 'text',
            text: schema,
          },
        ],
      };
    }

    if (name === 'get_stats') {
      const stats = db.getStats();
      return {
        content: [
          {
            type: 'text',
            text: `📊 Database Statistics:\n\n${JSON.stringify(stats, null, 2)}`,
          },
        ],
      };
    }

    if (name === 'query_patients') {
      const { query, generate_report = false } = args;
      
      console.error(`\n🔍 Processing: "${query}"`);
      
      const schema = db.getSchema();
      let sql = await convertNLtoSQL(query, schema);
      console.error(`📝 Generated SQL: ${sql}`);
      
      let result = db.executeQuery(sql);
      
      let retries = 0;
      while (!result.success && retries < 2) {
        console.error(`⚠️  SQL Error (attempt ${retries + 1}): ${result.error}`);
        sql = await validateAndRefineSQL(sql, result.error, schema);
        console.error(`🔧 Refined SQL: ${sql}`);
        result = db.executeQuery(sql);
        retries++;
      }
      
      if (!result.success) {
        return {
          content: [
            {
              type: 'text',
              text: `❌ Query failed after ${retries + 1} attempts.\n\nError: ${result.error}\n\nSQL: ${sql}\n\nTry rephrasing your query.`,
            },
          ],
          isError: true,
        };
      }

      const { data, rowCount } = result;
      
      let responseText = `✅ Query successful!\n\n`;
      responseText += `📊 Found ${rowCount} record(s)\n\n`;
      
      if (rowCount > 0) {
        responseText += `🔍 Results (showing up to 5):\n\n`;
        data.slice(0, 5).forEach((record, idx) => {
          responseText += `Record ${idx + 1}:\n`;
          responseText += JSON.stringify(record, null, 2);
          responseText += '\n\n';
        });
        
        if (rowCount > 5) {
          responseText += `... and ${rowCount - 5} more records\n\n`;
        }
      }
      
      responseText += `📝 SQL: ${sql}`;

      const content = [
        {
          type: 'text',
          text: responseText,
        },
      ];

      if (generate_report && rowCount > 0) {
        const reportsDir = path.join(__dirname, '../reports');
        if (!fs.existsSync(reportsDir)) {
          fs.mkdirSync(reportsDir, { recursive: true });
        }
        
        const reportPath = path.join(reportsDir, `report_${Date.now()}.pdf`);
        await generatePDFReport(data, query, reportPath);
        
        content.push({
          type: 'text',
          text: `\n📄 PDF Report: ${reportPath}`,
        });
      }

      return { content };
    }

    return {
      content: [
        {
          type: 'text',
          text: `Unknown tool: ${name}`,
        },
      ],
      isError: true,
    };
    
  } catch (error) {
    console.error('Error:', error);
    return {
      content: [
        {
          type: 'text',
          text: `Error: ${error.message}`,
        },
      ],
      isError: true,
    };
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('🏥 Medical MCP Server running');
  console.error(`📁 Database: ${DB_PATH}`);
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
