import Database from 'better-sqlite3';

export class MedicalDatabase {
  constructor(dbPath) {
    this.db = new Database(dbPath);
    this.db.pragma('journal_mode = WAL');
  }

  getSchema() {
    const tables = this.db.prepare(
      "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'"
    ).all();
    
    let schema = '=== CLINICAL TRIAL DATABASE SCHEMA ===\n\n';
    
    for (const table of tables) {
      const columns = this.db.prepare(`PRAGMA table_info(${table.name})`).all();
      const count = this.db.prepare(`SELECT COUNT(*) as count FROM ${table.name}`).get();
      
      schema += `TABLE: ${table.name.toUpperCase()} (${count.count} records)\n`;
      schema += 'Key Columns:\n';
      
      columns.slice(0, 10).forEach(col => {
        schema += `  - ${col.name}\n`;
      });
      
      if (columns.length > 10) {
        schema += `  ... and ${columns.length - 10} more columns\n`;
      }
      
      schema += '\n';
    }
    
    schema += '\nCommon Query Patterns:\n';
    schema += '- Find patients by age: SELECT * FROM demographics WHERE AGE > 65\n';
    schema += '- Find adverse events: SELECT * FROM adverse_events WHERE AETERM LIKE "%pain%"\n';
    schema += '- Join tables: Use USUBJID to link patients across tables\n';
    
    return schema;
  }

  executeQuery(sql) {
    try {
      const stmt = this.db.prepare(sql);
      const results = stmt.all();
      return { success: true, data: results, rowCount: results.length };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  getStats() {
    const tables = this.db.prepare(
      "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'"
    ).all();
    
    const stats = {};
    for (const table of tables) {
      const count = this.db.prepare(`SELECT COUNT(*) as count FROM ${table.name}`).get();
      stats[table.name] = count.count;
    }
    return stats;
  }

  close() {
    this.db.close();
  }
}
