import { MedicalDatabase } from './src/database/db.js';

const db = new MedicalDatabase('./medical_data.db');

console.log('🧪 Testing Corrected Query\n');

// Correct query for serious adverse events
const sql = `
  SELECT 
    d.USUBJID,
    d.AGE,
    d.SEX,
    ae.AETERM,
    ae.AESER
  FROM demographics d
  JOIN adverse_events ae ON d.USUBJID = ae.USUBJID
  WHERE CAST(d.AGE AS INTEGER) > 60 
  AND ae.AESER = 'Y'
  LIMIT 10;
`;

console.log('SQL Query:');
console.log(sql);

const result = db.executeQuery(sql);

if (result.success) {
  console.log(`\n✅ Found ${result.rowCount} patients over 60 with serious adverse events\n`);
  
  result.data.forEach((row, i) => {
    console.log(`${i + 1}. Patient ${row.USUBJID}: Age ${row.AGE}, ${row.SEX}, Event: ${row.AETERM}`);
  });
} else {
  console.log(`❌ Error: ${result.error}`);
}

db.close();
