# Mailsy — Disposable Email Service

A simple, modern disposable email web app built with Next.js, Tailwind CSS, and SQLite.  Users can generate random, one-off email addresses (protected by Cloudflare Turnstile CAPTCHA) and watch incoming mail in real time via IMAP polling.  An admin panel lets you configure IMAP, domain, and CAPTCHA keys, and manage your admin password.

---

## Features

- **Disposable addresses**  
  Generate a random email like `autumn.river@example.com` and throw it away when you’re done.

- **Live inbox**  
  Polls your IMAP catch-all mailbox every 5 seconds, shows sender / subject / snippet, click to view full message.

- **Gmail-style UI**  
  Responsive, mobile-friendly 1:2 two-column layout, top-aligned panels, simple nav bar for future pages.

- **Cloudflare Turnstile**  
  Protects the “Generate” button from bots.  Keys can be entered via the admin panel.

- **Admin panel**  
  — Default account: `admin` / `changeme`  
  — Configure IMAP host/port/user/password/TLS & domain  
  — Enter Turnstile `sitekey` & `secret`  
  — Change admin password

- **SQLite storage**  
  Self-contained `temp-mail.db` in `data/`, auto-migrates on startup.

---

## Getting Started

### Prerequisites

- **Node.js** v14+  
- **npm** or **yarn**  
- A **catch-all** IMAP mailbox you control  
- (Optional) A [Cloudflare Turnstile](https://www.cloudflare.com/products/turnstile/) account for CAPTCHA

### Installation

## Run by script (One Click Install)

```bash
curl -sSL https://github.com/tonyliuzj/Mailsy/releases/latest/download/mailsy.sh -o mailsy.sh && chmod +x mailsy.sh && bash mailsy.sh
```

1. **Clone** the repo  
```bash
git clone https://github.com/tonyliuzj/Mailsy.git
cd mailsy
```

2. **Install** dependencies

```bash
npm install
# or
yarn install
```

3. **Run** in development

```bash
npm run dev
# or
yarn dev
```

   Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Configuration

All settings live in the SQLite `config` table (auto-created at `data/temp-mail.db`).  Use the **Admin → Settings** page to modify:

| Setting                | Description                                 |
| ---------------------- | ------------------------------------------- |
| **IMAP Host**          | e.g. `imap.mailserver.com`                  |
| **IMAP Port**          | usually `993`                               |
| **IMAP User**          | your catch-all account (e.g. `catch-all@…`) |
| **IMAP Password**      | your IMAP password                          |
| **Use TLS**            | check to enable TLS/SSL                     |
| **Domain**             | the domain for generated aliases            |
| **Turnstile Site Key** | from Cloudflare Turnstile dashboard         |
| **Turnstile Secret**   | from Cloudflare Turnstile dashboard         |

**Default admin**

* Username: `admin`
* Password: `changeme`

Be sure to **change your password** after first login.

---

## Project Structure

```
pages/
├── index.js            # Public UI: generator + live inbox
├── api/
│   ├── generate.js     # alias + Turnstile verify
│   ├── emails.js       # fetch IMAP messages
│   └── admin/
│       ├── config.js   # get/update config via session
│       └── ...         # login, logout, change-password
├── admin/
│   └── index.js        # Admin UI
lib/
├── db.js                # SQLite schema & accessors
├── session.js           # iron-session helpers
data/
└── temp-mail.db         # SQLite database file
components/              # (optional) future shared components
public/                  # static assets
styles/                  # global styles (if any)
```

* **`db.js`** handles table creation (`admin`, `config`) and migrations for Turnstile fields.
* **`generate.js`** verifies the CAPTCHA, then uses `random-words` to build a `word.word@example.com` alias.
* **`emails.js`** connects to IMAP, searches `HEADER TO <alias>`, fetches & parses all new messages.
* **`index.js`** (UI) polls `/api/emails` every 5 seconds, shows a countdown, and updates the inbox list.

---

## Responsive & Accessible

* **Mobile-friendly**: single-column on small screens, 1:2 ratio on desktop.
* **Keyboard & focus-style** courtesy of default Tailwind resets.
* **High contrast** buttons & text for readability.

---

## Deployment

* **Vercel**: zero-config for Next.js, just connect your repo.
* **Custom**:

  1. Build: `npm run build`
  2. Start: `npm start`
  3. Ensure `data/` is writable and persisted.
  4. Configure environment (if any) — no extra ENV vars needed; all config via admin UI.

---

## Security

* **Session cookies** with `iron-session` protect admin routes.
* **CAPTCHA** prevents abuse of address generation.
* **Password hashing** with bcrypt.
* **No plaintext secrets** in code or `.env` — everything stored in SQLite.

---

## License

This project is [MIT-licensed](./LICENSE). Feel free to fork and adapt!
