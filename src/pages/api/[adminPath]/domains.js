import { withSessionSsr } from '../../../lib/session'
import { db } from '../../../lib/db'

export default withSessionSsr(async function handler(req, res) {
  const admin = req.session.get('admin')
  if (!admin) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  try {
    switch (req.method) {
      case 'GET':
        const domains = db.prepare('SELECT * FROM domains').all()
        return res.status(200).json(domains)

      case 'POST':
        const { name, imap_host, imap_port, imap_user, imap_password, imap_tls } = req.body
        if (!name) {
          return res.status(400).json({ error: 'Domain name is required' })
        }

        const result = db
          .prepare(
            `INSERT INTO domains (
              name, imap_host, imap_port, imap_user, imap_password, imap_tls
            ) VALUES (?, ?, ?, ?, ?, ?)`
          )
          .run(
            name,
            imap_host || '',
            imap_port || 993,
            imap_user || '',
            imap_password || '',
            imap_tls ? 1 : 0
          )

        return res.status(201).json({ id: result.lastInsertRowid })

      case 'PUT':
        const { id, ...updateData } = req.body
        if (!id) {
          return res.status(400).json({ error: 'Domain ID is required' })
        }

        const updateResult = db
          .prepare(
            `UPDATE domains SET
              name = ?,
              imap_host = ?,
              imap_port = ?,
              imap_user = ?,
              imap_password = ?,
              imap_tls = ?,
              is_active = ?
            WHERE id = ?`
          )
          .run(
            updateData.name,
            updateData.imap_host || '',
            updateData.imap_port || 993,
            updateData.imap_user || '',
            updateData.imap_password || '',
            updateData.imap_tls ? 1 : 0,
            updateData.is_active ? 1 : 0,
            id
          )

        if (updateResult.changes === 0) {
          return res.status(404).json({ error: 'Domain not found' })
        }
        return res.status(200).json({ success: true })

      case 'DELETE':
        const { id: deleteId } = req.body
        if (!deleteId) {
          return res.status(400).json({ error: 'Domain ID is required' })
        }

        const deleteResult = db.prepare('DELETE FROM domains WHERE id = ?').run(deleteId)
        if (deleteResult.changes === 0) {
          return res.status(404).json({ error: 'Domain not found' })
        }
        return res.status(200).json({ success: true })

      default:
        res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE'])
        return res.status(405).end(`Method ${req.method} Not Allowed`)
    }
  } catch (error) {
    console.error('Domain API error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
})
