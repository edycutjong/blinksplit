import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "./route";
import { parseReceipt } from "@/lib/receipt-parser";

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

vi.mock("@/lib/receipt-parser", () => ({
  parseReceipt: vi.fn(),
}));

describe("parse-receipt API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const createMockRequest = (headers: Record<string, string>, body?: any, formData?: any) => {
    return {
      headers: {
        get: (key: string) => headers[key] || null,
      },
      json: async () => body,
      formData: async () => {
        const fd = new Map();
        if (formData) {
          for (const [key, value] of Object.entries(formData)) {
            fd.set(key, value);
          }
        }
        return {
          get: (key: string) => fd.get(key),
        };
      },
    } as any;
  };

  it("handles JSON with data URL", async () => {
    const mockResult = { restaurant: "Test" };
    vi.mocked(parseReceipt).mockResolvedValue(mockResult as any);

    const req = createMockRequest(
      { "content-type": "application/json" },
      { image: "data:image/png;base64,test-base64-data" }
    );

    const res = await POST(req);
    const data = await res.json();

    expect(parseReceipt).toHaveBeenCalledWith("test-base64-data");
    expect(res.status).toBe(200);
    expect(data).toEqual(mockResult);
  });

  it("returns 400 for JSON missing image", async () => {
    const req = createMockRequest(
      { "content-type": "application/json" },
      { image: "" }
    );

    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("handles multipart/form-data with file", async () => {
    const mockResult = { restaurant: "Form Test" };
    vi.mocked(parseReceipt).mockResolvedValue(mockResult as any);

    const mockFile = {
      arrayBuffer: async () => new TextEncoder().encode("file-content").buffer,
    };

    const req = createMockRequest(
      { "content-type": "multipart/form-data" },
      null,
      { receipt: mockFile }
    );

    const res = await POST(req);
    const data = await res.json();

    // "file-content" encoded in base64 is ZmlsZS1jb250ZW50
    expect(parseReceipt).toHaveBeenCalledWith(Buffer.from("file-content").toString("base64"));
    expect(res.status).toBe(200);
    expect(data).toEqual(mockResult);
  });

  it("returns 400 for multipart missing file", async () => {
    const req = createMockRequest(
      { "content-type": "multipart/form-data" },
      null,
      {}
    );

    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("handles other content types (demo mode)", async () => {
    const mockResult = { restaurant: "Demo Test" };
    vi.mocked(parseReceipt).mockResolvedValue(mockResult as any);

    const req = createMockRequest({ "content-type": "text/plain" });

    const res = await POST(req);
    const data = await res.json();

    expect(parseReceipt).toHaveBeenCalledWith("");
    expect(res.status).toBe(200);
    expect(data).toEqual(mockResult);
  });

  it("handles missing content-type", async () => {
    const mockResult = { restaurant: "No Content Type Test" };
    vi.mocked(parseReceipt).mockResolvedValue(mockResult as any);

    const req = createMockRequest({}); // Headers have no content-type

    const res = await POST(req);
    const data = await res.json();

    expect(parseReceipt).toHaveBeenCalledWith("");
    expect(res.status).toBe(200);
    expect(data).toEqual(mockResult);
  });

  it("handles JSON with raw base64 (no data URL prefix)", async () => {
    const mockResult = { restaurant: "Test" };
    vi.mocked(parseReceipt).mockResolvedValue(mockResult as any);

    const req = createMockRequest(
      { "content-type": "application/json" },
      { image: "test-raw-base64-data" }
    );

    const res = await POST(req);
    const data = await res.json();

    expect(parseReceipt).toHaveBeenCalledWith("test-raw-base64-data");
    expect(res.status).toBe(200);
    expect(data).toEqual(mockResult);
  });

  it("returns 500 on parser error", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    vi.mocked(parseReceipt).mockRejectedValue(new Error("Parse fail"));

    const req = createMockRequest({ "content-type": "text/plain" });

    const res = await POST(req);
    expect(res.status).toBe(500);
    consoleSpy.mockRestore();
  });
});
