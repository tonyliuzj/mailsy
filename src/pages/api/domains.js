import Database from 'better-sqlite3'
import path from 'path'

const dbPath = path.join(process.cwd(), 'data', 'temp-mail.db')
const db = new Database(dbPath)

export default function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET'])
    return res.status(405).end(`Method ${req.method} Not Allowed`)
  }

  try {
    const domains = db.prepare('SELECT * FROM domains WHERE is_active = 1').all()
    return res.status(200).json(domains)
  } catch (error) {
    console.error('Error fetching domains:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
