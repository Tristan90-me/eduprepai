import jwt from 'jsonwebtoken'

// ── Generate a token ───────────────────────────────────────────
// Called after registration and login.
// The token contains the user's ID and role — nothing sensitive.
export const generateToken = (userId, role) => {
  return jwt.sign(
    { id: userId, role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  )
}

// ── Verify a token ─────────────────────────────────────────────
// Called by the auth middleware on every protected route.
export const verifyToken = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET)
}