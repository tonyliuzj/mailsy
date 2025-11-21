import { createEmail, getFirstActiveDomain } from '../../lib/db.js'
import { createSessionCookie } from '../../lib/user-session.js'
import { generate as randomWords } from 'random-words'
import { nanoid } from 'nanoid'
import { isTurnstileEnabled, verifyTurnstileToken, getClientIp } from '../../lib/turnstile.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST'])
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
const {
      emailType,
      customEmail,
      domainName,
      cf_turnstile_token,
      turnstileToken: bodyTurnstileToken,
    } = req.body

    
    if (!emailType || !domainName) {
      return res.status(400).json({ error: 'Missing required fields' })
    }

    
    const requiresTurnstile = isTurnstileEnabled('registration')
    const turnstileToken = bodyTurnstileToken || cf_turnstile_token

    if (requiresTurnstile) {
      if (!turnstileToken) {
        return res.status(400).json({ error: 'Turnstile verification is required' })
      }

    const verification = await verifyTurnstileToken(turnstileToken, getClientIp(req))
      if (!verification.success) {
        const statusCode = verification.error && verification.error.includes('not configured') ? 500 : 400
        console.error('[create-email] Turnstile verification failed:', verification)
        return res.status(statusCode).json({ error: verification.error || 'Turnstile verification failed' })
      }
    }

    let emailAddress
    if (emailType === 'random') {
      const randomAlias = randomWords({ exactly: 2, join: '.' })
      const domain = getFirstActiveDomain()
      emailAddress = `${randomAlias}@${domain.name}`
    } else if (emailType === 'custom') {
      if (!customEmail) {
        return res.status(400).json({ error: 'Custom email address is required' })
      }
      emailAddress = customEmail
    } else {
      return res.status(400).json({ error: 'Invalid email type' })
    }

    const passkey = nanoid(16)

    const emailResult = createEmail(emailAddress, passkey, domainName)
    if (!emailResult.success) {
      return res.status(400).json({ error: emailResult.error })
    }
    
    // In the current DB schema, emailId serves as userId
    const userId = emailResult.emailId

    const session = createSessionCookie(userId)
    
    const { createUserSession } = await import('../../lib/db.js')
    createUserSession(userId, session.token, session.expiresAt)

    
    res.setHeader('Set-Cookie', session.cookie)

    return res.status(201).json({
      email: emailAddress,
      passkey: passkey
    })

  } catch (error) {
    console.error('Email creation error:', error)
    return res.status(500).json({ error: 'Failed to create email address' })
  }
}
