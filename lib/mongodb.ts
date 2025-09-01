import { MongoClient } from "mongodb"

let client: MongoClient | null = null
let clientPromise: Promise<MongoClient> | null = null

const uri = process.env.MONGODB_URI
if (!uri) {
  throw new Error("Missing MONGODB_URI environment variable")
}

export async function getMongoClient() {
  if (client) return client
  if (!clientPromise) {
    clientPromise = new MongoClient(uri).connect()
  }
  client = await clientPromise
  return client
}

export async function getDb(dbName?: string) {
  const c = await getMongoClient()
  return c.db(dbName) // defaults to DB embedded in MONGODB_URI
}
