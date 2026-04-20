/**
 * ai.js — Servicio de IA generativa (Google Gemini).
 *
 * Expone `askGemini`, que recibe una pregunta del usuario y contexto del atleta
 * y devuelve la respuesta del modelo como string.
 *
 * La instancia de GoogleGenerativeAI se crea una sola vez (lazy singleton)
 * para evitar reinstanciar el cliente en cada llamada.
 */
import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

// Singleton: se inicializa la primera vez que se llama a askGemini
let _genAI = null;
let _model = null;

function getModel() {
    if (!API_KEY) throw new Error("Falta VITE_GEMINI_API_KEY en el archivo .env");
    if (!_model) {
        _genAI = new GoogleGenerativeAI(API_KEY);
        _model = _genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    }
    return _model;
}

/**
 * Envía una pregunta a Gemini con contexto del atleta y devuelve la respuesta.
 *
 * @param {string} userQuestion  - Pregunta del usuario
 * @param {{ currentMetrics: object, recentActivities: object[], nextRace: object|null }} contextData
 * @returns {Promise<string>}    - Respuesta de texto del modelo
 */
export const askGemini = async (userQuestion, contextData) => {
    const model = getModel();

    const { currentMetrics, recentActivities, nextRace } = contextData;

    const activitiesSummary = recentActivities.slice(0, 10).map(a =>
        `- ${new Date(a.date).toLocaleDateString('es-ES')}: ${a.type} (${a.duration}min, TSS ${a.tss || 0})`
    ).join('\n');

    const prompt = `
Actúa como un entrenador de triatlón experto y motivador.

PERFIL DEL ATLETA:
- Fitness (CTL): ${Math.round(currentMetrics?.ctl || 0)}
- Forma (TSB):   ${Math.round(currentMetrics?.tcb || 0)} (negativo = cansado, positivo = fresco)
- Fatiga (ATL):  ${Math.round(currentMetrics?.atl || 0)}

PRÓXIMO OBJETIVO: ${nextRace?.name ?? 'Mantener forma'}

ÚLTIMOS ENTRENAMIENTOS:
${activitiesSummary}

PREGUNTA DEL USUARIO: "${userQuestion}"

INSTRUCCIONES:
- Responde en español, de forma breve y directa.
- Basa tu consejo en los datos mostrados arriba.
`.trim();

    try {
        const result   = await model.generateContent(prompt);
        const response = await result.response;
        return response.text();
    } catch (error) {
        console.error("Error al llamar a Gemini:", error);

        if (error.message?.includes("API key not valid") || error.message?.includes("404")) {
            return "Error de permisos: la clave API parece válida, pero el proyecto de Google Cloud no tiene habilitada la 'Generative Language API'.";
        }

        return "Mi conexión neuronal ha fallado. Inténtalo de nuevo.";
    }
};