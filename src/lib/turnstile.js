import { getTurnstileConfig } from './db'

function parseBoolean(value) {
  if (typeof value === 'boolean') return value
  if (typeof value === 'string') {
    const lowered = value.toLowerCase()
    return lowered === 'true' || lowered === '1' || lowered === 'yes' || lowered === 'on'
  }
  return Boolean(value)
}

export function isTurnstileEnabled(type) {
  const config = getTurnstileConfig()
  if (type === 'registration') {
    return parseBoolean(config.registrationEnabled)
  }
  if (type === 'login') {
    return parseBoolean(config.loginEnabled)
  }
  return false
}

export function getClientIp(req) {
  const forwardedFor = req.headers['x-forwarded-for']
  if (typeof forwardedFor === 'string' && forwardedFor.length > 0) {
    return forwardedFor.split(',')[0].trim()
  }
  if (Array.isArray(forwardedFor) && forwardedFor.length > 0) {
    return forwardedFor[0]
  }
  return req.socket?.remoteAddress || ''
}

export async function verifyTurnstileToken(token, remoteIp) {
  const { secretKey } = getTurnstileConfig()

  if (!secretKey) {
    return { success: false, error: 'Turnstile secret key is not configured' }
  }
  if (!token) {
    return { success: false, error: 'Turnstile token is missing' }
  }

  const payload = new URLSearchParams()
  payload.append('secret', secretKey)
  payload.append('response', token)
  if (remoteIp) {
    payload.append('remoteip', remoteIp)
  }

  try {
    const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body: payload,
    })

    if (!response.ok) {
      return { success: false, error: 'Failed to reach Turnstile verification service' }
    }

    const data = await response.json()
    if (!data.success) {
      return {
        success: false,
        error: 'Turnstile verification failed',
        details: data['error-codes'] || [],
      }
    }

    return { success: true }
  } catch (error) {
    console.error('Turnstile verification error:', error)
    return { success: false, error: 'Error verifying Turnstile token' }
  }
}
