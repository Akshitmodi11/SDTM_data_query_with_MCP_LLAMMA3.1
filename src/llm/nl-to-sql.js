import { Ollama } from 'ollama';

const ollama = new Ollama({ host: 'http://localhost:11434' });

export async function convertNLtoSQL(naturalLanguageQuery, schema) {
  const prompt = `You are a SQL query generator. Convert natural language to SQL queries ONLY.

${schema}

Important rules:
- Return ONLY the SQL query, nothing else
- NO explanations, NO markdown, NO backticks
- Use LIKE '%text%' for text search (with single quotes)
- Use USUBJID to join tables
- Column names: AETERM (adverse event), AGE (age), SEX (sex), etc.

Query: "${naturalLanguageQuery}"

SQL:`;

  const response = await ollama.generate({
    model: 'llama3.1',
    prompt: prompt,
    stream: false,
    options: {
      temperature: 0.1,
      num_predict: 100
    }
  });

  let sql = response.response.trim();
  
  // Aggressive cleaning
  sql = sql.replace(/```sql\n?/gi, '');
  sql = sql.replace(/```\n?/g, '');
  sql = sql.replace(/^SQL:\s*/i, '');
  sql = sql.replace(/Explanation:.*/s, ''); // Remove everything after "Explanation"
  sql = sql.replace(/\n\n.*/s, ''); // Remove everything after double newline
  
  // Extract just the SELECT statement if there's extra text
  const selectMatch = sql.match(/(SELECT[\s\S]*?);/i);
  if (selectMatch) {
    sql = selectMatch[1] + ';';
  }
  
  // Clean up whitespace
  sql = sql.trim();
  
  // Ensure semicolon at end
  if (!sql.endsWith(';')) {
    sql += ';';
  }
  
  return sql;
}

export async function validateAndRefineSQL(sql, errorMessage, schema) {
  const prompt = `Fix this SQL query. Return ONLY the corrected SQL, nothing else.

${schema}

Failed SQL:
${sql}

Error:
${errorMessage}

Rules:
- Return ONLY SQL
- NO explanations
- Fix the error

Corrected SQL:`;

  const response = await ollama.generate({
    model: 'llama3.1',
    prompt: prompt,
    stream: false,
    options: {
      temperature: 0.1,
      num_predict: 100
    }
  });

  let correctedSQL = response.response.trim();
  
  // Aggressive cleaning
  correctedSQL = correctedSQL.replace(/```sql\n?/gi, '');
  correctedSQL = correctedSQL.replace(/```\n?/g, '');
  correctedSQL = correctedSQL.replace(/^SQL:\s*/i, '');
  correctedSQL = correctedSQL.replace(/Explanation:.*/s, '');
  correctedSQL = correctedSQL.replace(/\n\n.*/s, '');
  
  const selectMatch = correctedSQL.match(/(SELECT[\s\S]*?);/i);
  if (selectMatch) {
    correctedSQL = selectMatch[1] + ';';
  }
  
  correctedSQL = correctedSQL.trim();
  
  if (!correctedSQL.endsWith(';')) {
    correctedSQL += ';';
  }
  
  return correctedSQL;
}
