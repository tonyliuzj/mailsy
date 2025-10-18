import { generate as randomWords } from 'random-words'
import { nanoid } from 'nanoid'
import Database from 'better-sqlite3'
import path from 'path'
import { withSessionRoute } from '../../lib/session'

const dbPath = path.join(process.cwd(), 'data', 'temp-mail.db')
const db = new Database(dbPath)

export default withSessionRoute(async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST'])
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { cf_turnstile_token, domain_id, email_prefix } = req.body
  const secret = process.env.TURNSTILE_SECRET

  if (!secret) {
    console.error('[generate] Turnstile secret not set')
    return res.status(500).json({ error: 'CAPTCHA not configured' })
  }
  if (!domain_id) {
    console.error('[generate] Domain ID not provided')
    return res.status(400).json({ error: 'Domain selection required' })
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
    console.error('[generate] CAPTCHA verification error', err)
    return res.status(500).json({ error: 'Error verifying CAPTCHA' })
  }

  if (!verification.success) {
    console.error('[generate] CAPTCHA verification failed:', verification)
    return res.status(400).json({ error: 'CAPTCHA verification failed' })
  }

  const domain = db.prepare('SELECT * FROM domains WHERE id = ?').get(domain_id)
  if (!domain) {
    console.error('[generate] Domain not found:', domain_id)
    return res.status(400).json({ error: 'Invalid domain' })
  }

  const alias = email_prefix || randomWords({ exactly: 2, join: '.' })
  const email = `${alias}@${domain.name}`

  const apiKey = nanoid(32)
  req.session.set('email_api_key', { email, apiKey, domain_id })
  await req.session.save()

  return res.status(200).json({ email, apiKey })
})
