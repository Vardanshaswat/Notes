// app/api/notes/route.ts
import { type NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { serializeNote } from "@/types/note";
import { getSessionCookieFromRequest, verifySessionToken } from "@/lib/auth";

const COLLECTION = "notes";

// Force Node.js runtime since we import mongodb
export const runtime = "nodejs";

// GET /api/notes -> list all notes for the user
export async function GET(req: NextRequest) {
  try {
    const token = getSessionCookieFromRequest(req);
    const session = token ? await verifySessionToken(token) : null;
    if (!session)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);

    // optional filters (archived, pinned, etc.)
    const filter: any = { userId: new ObjectId(session.sub) };
    if (searchParams.has("archived")) {
      filter.archived = searchParams.get("archived") === "true";
    }
    if (searchParams.has("pinned")) {
      filter.pinned = searchParams.get("pinned") === "true";
    }

    const db = await getDb();
    const col = db.collection(COLLECTION);

    // optional pagination
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const skip = (page - 1) * limit;

    const [notes, total] = await Promise.all([
      col
        .find(filter)
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limit)
        .toArray(),
      col.countDocuments(filter),
    ]);

    return NextResponse.json({
      notes: notes.map(serializeNote),
      total,
      page,
      limit,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Failed to fetch notes" },
      { status: 400 }
    );
  }
}

// POST /api/notes -> create a new note
export async function POST(req: NextRequest) {
  try {
    const token = getSessionCookieFromRequest(req);
    const session = token ? await verifySessionToken(token) : null;
    if (!session)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const now = new Date();

    const newNote = {
      userId: new ObjectId(session.sub),
      title: String(body.title || "").trim(),
      content: String(body.content || "").trim(),
      labels: Array.isArray(body.labels) ? body.labels.map(String) : [],
      color: String(body.color || "default"),
      pinned: Boolean(body.pinned),
      archived: Boolean(body.archived),
      createdAt: now,
      updatedAt: now,
    };

    const db = await getDb();
    const col = db.collection(COLLECTION);

    const result = await col.insertOne(newNote);
    const inserted = { ...newNote, _id: result.insertedId };

    return NextResponse.json(serializeNote(inserted), { status: 201 });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Failed to create note" },
      { status: 400 }
    );
  }
}
