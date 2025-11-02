import { getSessionCookie, withSessionRoute } from './session.js'
import { getSession } from './db.js'

export function withUserAuth(handler) {
  return withSessionRoute(async function(req, res) {
    try {
      const sessionToken = getSessionCookie(req)
      
      if (!sessionToken) {
        return res.status(401).json({ error: 'No session found' })
      }

      const session = getSession(sessionToken)
      
      if (!session) {
        
        req.session.destroy()
        return res.status(401).json({ error: 'Invalid or expired session' })
      }

      
      req.userSession = session
      
      return handler(req, res)
    } catch (error) {
      console.error('Authentication error:', error)
      return res.status(500).json({ error: 'Authentication failed' })
    }
  })
}

export function withUser(handler) {
  return async function(context) {
    const { req } = context;
    const sessionToken = getSessionCookie(req);
    let user = null;
    if (sessionToken) {
      user = getSession(sessionToken);
    }
    context.user = user;
    return handler(context);
  }
}
