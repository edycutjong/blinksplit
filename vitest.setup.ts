import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock matchMedia
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

// Mock Next.js router
vi.mock('next/navigation', async () => {
  const actual = await vi.importActual<any>('next/navigation');
  return {
    ...actual,
    useRouter: vi.fn(() => ({
      push: vi.fn(),
      replace: vi.fn(),
      prefetch: vi.fn(),
      back: vi.fn(),
    })),
    useParams: vi.fn(() => ({})),
    useSearchParams: vi.fn(() => new URLSearchParams()),
  };
});

// Mock framer-motion to skip animations
vi.mock('framer-motion', async () => {
  const actual = await vi.importActual<any>('framer-motion');
  const React = require('react');
  
  const createMockComponent = (Tag: any) => {
    return React.forwardRef((props: any, ref: any) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { initial, animate, exit, transition, whileHover, whileTap, whileInView, viewport, layout, layoutId, ...rest } = props;
      return React.createElement(Tag, { ref, ...rest });
    });
  };

  return {
    ...actual,
    AnimatePresence: ({ children }: any) => children,
    motion: new Proxy(actual.motion, {
      get: (target, prop) => {
        if (typeof prop === 'string') {
          return createMockComponent(prop);
        }
        return target[prop];
      }
    }),
  };
});

// Polyfill TextEncoder/TextDecoder if needed
if (typeof TextEncoder === 'undefined') {
  const util = require('util');
  global.TextEncoder = util.TextEncoder;
  global.TextDecoder = util.TextDecoder;
}

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Global fetch mock
global.fetch = vi.fn();

// Mock window.alert
window.alert = vi.fn();
