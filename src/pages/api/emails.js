import Imap from 'node-imap'
import { simpleParser } from 'mailparser'
import { getConfig } from '../../lib/db'

export default async function handler(req, res) {

  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST'])
    return res.status(405).end()
  }

  const { email } = req.body
  if (!email) {
    return res.status(400).json({ error: 'Email is required' })
  }

  let cfg
  try {
    cfg = getConfig()
  } catch {
    return res.status(500).json({ error: 'Failed to load configuration.' })
  }

  const imap = new Imap({
    user:     cfg.imap_user,
    password: cfg.imap_password,
    host:     cfg.imap_host,
    port:     cfg.imap_port,
    tls:      cfg.imap_tls,
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
}
