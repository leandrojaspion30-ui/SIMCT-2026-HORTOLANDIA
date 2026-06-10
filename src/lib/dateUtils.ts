/**
 * Formats a date string in YYYY-MM-DD format (or ISO format) safely 
 * into DD/MM/YYYY without any timezone offsets or date-shifting.
 */
export function formatLocalDateString(dateStr: string | undefined | null): string {
  if (!dateStr) return 'N/A';
  
  // Hande full ISO strings by extracting only the date portion
  const dateOnly = dateStr.includes('T') ? dateStr.split('T')[0] : dateStr;
  
  // Split by hyphen or slash
  const parts = dateOnly.split(/[-/]/);
  
  if (parts.length === 3) {
    // If it is in YYYY-MM-DD format
    if (parts[0].length === 4) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    // If it is already in DD-MM-YYYY format
    return `${parts[0]}/${parts[1]}/${parts[2]}`;
  }
  
  return dateStr;
}

/**
 * Parses a date string in YYYY-MM-DD format to a JavaScript Date object
 * in local time midnight. This prevents the browser from interpreting 
 * the date string as UTC midnight, which shifts the date backwards 
 * in timezones behind UTC (like Brazil/Hortolândia - UTC-3).
 */
export function parseLocalDate(dateStr: string | undefined | null): Date {
  if (!dateStr) return new Date();
  
  const dateOnly = dateStr.includes('T') ? dateStr.split('T')[0] : dateStr;
  const parts = dateOnly.split(/[-/]/);
  
  if (parts.length === 3) {
    let year = 2026;
    let month = 0;
    let day = 1;
    
    if (parts[0].length === 4) {
      year = parseInt(parts[0], 10);
      month = parseInt(parts[1], 10) - 1; // months are 0-indexed in JS Dates
      day = parseInt(parts[2], 10);
    } else {
      day = parseInt(parts[0], 10);
      month = parseInt(parts[1], 10) - 1;
      year = parseInt(parts[2], 10);
    }
    
    return new Date(year, month, day, 0, 0, 0, 0);
  }
  
  return new Date(dateOnly);
}

/**
 * Formats the real database creation date (criado_em) into pt-BR local format,
 * with fallbacks to other fields if criado_em is not defined or invalid.
 */
export function formatCadastroDateTime(
  criadoEm: string | undefined | null,
  dataAporte?: string,
  horaAporte?: string
): { date: string; time: string } {
  if (criadoEm) {
    const parsed = new Date(criadoEm);
    if (!isNaN(parsed.getTime())) {
      const date = parsed.toLocaleDateString('pt-BR');
      const time = parsed.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
      return { date, time };
    }
  }
  
  return {
    date: dataAporte ? formatLocalDateString(dataAporte) : 'N/A',
    time: horaAporte || '--:--'
  };
}
