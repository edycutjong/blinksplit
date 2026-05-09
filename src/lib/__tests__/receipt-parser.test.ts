import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { parseReceipt } from '../receipt-parser';
import * as storeModule from '../store';

// Mock the store module to return predictable demo data
vi.mock('../store', async () => {
  const actual = await vi.importActual<any>('../store');
  return {
    ...actual,
    getDemoReceipt: vi.fn(() => ({
      restaurant: 'Demo Resto',
      items: [{ id: 1, name: 'Demo Item', price: 10 }],
      subtotal: 10,
      tax: 1,
      tip: 2,
      total: 13,
    })),
  };
});

describe('Receipt Parser', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
    vi.clearAllMocks();
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('should use fallback demo data when OPENAI_API_KEY is not set', async () => {
    const consoleLogMock = vi.spyOn(console, 'log').mockImplementation(() => {});
    delete process.env.OPENAI_API_KEY;

    const result = await parseReceipt('base64string');

    expect(result.success).toBe(true);
    expect(result.source).toBe('fallback');
    expect(result.receipt.restaurant).toBe('Demo Resto');
    expect(storeModule.getDemoReceipt).toHaveBeenCalled();
    
    consoleLogMock.mockRestore();
  });

  it('should return AI parsed data when API call succeeds', async () => {
    process.env.OPENAI_API_KEY = 'test-key';

    const mockApiResponse = {
      choices: [
        {
          message: {
            content: JSON.stringify({
              restaurant: 'AI Resto',
              items: [{ name: 'AI Item', price: 20 }],
              subtotal: 20,
              tax: 2,
              tip: 3,
              total: 25,
            }),
          },
        },
      ],
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockApiResponse,
    } as Response);

    const result = await parseReceipt('base64string');

    expect(global.fetch).toHaveBeenCalledWith(
      'https://api.openai.com/v1/chat/completions',
      expect.objectContaining({
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer test-key',
        },
      })
    );

    expect(result.success).toBe(true);
    expect(result.source).toBe('ai');
    expect(result.receipt.restaurant).toBe('AI Resto');
    expect(result.receipt.items[0].name).toBe('AI Item');
    expect(result.receipt.items[0].price).toBe(20);
    expect(result.receipt.subtotal).toBe(20);
  });

  it('should recalculate subtotal and total if missing', async () => {
    process.env.OPENAI_API_KEY = 'test-key';

    const mockApiResponse = {
      choices: [
        {
          message: {
            content: JSON.stringify({
              restaurant: 'AI Resto',
              items: [{ name: 'AI Item', price: 20 }],
              tax: 2,
              tip: 3,
            }),
          },
        },
      ],
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockApiResponse,
    } as Response);

    const result = await parseReceipt('base64string');

    expect(result.success).toBe(true);
    expect(result.receipt.subtotal).toBe(20);
    expect(result.receipt.total).toBe(25);
  });

  it('should clean markdown from JSON response', async () => {
    process.env.OPENAI_API_KEY = 'test-key';

    const jsonString = JSON.stringify({
      restaurant: 'AI Resto',
      items: [{ name: 'AI Item', price: 20 }],
      subtotal: 20,
      tax: 2,
      tip: 3,
      total: 25,
    });

    const mockApiResponse = {
      choices: [
        {
          message: {
            content: `\`\`\`json\n${jsonString}\n\`\`\``,
          },
        },
      ],
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockApiResponse,
    } as Response);

    const result = await parseReceipt('base64string');

    expect(result.success).toBe(true);
    expect(result.source).toBe('ai');
    expect(result.receipt.restaurant).toBe('AI Resto');
  });

  it('should use fallback if API call fails', async () => {
    const consoleErrorMock = vi.spyOn(console, 'error').mockImplementation(() => {});
    process.env.OPENAI_API_KEY = 'test-key';

    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
    } as Response);

    const result = await parseReceipt('base64string');

    expect(result.success).toBe(true);
    expect(result.source).toBe('fallback');
    expect(result.receipt.restaurant).toBe('Demo Resto');
    
    consoleErrorMock.mockRestore();
  });

  it('should use fallback if empty response', async () => {
    const consoleErrorMock = vi.spyOn(console, 'error').mockImplementation(() => {});
    process.env.OPENAI_API_KEY = 'test-key';

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ choices: [] }),
    } as Response);

    const result = await parseReceipt('base64string');

    expect(result.success).toBe(true);
    expect(result.source).toBe('fallback');
    expect(result.receipt.restaurant).toBe('Demo Resto');
    
    consoleErrorMock.mockRestore();
  });
  it('should handle missing fields and string prices', async () => {
    process.env.OPENAI_API_KEY = 'test-key';

    const mockApiResponse = {
      choices: [
        {
          message: {
            content: JSON.stringify({
              items: [{ name: 'AI Item', price: "20.5" }, { name: 'Free Item', price: "abc" }],
            }),
          },
        },
      ],
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockApiResponse,
    } as Response);

    const result = await parseReceipt('base64string');

    expect(result.success).toBe(true);
    expect(result.receipt.restaurant).toBe('Unknown Restaurant');
    expect(result.receipt.items[0].price).toBe(20.5);
    expect(result.receipt.items[1].price).toBe(0);
    expect(result.receipt.subtotal).toBe(20.5);
    expect(result.receipt.tax).toBe(0);
    expect(result.receipt.tip).toBe(0);
    expect(result.receipt.total).toBe(20.5);
  });

  it('should handle missing items array', async () => {
    process.env.OPENAI_API_KEY = 'test-key';

    const mockApiResponse = {
      choices: [
        {
          message: {
            content: JSON.stringify({
              restaurant: 'No Items Resto',
            }),
          },
        },
      ],
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockApiResponse,
    } as Response);

    const result = await parseReceipt('base64string');

    expect(result.success).toBe(true);
    expect(result.receipt.items).toEqual([]);
    expect(result.receipt.subtotal).toBe(0);
  });
});

