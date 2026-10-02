import process from 'node:process'
import { MongoClient } from 'mongodb'

let cachedClientPromise = null

export async function getDatabase() {
  if (!process.env.MONGODB_URI) return null

  if (!cachedClientPromise) {
    const client = new MongoClient(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      maxPoolSize: 10,
    })
    cachedClientPromise = client.connect()
      .then(() => client)
      .catch((error) => {
        cachedClientPromise = null
        throw error
      })
  }

  const client = await cachedClientPromise
  return client.db(process.env.MONGODB_DB_NAME || 'rahmat_advocate')
}