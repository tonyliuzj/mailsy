import { withSessionRoute } from '../../../lib/session.js'

function handler(req, res) {
  const { email } = req.session.get('email')
  res.status(200).json({ email })
}

export default withSessionRoute(handler)
