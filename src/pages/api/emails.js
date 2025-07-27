import Imap from 'node-imap'
import { simpleParser } from 'mailparser'
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

  const { email, apiKey } = req.body
  if (!email || !apiKey) {
    return res.status(400).json({ error: 'Email and apiKey are required' })
  }

  const sessionData = req.session.get('email_api_key')
  if (
    !sessionData ||
    sessionData.email !== email ||
    sessionData.apiKey !== apiKey
  ) {
    return res.status(401).json({ error: 'Unauthorized: Invalid or expired API key' })
  }

  const domain = db.prepare('SELECT * FROM domains WHERE id = ?').get(sessionData.domain_id)
  if (!domain) {
    return res.status(500).json({ error: 'Domain configuration not found' })
  }

  const imap = new Imap({
    user:     domain.imap_user,
    password: domain.imap_password,
    host:     domain.imap_host,
    port:     domain.imap_port,
    tls:      domain.imap_tls,
  })

  await new Promise(resolve => {
    const messages = []
    const parsePromises = []

    const finish = (code, payload) => {
      res.status(code).json(payload)
      imap.end()
      resolve()
    }

    imap.once('ready', () => {
      imap.openBox('INBOX', true, () => {
        imap.search([['HEADER', 'TO', email]], (err, uids) => {
          if (err) return finish(500, { error: 'Failed to search mailbox.' })

          const list = Array.isArray(uids) ? uids : []
          if (list.length === 0) return finish(200, { emails: [] })

          const f = imap.fetch(list, { bodies: '' })
          f.on('message', msg => {
            let buffer = ''
            let uid = null

            msg.on('attributes', attrs => { uid = attrs.uid })
            msg.on('body', stream => {
              stream.on('data', chunk => { buffer += chunk.toString('utf8') })
            })

            msg.once('end', () => {
              const p = simpleParser(buffer)
                .then(parsed => {
                  messages.push({
                    uid,
                    subject: parsed.subject,
                    from: parsed.from?.text,
                    date: parsed.date,
                    text: parsed.text,
                    html: parsed.html || null
                  })
                })
                .catch(() => {})
              parsePromises.push(p)
            })
          })

          f.once('end', async () => {
            await Promise.all(parsePromises)
            messages.sort((a, b) => new Date(a.date) - new Date(b.date))
            finish(200, { emails: messages })
          })

          f.once('error', () => finish(500, { error: 'An error occurred while fetching emails.' }))
        })
      })
    })

    imap.once('error', () => finish(500, { error: 'A connection error occurred.' }))
    imap.connect()
  })
})
