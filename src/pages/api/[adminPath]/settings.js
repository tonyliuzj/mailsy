import { withSessionSsr } from '../../../lib/session'
import { getSiteTitle, setSiteTitle } from '../../../lib/db'

export default withSessionSsr(async function handler(req, res) {
  const admin = req.session.get('admin')
  if (!admin) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  try {
    if (req.method === 'GET') {
      return res.status(200).json({ site_title: getSiteTitle() })
    }
    
    if (req.method === 'POST') {
      const { site_title } = req.body
      if (!site_title) {
        return res.status(400).json({ error: 'Site title is required' })
      }
      
      setSiteTitle(site_title)
      return res.status(200).json({ success: true })
    }
    
    res.setHeader('Allow', ['GET', 'POST'])
    return res.status(405).end(`Method ${req.method} Not Allowed`)
  } catch (error) {
    console.error('Settings API error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
})
