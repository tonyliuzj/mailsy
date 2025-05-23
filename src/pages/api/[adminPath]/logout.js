import { withSessionRoute } from '../../../lib/session'
import { getAdminPath } from '../../../lib/db'

export default withSessionRoute(async (req, res) => {
  const { adminPath } = req.query
  if (adminPath !== getAdminPath()) {
    return res.status(404).json({ error: 'Not found' })
  }

  req.session.destroy()
  await req.session.save()
  return res.status(200).json({ ok: true })
})
