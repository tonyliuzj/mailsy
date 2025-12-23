import { getEmailByAddress } from '../../lib/db.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email, domainName } = req.body;

    if (!email || !domainName) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const fullEmail = `${email}@${domainName}`;
    const existingEmail = getEmailByAddress(fullEmail);

    return res.status(200).json({
      exists: !!existingEmail
    });

  } catch (error) {
    console.error('Email check error:', error);
    return res.status(500).json({ error: 'Failed to check email' });
  }
}
