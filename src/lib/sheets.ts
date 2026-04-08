/**
 * Fetches data from a published Google Sheet as CSV and parses it into objects.
 * The sheet MUST be published to the web (File > Share > Publish to web > CSV).
 */

const SHEET_ID = '1YMfIOiLlW9P65E3plfGMyTXDgpTLTMrjzoayRYIARHY';
const CSV_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=0`;

export interface SheetJob {
  companyName: string;
  title: string;
  area: string;
  description: string;
  location: string;
  modality: string;
}

function parseCSV(csv: string): string[][] {
  const rows: string[][] = [];
  let current = '';
  let inQuotes = false;
  let row: string[] = [];

  for (let i = 0; i < csv.length; i++) {
    const char = csv[i];
    const next = csv[i + 1];

    if (inQuotes) {
      if (char === '"' && next === '"') {
        current += '"';
        i++; // skip escaped quote
      } else if (char === '"') {
        inQuotes = false;
      } else {
        current += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ',') {
        row.push(current.trim());
        current = '';
      } else if (char === '\n' || (char === '\r' && next === '\n')) {
        row.push(current.trim());
        rows.push(row);
        row = [];
        current = '';
        if (char === '\r') i++; // skip \n after \r
      } else {
        current += char;
      }
    }
  }

  // Push last field/row
  if (current || row.length > 0) {
    row.push(current.trim());
    rows.push(row);
  }

  return rows;
}

export async function fetchJobsFromSheet(): Promise<SheetJob[]> {
  const response = await fetch(CSV_URL);
  if (!response.ok) throw new Error('No se pudo cargar la hoja de vacantes.');

  const csv = await response.text();
  const rows = parseCSV(csv);

  if (rows.length < 2) return []; // Only header or empty

  const headers = rows[0].map(h => h.toLowerCase().trim());
  const colIndex = {
    companyName: headers.indexOf('companyname'),
    title: headers.indexOf('title'),
    area: headers.indexOf('area'),
    description: headers.indexOf('description'),
    location: headers.indexOf('location'),
    modality: headers.indexOf('modality'),
  };

  return rows.slice(1)
    .filter(row => row.some(cell => cell.length > 0)) // Skip empty rows
    .map(row => ({
      companyName: row[colIndex.companyName] || '',
      title: row[colIndex.title] || '',
      area: row[colIndex.area] || '',
      description: row[colIndex.description] || '',
      location: row[colIndex.location] || '',
      modality: row[colIndex.modality] || '',
    }));
}
