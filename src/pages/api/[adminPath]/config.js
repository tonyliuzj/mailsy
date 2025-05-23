import { withSessionRoute } from '../../../lib/session'
import { getConfig, updateConfig, getAdminPath } from '../../../lib/db'

export default withSessionRoute(async (req, res) => {
  const { adminPath } = req.query
  if (adminPath !== getAdminPath()) {
    return res.status(404).json({ error: 'Not found' })
  }

  const admin = req.session.get('admin')
  if (!admin) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  if (req.method === 'GET') {
    const config = getConfig()
    return res.status(200).json(config)
  }

  if (req.method === 'POST') {
    updateConfig(req.body)
    return res.status(200).json({ success: true })
  }

  res.setHeader('Allow', ['GET', 'POST'])
  return res.status(405).end()
})
