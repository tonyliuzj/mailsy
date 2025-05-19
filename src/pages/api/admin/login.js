import bcrypt from 'bcryptjs'
import { withSessionRoute } from '../../../lib/session'
import { getAdmin } from '../../../lib/db'

export default withSessionRoute(async (req, res) => {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST'])
    return res.status(405).end()
  }

  const { username, password } = req.body
  const admin = getAdmin(username)

  if (!admin || !bcrypt.compareSync(password, admin.password_hash)) {
    return res.status(401).json({ error: 'Invalid credentials' })
  }

  req.session.set('admin', { username })
  await req.session.save()

  return res.status(200).json({ ok: true })
})
