import { getSiteTitle, getFirstActiveDomain } from '../../lib/db'

export default function handler(req, res) {
  const domain = getFirstActiveDomain()
  const siteTitle = getSiteTitle()
  res.json({
    domain: domain.name,
    title: domain.title || siteTitle
  })
}
