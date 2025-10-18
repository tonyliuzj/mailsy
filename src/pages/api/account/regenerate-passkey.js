import { regeneratePasskey, getUserEmailsByUserId } from '../../../lib/db.js'
import { withSessionRoute } from '../../../lib/session.js'
import { nanoid } from 'nanoid'

async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST'])
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // Get user data from iron-session
    const userEmail = req.session.get('email')
    
    if (!userEmail) {
      return res.status(401).json({ error: 'Not authenticated' })
    }

    const { emailId } = req.body

    if (!emailId) {
      return res.status(400).json({ error: 'Email ID is required' })
    }

    // Get user emails using the email ID from the session
    const userEmailId = userEmail.id || userEmail.email_id
    const userEmails = getUserEmailsByUserId(userEmailId)
    const targetEmail = userEmails.find(email => email.id === parseInt(emailId))

    if (!targetEmail) {
      return res.status(403).json({ error: 'Unauthorized access to this email' })
    }

    // Generate new passkey
    const newPasskey = nanoid(16)

    // Update passkey in database
    const success = regeneratePasskey(emailId, newPasskey)
    
    if (!success) {
      return res.status(500).json({ error: 'Failed to regenerate passkey' })
    }

    return res.status(200).json({
      success: true,
      newPasskey: newPasskey
    })

  } catch (error) {
    console.error('Passkey regeneration error:', error)
    return res.status(500).json({ error: 'Failed to regenerate passkey' })
  }
}

export default withSessionRoute(handler)
