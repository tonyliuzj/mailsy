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
  CREATE TABLE IF NOT EXISTS config (
    id INTEGER PRIMARY KEY,
    imap_host TEXT,
    imap_port INTEGER,
    imap_user TEXT,
    imap_password TEXT,
    imap_tls INTEGER,
    admin_path TEXT DEFAULT 'admin',
    domain TEXT,
    title TEXT
  )
`).run()

try { db.prepare('ALTER TABLE config ADD COLUMN domain TEXT').run() } catch {}
try { db.prepare('ALTER TABLE config ADD COLUMN title TEXT').run() } catch {}

let cfg = db.prepare('SELECT * FROM config WHERE id = 1').get()
if (!cfg) {
  db.prepare(`
    INSERT INTO config (
      id,
      imap_host,
      imap_port,
      imap_user,
      imap_password,
      imap_tls,
      admin_path,
      domain,
      title
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    1,
    '',
    993,
    '',
    '',
    1,
    'admin',
    'example.com',
    'example.com'
  )
  cfg = db.prepare('SELECT * FROM config WHERE id = 1').get()
}

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

export function getConfig() {
  let cfg = db.prepare('SELECT * FROM config WHERE id = 1').get()
  if (!cfg) {
    db.prepare(`
      INSERT INTO config (
        id,
        imap_host,
        imap_port,
        imap_user,
        imap_password,
        imap_tls,
        admin_path,
        domain,
        title
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      1, '', 993, '', '', 1, 'admin', 'example.com', 'example.com'
    )
    cfg = db.prepare('SELECT * FROM config WHERE id = 1').get()
  }
  if (!cfg.domain) cfg.domain = 'example.com'
  if (!cfg.title) cfg.title = 'example.com'
  cfg.imap_tls = Boolean(cfg.imap_tls)
  return cfg
}

export function updateConfig({
  imap_host,
  imap_port,
  imap_user,
  imap_password,
  imap_tls,
  domain,
  title
}) {
  return db.prepare(`
    UPDATE config SET
      imap_host    = ?,
      imap_port    = ?,
      imap_user    = ?,
      imap_password= ?,
      imap_tls     = ?,
      domain       = ?,
      title        = ?
    WHERE id = 1
  `).run(
    imap_host,
    imap_port,
    imap_user,
    imap_password,
    imap_tls ? 1 : 0,
    domain,
    title
  )
}

export function getAdminPath() {
  const row = db.prepare('SELECT admin_path FROM config WHERE id = 1').get()
  return row?.admin_path || 'admin'
}

export function setAdminPath(newPath) {
  db.prepare('UPDATE config SET admin_path = ? WHERE id = 1').run(newPath)
}

export function updateAdminUsername(oldUsername, newUsername) {
  return db
    .prepare('UPDATE admin SET username = ? WHERE username = ?')
    .run(newUsername, oldUsername)
}
