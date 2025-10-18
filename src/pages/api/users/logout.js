import { withSessionRoute } from '../../../lib/session.js'

function handler(req, res) {
  req.session.destroy()
  res.status(200).json({ success: true })
}

export default withSessionRoute(handler)
