import { type NextRequest, NextResponse } from "next/server"
import { getDb } from "@/lib/mongodb"
import { ObjectId } from "mongodb"
import { serializeNote } from "@/types/note"

const COLLECTION = "notes"

function asObjectId(id: string) {
  try {
    return new ObjectId(id)
  } catch {
    throw new Error("Invalid note id")
  }
}

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  try {
    const db = await getDb()
    const col = db.collection(COLLECTION)
    const doc = await col.findOne({ _id: asObjectId(params.id) })
    if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 })
    return NextResponse.json(serializeNote(doc))
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Failed to fetch note" }, { status: 400 })
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json()
    const updates: any = { updatedAt: new Date() }
    if (body.title !== undefined) updates.title = String(body.title).trim()
    if (body.content !== undefined) updates.content = String(body.content).trim()
    if (body.labels !== undefined) updates.labels = Array.isArray(body.labels) ? body.labels.map(String) : []
    if (body.color !== undefined) updates.color = String(body.color)
    if (body.pinned !== undefined) updates.pinned = Boolean(body.pinned)
    if (body.archived !== undefined) updates.archived = Boolean(body.archived)

    const db = await getDb()
    const col = db.collection(COLLECTION)
    const result = await col.findOneAndUpdate(
      { _id: asObjectId(params.id) },
      { $set: updates },
      { returnDocument: "after" },
    )
    const updated = result.value
    if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 })
    return NextResponse.json(serializeNote(updated))
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Failed to update note" }, { status: 400 })
  }
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  try {
    const db = await getDb()
    const col = db.collection(COLLECTION)
    const res = await col.deleteOne({ _id: asObjectId(params.id) })
    if (res.deletedCount === 0) return NextResponse.json({ error: "Not found" }, { status: 404 })
    return NextResponse.json({ ok: true })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Failed to delete note" }, { status: 400 })
  }
}
