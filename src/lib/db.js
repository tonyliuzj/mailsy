import Database from 'better-sqlite3'
import bcrypt from 'bcryptjs'
import path from 'path'
import fs from 'fs'

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
         ('site_title', 'example.com')
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

export { db }
