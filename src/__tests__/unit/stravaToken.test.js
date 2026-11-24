import { describe, it, expect, vi, beforeEach } from 'vitest';

const invokeMock = vi.fn();
vi.mock('../../supabase', () => ({
  supabase: { functions: { invoke: (...args) => invokeMock(...args) } },
}));

import { exchangeStravaCode, refreshStravaToken } from '../../services/stravaToken';

const TOKENS = { access_token: 'a', refresh_token: 'r', expires_at: 123 };

describe('stravaToken (Edge Function strava-token)', () => {
  beforeEach(() => invokeMock.mockReset());

  it('canjea el código con grant_type=authorization_code', async () => {
    invokeMock.mockResolvedValue({ data: TOKENS, error: null });
    await expect(exchangeStravaCode('abc')).resolves.toEqual(TOKENS);
    expect(invokeMock).toHaveBeenCalledWith('strava-token', {
      body: { grant_type: 'authorization_code', code: 'abc' },
    });
  });

  it('refresca con grant_type=refresh_token', async () => {
    invokeMock.mockResolvedValue({ data: TOKENS, error: null });
    await expect(refreshStravaToken('rt')).resolves.toEqual(TOKENS);
    expect(invokeMock).toHaveBeenCalledWith('strava-token', {
      body: { grant_type: 'refresh_token', refresh_token: 'rt' },
    });
  });

  it('nunca envía el secreto de cliente', async () => {
    invokeMock.mockResolvedValue({ data: TOKENS, error: null });
    await exchangeStravaCode('abc');
    await refreshStravaToken('rt');
    for (const [, opts] of invokeMock.mock.calls) {
      expect(Object.keys(opts.body)).not.toContain('client_secret');
    }
  });

  it('propaga el mensaje { error } de la función', async () => {
    invokeMock.mockResolvedValue({
      data: null,
      error: { message: 'Edge Function returned a non-2xx status code', context: { json: async () => ({ error: 'Bad Request' }) } },
    });
    await expect(exchangeStravaCode('caducado')).rejects.toThrow('Bad Request');
  });

  it('usa el mensaje del error si el cuerpo no es JSON', async () => {
    invokeMock.mockResolvedValue({
      data: null,
      error: { message: 'Failed to send a request to the Edge Function', context: { json: async () => { throw new Error('x'); } } },
    });
    await expect(refreshStravaToken('rt')).rejects.toThrow('Failed to send a request to the Edge Function');
  });

  it('rechaza una respuesta sin access_token', async () => {
    invokeMock.mockResolvedValue({ data: {}, error: null });
    await expect(exchangeStravaCode('abc')).rejects.toThrow('Respuesta de token de Strava inválida');
  });
});
