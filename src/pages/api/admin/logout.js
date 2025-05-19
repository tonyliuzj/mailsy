import { withSessionRoute } from '../../../lib/session'

export default withSessionRoute(async (req, res) => {
  req.session.destroy()
  await req.session.save()
  return res.status(200).json({ ok: true })
})
