import { MedicalDatabase } from './src/database/db.js';
import { convertNLtoSQL, validateAndRefineSQL } from './src/llm/nl-to-sql.js';
import { generatePDFReport } from './src/utils/pdf-generator.js';
import readline from 'readline';
import fs from 'fs';

const db = new MedicalDatabase('./medical_data.db');

// Create readline interface for chat
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('🏥 MEDICAL DATA CHATBOT');
console.log('='*70);
console.log('\nPowered by LLaMA 3.1 🦙\n');
console.log('Ask questions about your clinical trial data!');
console.log('\nExamples:');
console.log('  - Find patients over 65');
console.log('  - Show me adverse events for patients over 60');
console.log('  - What medications are in the database?');
console.log('  - Get lab results for patient XYZ');
console.log('\nSpecial commands:');
console.log('  - "schema" - Show database structure');
console.log('  - "stats" - Show database statistics');
console.log('  - "help" - Show this help');
console.log('  - "exit" or "quit" - Exit chatbot');
console.log('\n' + '='*70 + '\n');

async function processQuery(query) {
  try {
    // Handle special commands
    if (query.toLowerCase() === 'schema') {
      const schema = db.getSchema();
      console.log('\n' + schema);
      return;
    }
    
    if (query.toLowerCase() === 'stats') {
      const stats = db.getStats();
      console.log('\n📊 Database Statistics:\n');
      Object.entries(stats).forEach(([table, count]) => {
        console.log(`  ${table}: ${count.toLocaleString()} records`);
      });
      console.log();
      return;
    }
    
    if (query.toLowerCase() === 'help') {
      console.log('\n📚 Help:\n');
      console.log('Ask any question about the clinical trial data.');
      console.log('The chatbot will convert your question to SQL and return results.\n');
      console.log('Example queries:');
      console.log('  - "Find all patients over 70"');
      console.log('  - "Show serious adverse events"');
      console.log('  - "Get patients with diabetes"');
      console.log();
      return;
    }
    
    // Process natural language query
    console.log('\n🤔 Thinking...');
    
    const schema = db.getSchema();
    let sql = await convertNLtoSQL(query, schema);
    
    console.log(`\n📝 Generated SQL:\n${sql}\n`);
    
    // Execute query
    console.log('🔍 Executing query...\n');
    let result = db.executeQuery(sql);
    
    // Retry if error
    let retries = 0;
    while (!result.success && retries < 2) {
      console.log(`⚠️  Error: ${result.error}`);
      console.log('🔧 Trying to fix the query...\n');
      
      sql = await validateAndRefineSQL(sql, result.error, schema);
      console.log(`📝 Refined SQL:\n${sql}\n`);
      
      result = db.executeQuery(sql);
      retries++;
    }
    
    if (!result.success) {
      console.log(`❌ Query failed: ${result.error}\n`);
      return;
    }
    
    // Display results
    console.log(`✅ Found ${result.rowCount} record(s)\n`);
    
    if (result.rowCount === 0) {
      console.log('No matching records found.\n');
      return;
    }
    
    // Show first 10 results
    const displayCount = Math.min(10, result.rowCount);
    console.log(`📊 Showing first ${displayCount} results:\n`);
    console.log('─'.repeat(70));
    
    result.data.slice(0, displayCount).forEach((row, i) => {
      console.log(`\nRecord ${i + 1}:`);
      
      // Clean up binary strings and show key fields
      Object.entries(row).forEach(([key, value]) => {
        if (key === 'id') return; // Skip ID
        
        let cleanValue = String(value);
        // Remove b' prefix and trailing '
        cleanValue = cleanValue.replace(/^b'|'$/g, '');
        
        if (cleanValue && cleanValue !== 'null' && cleanValue !== '') {
          console.log(`  ${key}: ${cleanValue}`);
        }
      });
    });
    
    console.log('\n' + '─'.repeat(70));
    
    if (result.rowCount > 10) {
      console.log(`\n... and ${result.rowCount - 10} more records`);
    }
    
    // Ask if user wants PDF
    rl.question('\n📄 Generate PDF report? (yes/no): ', async (answer) => {
      if (answer.toLowerCase() === 'yes' || answer.toLowerCase() === 'y') {
        const timestamp = Date.now();
        const reportPath = `./reports/report_${timestamp}.pdf`;
        
        // Ensure reports directory exists
        if (!fs.existsSync('./reports')) {
          fs.mkdirSync('./reports', { recursive: true });
        }
        
        await generatePDFReport(result.data, query, reportPath);
        console.log(`\n✅ PDF report saved: ${reportPath}\n`);
      }
      
      askQuestion();
    });
    
  } catch (error) {
    console.log(`\n❌ Error: ${error.message}\n`);
    askQuestion();
  }
}

function askQuestion() {
  rl.question('\n💬 Your question (or "exit" to quit): ', async (query) => {
    query = query.trim();
    
    if (!query) {
      askQuestion();
      return;
    }
    
    if (query.toLowerCase() === 'exit' || query.toLowerCase() === 'quit') {
      console.log('\n👋 Goodbye! Closing database...\n');
      db.close();
      rl.close();
      process.exit(0);
    }
    
    await processQuery(query);
    
    // Only ask next question if PDF generation wasn't triggered
    if (!query.includes('Generate PDF')) {
      askQuestion();
    }
  });
}

// Start the chatbot
askQuestion();
