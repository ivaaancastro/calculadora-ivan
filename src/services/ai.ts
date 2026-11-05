/**
 * ai.ts — Servicio de IA generativa (Google Gemini).
 *
 * Expone `askGemini`, que recibe una pregunta del usuario y contexto del atleta
 * y devuelve la respuesta del modelo como string. Cuando se pide `structured: true`,
 * devuelve además un objeto tipado (`json`) listo para consumir en la UI.
 *
 * La instancia de GoogleGenerativeAI se crea una sola vez (lazy singleton)
 * para evitar reinstanciar el cliente en cada llamada.
 */
import { GoogleGenerativeAI, Schema } from "@google/generative-ai";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

// Tipos de contexto para askGemini
export interface ActivityContext {
  date: string;
  type: string;
  duration: number;
  tss?: number;
}

export interface GeminiContextData {
  currentMetrics: Record<string, unknown>;
  recentActivities: ActivityContext[];
  nextRace: { name: string } | null;
}

/**
 * Respuesta estructurada del entrenador (modo `structured: true`).
 */
export interface GeminiStructuredResponse {
  analisis: string;
  recomendacion: string;
  ajusteEntrenamiento: 'mantener' | 'reducir' | 'aumentar';
  confianza: number;   // 0-100
  metas: string[];
}

// Tipo de retorno: string por defecto (retrocompatibilidad), objeto con json si structured.
export type GeminiResponse = string | { text: string; json: GeminiStructuredResponse };

// Singleton: se inicializa la primera vez que se llama a askGemini
let _genAI: GoogleGenerativeAI | null = null;
let _model: ReturnType<GoogleGenerativeAI['getGenerativeModel']> | null = null;

function getModel() {
  if (!API_KEY) throw new Error("Falta VITE_GEMINI_API_KEY en el archivo .env");
  if (!_model) {
    _genAI = new GoogleGenerativeAI(API_KEY);
    _model = _genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  }
  return _model;
}

/**
 * Schema JSON que Gemini debe respetar en modo estructurado.
 */
const structuredResponseSchema: Schema = {
  type: "object",
  properties: {
    analisis: { type: "string", description: "Análisis breve del estado actual del atleta" },
    recomendacion: { type: "string", description: "Recomendación concreta y accionable" },
    ajusteEntrenamiento: {
      type: "string",
      enum: ["mantener", "reducir", "aumentar"],
      description: "Ajuste sugerido de la carga de entrenamiento",
    },
    confianza: {
      type: "number",
      description: "Nivel de confianza en el análisis (0-100)",
    },
    metas: {
      type: "array",
      items: { type: "string" },
      description: "Lista de metas o acciones sugeridas",
    },
  },
  required: ["analisis", "recomendacion", "ajusteEntrenamiento", "confianza", "metas"],
};

/**
 * Construye el prompt base del entrenador con el contexto del atleta.
 */
function buildPrompt(userQuestion: string, contextData: GeminiContextData): string {
  const { currentMetrics, recentActivities, nextRace } = contextData;

  const activitiesSummary = recentActivities.slice(0, 10).map((a) =>
    `- ${new Date(a.date).toLocaleDateString('es-ES')}: ${a.type} (${a.duration}min, TSS ${a.tss || 0})`
  ).join('\n');

  return `
Actúa como un entrenador de triatlón experto y motivador.

PERFIL DEL ATLETA:
- Fitness (CTL): ${Math.round(Number(currentMetrics?.ctl || 0))}
- Forma (TSB):   ${Math.round(Number(currentMetrics?.tsb || 0))} (negativo = cansado, positivo = fresco)
- Fatiga (ATL):  ${Math.round(Number(currentMetrics?.atl || 0))}

PRÓXIMO OBJETIVO: ${nextRace?.name ?? 'Mantener forma'}

ÚLTIMOS ENTRENAMIENTOS:
${activitiesSummary}

PREGUNTA DEL USUARIO: "${userQuestion}"

INSTRUCCIONES:
- Responde en español, de forma breve y directa.
- Basa tu consejo en los datos mostrados arriba.
`.trim();
}

/**
 * Construye el prompt estructurado (pide JSON) basado en el prompt base.
 */
