import { generate as randomWords } from 'random-words'
import { nanoid } from 'nanoid'
import { getConfig } from '../../lib/db'
import { withSessionRoute } from '../../lib/session'

export default withSessionRoute(async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST'])
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { cf_turnstile_token } = req.body
  const secret = process.env.TURNSTILE_SECRET

  const cfg = getConfig()
  const domain = cfg.domain

  if (!secret) {
    console.error('[generate] Turnstile secret not set')
    return res.status(500).json({ error: 'CAPTCHA not configured' })
  }
  if (!domain) {
    console.error('[generate] Email domain not set')
    return res.status(500).json({ error: 'Email domain not configured' })
  }

  let verification
  try {
    const resp = await fetch(
      'https://challenges.cloudflare.com/turnstile/v0/siteverify',
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
    console.error('[generate] CAPTCHA verification error', err)
    return res.status(500).json({ error: 'Error verifying CAPTCHA' })
  }

  if (!verification.success) {
    console.error('[generate] CAPTCHA verification failed:', verification)
    return res.status(400).json({ error: 'CAPTCHA verification failed' })
  }

  const alias = randomWords({ exactly: 2, join: '.' })
  const email = `${alias}@${domain}`

  const apiKey = nanoid(32)
  req.session.set('email_api_key', { email, apiKey })
  await req.session.save()

  return res.status(200).json({ email, apiKey })
})
