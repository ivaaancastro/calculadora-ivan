/**
 * Une clases de Tailwind y descarta los valores falsos (spec-rediseno-02-c2, 6.1).
 * No decide qué clase gana: eso lo sigue haciendo el CSS, como en el JSX original.
 */
export function cx(...parts) {
  return parts
    .flat(Infinity)
    .filter((p) => typeof p === 'string' && p.trim() !== '')
    .map((p) => p.trim())
    .join(' ');
}
