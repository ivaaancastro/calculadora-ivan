/** «Junio de 2026»: solo la primera letra en mayúscula (BUG-8; la clase `capitalize` daba «Junio De 2026»). */
export const monthTitle = (year, month) => {
    const label = new Date(year, month).toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
    return label.charAt(0).toUpperCase() + label.slice(1);
};
