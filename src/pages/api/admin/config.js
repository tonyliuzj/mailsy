import { withSessionRoute } from '../../../lib/session'
import { getConfig, updateConfig } from '../../../lib/db'

export default withSessionRoute(async (req, res) => {
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
