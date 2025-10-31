import { generate as randomWords } from 'random-words'
import { nanoid } from 'nanoid'
import Database from 'better-sqlite3'
import path from 'path'
import { withSessionRoute } from '../../lib/session'
import { isTurnstileEnabled, verifyTurnstileToken, getClientIp } from '../../lib/turnstile.js'

const dbPath = path.join(process.cwd(), 'data', 'temp-mail.db')
const db = new Database(dbPath)

export default withSessionRoute(async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST'])
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const {
    cf_turnstile_token,
    turnstileToken: bodyTurnstileToken,
    domain_id,
    email_prefix,
  } = req.body
  const turnstileToken = bodyTurnstileToken || cf_turnstile_token
  const requiresTurnstile = isTurnstileEnabled('registration')

  if (!domain_id) {
    console.error('[generate] Domain ID not provided')
    return res.status(400).json({ error: 'Domain selection required' })
  }

  if (requiresTurnstile) {
    if (!turnstileToken) {
      console.error('[generate] Turnstile token missing')
      return res.status(400).json({ error: 'Turnstile verification is required' })
    }

    const verification = await verifyTurnstileToken(turnstileToken, getClientIp(req))
    if (!verification.success) {
      const statusCode = verification.error && verification.error.includes('not configured') ? 500 : 400
      console.error('[generate] Turnstile verification failed:', verification)
      return res.status(statusCode).json({ error: verification.error || 'Turnstile verification failed' })
    }
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
