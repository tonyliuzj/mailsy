import { nanoid } from 'nanoid'

const SESSION_COOKIE_NAME = 'mailsy_user_session'
const SESSION_DURATION_DAYS = 30

export function createSessionCookie(userId) {
  const sessionToken = nanoid(64)
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + SESSION_DURATION_DAYS)
  
  return {
    token: sessionToken,
    expiresAt,
    cookie: `${SESSION_COOKIE_NAME}=${sessionToken}; Path=/; HttpOnly; SameSite=Strict; Expires=${expiresAt.toUTCString()}${process.env.NODE_ENV === 'production' ? '; Secure' : ''}`
  }
}

export function getSessionCookie(req) {
  const cookieHeader = req.headers.cookie || ''
  const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
    const [key, value] = cookie.trim().split('=')
    acc[key] = value
    return acc
  }, {})
  
  return cookies[SESSION_COOKIE_NAME] || null
}

export function clearSessionCookie() {
  return `${SESSION_COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Strict; Expires=Thu, 01 Jan 1970 00:00:00 GMT`
}
