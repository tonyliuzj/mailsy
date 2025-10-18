import { getUserEmailsByUserId } from '../../../lib/db.js'
import { withSessionRoute } from '../../../lib/session.js'

async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET'])
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // Get user data from iron-session
    const userEmail = req.session.get('email')
    
    console.log('Session data:', { userEmail, sessionExists: !!userEmail })
    
    if (!userEmail) {
      console.log('No user email found in session')
      return res.status(401).json({ error: 'Not authenticated' })
    }

    // Validate that userEmail has the expected structure
    const emailId = userEmail.id || userEmail.email_id
    if (!emailId) {
      console.error('User email object missing ID:', userEmail)
      return res.status(401).json({ error: 'Invalid session data' })
    }

    // Get user emails using the email ID from the session
    const userEmails = getUserEmailsByUserId(emailId)
    
    console.log('Retrieved user emails:', { emailCount: userEmails.length, userEmails })

    // For each email, we need to add the passkey field (not the hash) for display
    // Since we can't retrieve the original passkey from the hash, we'll set it to null
    // The frontend will handle displaying masked passkeys
    const emailsWithPasskey = userEmails.map(email => ({
      ...email,
      passkey: null, // We can't retrieve the original passkey from the hash
      apiKey: email.passkey_hash // Use the hash as API key for fetching emails
    }))

    return res.status(200).json({
      success: true,
      userId: userEmail.id,
      emails: emailsWithPasskey
    })

  } catch (error) {
    console.error('Account info error:', error)
    return res.status(500).json({ error: 'Failed to fetch account information' })
  }
}

export default withSessionRoute(handler)