function buildStructuredPrompt(userQuestion: string, contextData: GeminiContextData): string {
  const base = buildPrompt(userQuestion, contextData);
  return `
${base}

RESPUESTA ESTRUCTURADA:
Devuelve EXCLUSIVAMENTE un objeto JSON válido con los siguientes campos:
- analisis: string (análisis breve del estado actual del atleta)
- recomendacion: string (recomendación concreta y accionable)
- ajusteEntrenamiento: "mantener" | "reducir" | "aumentar"
- confianza: number (0-100)
- metas: string[] (lista de metas o acciones sugeridas)

No incluyas texto adicional fuera del JSON.
`.trim();
}

/**
 * Envía una pregunta a Gemini con contexto del atleta y devuelve la respuesta.
 *
 * Por defecto (structured = false/undefined) devuelve un string de texto libre,
 * manteniendo la retrocompatibilidad con llamadas existentes.
 *
 * Cuando structured = true, pide a Gemini una respuesta JSON y devuelve
 * { text, json } con el objeto tipado GeminiStructuredResponse.
 *
 * @param userQuestion - Pregunta del usuario
 * @param contextData - Datos de contexto del atleta
 * @param structured - Si true, solicita y devuelve respuesta estructurada (JSON)
 * @returns Respuesta de texto del modelo, o objeto { text, json } si structured
 */
export const askGemini = async (
  userQuestion: string,
  contextData: GeminiContextData,
  structured?: boolean
): Promise<GeminiResponse> => {
  const model = getModel();

  if (structured) {
    const structuredModel = model as ReturnType<GoogleGenerativeAI['getGenerativeModel']> & {
      generateContent: (prompt: string, config?: { responseMimeType?: string; responseSchema?: Schema }) => ReturnType<ReturnType<GoogleGenerativeAI['getGenerativeModel']>['generateContent']>;
    };

    try {
      const result = await structuredModel.generateContent(
        buildStructuredPrompt(userQuestion, contextData),
        { responseMimeType: "application/json", responseSchema: structuredResponseSchema }
      );
      const response = await result.response;
      const text = response.text();
      let json: GeminiStructuredResponse;
      try {
        json = JSON.parse(text);
      } catch {
        // Fallback: si el JSON no es válido, devolver un objeto seguro sin romper la app
        json = {
          analisis: "No se pudo analizar la respuesta del entrenador.",
          recomendacion: "Inténtalo de nuevo más tarde.",
          ajusteEntrenamiento: "mantener",
          confianza: 0,
          metas: [],
        };
      }
      return { text, json };
    } catch (error: unknown) {
      console.error("Error al llamar a Gemini (modo estructurado):", error);
      const errMsg = error instanceof Error ? error.message : String(error);
      if (errMsg.includes("API key not valid") || errMsg.includes("404")) {
        return {
          text: "Error de permisos: la clave API parece válida, pero el proyecto de Google Cloud no tiene habilitada la 'Generative Language API'.",
          json: {
            analisis: "Error de permisos de la API de Gemini.",
            recomendacion: "Verifica VITE_GEMINI_API_KEY y habilita la Generative Language API en Google Cloud.",
            ajusteEntrenamiento: "mantener",
            confianza: 0,
            metas: [],
          },
        };
      }
      return {
        text: "Mi conexión neuronal ha fallado. Inténtalo de nuevo.",
        json: {
          analisis: "Error de conexión con el servicio de IA.",
          recomendacion: "Inténtalo de nuevo más tarde.",
          ajusteEntrenamiento: "mantener",
          confianza: 0,
          metas: [],
        },
      };
    }
  }

  // --- Modo por defecto: texto libre (retrocompatibilidad) ---
  try {
    const result = await model.generateContent(buildPrompt(userQuestion, contextData));
    const response = await result.response;
    return response.text();
  } catch (error: unknown) {
    console.error("Error al llamar a Gemini:", error);

    const errMsg = error instanceof Error ? error.message : String(error);
    if (errMsg.includes("API key not valid") || errMsg.includes("404")) {
      return "Error de permisos: la clave API parece válida, pero el proyecto de Google Cloud no tiene habilitada la 'Generative Language API'.";
    }

    return "Mi conexión neuronal ha fallado. Inténtalo de nuevo.";
  }
};
