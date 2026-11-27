/** Texto de la etiqueta de la banda proyectada según su ancho en px (BUG-10): completo, abreviado o nada. */
export const projectionLabelText = (width) => {
    if (width >= 64) return 'PROYECCIÓN';
    if (width >= 32) return 'PROY.';
    return null;
};
