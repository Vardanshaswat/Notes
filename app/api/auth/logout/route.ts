import { NextResponse } from "next/server";

export async function POST() {
  const res = new NextResponse(null, { status: 204 });
  res.cookies.set("session", "", {
    httpOnly: true,
    path: "/",
    sameSite: "lax",
    secure: true,
    maxAge: 0,
  });
  return res;
}
