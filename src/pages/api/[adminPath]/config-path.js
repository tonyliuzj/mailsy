import { getAdminPath, setAdminPath } from '../../../lib/db'
import { withSessionRoute } from '../../../lib/session'

export default withSessionRoute(async (req, res) => {
  // Only allow the current admin path!
  const { adminPath } = req.query
  if (adminPath !== getAdminPath()) {
    return res.status(404).json({ error: 'Not found' })
  }

  if (!req.session.get('admin')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  if (req.method === 'GET') {
    return res.json({ adminPath: getAdminPath() });
  } else if (req.method === 'POST') {
    const { adminPath: newPath } = req.body;
    if (!newPath || typeof newPath !== 'string' || newPath.length < 3) {
      return res.status(400).json({ error: 'Invalid path' });
    }
    setAdminPath(newPath);
    return res.json({ ok: true, adminPath: newPath });
  } else {
    res.status(405).end();
  }
});
