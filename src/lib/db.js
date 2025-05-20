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
    imap_tls INTEGER
  )
`).run()

const existingAdmin = db
  .prepare('SELECT 1 FROM admin WHERE username = ?')
  .get('admin')

if (!existingAdmin) {
  const hash = bcrypt.hashSync('changeme', 10)
  db.prepare('INSERT INTO admin (username, password_hash) VALUES (?, ?)')
    .run('admin', hash)
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
        imap_tls
      ) VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      1,      // id
      '',     // imap_host
      993,    // imap_port
      '',     // imap_user
      '',     // imap_password
      1      // imap_tls (INTEGER 0/1)
    )
    cfg = db.prepare('SELECT * FROM config WHERE id = 1').get()
  }

  cfg.imap_tls = Boolean(cfg.imap_tls)

  return cfg
}

export function updateConfig({
  imap_host,
  imap_port,
  imap_user,
  imap_password,
  imap_tls
}) {
  return db.prepare(`
    UPDATE config SET
      imap_host          = ?,
      imap_port          = ?,
      imap_user          = ?,
      imap_password      = ?,
      imap_tls           = ?
    WHERE id = 1
  `).run(
    imap_host,
    imap_port,
    imap_user,
    imap_password,
    imap_tls ? 1 : 0
  )
}
