/**
 * POST /api/splits/[id]/pay — Simulate payment for a person
 * Used for demo purposes — in production, this would be triggered by Solana tx confirmation webhook.
 */
import { NextRequest, NextResponse } from "next/server";
import { markPaid } from "@/lib/store";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const body = await request.json();
    const { personId } = body;

    if (!personId) {
      return NextResponse.json({ error: "Missing personId" }, { status: 400 });
    }

    const session = await markPaid(id, personId);

    if (!session) {
      return NextResponse.json({ error: "Split not found" }, { status: 404 });
    }

    return NextResponse.json(session);
  } catch (err) {
    console.error("[API] Pay error:", err);
    return NextResponse.json(
      { error: "Failed to process payment" },
      { status: 500 }
    );
  }
}
