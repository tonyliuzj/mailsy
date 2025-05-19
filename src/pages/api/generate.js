import { getConfig } from '../../lib/db'
import { generate as randomWords } from 'random-words'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST'])
    return res.status(405).end()
  }

  const { cf_turnstile_token } = req.body
  const cfg = getConfig()
  const secret = cfg.turnstile_secret

  if (!secret) {
    console.error('[generate] Turnstile secret not set in config')
    return res.status(500).json({ error: 'CAPTCHA not configured' })
  }

  const verification = await fetch(
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
  ).then(r => r.json())

  if (!verification.success) {
    console.error('[generate] CAPTCHA verification failed:', verification)
    return res.status(400).json({ error: 'CAPTCHA verification failed' })
  }

  const alias = randomWords({ exactly: 2, join: '.' })
  const domain = cfg.domain
  const email = `${alias}@${domain}`

  return res.status(200).json({ email })
}
