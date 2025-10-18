import Imap from 'node-imap'
import { simpleParser } from 'mailparser'
import Database from 'better-sqlite3'
import path from 'path'
import { getUserEmailByAddress } from '../../lib/db.js'
import { withSessionRoute } from '../../lib/session.js'

const dbPath = path.join(process.cwd(), 'data', 'temp-mail.db')
const db = new Database(dbPath)

async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST'])
    return res.status(405).json({ error: 'Method not allowed' })
  }

  // Get user data from iron-session
  const userEmail = req.session.get('email')
  
  if (!userEmail) {
    return res.status(401).json({ error: 'Unauthorized: No session found' })
  }

  const { email } = req.body
  if (!email) {
    return res.status(400).json({ error: 'Email is required' })
  }

  // Verify the email belongs to the authenticated user
  const requestedEmail = getUserEmailByAddress(email)
  const userEmailId = userEmail.id || userEmail.email_id
  if (!requestedEmail || requestedEmail.id !== userEmailId) {
    return res.status(403).json({ error: 'Unauthorized access to this email' })
  }

  const domain = db.prepare('SELECT * FROM domains WHERE name = ?').get(userEmail.domain_name)
  if (!domain) {
    return res.status(500).json({ error: 'Domain configuration not found' })
  }

  const imapConfig = {
    user: domain.imap_user,
    password: domain.imap_password,
    host: domain.imap_host,
    port: domain.imap_port,
    tls: domain.imap_tls,
  }

  const imap = new Imap(imapConfig)

  const fetchEmails = () => new Promise((resolve, reject) => {
    imap.once('ready', () => {
      imap.openBox('INBOX', true, (err) => {
        if (err) return reject(new Error('Failed to open INBOX.'))
        
        imap.search([['HEADER', 'TO', email]], (err, uids) => {
          if (err) return reject(new Error('Failed to search mailbox.'))
          if (uids.length === 0) return resolve([])

          const messages = []
          const fetch = imap.fetch(uids, { bodies: '' })

          fetch.on('message', (msg, seqno) => {
            let buffer = ''
            let uid = null
            
            msg.on('attributes', attrs => { uid = attrs.uid })
            msg.on('body', stream => {
              stream.on('data', chunk => { buffer += chunk.toString('utf8') })
            })
            
            msg.once('end', () => {
              messages.push({ uid, buffer })
            })
          })

          fetch.once('error', (err) => reject(new Error('An error occurred while fetching emails.')))
          fetch.once('end', () => resolve(messages))
        })
      })
    })

    imap.once('error', (err) => reject(new Error('A connection error occurred.')))
    imap.connect()
  })

  try {
    const rawMessages = await fetchEmails()
    if (rawMessages.length === 0) {
      return res.status(200).json({ emails: [] })
    }

    const emails = await Promise.all(
      rawMessages.map(async ({ uid, buffer }) => {
        try {
          const parsed = await simpleParser(buffer)
          return {
            uid,
            subject: parsed.subject,
            from: parsed.from?.text,
            date: parsed.date,
            text: parsed.text,
            html: parsed.html || null,
          }
        } catch (error) {
          console.error(`Failed to parse email UID ${uid}:`, error)
          return null
        }
      })
    )

    const validEmails = emails.filter(Boolean)
    validEmails.sort((a, b) => new Date(b.date) - new Date(a.date))
    
    res.status(200).json({ emails: validEmails })
  } catch (error) {
    console.error('IMAP processing failed:', error)
    res.status(500).json({ error: error.message || 'An internal server error occurred.' })
  } finally {
    if (imap.state !== 'disconnected') {
      imap.end()
    }
  }
}

export default withSessionRoute(handler)
