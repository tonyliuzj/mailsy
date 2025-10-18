import { createEmailOnlyUser, createUserEmail, getFirstActiveDomain } from '../../lib/db.js'
import { createSessionCookie } from '../../lib/user-session.js'
import { generate as randomWords } from 'random-words'
import { nanoid } from 'nanoid'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST'])
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
const { emailType, customEmail, domainName, cf_turnstile_token } = req.body

    
if (!emailType || !domainName || !cf_turnstile_token) {
      return res.status(400).json({ error: 'Missing required fields' })
    }

    
    const secret = process.env.TURNSTILE_SECRET
    if (!secret) {
      return res.status(500).json({ error: 'CAPTCHA not configured' })
    }

    let verification
    try {
      const resp = await fetch(
        'https:
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            secret,
            response: cf_turnstile_token,
            remoteip: req.socket.remoteAddress || ''
          })
        }
      )
      verification = await resp.json()
    } catch (err) {
      console.error('[create-email] CAPTCHA verification error', err)
      return res.status(500).json({ error: 'Error verifying CAPTCHA' })
    }

    if (!verification.success) {
      console.error('[create-email] CAPTCHA verification failed:', verification)
      return res.status(400).json({ error: 'CAPTCHA verification failed' })
    }

    
    const userResult = createEmailOnlyUser()
    if (!userResult.success) {
      return res.status(500).json({ error: userResult.error })
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

    
const emailResult = createUserEmail(userResult.userId, emailAddress, passkey, domainName)
    if (!emailResult.success) {
      return res.status(400).json({ error: emailResult.error })
    }

    
    const session = createSessionCookie(userResult.userId)
    
    
    const { createUserSession } = await import('../../lib/db.js')
    createUserSession(userResult.userId, session.token, session.expiresAt)

    
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
