/**
 * GET /api/splits/[id] — Get split session details
 * PUT /api/splits/[id] — Update assignments
 */
import { NextRequest, NextResponse } from "next/server";
import { getSplit, updateAssignments } from "@/lib/store";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getSplit(id);

  if (!session) {
    return NextResponse.json({ error: "Split not found" }, { status: 404 });
  }

  return NextResponse.json(session);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const body = await request.json();
    const session = await updateAssignments(id, body.assignments, body.people);

    if (!session) {
      return NextResponse.json({ error: "Split not found" }, { status: 404 });
    }

    return NextResponse.json(session);
  } catch (err) {
    console.error("[API] Update split error:", err);
    return NextResponse.json(
      { error: "Failed to update split" },
      { status: 500 }
    );
  }
}
