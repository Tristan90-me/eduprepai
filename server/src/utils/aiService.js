import { GoogleGenAI } from '@google/genai'
import Anthropic from '@anthropic-ai/sdk'
import dotenv from 'dotenv'

dotenv.config()

// ── Which AI provider to use ───────────────────────────────────
// Controlled by AI_PROVIDER in your .env file.
// Defaults to 'gemini' if not set.
const provider = process.env.AI_PROVIDER || 'gemini'

// ── Initialise the Gemini client ───────────────────────────────
// GoogleGenAI automatically reads GEMINI_API_KEY from process.env.
// You do not need to pass the key manually.
let geminiClient = null
let anthropicClient = null

if (provider === 'gemini') {
  geminiClient = new GoogleGenAI({})
} else {
  anthropicClient = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
}

// ── Core function — used by all modules ────────────────────────
// Takes a prompt string and optional system prompt.
// Returns the AI's text response as a plain string.
export const generateAIResponse = async (prompt, systemPrompt = '') => {
  try {
    if (provider === 'gemini') {
      return await callGemini(prompt, systemPrompt)
    } else {
      return await callClaude(prompt, systemPrompt)
    }
  } catch (error) {
    // ── Rate limit guard for free tier ─────────────────────────
    // Free tier allows ~15 requests/minute. If you hit the limit,
    // this returns a clear message instead of crashing.
    if (error.status === 429) {
      console.warn('[AI Service] Free tier rate limit hit. Slow down requests.')
      throw new Error('AI is temporarily busy due to rate limits. Please wait 60 seconds and try again.')
    }

    console.error(`[AI Service] ${provider} call failed:`, error.message)
    throw new Error(`AI generation failed: ${error.message}`)
  }
}

// ── Gemini implementation ──────────────────────────────────────
// Uses gemini-3.5-flash-lite — the recommended free-tier model.
// Combines systemPrompt and user prompt into a single contents string
// since the new SDK handles them together.
const callGemini = async (prompt, systemPrompt) => {
  const fullPrompt = systemPrompt
    ? `${systemPrompt}\n\n${prompt}`
    : prompt

  const response = await geminiClient.models.generateContent({
    model:    'gemini-3.5-flash-lite',
    contents: fullPrompt,
  })

  return response.text
}

// ── Claude implementation (kept for easy switching later) ──────
const callClaude = async (prompt, systemPrompt) => {
  const message = await anthropicClient.messages.create({
    model:      'claude-haiku-4-5-20251001',
    max_tokens: 2048,
    system:     systemPrompt || undefined,
    messages:   [{ role: 'user', content: prompt }],
  })
  return message.content[0].text
}

// ── JSON helper ────────────────────────────────────────────────
// Many AI calls expect structured JSON back.
// Strips markdown code fences Gemini sometimes wraps around JSON
// and parses the result safely.
export const generateAIJSON = async (prompt, systemPrompt = '') => {
  const raw = await generateAIResponse(prompt, systemPrompt)

  // Strip ```json ... ``` or ``` ... ``` fences if present
  const cleaned = raw
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i,     '')
    .replace(/```\s*$/,      '')
    .trim()

  try {
    return JSON.parse(cleaned)
  } catch (err) {
    console.error('[AI Service] JSON parse failed. Raw output:', raw)
    throw new Error('AI returned invalid JSON. Raw: ' + raw.slice(0, 300))
  }
}