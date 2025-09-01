import { type NextRequest, NextResponse } from "next/server"
import { getDb } from "@/lib/mongodb"
import bcrypt from "bcryptjs"
import { createSessionToken } from "@/lib/auth"

export async function GET() {
  return NextResponse.json(
    { status: "ok", info: "Use POST to create an account at /api/auth/register" },
    { status: 200 },
  )
}

export async function POST(req: NextRequest) {
  try {
    
    const { email, password } = await req.json()
    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 })
    }

    const normalizedEmail = String(email).trim().toLowerCase()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      return NextResponse.json({ error: "Invalid email" }, { status: 400 })
    }
    if (String(password).length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 })
    }

    const db = await getDb()
    const users = db.collection("users")
    const existing = await users.findOne({ email: normalizedEmail })
    if (existing) {
      return NextResponse.json({ error: "Email already registered" }, { status: 409 })
    }

    const passwordHash = await bcrypt.hash(String(password), 10)
    const now = new Date()
    const result = await users.insertOne({
      email: normalizedEmail,
      passwordHash,
      createdAt: now,
      updatedAt: now,
    })
    const userId = result.insertedId.toString()

    const token = await createSessionToken({ sub: userId, email: normalizedEmail })
    const res = NextResponse.json({ user: { id: userId, email: normalizedEmail } }, { status: 201 })
    res.cookies.set("session", token, {
      httpOnly: true,
      path: "/",
      sameSite: "lax",
      secure: true,
      maxAge: 60 * 60 * 24 * 7, // 7 days
    })
    return res
  } catch (err: any) {
    console.log("[ /api/auth/register error:", err?.message)
    return NextResponse.json({ error: err?.message || "Registration failed" }, { status: 500 })
  }
}
