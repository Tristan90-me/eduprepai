import mongoose from 'mongoose'

export const connectDB = async () => {
  try {
    const uri = process.env.MONGODB_URI

    if (!uri) {
      throw new Error('MONGODB_URI is not defined in environment variables')
    }

    const conn = await mongoose.connect(uri, {
      dbName: 'eduprepai',
    })

    console.log(`✅ MongoDB connected: ${conn.connection.host}`)

    // ── Connection event listeners ─────────────────────────────
    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️  MongoDB disconnected')
    })

    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB error:', err.message)
    })

  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message)
    process.exit(1)
  }
}
