import { MedicalDatabase } from './src/database/db.js';

const db = new MedicalDatabase('./medical_data.db');

console.log('🔍 Data Investigation\n');
console.log('='*70);

// Check 1: Age distribution
console.log('\n1. Age Distribution:');
const ages = db.executeQuery(`
  SELECT AGE, COUNT(*) as count 
  FROM demographics 
  WHERE AGE IS NOT NULL AND AGE != ''
  GROUP BY AGE 
  ORDER BY CAST(AGE AS INTEGER)
`);
console.log(ages.data);

// Check 2: Serious adverse events
console.log('\n2. Serious Adverse Events (AESER values):');
const aeser = db.executeQuery(`
  SELECT AESER, COUNT(*) as count 
  FROM adverse_events 
  GROUP BY AESER
`);
console.log(aeser.data);

// Check 3: Sample adverse events
console.log('\n3. Sample Adverse Events:');
const sample_ae = db.executeQuery(`
  SELECT USUBJID, AETERM, AESER, AESTDTC
  FROM adverse_events 
  LIMIT 5
`);
console.log(sample_ae.data);

// Check 4: Patients with ANY adverse events (not just serious)
console.log('\n4. Patients over 60 with ANY adverse events:');
const any_ae = db.executeQuery(`
  SELECT 
    d.USUBJID,
    d.AGE,
    d.SEX,
    ae.AETERM
  FROM demographics d
  JOIN adverse_events ae ON d.USUBJID = ae.USUBJID
  WHERE CAST(d.AGE AS INTEGER) > 60 
  LIMIT 5
`);
console.log(`Found ${any_ae.rowCount} records`);
if (any_ae.rowCount > 0) {
  console.log(any_ae.data);
}

// Check 5: All patients over 60
console.log('\n5. All patients over 60:');
const over60 = db.executeQuery(`
  SELECT USUBJID, AGE, SEX
  FROM demographics 
  WHERE CAST(AGE AS INTEGER) > 60
`);
console.log(`Found ${over60.rowCount} patients over 60`);
console.log(over60.data);

db.close();
