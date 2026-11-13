import fs from "fs";

interface ParsedFormResponse {
  formType: string;
  formName: string;
  data: Record<string, string>;
  ipAddress: string;
  submittedAt: string;
}

function parseCSV(content: string): string[][] {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentField = "";
  let inQuotes = false;
  
  for (let i = 0; i < content.length; i++) {
    const char = content[i];
    const nextChar = content[i + 1];
    
    if (inQuotes) {
      if (char === '"') {
        if (nextChar === '"') {
          // Escaped quote
          currentField += '"';
          i++;
        } else {
          // End of quoted field
          inQuotes = false;
        }
      } else {
        currentField += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ',') {
        currentRow.push(currentField.trim());
        currentField = "";
      } else if (char === '\n' || (char === '\r' && nextChar === '\n')) {
        if (char === '\r') i++; // Skip \n after \r
        currentRow.push(currentField.trim());
        if (currentRow.length > 1 || currentRow[0] !== "") {
          rows.push(currentRow);
        }
        currentRow = [];
        currentField = "";
      } else if (char !== '\r') {
        currentField += char;
      }
    }
  }
  
  // Handle last field
  if (currentField || currentRow.length > 0) {
    currentRow.push(currentField.trim());
    if (currentRow.length > 1 || currentRow[0] !== "") {
      rows.push(currentRow);
    }
  }
  
  return rows;
}

export function parseFormCSV(
  csvPath: string,
  formType: string,
  formName: string
): ParsedFormResponse[] {
  const content = fs.readFileSync(csvPath, "utf-8");
  const rows = parseCSV(content);
  
  if (rows.length < 2) return [];
  
  const headers = rows[0];
  const responses: ParsedFormResponse[] = [];
  
  // Find important column indices
  const ipIndex = headers.findIndex((h) => h.toLowerCase().includes("ip adres"));
  const dateIndex = headers.findIndex((h) => h.toLowerCase() === "tarih");
  
  // Columns to exclude from data
  const excludePatterns = [
    "giriş kimliği", "ip adres", "form url", "yönlendiren url", 
    "sayfa", "kullanıcı", "tarih", "son değiştirme"
  ];
  
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (row.length < 3) continue;
    
    const data: Record<string, string> = {};
    
    for (let j = 0; j < headers.length && j < row.length; j++) {
      const header = headers[j];
      const value = row[j];
      
      if (!header) continue;
      
      // Check if this column should be excluded
      const headerLower = header.toLowerCase();
      const shouldExclude = excludePatterns.some((p) => headerLower.includes(p));
      
      if (!shouldExclude && value) {
        data[header] = value;
      }
    }
    
    // Skip if no meaningful data
    if (Object.keys(data).length === 0) continue;
    
    const ipAddress = ipIndex >= 0 && row[ipIndex] ? row[ipIndex] : "";
    const submittedAt = dateIndex >= 0 && row[dateIndex] ? parseDate(row[dateIndex]) : new Date().toISOString();
    
    responses.push({
      formType,
      formName,
      data,
      ipAddress,
      submittedAt,
    });
  }
  
  return responses;
}

function parseDate(dateStr: string): string {
  // Parse "14.01.2025 12:01" format
  const match = dateStr.match(/(\d{1,2})\.(\d{1,2})\.(\d{4})\s+(\d{1,2}):(\d{2})/);
  if (match) {
    const [, day, month, year, hour, minute] = match;
    return new Date(
      parseInt(year),
      parseInt(month) - 1,
      parseInt(day),
      parseInt(hour),
      parseInt(minute)
    ).toISOString();
  }
  return new Date().toISOString();
}
