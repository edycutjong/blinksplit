import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  getSplit,
  createSplit,
  updateAssignments,
  generateBlinks,
  markPaid,
  getAllSplits,
  getDemoReceipt,
  getDemoPeople,
} from "../store";
import { supabase as _supabase } from "../supabase";

const supabase = _supabase as any;

vi.mock("../supabase", () => {
  const mockSupabase = {
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn(),
    order: vi.fn(),
  };
  return { supabase: mockSupabase };
});

describe("store", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getDemoReceipt & getDemoPeople", () => {
    it("generates a valid demo receipt", () => {
      const receipt = getDemoReceipt();
      expect(receipt.restaurant).toBeDefined();
      expect(receipt.items.length).toBeGreaterThanOrEqual(3);
      expect(receipt.items.length).toBeLessThanOrEqual(6);
      expect(receipt.subtotal).toBeGreaterThan(0);
      expect(receipt.tax).toBeGreaterThan(0);
      expect(receipt.tip).toBeGreaterThan(0);
      expect(receipt.total).toBeCloseTo(receipt.subtotal + receipt.tax + receipt.tip, 2);
    });

    it("generates valid demo people", () => {
      const people = getDemoPeople();
      expect(people.length).toBeGreaterThanOrEqual(2);
      expect(people.length).toBeLessThanOrEqual(6);
      expect(people[0].id).toBe("p1");
      expect(people[1].id).toBe("p2");
    });
  });

  describe("getSplit", () => {
    it("returns undefined if error occurs", async () => {
      (supabase.eq as any).mockReturnThis();
      (supabase.single as any).mockResolvedValue({ data: null, error: new Error("Test error") });

      const result = await getSplit("test-id");
      expect(result).toBeUndefined();
    });

    it("returns undefined if no data", async () => {
      (supabase.single as any).mockResolvedValue({ data: null, error: null });

      const result = await getSplit("test-id");
      expect(result).toBeUndefined();
    });

    it("returns formatted split session if successful", async () => {
      const mockData = {
        id: "test-id",
        receipt: { total: 100 },
        people: [{ name: "Alice" }],
        assignments: {},
        blinks: [],
        created_at: "2024-01-01T00:00:00Z",
        status: "assigning",
      };
      (supabase.single as any).mockResolvedValue({ data: mockData, error: null });

      const result = await getSplit("test-id");
      expect(result).toEqual({
        id: mockData.id,
        receipt: mockData.receipt,
        people: mockData.people,
        assignments: mockData.assignments,
        blinks: mockData.blinks,
        createdAt: mockData.created_at,
        status: mockData.status,
      });
      expect(supabase.from).toHaveBeenCalledWith("splits");
      expect(supabase.select).toHaveBeenCalledWith("*");
      expect(supabase.eq).toHaveBeenCalledWith("id", "test-id");
    });
  });

  describe("createSplit", () => {
    it("creates a split and returns it", async () => {
      (supabase.insert as any).mockResolvedValue({ error: null });
      const receipt = getDemoReceipt();
      
      const result = await createSplit(receipt);
      expect(result.id).toBeDefined();
      expect(result.receipt).toEqual(receipt);
      expect(result.status).toBe("assigning");
      expect(supabase.from).toHaveBeenCalledWith("splits");
      expect(supabase.insert).toHaveBeenCalled();
    });

    it("throws error if insert fails", async () => {
      const consoleErrorMock = vi.spyOn(console, 'error').mockImplementation(() => {});
      (supabase.insert as any).mockResolvedValue({ error: new Error("Insert failed") });
      const receipt = getDemoReceipt();
      
      await expect(createSplit(receipt)).rejects.toThrow("Failed to create split");
      consoleErrorMock.mockRestore();
    });
  });

  describe("updateAssignments", () => {
    it("updates assignments and returns split", async () => {
      (supabase.update as any).mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null })
      });
      const mockData = { id: "test-id", status: "assigning" };
      (supabase.select as any).mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: mockData, error: null })
        })
      });
      
      const assignments = { 1: ["p1"] };
      const people = getDemoPeople();
      
      const result = await updateAssignments("test-id", assignments, people);
      expect(supabase.update).toHaveBeenCalledWith({ assignments, people });
      expect(result).toEqual({
        id: mockData.id,
        status: mockData.status,
      } as any);
    });

    it("returns null if update fails", async () => {
      const consoleErrorMock = vi.spyOn(console, 'error').mockImplementation(() => {});
      (supabase.update as any).mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: new Error("Update failed") })
      });
      
      const result = await updateAssignments("test-id", {}, []);
      expect(result).toBeNull();
      consoleErrorMock.mockRestore();
    });

    it("returns null if getSplit fails after update", async () => {
      (supabase.update as any).mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null })
      });
      (supabase.select as any).mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: null, error: new Error("Not found") })
        })
      });
      
      const result = await updateAssignments("test-id", {}, []);
      expect(result).toBeNull();
    });
  });

  describe("generateBlinks", () => {
    it("generates blinks for assignments and updates status", async () => {
      const mockSession = {
        id: "test-split",
        receipt: {
          items: [
            { id: 1, name: "Pizza", price: 20 },
            { id: 2, name: "Salad", price: 10 }
          ],
          subtotal: 30,
          tax: 3,
          tip: 6,
          total: 39
        },
        people: [
          { id: "p1", name: "Alice", wallet: "wallet1" },
          { id: "p2", name: "Bob", wallet: "wallet2" }
        ],
        assignments: {
          1: ["p1", "p2"], // Pizza split by 2
          2: ["p1"], // Salad only p1
          999: ["p1"] // Unknown item to test line 155 branch
        },
        blinks: [],
        status: "assigning"
      };

      (supabase.select as any).mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: mockSession, error: null })
        })
      });

      const updateEqMock = vi.fn().mockResolvedValue({ error: null });
      (supabase.update as any).mockReturnValue({ eq: updateEqMock });

      await generateBlinks("test-split", "http://localhost");
      
      expect(supabase.update).toHaveBeenCalled();
    });

    it("returns null if session not found", async () => {
      (supabase.select as any).mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: null, error: null })
        })
      });

      const result = await generateBlinks("test-split", "http://localhost");
      expect(result).toBeNull();
    });

    it("returns null if update fails", async () => {
      const consoleErrorMock = vi.spyOn(console, 'error').mockImplementation(() => {});
      (supabase.select as any).mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: { id: "test", receipt: { items: [], subtotal: 10, tax: 1, tip: 1 }, people: [], assignments: {} }, error: null })
        })
      });

      (supabase.update as any).mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: new Error("Update fail") })
      });

      const result = await generateBlinks("test-split", "http://localhost");
      expect(result).toBeNull();
      consoleErrorMock.mockRestore();
    });

    it("returns null if final getSplit returns undefined", async () => {
      let callCount = 0;
      (supabase.select as any).mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockImplementation(() => {
            callCount++;
            if (callCount === 1) {
              return Promise.resolve({ data: { id: "test", receipt: { items: [], subtotal: 10, tax: 1, tip: 1 }, people: [], assignments: {} }, error: null });
            }
            return Promise.resolve({ data: null, error: null });
          })
        })
      });

      (supabase.update as any).mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null })
      });

      const result = await generateBlinks("test-split", "http://localhost");
      expect(result).toBeNull();
    });
  });

  describe("markPaid", () => {
    it("updates person blink to paid and checks overall status", async () => {
      const mockSession = {
        id: "test-split",
        blinks: [
          { personId: "p1", paymentStatus: "pending" },
          { personId: "p2", paymentStatus: "paid" }
        ],
        status: "generated"
      };

      (supabase.select as any).mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: mockSession, error: null })
        })
      });

      const updateEqMock = vi.fn().mockResolvedValue({ error: null });
      (supabase.update as any).mockReturnValue({ eq: updateEqMock });

      await markPaid("test-split", "p1");

      expect(supabase.update).toHaveBeenCalled();
      const updateArgs = (supabase.update as any).mock.calls[0][0];
      
      expect(updateArgs.status).toBe("complete");
    });

    it("does not change status to complete if some are still pending", async () => {
      const mockSession = {
        id: "test-split",
        blinks: [
          { personId: "p1", paymentStatus: "pending" },
          { personId: "p2", paymentStatus: "pending" } // p2 still pending
        ],
        status: "generated"
      };

      (supabase.select as any).mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: mockSession, error: null })
        })
      });

      const updateEqMock = vi.fn().mockResolvedValue({ error: null });
      (supabase.update as any).mockReturnValue({ eq: updateEqMock });

      await markPaid("test-split", "p1");

      expect(supabase.update).toHaveBeenCalled();
      const updateArgs = (supabase.update as any).mock.calls[0][0];
      
      expect(updateArgs.status).toBe("generated"); // unchanged
    });

    it("returns null if session not found", async () => {
      (supabase.select as any).mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: null, error: null })
        })
      });

      const result = await markPaid("test-split", "p1");
      expect(result).toBeNull();
    });

    it("returns null if update fails", async () => {
      const consoleErrorMock = vi.spyOn(console, 'error').mockImplementation(() => {});
      (supabase.select as any).mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: { blinks: [] }, error: null })
        })
      });

      (supabase.update as any).mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: new Error("fail") })
      });

      const result = await markPaid("test-split", "p1");
      expect(result).toBeNull();
      consoleErrorMock.mockRestore();
    });

    it("returns null if final getSplit returns undefined", async () => {
      let callCount = 0;
      (supabase.select as any).mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockImplementation(() => {
            callCount++;
            if (callCount === 1) {
              return Promise.resolve({ data: { id: "test", blinks: [] }, error: null });
            }
            return Promise.resolve({ data: null, error: null });
          })
        })
      });

      (supabase.update as any).mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null })
      });

      const result = await markPaid("test-split", "p1");
      expect(result).toBeNull();
    });
  });

  describe("getAllSplits", () => {
    it("returns list of splits", async () => {
      const mockData = [
        { id: "1", receipt: {}, people: [], assignments: {}, blinks: [], created_at: "date1", status: "assigning" },
        { id: "2", receipt: {}, people: [], assignments: {}, blinks: [], created_at: "date2", status: "complete" }
      ];

      (supabase.select as any).mockReturnValue({
        order: vi.fn().mockResolvedValue({ data: mockData, error: null })
      });

      const result = await getAllSplits();
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe("1");
      expect(result[1].id).toBe("2");
      expect(supabase.from).toHaveBeenCalledWith("splits");
      expect(supabase.select).toHaveBeenCalledWith("*");
    });

    it("returns empty array on error or no data", async () => {
      (supabase.select as any).mockReturnValue({
        order: vi.fn().mockResolvedValue({ data: null, error: new Error("Failed") })
      });

      const result = await getAllSplits();
      expect(result).toEqual([]);
    });
  });
});
