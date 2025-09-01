import { redirect } from "next/navigation"
import { getSessionCookieFromServer, verifySessionToken } from "@/lib/auth"
import NotesApp from "@/components/notes-app"

export default async function Page() {
  const token = await getSessionCookieFromServer()
  const session = token ? await verifySessionToken(token) : null
  if (!session) redirect("/login")

  return (
    <main className="min-h-dvh bg-background">
      <NotesApp />
    </main>
  )
}
