import { type NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { serializeNote } from "@/types/note";
import { ObjectId } from "mongodb";
import { getSessionCookieFromRequest, verifySessionToken } from "@/lib/auth";
import * as React from 'react'

const COLLECTION = "notes";

export async function GET(req: NextRequest) {
  try {
    const token = getSessionCookieFromRequest(req);
    const session = token ? await verifySessionToken(token) : null;
    if (!session)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const userObjectId = new ObjectId(session.sub);

    const { searchParams } = new URL(req.url);
    const query = searchParams.get("query") || "";
    const label = searchParams.get("label") || "";
    const pinned = searchParams.get("pinned");
    const archived = searchParams.get("archived");
    const limit = Number(searchParams.get("limit") || 100);

    const db = await getDb();
    const col = db.collection(COLLECTION);

    const filter: any = { userId: userObjectId };
    if (query) {
      filter.$or = [
        { title: { $regex: query, $options: "i" } },
        { content: { $regex: query, $options: "i" } },
      ];
    }
    if (label) filter.labels = label;
    if (pinned === "true" || pinned === "false")
      filter.pinned = pinned === "true";
    if (archived === "true" || archived === "false")
      filter.archived = archived === "true";

    const docs = await col
      .find(filter)
      .sort({ pinned: -1, updatedAt: -1 })
      .limit(limit)
      .toArray();
    return NextResponse.json(docs.map(serializeNote));
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Failed to fetch notes" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const token = getSessionCookieFromRequest(req);
    const session = token ? await verifySessionToken(token) : null;
    if (!session)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const userObjectId = new ObjectId(session.sub);

    const body = await req.json();
    const note = {
      userId: userObjectId,
      title: (body.title || "").toString().trim(),
      content: (body.content || "").toString().trim(),
      labels: Array.isArray(body.labels) ? body.labels.map(String) : [],
      color: body.color ? String(body.color) : "",
      pinned: Boolean(body.pinned),
      archived: Boolean(body.archived),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    if (!note.title && !note.content) {
      return NextResponse.json(
        { error: "Title or content is required" },
        { status: 400 }
      );
    }

    const db = await getDb();
    const col = db.collection(COLLECTION);
    const result = await col.insertOne(note);
    const created = await col.findOne({
      _id: result.insertedId,
      userId: userObjectId,
    });
    return NextResponse.json(serializeNote(created), { status: 201 });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Failed to create note" },
      { status: 500 }
    );
  }
}
