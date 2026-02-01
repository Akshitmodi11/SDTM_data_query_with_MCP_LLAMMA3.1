import { MedicalDatabase } from './src/database/db.js';
import { convertNLtoSQL } from './src/llm/nl-to-sql.js';
import { generatePDFReport } from './src/utils/pdf-generator.js';
import readline from 'readline';
import fs from 'fs';

const db = new MedicalDatabase('./medical_data.db');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function cleanValue(value) {
  if (!value) return '';
  let str = String(value);
  str = str.replace(/^b'|'$/g, '');
  return str;
}

console.log('🏥 MEDICAL DATA CHATBOT');
console.log('='*70);
console.log('\n✨ Powered by LLaMA 3.1');
console.log('\nCommands: "schema", "stats", "pdf", "exit"\n');
console.log('='*70 + '\n');

let lastResult = null;
let lastQuery = null;

async function processQuery(input) {
  try {
    if (input.toLowerCase() === 'schema') {
      console.log('\n' + db.getSchema());
      return;
    }
    
    if (input.toLowerCase() === 'stats') {
      const stats = db.getStats();
      console.log('\n📊 Database Statistics:\n');
      Object.entries(stats).forEach(([table, count]) => {
        console.log(`  ${table}: ${count.toLocaleString()} records`);
      });
      console.log();
      return;
    }
    
    if (input.toLowerCase() === 'pdf') {
      if (!lastResult || lastResult.rowCount === 0) {
        console.log('\n⚠️  No results to export. Run a query first!\n');
        return;
      }
      
      const timestamp = Date.now();
      const reportPath = `./reports/report_${timestamp}.pdf`;
      
      if (!fs.existsSync('./reports')) {
        fs.mkdirSync('./reports', { recursive: true });
      }
      
      console.log('\n📄 Generating PDF...');
      await generatePDFReport(lastResult.data, lastQuery, reportPath);
      console.log(`✅ Saved: ${reportPath}\n`);
      return;
    }
    
    let sql;
    
    if (input.toUpperCase().startsWith('SELECT')) {
      sql = input;
      console.log('\n📝 Using SQL directly\n');
    } else {
      console.log('\n🤔 Converting to SQL...');
      const schema = db.getSchema();
      sql = await convertNLtoSQL(input, schema);
      console.log(`\n📝 SQL:\n${sql}\n`);
    }
    
    console.log('🔍 Executing...\n');
    const result = db.executeQuery(sql);
    
    if (!result.success) {
      console.log(`❌ Error: ${result.error}\n`);
      return;
    }
    
    lastResult = result;
    lastQuery = input;
    
    console.log(`✅ Found ${result.rowCount} record(s)\n`);
    
    if (result.rowCount === 0) {
      console.log('No results.\n');
      return;
    }
    
    const show = Math.min(10, result.rowCount);
    console.log('┌' + '─'.repeat(68) + '┐');
    
    result.data.slice(0, show).forEach((row, i) => {
      console.log(`│ Record ${i + 1}:`);
      Object.entries(row).forEach(([key, value]) => {
        if (key !== 'id' && value && value !== 'null') {
          const clean = cleanValue(value);
          if (clean) {
            const line = `│   ${key}: ${clean}`;
            console.log(line.substring(0, 70));
          }
        }
      });
      if (i < show - 1) console.log('│ ' + '·'.repeat(66));
    });
    
    console.log('└' + '─'.repeat(68) + '┘');
    
    if (result.rowCount > show) {
      console.log(`\n... and ${result.rowCount - show} more records`);
    }
    
    console.log(`\n💡 Type "pdf" to export these results\n`);
    
  } catch (error) {
    console.log(`\n❌ Error: ${error.message}\n`);
  }
}

function ask() {
  rl.question('💬 Your question: ', async (input) => {
    input = input.trim();
    
    if (!input) {
      ask();
      return;
    }
    
    if (input.toLowerCase() === 'exit' || input.toLowerCase() === 'quit') {
      console.log('\n👋 Goodbye!\n');
      db.close();
      rl.close();
      process.exit(0);
    }
    
    await processQuery(input);
    ask();
  });
}

console.log('Ready! Ask me anything about your clinical trial data.\n');
ask();
