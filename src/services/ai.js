// src/services/ai.js
import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

export const askGemini = async (userQuestion, contextData) => {
  if (!API_KEY) throw new Error("Falta la API Key en .env");

  // 1. Inicializar la librería oficial
  const genAI = new GoogleGenerativeAI(API_KEY);
  
  // Usamos el modelo 'gemini-1.5-flash' que es el más rápido y estable actualmente
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const { currentMetrics, recentActivities, nextRace } = contextData;
  
  // 2. Preparar el contexto (Prompt)
  const activitiesSummary = recentActivities.slice(0, 10).map(a => 
    `- ${new Date(a.date).toLocaleDateString()}: ${a.type} (${a.duration}min, ${a.tss || 0} TSS)`
  ).join('\n');

  const prompt = `
    Actúa como un entrenador de triatlón experto y motivador.
    
    PERFIL DEL ATLETA:
    - Fitness (CTL): ${Math.round(currentMetrics?.ctl || 0)}
    - Forma (TSB): ${Math.round(currentMetrics?.tcb || 0)} (Si es negativo, está cansado. Si es positivo, está fresco).
    - Fatiga (ATL): ${Math.round(currentMetrics?.atl || 0)}
    
    PRÓXIMO OBJETIVO: ${nextRace ? `${nextRace.name}` : "Mantener forma"}
    
    ÚLTIMOS ENTRENOS:
    ${activitiesSummary}
    
    PREGUNTA DEL USUARIO: "${userQuestion}"
    
    INSTRUCCIONES:
    - Responde en español, sé breve y directo.
    - Basa tu consejo en los datos de arriba.
  `;

  try {
    // 3. Generar contenido
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    return text;

  } catch (error) {
    console.error("🔥 Error SDK Google:", error);
    
    // Si falla aquí, suele ser porque la API no está habilitada en la consola de Google
    if (error.message.includes("API key not valid") || error.message.includes("404")) {
        return "Error de permisos: Tu API Key parece correcta, pero el proyecto en Google Cloud no tiene habilitada la 'Generative Language API'.";
    }
    
    return "Mi conexión neuronal ha fallado. Inténtalo de nuevo.";
  }
};