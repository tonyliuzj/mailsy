import Database from 'better-sqlite3'
import bcrypt from 'bcryptjs'
import path from 'path'
import fs from 'fs'
import { nanoid } from 'nanoid'

const dbPath = path.join(process.cwd(), 'data', 'temp-mail.db')
fs.mkdirSync(path.dirname(dbPath), { recursive: true })
const db = new Database(dbPath)

db.prepare(`
  CREATE TABLE IF NOT EXISTS admin (
    id INTEGER PRIMARY KEY,
    username TEXT UNIQUE,
    password_hash TEXT
  )
`).run()

db.prepare(`
  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT
  )
`).run()

db.prepare(`
  CREATE TABLE IF NOT EXISTS domains (
    id INTEGER PRIMARY KEY,
    name TEXT UNIQUE,
    imap_host TEXT,
    imap_port INTEGER,
    imap_user TEXT,
    imap_password TEXT,
    imap_tls INTEGER,
    is_active INTEGER DEFAULT 1
  )
`).run()

db.prepare(`
  INSERT OR IGNORE INTO settings (key, value)
  VALUES ('admin_path', 'admin'),
         ('site_title', 'example.com'),
         ('turnstile_site_key', ''),
         ('turnstile_secret_key', ''),
         ('turnstile_registration_enabled', '0'),
         ('turnstile_login_enabled', '0')
`).run()

db.prepare(`
  CREATE TABLE IF NOT EXISTS emails (
    id INTEGER PRIMARY KEY,
    email_address TEXT UNIQUE NOT NULL,
    passkey_hash TEXT NOT NULL,
    domain_name TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`).run()

db.prepare(`
  CREATE TABLE IF NOT EXISTS sessions (
    id INTEGER PRIMARY KEY,
    email_id INTEGER NOT NULL,
    session_token TEXT UNIQUE NOT NULL,
    expires_at DATETIME NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (email_id) REFERENCES emails (id) ON DELETE CASCADE
  )
`).run()



const defaultAdminUsername = process.env.ADMIN_USERNAME || 'admin'
const defaultAdminPassword = process.env.ADMIN_PASSWORD || 'changeme'

const existingAdmin = db
  .prepare('SELECT 1 FROM admin WHERE username = ?')
  .get(defaultAdminUsername)

if (!existingAdmin) {
  const hash = bcrypt.hashSync(defaultAdminPassword, 10)
  db.prepare('INSERT INTO admin (username, password_hash) VALUES (?, ?)')
    .run(defaultAdminUsername, hash)
}

export function getAdmin(username) {
  return db
    .prepare('SELECT * FROM admin WHERE username = ?')
    .get(username)
}

export function updateAdminPassword(username, newPass) {
  const hash = bcrypt.hashSync(newPass, 10)
  return db
    .prepare('UPDATE admin SET password_hash = ? WHERE username = ?')
    .run(hash, username)
}

export function getSetting(key) {
  const row = db.prepare('SELECT value FROM settings WHERE key = ?').get(key)
  return row ? row.value : null
}

export function setSetting(key, value) {
  db.prepare(`
    INSERT OR REPLACE INTO settings (key, value)
    VALUES (?, ?)
  `).run(key, value)
}

export function getAdminPath() {
  return getSetting('admin_path') || 'admin'
}

export function setAdminPath(newPath) {
  setSetting('admin_path', newPath)
}

export function updateAdminUsername(oldUsername, newUsername) {
  return db
    .prepare('UPDATE admin SET username = ? WHERE username = ?')
    .run(newUsername, oldUsername)
}

export function getFirstActiveDomain() {
  return db.prepare(`
    SELECT name 
    FROM domains 
    WHERE is_active = 1 
    ORDER BY id 
    LIMIT 1
  `).get() || { name: 'example.com' }
}

export function getSiteTitle() {
  return getSetting('site_title') || 'example.com'
}

export function setSiteTitle(title) {
  setSetting('site_title', title)
}

export function getTurnstileConfig() {
  const rawRegistration = getSetting('turnstile_registration_enabled')
  const rawLogin = getSetting('turnstile_login_enabled')
  return {
    siteKey: getSetting('turnstile_site_key') || '',
    secretKey: getSetting('turnstile_secret_key') || '',
    registrationEnabled: rawRegistration ? rawRegistration === '1' : false,
    loginEnabled: rawLogin ? rawLogin === '1' : false,
  }
}

