/** Recorta `data` al rango [inicio, fin] en %. Con [0,100] (o sin datos) devuelve el mismo array. */
export function sliceByRange(data, [lo, hi]) {
  if (!Array.isArray(data) || data.length === 0 || (lo <= 0 && hi >= 100)) return data;
  const start = Math.floor((lo / 100) * data.length);
  const end = Math.max(start + 2, Math.ceil((hi / 100) * data.length));
  return data.slice(start, end);
}
