import { getConfig } from '../../lib/db'

export default function handler(req, res) {
  const cfg = getConfig()
  res.json({
    domain: cfg.domain,
    title: cfg.title
  })
}
