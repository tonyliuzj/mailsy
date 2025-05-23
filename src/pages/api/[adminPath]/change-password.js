import bcrypt from 'bcryptjs'
import { withSessionRoute } from '../../../lib/session'
import { getAdmin, updateAdminPassword, getAdminPath } from '../../../lib/db'

export default withSessionRoute(async (req, res) => {
  const { adminPath } = req.query
  if (adminPath !== getAdminPath()) {
    return res.status(404).json({ error: 'Not found' })
  }

  const sessionAdmin = req.session.get('admin')
  if (!sessionAdmin) {
    return res.status(401).json({ error: 'Unauthorized' })
  }
  const username = sessionAdmin.username

  const { currentPassword, newPassword } = req.body
  const admin = getAdmin(username)

  if (!bcrypt.compareSync(currentPassword, admin.password_hash)) {
    return res.status(400).json({ error: 'Current password is incorrect' })
  }
  if (newPassword.length < 6) {
    return res.status(400).json({ error: 'New password must be at least 6 characters' })
  }

  updateAdminPassword(username, newPassword)
  return res.status(200).json({ ok: true })
})
