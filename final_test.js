import { MedicalDatabase } from './src/database/db.js';

const db = new MedicalDatabase('./medical_data.db');

console.log('🔍 Final Data Check\n');

// Check if ANY adverse events match ANY patients
console.log('1. Checking if adverse events exist for patients over 60:\n');

const result = db.executeQuery(`
  SELECT 
    d.USUBJID as patient_id,
    d.AGE,
    COUNT(ae.AETERM) as ae_count,
    GROUP_CONCAT(ae.AETERM, '; ') as events
  FROM demographics d
  LEFT JOIN adverse_events ae ON d.USUBJID = ae.USUBJID
  WHERE CAST(d.AGE AS INTEGER) > 60
  GROUP BY d.USUBJID, d.AGE
  HAVING ae_count > 0
  LIMIT 10
`);

console.log(`Found ${result.rowCount} patients over 60 with adverse events\n`);
if (result.rowCount > 0) {
  result.data.forEach((row, i) => {
    console.log(`${i + 1}. Age ${row.AGE}: ${row.ae_count} events`);
    console.log(`   Events: ${row.events?.substring(0, 100)}...`);
  });
} else {
  console.log('No matches found - data may need cleaning\n');
  
  // Let's check a specific patient
  console.log('2. Checking one specific patient:\n');
  
  const onePatient = db.executeQuery(`
    SELECT USUBJID FROM demographics LIMIT 1
  `);
  
  const patientId = onePatient.data[0].USUBJID;
  console.log(`Patient ID from demographics: ${patientId}`);
  
  const aeForPatient = db.executeQuery(`
    SELECT USUBJID, AETERM 
    FROM adverse_events 
    WHERE USUBJID = '${patientId}'
    LIMIT 3
  `);
  
  console.log(`\nAdverse events for this patient: ${aeForPatient.rowCount}`);
  if (aeForPatient.rowCount > 0) {
    console.log(aeForPatient.data);
  }
}

db.close();
