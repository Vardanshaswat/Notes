import { type NextRequest, NextResponse } from "next/server"
import { getDb } from "@/lib/mongodb"
import bcrypt from "bcryptjs"
import { createSessionToken } from "@/lib/auth"

export async function POST(req: NextRequest) {
  try {
   
    const { email, password } = await req.json()
    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 })
    }
    const normalizedEmail = String(email).trim().toLowerCase()

    const db = await getDb()
    const users = db.collection("users")
    const user = await users.findOne<{ _id: any; email: string; passwordHash: string }>({ email: normalizedEmail })
    if (!user) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    const ok = await bcrypt.compare(String(password), user.passwordHash)
    if (!ok) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    const token = await createSessionToken({ sub: user._id.toString(), email: user.email })
    const res = NextResponse.json({ user: { id: user._id.toString(), email: user.email } })
    res.cookies.set("session", token, {
      httpOnly: true,
      path: "/",
      sameSite: "lax",
      secure: true,
      maxAge: 60 * 60 * 24 * 7,
    })
    return res
  } catch (err: any) {
    
    return NextResponse.json({ error: err?.message || "Login failed" }, { status: 500 })
  }
}
