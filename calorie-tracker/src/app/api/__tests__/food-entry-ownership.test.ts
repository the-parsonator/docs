import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock prisma before importing the route
vi.mock("@/lib/prisma", () => ({
  prisma: {
    foodEntry: {
      findUnique: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

vi.mock("@/lib/auth", () => ({
  getUserIdFromRequest: vi.fn(),
}));

function makeRequest(id: string): Request {
  return new Request(`http://localhost/api/food-entry/${id}`, { method: "DELETE" });
}

describe("DELETE /api/food-entry/[id] — ownership check", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 403 when the entry belongs to a different user", async () => {
    const { getUserIdFromRequest } = await import("@/lib/auth");
    const { prisma } = await import("@/lib/prisma");
    vi.mocked(getUserIdFromRequest).mockResolvedValue(1);
    vi.mocked(prisma.foodEntry.findUnique).mockResolvedValue({
      id: 42,
      dailyLogId: 10,
      name: "Apple",
      calories: 95,
      timestamp: new Date(),
      dailyLog: { id: 10, userId: 2, date: "2024-01-01", calorieTarget: 2000 },
    } as never);

    const { DELETE } = await import("../food-entry/[id]/route");
    const res = await DELETE(makeRequest("42") as never, {
      params: Promise.resolve({ id: "42" }),
    });
    expect(res.status).toBe(403);
  });

  it("returns 204 when the entry belongs to the authenticated user", async () => {
    const { getUserIdFromRequest } = await import("@/lib/auth");
    const { prisma } = await import("@/lib/prisma");
    vi.mocked(getUserIdFromRequest).mockResolvedValue(1);
    vi.mocked(prisma.foodEntry.findUnique).mockResolvedValue({
      id: 43,
      dailyLogId: 11,
      name: "Banana",
      calories: 105,
      timestamp: new Date(),
      dailyLog: { id: 11, userId: 1, date: "2024-01-01", calorieTarget: 2000 },
    } as never);
    vi.mocked(prisma.foodEntry.delete).mockResolvedValue({} as never);

    const { DELETE } = await import("../food-entry/[id]/route");
    const res = await DELETE(makeRequest("43") as never, {
      params: Promise.resolve({ id: "43" }),
    });
    expect(res.status).toBe(204);
  });

  it("returns 401 when unauthenticated", async () => {
    const { getUserIdFromRequest } = await import("@/lib/auth");
    vi.mocked(getUserIdFromRequest).mockResolvedValue(null);

    const { DELETE } = await import("../food-entry/[id]/route");
    const res = await DELETE(makeRequest("1") as never, {
      params: Promise.resolve({ id: "1" }),
    });
    expect(res.status).toBe(401);
  });

  it("returns 400 for a non-numeric ID", async () => {
    const { getUserIdFromRequest } = await import("@/lib/auth");
    vi.mocked(getUserIdFromRequest).mockResolvedValue(1);

    const { DELETE } = await import("../food-entry/[id]/route");
    const res = await DELETE(makeRequest("abc") as never, {
      params: Promise.resolve({ id: "abc" }),
    });
    expect(res.status).toBe(400);
  });
});
