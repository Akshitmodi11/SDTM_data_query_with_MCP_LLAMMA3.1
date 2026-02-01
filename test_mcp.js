import { MedicalDatabase } from './src/database/db.js';
import { convertNLtoSQL } from './src/llm/nl-to-sql.js';

const db = new MedicalDatabase('./medical_data.db');

// Test 1: Get schema
console.log('📋 TEST 1: Database Schema');
console.log('='*60);
const schema = db.getSchema();
console.log(schema);

// Test 2: Convert NL to SQL
console.log('\n🧪 TEST 2: Natural Language to SQL');
console.log('='*60);
const query = "Find patients over age 60 with serious adverse events";
console.log(`Query: "${query}"`);

const sql = await convertNLtoSQL(query, schema);
console.log(`\nGenerated SQL:\n${sql}`);

// Test 3: Execute the query
console.log('\n🔍 TEST 3: Execute Query');
console.log('='*60);
const result = db.executeQuery(sql);

if (result.success) {
  console.log(`✅ Success! Found ${result.rowCount} records`);
  if (result.rowCount > 0) {
    console.log('\nFirst 3 results:');
    result.data.slice(0, 3).forEach((row, i) => {
      console.log(`\nRecord ${i + 1}:`);
      console.log(JSON.stringify(row, null, 2));
    });
  }
} else {
  console.log(`❌ Error: ${result.error}`);
}

db.close();
