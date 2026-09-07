import '@testing-library/jest-dom';
import { vi } from 'vitest';
import { beforeAll, afterEach, afterAll } from 'vitest';
import { setupServer } from 'msw/node';

// Setup Mock Service Worker for API mocking during tests
export const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

// Mock window.matchMedia which is not present in JSDOM but used by Recharts
if (typeof window !== 'undefined') {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation(query => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(), // deprecated
      removeListener: vi.fn(), // deprecated
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });

  // Mock element dimensions for @tanstack/react-virtual and layout components in JSDOM
  if (typeof HTMLElement !== 'undefined') {
    Object.defineProperties(HTMLElement.prototype, {
      offsetHeight: {
        configurable: true,
        get() { return parseFloat(this.style?.height) || 800; }
      },
      offsetWidth: {
        configurable: true,
        get() { return parseFloat(this.style?.width) || 800; }
      },
      clientHeight: {
        configurable: true,
        get() { return parseFloat(this.style?.height) || 800; }
      },
      clientWidth: {
        configurable: true,
        get() { return parseFloat(this.style?.width) || 800; }
      }
    });
  }
}
