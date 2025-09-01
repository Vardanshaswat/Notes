import type { ObjectId } from "mongodb"

export type Note = {
  _id?: ObjectId | string
  userId?: ObjectId | string
  title: string
  content: string
  labels?: string[]
  color?: string
  pinned?: boolean
  archived?: boolean
  createdAt?: string | Date
  updatedAt?: string | Date
}

export function serializeNote(n: any) {
  return {
    ...n,
    _id: n._id?.toString?.() ?? n._id,
    userId: n.userId?.toString?.() ?? n.userId,
    createdAt: typeof n.createdAt === "string" ? n.createdAt : n.createdAt?.toISOString?.(),
    updatedAt: typeof n.updatedAt === "string" ? n.updatedAt : n.updatedAt?.toISOString?.(),
  }
}
