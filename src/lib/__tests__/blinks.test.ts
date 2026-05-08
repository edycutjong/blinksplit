import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { BlinkSplitService } from '../blinks';
import { encodeURL, createPostResponse } from '@solana/actions';
import { Connection, PublicKey, SystemProgram } from '@solana/web3.js';

vi.mock('@solana/actions', () => ({
  encodeURL: vi.fn(({ link }) => ({
    toString: () => `solana-action:${link.toString()}`,
  })),
  createPostResponse: vi.fn().mockResolvedValue({
    type: 'transaction',
    transaction: 'base64_tx_mock',
    message: 'Mock message',
  }),
}));

vi.mock('@solana/web3.js', () => {
  const mockTx = {
    add: vi.fn().mockReturnThis(),
  };
  return {
    Connection: vi.fn().mockImplementation(function() {
      return {
        getLatestBlockhash: vi.fn().mockResolvedValue({ blockhash: 'mock-blockhash' }),
      };
    }),
    PublicKey: vi.fn().mockImplementation(function(key) {
      if (key === 'invalid') throw new Error('Invalid pubkey');
      return { toBase58: () => key };
    }),
    Transaction: vi.fn().mockImplementation(function() {
      return mockTx;
    }),
    SystemProgram: {
      transfer: vi.fn(),
    },
  };
});

describe('Blinks SDK', () => {
  let service: BlinkSplitService;
  const originalEnv = process.env;

  beforeEach(() => {
    service = new BlinkSplitService();
    process.env = { ...originalEnv };
    vi.clearAllMocks();
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('generateBlinkUrl', () => {
    it('should generate a blink URL using encodeURL', async () => {
      const url = await service.generateBlinkUrl(10.5, 'recipient_address');
      
      expect(encodeURL).toHaveBeenCalled();
      expect(url).toContain('amount=10.5');
      expect(url).toContain('recipient=recipient_address');
    });

    it('should fallback to string formatting if encodeURL fails', async () => {
      vi.mocked(encodeURL).mockImplementationOnce(() => {
        throw new Error('Encoding failed');
      });

      const url = await service.generateBlinkUrl(20, 'test_recipient');
      
      expect(url).toBe('solana-action:https://blinksplit.com/api/pay?amount=20&to=test_recipient');
    });

    it('should initialize connection only once', async () => {
      await service.generateBlinkUrl(10, 'recip');
      await service.generateBlinkUrl(20, 'recip');
      
      expect(Connection).toHaveBeenCalledTimes(1);
    });
  });

  describe('simulateBlinkTransaction', () => {
    it('should simulate a successful blink transaction', async () => {
      const payload = await service.simulateBlinkTransaction('valid_payer', 5);
      
      expect(Connection).toHaveBeenCalled();
      expect(PublicKey).toHaveBeenCalledWith('valid_payer');
      expect(SystemProgram.transfer).toHaveBeenCalledWith({
        fromPubkey: expect.anything(),
        toPubkey: expect.anything(),
        lamports: 5 * 1e9,
      });
      expect(createPostResponse).toHaveBeenCalled();
      expect(payload).toEqual({
        type: 'transaction',
        transaction: 'base64_tx_mock',
        message: 'Mock message',
      });
    });

    it('should handle uninitialized connection error', async () => {
      // Mock Connection to return null basically by mocking the property
      Object.defineProperty(service, 'connection', {
        value: null,
        writable: true,
      });
      // Skip init by setting initialized to true
      Object.defineProperty(service, 'initialized', {
        value: true,
        writable: true,
      });

      const payload = await service.simulateBlinkTransaction('payer', 10);
      
      expect(payload).toEqual({
        transaction: 'base64_encoded_tx_mock',
        message: 'Fallback: Payment for split bill',
      });
    });

    it('should handle transaction generation error (invalid pubkey)', async () => {
      const payload = await service.simulateBlinkTransaction('invalid', 10);
      
      expect(payload).toEqual({
        transaction: 'base64_encoded_tx_mock',
        message: 'Fallback: Payment for split bill',
      });
    });
  });
});
