import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET, POST, OPTIONS } from "./route";
import { getSplit } from "@/lib/store";
import { createPostResponse } from "@solana/actions";


vi.mock("next/server", () => {
  return {
    NextResponse: {
      json: vi.fn((data, options) => ({
        status: options?.status || 200,
        json: async () => data,
      })),
    },
  };
});

vi.mock("@/lib/store", () => ({
  getSplit: vi.fn(),
}));

vi.mock("@solana/actions", () => ({
  createPostResponse: vi.fn().mockResolvedValue({ some: "response" }),
  ACTIONS_CORS_HEADERS: { "X-Cors": "test" },
}));

vi.mock("@solana/web3.js", () => {
  class MockPublicKey {
    key: string;
    constructor(key: string) {
      this.key = key;
    }
    toBase58() {
      return this.key;
    }
  }

  class MockConnection {
    getLatestBlockhash() {
      return Promise.resolve({ blockhash: "test-blockhash" });
    }
  }

  class MockTransaction {
    add() {
      return this;
    }
  }

  return {
    Connection: MockConnection,
    PublicKey: MockPublicKey,
    Transaction: MockTransaction,
  };
});

vi.mock("@solana/spl-token", () => ({
  createTransferInstruction: vi.fn(),
  getAssociatedTokenAddress: vi.fn().mockResolvedValue({ toBase58: () => "test-ata" }),
}));

describe("Solana actions pay API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const createMockRequest = (body?: any) => {
    return {
      json: async () => body,
    } as any;
  };

  describe("OPTIONS", () => {
    it("returns CORS headers", async () => {
      const res = await OPTIONS();
      expect(res.headers.get("X-Cors")).toBe("test");
    });
  });

  describe("GET", () => {
    it("returns 404 if split not found", async () => {
      vi.mocked(getSplit).mockResolvedValue(undefined as any);

      const res = await GET(createMockRequest(), { params: Promise.resolve({ paymentId: "splitId_p1" }) });
      const data = await res.json();

      expect(res.status).toBe(404);
      expect(data.error).toBe("Payment not found");
    });

    it("returns 404 if blink not found", async () => {
      vi.mocked(getSplit).mockResolvedValue({ blinks: [] } as any);

      const res = await GET(createMockRequest(), { params: Promise.resolve({ paymentId: "splitId_p1" }) });
      const data = await res.json();

      expect(res.status).toBe(404);
      expect(data.error).toBe("Blink not found");
    });

    it("returns action payload if blink found", async () => {
      vi.mocked(getSplit).mockResolvedValue({
        receipt: { restaurant: "Test Place" },
        blinks: [{ personId: "p1", name: "Alice", totalOwed: 15.5, items: [{ name: "Burger" }] }],
      } as any);

      const res = await GET(createMockRequest(), { params: Promise.resolve({ paymentId: "splitId_p1" }) });
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.type).toBe("action");
      expect(data.title).toContain("Alice");
      expect(data.description).toContain("Test Place");
    });
  });

  describe("POST", () => {
    it("returns 400 if account missing", async () => {
      const req = createMockRequest({});
      const res = await POST(req, { params: Promise.resolve({ paymentId: "s_p1" }) });
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.error).toBe("Missing account (payer wallet)");
    });

    it("returns 404 if split not found", async () => {
      vi.mocked(getSplit).mockResolvedValue(undefined as any);
      
      const req = createMockRequest({ account: "wallet" });
      const res = await POST(req, { params: Promise.resolve({ paymentId: "s_p1" }) });
      const data = await res.json();

      expect(res.status).toBe(404);
      expect(data.error).toBe("Payment not found");
    });

    it("returns 404 if blink not found", async () => {
      vi.mocked(getSplit).mockResolvedValue({ blinks: [] } as any);
      
      const req = createMockRequest({ account: "wallet" });
      const res = await POST(req, { params: Promise.resolve({ paymentId: "s_p1" }) });
      const data = await res.json();

      expect(res.status).toBe(404);
      expect(data.error).toBe("Blink not found");
    });

    it("returns action response", async () => {
      vi.mocked(getSplit).mockResolvedValue({
        receipt: { restaurant: "Place" },
        blinks: [{ personId: "p1", name: "Alice", totalOwed: 10, items: [] }],
      } as any);

      const req = createMockRequest({ account: "11111111111111111111111111111111" });
      const res = await POST(req, { params: Promise.resolve({ paymentId: "s_p1" }) });
      const data = await res.json();

      expect(createPostResponse).toHaveBeenCalled();
      expect(res.status).toBe(200);
      expect(data.some).toBe("response");
    });

    it("returns fallback on error", async () => {
      vi.mocked(getSplit).mockResolvedValue({
        receipt: { restaurant: "Place" },
        blinks: [{ personId: "p1", name: "Alice", totalOwed: 10, items: [] }],
      } as any);

      vi.mocked(createPostResponse).mockRejectedValue(new Error("fail"));

      const req = createMockRequest({ account: "11111111111111111111111111111111" });
      const res = await POST(req, { params: Promise.resolve({ paymentId: "s_p1" }) });
      const data = await res.json();

      expect(res.status).toBe(200); // the fallback returns 200
      expect(data.transaction).toBe("base64_demo_tx");
    });
  });
});
