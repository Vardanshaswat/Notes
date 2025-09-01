import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { serializeNote } from "@/types/note";

const COLLECTION = "notes";

// Helper to safely convert string to ObjectId
function asObjectId(id: string) {
  if (!ObjectId.isValid(id)) throw new Error("Invalid note id");
  return new ObjectId(id);
}

// Reusable edit function
async function editNoteById(
  id: string,
  updates: Partial<{
    title: string;
    content: string;
    labels: string[];
    color: string;
    pinned: boolean;
    archived: boolean;
  }>
) {
  const db = await getDb();
  const result = await db.collection(COLLECTION).findOneAndUpdate(
    { _id: asObjectId(id) },
    { $set: { ...updates, updatedAt: new Date() } },
    { returnDocument: "after" }
  );

  if (!result.value) throw new Error("Note not found");
  return result.value;
}

// GET /api/notes/[id]
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    if (!id) return NextResponse.json({ error: "Missing ID" }, { status: 400 });

    const db = await getDb();
    const note = await db.collection(COLLECTION).findOne({ _id: asObjectId(id) });
    if (!note) return NextResponse.json({ error: "Not found" }, { status: 404 });

    return NextResponse.json(serializeNote(note));
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Failed to fetch note" }, { status: 400 });
  }
}

// PATCH /api/notes/[id] → Edit Note
export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    if (!id) return NextResponse.json({ error: "Missing ID" }, { status: 400 });

    const body = await req.json();
    const updates: any = {};

    if (body.title !== undefined) updates.title = String(body.title).trim();
    if (body.content !== undefined) updates.content = String(body.content).trim();
    if (body.labels !== undefined)
      updates.labels = Array.isArray(body.labels) ? body.labels.map(String) : [];
    if (body.color !== undefined) updates.color = String(body.color);
    if (body.pinned !== undefined) updates.pinned = Boolean(body.pinned);
    if (body.archived !== undefined) updates.archived = Boolean(body.archived);

    const updatedNote = await editNoteById(id, updates);
    return NextResponse.json(serializeNote(updatedNote));
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Failed to update note" }, { status: 400 });
  }
}

// DELETE /api/notes/[id]
export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    if (!id) return NextResponse.json({ error: "Missing ID" }, { status: 400 });

    const db = await getDb();
    const res = await db.collection(COLLECTION).deleteOne({ _id: asObjectId(id) });

    if (res.deletedCount === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Failed to delete note" }, { status: 400 });
  }
}
