import { withIronSession } from 'next-iron-session'
import { serialize, parse } from 'cookie'

const { SESSION_PASSWORD } = process.env

if (!SESSION_PASSWORD) {
  throw new Error(
    '✋ next-iron-session: Missing `SESSION_PASSWORD` environment variable.\n' +
    'Please add a `SESSION_PASSWORD` (at least 32 characters) to your .env.local or deployment env.'
  )
}

const sessionOptions = {
  password: SESSION_PASSWORD,
  cookieName: 'temp-mail-session',
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
  },
}

export function getSessionCookie(req) {
  const cookies = parse(req.headers.cookie || '')
  return cookies[sessionOptions.cookieName]
}

export function clearSessionCookie() {
  return serialize(sessionOptions.cookieName, '', {
    maxAge: -1,
    path: '/',
  })
}

export function withSessionRoute(handler) {
  return withIronSession(handler, sessionOptions)
}

export function withSessionSsr(handler) {
  return withIronSession(handler, sessionOptions)
}
