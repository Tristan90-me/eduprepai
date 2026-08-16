import express       from 'express'
import cors          from 'cors'
import helmet        from 'helmet'
import morgan        from 'morgan'
import dotenv        from 'dotenv'
import rateLimit     from 'express-rate-limit'

import { connectDB } from './config/database.js'

// ── Route imports ──────────────────────────────────────────────
import authRoutes       from './routes/auth.routes.js'
import questionRoutes   from './routes/question.routes.js'
import predictionRoutes from './routes/prediction.routes.js'
import practiceRoutes   from './routes/practice.routes.js'
import mockExamRoutes   from './routes/mockExam.routes.js'
import reportRoutes     from './routes/report.routes.js'
import adminRoutes      from './routes/admin.routes.js'
import settingsRoutes from './routes/settings.routes.js'
import analyticsRoutes  from './routes/analytics.routes.js'

import { errorHandler } from './middleware/error.middleware.js'

dotenv.config()

const app  = express()
const PORT = process.env.PORT || 5000

// ── Security & parsing middleware ──────────────────────────────
app.use(helmet())
app.use(cors({
  origin:      process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}))
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))
app.use(morgan('dev'))

// ── Global rate limiter ────────────────────────────────────────
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max:      200,
  message:  { success: false, message: 'Too many requests, please try again later.' },
})
app.use('/api', limiter)

// ── Routes ─────────────────────────────────────────────────────
app.use('/api/auth',        authRoutes)
app.use('/api/questions',   questionRoutes)
app.use('/api/predictions', predictionRoutes)
app.use('/api/practice',    practiceRoutes)
app.use('/api/mock-exams',  mockExamRoutes)
app.use('/api/reports',     reportRoutes)
app.use('/api/admin',       adminRoutes)
app.use('/api/settings',    settingsRoutes)
app.use('/api/analytics',   analyticsRoutes)

// ── Health check ───────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({
    success:     true,
    message:     'EduPrepAI API is running',
    environment: process.env.NODE_ENV,
    timestamp:   new Date().toISOString(),
  })
})

// ── 404 handler ────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
  })
})

// ── Global error handler ───────────────────────────────────────
app.use(errorHandler)

// ── Start server ───────────────────────────────────────────────
const start = async () => {
  await connectDB()
  app.listen(PORT, () => {
    console.log(`\n🚀 EduPrepAI server running on http://localhost:${PORT}`)
    console.log(`📚 Environment: ${process.env.NODE_ENV}`)
    console.log(`🩺 Health check: http://localhost:${PORT}/api/health\n`)
  })
}

start()