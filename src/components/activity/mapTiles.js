// CARTO (basemaps.cartocdn.com) pasó a exigir clave: devuelve teselas con marca de agua. Esri Canvas no la pide.
export const MAP_TILES = {
    light: 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}',
    dark: 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}',
};
