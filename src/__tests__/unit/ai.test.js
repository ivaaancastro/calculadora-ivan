import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// ── Mock de @google/generative-ai ──
const generateContentMock = vi.fn();
vi.mock('@google/generative-ai', () => ({
    GoogleGenerativeAI: vi.fn(function (_apiKey) {
        return {
            getGenerativeModel: () => ({
                generateContent: generateContentMock,
            }),
        };
    }),
}));

const contextData = {
    currentMetrics: { ctl: 85, tsb: 10, atl: 75 },
    recentActivities: [
        { date: '2026-01-10', type: 'Ride', duration: 60, tss: 70 },
        { date: '2026-01-09', type: 'Run', duration: 45, tss: 55 },
    ],
    nextRace: { name: 'Media Maratón' },
};

async function importAiWithKey(_apiKey) {
    vi.stubEnv('VITE_GEMINI_API_KEY', _apiKey);
    vi.resetModules();
    const mod = await import('../../../src/services/ai');
    return mod.askGemini;
}

beforeEach(() => {
    generateContentMock.mockReset();
    vi.stubEnv('VITE_GEMINI_API_KEY', 'test-key-123');
    vi.resetModules();
});

afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
});

describe('services - ai.js askGemini', () => {
    it('debe devolver la respuesta de Gemini cuando la API key está configurada', async () => {
        const askGemini = await importAiWithKey('test-key-123');
        generateContentMock.mockResolvedValue({
            response: { text: () => 'Respuesta del entrenador' },
        });

        const result = await askGemini('¿Cómo estoy?', contextData);

        expect(result).toBe('Respuesta del entrenador');
        expect(generateContentMock).toHaveBeenCalledTimes(1);
    });

    it('debe incluir el contexto del atleta en el prompt enviado a Gemini', async () => {
        const askGemini = await importAiWithKey('test-key-123');
        generateContentMock.mockResolvedValue({
            response: { text: () => 'ok' },
        });

        await askGemini('Pregunta test', contextData);

        const prompt = generateContentMock.mock.calls[0][0];
        expect(prompt).toContain('entrenador de triatlón');
        expect(prompt).toContain('Media Maratón');
        expect(prompt).toContain('Pregunta test');
        expect(prompt).toContain('CTL');
        expect(prompt).toContain('TSB');
    });

    it('debe lanzar error si falta VITE_GEMINI_API_KEY', async () => {
        const askGemini = await importAiWithKey(undefined);

        await expect(askGemini('¿Cómo estoy?', contextData)).rejects.toThrow(
            'Falta VITE_GEMINI_API_KEY'
        );
    });

    it('debe manejar errores de llamada a Gemini con mensaje amigable', async () => {
        const askGemini = await importAiWithKey('test-key-123');
        generateContentMock.mockRejectedValue(new Error('API key not valid'));

        const result = await askGemini('¿Cómo estoy?', contextData);

        expect(result).toContain('Error de permisos');
    });

    it('debe manejar errores genéricos de Gemini', async () => {
        const askGemini = await importAiWithKey('test-key-123');
        generateContentMock.mockRejectedValue(new Error('Timeout de red'));

        const result = await askGemini('¿Cómo estoy?', contextData);

        expect(result).toContain('conexión neuronal ha fallado');
    });
});
