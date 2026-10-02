import { MongoClient } from 'mongodb'

let cachedClient = null

export async function getDatabase() {
  if (!process.env.MONGODB_URI) {
    return null
  }

  if (!cachedClient) {
    cachedClient = new MongoClient(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      maxPoolSize: 10,
    })

    await cachedClient.connect()
  }

  const databaseName = process.env.MONGODB_DB_NAME || 'rahmat_advocate'
  return cachedClient.db(databaseName)
}
