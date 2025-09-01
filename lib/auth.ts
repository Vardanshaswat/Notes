import { cookies } from "next/headers"
import type { NextRequest } from "next/server"
import { SignJWT, jwtVerify, type JWTPayload } from "jose"

function getSecret() {
  const secret = process.env.JWT_SECRET
  if (!secret) throw new Error("Missing JWT_SECRET environment variable in Project Settings.")
  return new TextEncoder().encode(secret)
}

export type SessionPayload = {
  sub: string
  email: string
}

export async function createSessionToken(payload: SessionPayload, expiresIn = "7d") {
  const token = await new SignJWT(payload as unknown as JWTPayload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(getSecret())
  return token
}

export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret())
    return { sub: String(payload.sub), email: String(payload.email) }
  } catch {
    return null
  }
}

export function getSessionCookieFromRequest(req: NextRequest) {
  return req.cookies.get("session")?.value || null
}

export async function getSessionCookieFromServer() {
  return (await cookies()).get("session")?.value || null
}
