/**
 * parser.js — Utilidades de análisis de datos de entrada.
 *
 * Módulo con parsers para:
 *  - CSV manual (exportaciones de Strava, Garmin, etc.)
 *  - Fechas en formato español (para importaciones desde archivos en locale es-ES)
 */

/**
 * Parsea un string CSV en un array bidimensional de strings.
 * Gestiona correctamente campos entrecomillados (incluyendo comas y saltos de línea dentro).
 * Compatible con CRLF, LF y CR como separadores de línea.
 *
 * @param {string} text  - Contenido raw del archivo CSV
 * @returns {string[][]} - Array de filas, cada fila es un array de campos
 *
 * @example
 * parseCSV('"Nombre","Fecha"\n"Rodaje Easy","1 ene 2024"')
 * // → [['Nombre', 'Fecha'], ['Rodaje Easy', '1 ene 2024']]
 */
export const parseCSV = (text) => {
    const rows = [];
    let currentRow = [];
    let currentField = '';
    let inQuotes = false;

    // Normalizar saltos de línea a \n
    const cleanText = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

    for (let i = 0; i < cleanText.length; i++) {
        const char     = cleanText[i];
        const nextChar = cleanText[i + 1];

        if (char === '"') {
            if (inQuotes && nextChar === '"') {
                // Comilla escapada dentro de campo entrecomillado: "" → "
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

    // Última fila (sin salto de línea al final)
    if (currentField || currentRow.length > 0) {
        currentRow.push(currentField);
        rows.push(currentRow);
    }

    return rows;
};

/**
 * Parsea una fecha en formato español (Strava/Garmin locale es-ES) a ISO 8601.
 * Soporta abreviaturas de mes cortas y largas, con y sin coma.
 *
 * Formatos aceptados:
 *  - "1 ene 2024"
 *  - "15 enero 2024 09:30:00"
 *  - "3 ago. 2023, 08:15:00"
 *
 * @param {string|null} dateStr  - String de fecha en español
 * @returns {string|null}        - Fecha en ISO 8601 ('YYYY-MM-DDTHH:mm:ss.sssZ') o null si no se pudo parsear
 */
export const parseStravaDate = (dateStr) => {
    if (!dateStr) return null;

    try {
        const cleanStr = dateStr.replace(/"/g, '').trim();

        // Mapa de meses en español (abreviados y completos) → inglés (para new Date())
        const MONTH_MAP = {
            'ene': 'Jan', 'feb': 'Feb', 'mar': 'Mar', 'abr': 'Apr',
            'may': 'May', 'jun': 'Jun', 'jul': 'Jul', 'ago': 'Aug',
            'sep': 'Sep', 'sept': 'Sep', 'oct': 'Oct', 'nov': 'Nov', 'dic': 'Dec',
            'enero': 'Jan', 'febrero': 'Feb', 'marzo': 'Mar', 'abril': 'Apr',
            'mayo': 'May', 'junio': 'Jun', 'julio': 'Jul', 'agosto': 'Aug',
            'septiembre': 'Sep', 'octubre': 'Oct', 'noviembre': 'Nov', 'diciembre': 'Dec',
        };

        // Extraer partes: día, mes, año y hora opcional
        const parts = cleanStr.replace(/,/g, ' ').split(/\s+/).filter(p => p);

        if (parts.length >= 3) {
            const day      = parts[0];
            const monthRaw = parts[1].toLowerCase().replace('.', '');
            const year     = parts[2];
            const time     = parts[3] || '12:00:00';

            const month        = MONTH_MAP[monthRaw] || monthRaw;
            const parsedDate   = new Date(`${month} ${day} ${year} ${time}`);

            if (!isNaN(parsedDate.getTime())) {
                return parsedDate.toISOString();
            }
        }

        return null;
    } catch {
        return null;
    }
};