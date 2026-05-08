import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "./route";
import { markPaid } from "@/lib/store";

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
  markPaid: vi.fn(),
}));

describe("pay API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const createMockRequest = (body?: any) => {
    return {
      json: async () => body,
    } as any;
  };

  it("returns 400 if personId is missing", async () => {
    const req = createMockRequest({});
    const res = await POST(req, { params: Promise.resolve({ id: "test-id" }) });
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toBe("Missing personId");
  });

  it("returns 404 if split not found", async () => {
    vi.mocked(markPaid).mockResolvedValue(null as any);

    const req = createMockRequest({ personId: "p1" });
    const res = await POST(req, { params: Promise.resolve({ id: "missing" }) });
    const data = await res.json();

    expect(markPaid).toHaveBeenCalledWith("missing", "p1");
    expect(res.status).toBe(404);
    expect(data.error).toBe("Split not found");
  });

  it("returns 500 on store error", async () => {
    vi.mocked(markPaid).mockRejectedValue(new Error("fail"));

    const req = createMockRequest({ personId: "p1" });
    const res = await POST(req, { params: Promise.resolve({ id: "test-id" }) });
    const data = await res.json();

    expect(res.status).toBe(500);
    expect(data.error).toBe("Failed to process payment");
  });

  it("marks as paid and returns session", async () => {
    const mockSession = { id: "test-id" };
    vi.mocked(markPaid).mockResolvedValue(mockSession as any);

    const req = createMockRequest({ personId: "p1" });
    const res = await POST(req, { params: Promise.resolve({ id: "test-id" }) });
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data).toEqual(mockSession);
  });
});
