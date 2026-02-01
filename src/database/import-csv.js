import Database from 'better-sqlite3';
import fs from 'fs';
import csv from 'csv-parser';

export async function importCSVtoSQLite(csvFilePath, dbPath, tableName = 'patients') {
  const db = new Database(dbPath);
  
  return new Promise((resolve, reject) => {
    const rows = [];
    let headers = [];
    
    fs.createReadStream(csvFilePath)
      .pipe(csv())
      .on('headers', (headerList) => {
        headers = headerList;
        
        const columns = headers.map(col => 
          `"${col.replace(/"/g, '""')}" TEXT`
        ).join(', ');
        
        const createTableSQL = `
          CREATE TABLE IF NOT EXISTS ${tableName} (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            ${columns}
          )
        `;
        
        db.exec(createTableSQL);
        console.log(`  ✅ Created table: ${tableName}`);
      })
      .on('data', (row) => {
        rows.push(row);
      })
      .on('end', () => {
        if (rows.length === 0) {
          console.log('  ⚠️  No data to import');
          resolve(db);
          return;
        }
        
        const placeholders = headers.map(() => '?').join(', ');
        const columnNames = headers.map(col => `"${col.replace(/"/g, '""')}"`).join(', ');
        
        const insertStmt = db.prepare(
          `INSERT INTO ${tableName} (${columnNames}) VALUES (${placeholders})`
        );
        
        const insertMany = db.transaction((records) => {
          for (const record of records) {
            const values = headers.map(header => record[header] || null);
            insertStmt.run(...values);
          }
        });
        
        insertMany(rows);
        
        console.log(`  ✅ Imported ${rows.length.toLocaleString()} records`);
        resolve(db);
      })
      .on('error', (error) => {
        reject(error);
      });
  });
}
