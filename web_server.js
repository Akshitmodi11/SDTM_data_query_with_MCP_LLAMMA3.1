import express from 'express';
import cors from 'cors';
import { MedicalDatabase } from './src/database/db.js';
import { convertNLtoSQL } from './src/llm/nl-to-sql.js';
import { generatePDFReport } from './src/utils/pdf-generator.js';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());
app.use(express.static('public'));
app.use('/reports', express.static('reports'));

const db = new MedicalDatabase('./medical_data.db');

function cleanValue(value) {
  if (!value) return '';
  let str = String(value);
  return str.replace(/^b'|'$/g, '');
}

// API endpoint for queries
app.post('/api/query', async (req, res) => {
  try {
    const { query } = req.body;
    
    if (!query) {
      return res.status(400).json({ error: 'Query is required' });
    }
    
    console.log(`Query received: ${query}`);
    
    // Handle special commands
    if (query.toLowerCase() === 'schema') {
      const schema = db.getSchema();
      return res.json({ type: 'schema', data: schema });
    }
    
    if (query.toLowerCase() === 'stats') {
      const stats = db.getStats();
      return res.json({ type: 'stats', data: stats });
    }
    
    // Convert natural language to SQL
    const schema = db.getSchema();
    let sql = await convertNLtoSQL(query, schema);
    
    console.log(`Generated SQL: ${sql}`);
    
    // Execute query
    const result = db.executeQuery(sql);
    
    if (!result.success) {
      return res.json({ 
        type: 'error', 
        error: result.error,
        sql: sql
      });
    }
    
    // Clean the data
    const cleanData = result.data.map(row => {
      const cleaned = {};
      Object.entries(row).forEach(([key, value]) => {
        if (key !== 'id') {
          cleaned[key] = cleanValue(value);
        }
      });
      return cleaned;
    });
    
    res.json({
      type: 'success',
      sql: sql,
      rowCount: result.rowCount,
      data: cleanData.slice(0, 50), // Limit to 50 for display
      totalRows: result.rowCount
    });
    
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// API endpoint for PDF generation
app.post('/api/generate-pdf', async (req, res) => {
  try {
    const { query, data } = req.body;
    
    if (!data || data.length === 0) {
      return res.status(400).json({ error: 'No data to generate PDF' });
    }
    
    const timestamp = Date.now();
    const filename = `report_${timestamp}.pdf`;
    const reportPath = path.join(__dirname, 'reports', filename);
    
    // Ensure reports directory exists
    if (!fs.existsSync('./reports')) {
      fs.mkdirSync('./reports', { recursive: true });
    }
    
    await generatePDFReport(data, query, reportPath);
    
    res.json({
      success: true,
      filename: filename,
      url: `/reports/${filename}`
    });
    
  } catch (error) {
    console.error('PDF Error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`\n🏥 Medical Query Web Interface`);
  console.log(`==========================================`);
  console.log(`🌐 Server running at: http://localhost:${PORT}`);
  console.log(`📊 Database: ${db.getStats().adverse_events || 0} adverse events`);
  console.log(`==========================================\n`);
  console.log(`Open your browser and go to: http://localhost:${PORT}\n`);
});