export function setTurnstileConfig({
  siteKey,
  secretKey,
  registrationEnabled,
  loginEnabled,
} = {}) {
  if (typeof siteKey === 'string') {
    setSetting('turnstile_site_key', siteKey.trim())
  }
  if (typeof secretKey === 'string') {
    setSetting('turnstile_secret_key', secretKey.trim())
  }
  if (typeof registrationEnabled === 'boolean') {
    setSetting('turnstile_registration_enabled', registrationEnabled ? '1' : '0')
  }
  if (typeof loginEnabled === 'boolean') {
    setSetting('turnstile_login_enabled', loginEnabled ? '1' : '0')
  }
}

export function createEmail(emailAddress, passkey, domainName) {
  const passkeyHash = bcrypt.hashSync(passkey, 10);
  try {
    const result = db.prepare(`
      INSERT INTO emails (email_address, passkey_hash, domain_name)
      VALUES (?, ?, ?)
    `).run(emailAddress, passkeyHash, domainName);
    return { success: true, emailId: result.lastInsertRowid };
  } catch (error) {
    if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return { success: false, error: 'Email address already taken' };
    }
    return { success: false, error: 'Failed to create email address' };
  }
}

export function getEmailByAddress(emailAddress) {
  return db.prepare('SELECT * FROM emails WHERE email_address = ?').get(emailAddress);
}

export function verifyEmail(emailAddress, passkey) {
  const email = getEmailByAddress(emailAddress);
  if (!email) {
    return { success: false, error: 'Email address not found' };
  }

  const isValid = bcrypt.compareSync(passkey, email.passkey_hash);
  if (!isValid) {
    return { success: false, error: 'Invalid passkey' };
  }

  return { success: true, email };
}

export function regeneratePasskey(emailId, newPasskey) {
  const passkeyHash = bcrypt.hashSync(newPasskey, 10);
  const result = db.prepare('UPDATE emails SET passkey_hash = ? WHERE id = ?').run(passkeyHash, emailId);
  return result.changes > 0;
}

export function deleteEmail(emailId) {
  const result = db.prepare('DELETE FROM emails WHERE id = ?').run(emailId);
  return result.changes > 0;
}

export function createSession(emailId, sessionToken, expiresAt) {
  try {
    const expiresAtTimestamp = expiresAt instanceof Date ? Math.floor(expiresAt.getTime() / 1000) : expiresAt;
    const result = db.prepare(`
      INSERT INTO sessions (email_id, session_token, expires_at)
      VALUES (?, ?, ?)
    `).run(emailId, sessionToken, expiresAtTimestamp);
    return { success: true, sessionId: result.lastInsertRowid };
  } catch (error) {
    console.error('Failed to create session:', error);
    return { success: false, error: 'Failed to create session' };
  }
}

export function getSession(sessionToken) {
  const session = db.prepare('SELECT * FROM sessions WHERE session_token = ?').get(sessionToken);
  if (!session) return null;

  const now = Math.floor(Date.now() / 1000);
  if (session.expires_at < now) {
    db.prepare('DELETE FROM sessions WHERE id = ?').run(session.id);
    return null;
  }

  return session;
}

export function deleteSession(sessionToken) {
  const result = db.prepare('DELETE FROM sessions WHERE session_token = ?').run(sessionToken);
  return result.changes > 0;
}

export function deleteSessions(emailId) {
  const result = db.prepare('DELETE FROM sessions WHERE email_id = ?').run(emailId);
  return result.changes > 0;
}

export function getUserEmailsByUserId(emailId) {
  const email = db.prepare('SELECT * FROM emails WHERE id = ?').get(emailId);
  return email ? [email] : [];
}

// Missing functions needed by the emails API
export function getUserSession(sessionToken) {
  const session = getSession(sessionToken);
  if (!session) return null;
  
  // Adapt the session to include user_id (using email_id as user_id)
  return {
    ...session,
    user_id: session.email_id
  };
}

export function getUserEmailByAddress(emailAddress) {
  const email = getEmailByAddress(emailAddress);
  if (!email) return null;
  
  // Adapt the email object to include user_id and domain_id
  // For this simple system, the email id serves as the user_id
  return {
    ...email,
    user_id: email.id,
    domain_id: 1 // Default domain ID - you may need to map this properly based on domain_name
  };
}

export { db }
