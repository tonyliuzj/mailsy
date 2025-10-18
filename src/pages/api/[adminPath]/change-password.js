import { withSessionRoute } from '../../../lib/session'
import { getAdminPath, updateAdminPassword } from '../../../lib/db'

export default withSessionRoute(async (req, res) => {
  const { adminPath } = req.query
  if (adminPath !== getAdminPath()) {
    return res.status(404).json({ error: 'Not found' })
  }

  const admin = req.session.get('admin')
  if (!admin) {
    return res.status(401).json({ error: 'Not authenticated' })
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST'])
    return res.status(405).end()
  }

  const { newPassword } = req.body
  if (!newPassword) {
    return res.status(400).json({ error: 'New password is required' })
  }

  updateAdminPassword(admin.username, newPassword)

  return res.status(200).json({ ok: true })
})
