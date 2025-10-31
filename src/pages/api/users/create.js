import { createEmail, getFirstActiveDomain, createSession } from '../../../lib/db.js';
import { withSessionRoute } from '../../../lib/session.js';
import { generate as randomWords } from 'random-words';
import { nanoid } from 'nanoid';
import { isTurnstileEnabled, verifyTurnstileToken, getClientIp } from '../../../lib/turnstile.js';

async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST'])
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
const { userEmail, emailType, customEmail, domainName, turnstileToken } = req.body

    
    if (isTurnstileEnabled('registration')) {
      const verification = await verifyTurnstileToken(turnstileToken, getClientIp(req));
      if (!verification.success) {
        const statusCode = verification.error && verification.error.includes('not configured') ? 500 : 400;
        return res.status(statusCode).json({ error: verification.error || 'Turnstile verification failed' });
      }
    }

    
if (!userEmail || !emailType || !domainName) {
      return res.status(400).json({ error: 'Missing required fields' })
    }

    
    let emailAddress;

    if (emailType === 'random') {
      const randomAlias = randomWords({ exactly: 2, join: '.' });
      const domain = getFirstActiveDomain();
      emailAddress = `${randomAlias}@${domain.name}`;
    } else if (emailType === 'custom') {
      if (!customEmail) {
        return res.status(400).json({ error: 'Custom email address is required' });
      }
      emailAddress = customEmail;
    } else if (emailType === 'username') {
      // Validate username - should not contain @ or invalid characters
      if (userEmail.includes('@') || userEmail.includes(' ') || !userEmail.trim()) {
        return res.status(400).json({ error: 'Invalid username format' });
      }
      
      // Create email by combining username with domain
      emailAddress = `${userEmail.trim()}@${domainName}`;
    } else {
      return res.status(400).json({ error: 'Invalid email type' });
    }

    
    const passkey = nanoid(16);

    
    const emailResult = createEmail(emailAddress, passkey, domainName);
    if (!emailResult.success) {
      return res.status(400).json({ error: emailResult.error });
    }

    
    req.session.set('email', {
      email_id: emailResult.emailId,
      email_address: emailAddress,
      domain_name: domainName,
    });
    await req.session.save();

    // Create database session entry for withUserAuth compatibility
    const sessionToken = nanoid(32);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
    const sessionResult = createSession(emailResult.emailId, sessionToken, expiresAt);
    
    if (!sessionResult.success) {
      console.error('Failed to create database session:', sessionResult.error);
    }

    return res.status(201).json({
      success: true,
      email: {
        email: emailAddress,
        apiKey: passkey,
      },
      passkey: passkey,
      emailId: emailResult.emailId,
    });

  } catch (error) {
    console.error('User creation error:', error);
    return res.status(500).json({ error: 'Failed to create user account' });
  }
}

export default withSessionRoute(handler);
