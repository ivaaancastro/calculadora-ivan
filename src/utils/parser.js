export const parseCSV = (text) => {
  const rows = [];
  let currentRow = [];
  let currentField = '';
  let inQuotes = false;
  
  const cleanText = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  for (let i = 0; i < cleanText.length; i++) {
    const char = cleanText[i];
    const nextChar = cleanText[i + 1];
    
    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        currentField += '"';
        i++; 
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      currentRow.push(currentField);
      currentField = '';
    } else if (char === '\n' && !inQuotes) {
      currentRow.push(currentField);
      rows.push(currentRow);
      currentRow = [];
      currentField = '';
    } else {
      currentField += char;
    }
  }
  if (currentField || currentRow.length > 0) {
    currentRow.push(currentField);
    rows.push(currentRow);
  }
  return rows;
};

export const parseStravaDate = (dateStr) => {
  if (!dateStr) return null;
  try {
    const cleanStr = dateStr.replace(/"/g, '').trim();
    const months = {
      'ene': 'Jan', 'feb': 'Feb', 'mar': 'Mar', 'abr': 'Apr', 'may': 'May', 'jun': 'Jun',
      'jul': 'Jul', 'ago': 'Aug', 'sep': 'Sep', 'sept': 'Sep', 'oct': 'Oct', 'nov': 'Nov', 'dic': 'Dec',
      'enero': 'Jan', 'febrero': 'Feb', 'marzo': 'Mar', 'abril': 'Apr', 'mayo': 'May', 'junio': 'Jun',
      'julio': 'Jul', 'agosto': 'Aug', 'septiembre': 'Sep', 'octubre': 'Oct', 'noviembre': 'Nov', 'diciembre': 'Dec'
    };

    const parts = cleanStr.replace(/,/g, ' ').split(/\s+/).filter(p => p);
    
    if (parts.length >= 3) {
      const day = parts[0];
      const monthRaw = parts[1].toLowerCase().replace('.', '');
      const year = parts[2];
      const time = parts[3] || '12:00:00';
      
      const month = months[monthRaw] || monthRaw; 
      const finalDateStr = `${month} ${day} ${year} ${time}`;
      
      const dateObject = new Date(finalDateStr);
      if (!isNaN(dateObject.getTime())) {
        return dateObject.toISOString();
      }
    }
    return null;
  } catch {
    return null;
  }
};