import { importCSVtoSQLite } from './src/database/import-csv.js';
import Database from 'better-sqlite3';
import fs from 'fs';

const dbPath = './medical_data.db';

const tables = [
  { csv: 'ae.csv', table: 'adverse_events', name: 'Adverse Events' },
  { csv: 'dm.csv', table: 'demographics', name: 'Demographics' },
  { csv: 'lb.csv', table: 'laboratory', name: 'Laboratory' },
  { csv: 'vs.csv', table: 'vital_signs', name: 'Vital Signs' },
  { csv: 'cm.csv', table: 'medications', name: 'Medications' },
  { csv: 'mh.csv', table: 'medical_history', name: 'Medical History' },
];

async function main() {
  console.log('🏥 Importing data to SQLite database...\n');
  
  // Remove old database
  if (fs.existsSync(dbPath)) {
    fs.unlinkSync(dbPath);
  }
  
  for (const table of tables) {
    if (!fs.existsSync(table.csv)) {
      console.log(`⚠️  Skipping ${table.name} (${table.csv} not found)\n`);
      continue;
    }
    
    console.log(`📥 Importing ${table.name}...`);
    await importCSVtoSQLite(table.csv, dbPath, table.table);
    console.log();
  }
  
  // Show summary
  const db = new Database(dbPath);
  console.log('📊 Database Summary:\n');
  
  const dbTables = db.prepare(
    "SELECT name FROM sqlite_master WHERE type='table'"
  ).all();
  
  for (const t of dbTables) {
    const count = db.prepare(`SELECT COUNT(*) as count FROM ${t.name}`).get();
    console.log(`   ${t.name}: ${count.count.toLocaleString()} records`);
  }
  
  db.close();
  console.log(`\n🎉 Database ready: ${dbPath}`);
}

main().catch(console.error);
