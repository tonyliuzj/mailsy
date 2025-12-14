# Mailsy — Persistent Email Service

A modern, self-hosted email service built with Next.js, Tailwind CSS, and SQLite. Users can create persistent email accounts with secure passkey authentication and access their inbox in real-time via IMAP polling. An admin panel allows configuration of multiple domains, IMAP settings, and Cloudflare Turnstile CAPTCHA protection.

---

## Features

- **Persistent Email Accounts**
  Create permanent email addresses with secure passkey authentication. Users can log back in anytime to access their inbox.

- **Multi-Domain Support**
  Configure multiple domains with separate IMAP settings. Users can choose from available domains when creating accounts.

- **Real-Time Inbox**
  Auto-refreshes every 5 seconds via IMAP polling. View sender, subject, and message preview, then click to read full emails with HTML rendering.

- **Modern, Responsive UI**
  Clean interface with dark mode support, built with Tailwind CSS and Lucide icons. Mobile-friendly design with smooth animations.

- **Secure Authentication**
  - Session-based authentication with iron-session
  - Bcrypt password hashing for admin and user passkeys
  - Passkey regeneration with manual masking controls
  - Optional Cloudflare Turnstile CAPTCHA for registration and login

- **Admin Panel**
  - Default account: `admin` / `changeme`
  - Configure multiple domains with individual IMAP settings
  - Manage Turnstile CAPTCHA settings (registration/login toggles)
  - Change admin credentials and customize site title
  - Dynamic admin path configuration

- **SQLite Storage**
  Self-contained `temp-mail.db` in `data/` directory with automatic schema migrations.

---

## Getting Started

### Prerequisites

- **Node.js** v18+ (recommended v20+)
- **npm** or **yarn**
- A **catch-all** IMAP mailbox you control (one per domain)
- (Optional) A [Cloudflare Turnstile](https://www.cloudflare.com/products/turnstile/) account for CAPTCHA protection

### Installation

#### Quick Install (One-Click Script)

```bash
curl -sSL https://github.com/tonyliuzj/mailsy/releases/latest/download/mailsy.sh -o mailsy.sh && chmod +x mailsy.sh && bash mailsy.sh
```

#### Manual Installation

1. **Clone the repository**
```bash
git clone https://github.com/tonyliuzj/Mailsy.git
cd mailsy
```

2. **Install dependencies**
```bash
npm install
```

3. **Run in development mode**
```bash
npm run dev
```

4. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

5. **Access admin panel**
   Go to [http://localhost:3000/admin](http://localhost:3000/admin) and login with:
   - Username: `admin`
   - Password: `changeme`

6. **Configure your first domain**
   In the admin panel, add a domain with your IMAP settings.

---

## Configuration

All settings are stored in the SQLite database at `data/temp-mail.db`. Configure everything through the admin panel.

### Admin Settings

Access the admin panel at `/admin` (or your custom admin path):

| Setting                          | Description                                      |
| -------------------------------- | ------------------------------------------------ |
| **Site Title**                   | Displayed in browser tab and header              |
| **Admin Path**                   | Custom URL path for admin panel (default: admin) |
| **Admin Username**               | Change your admin username                       |
| **Admin Password**               | Change your admin password                       |
| **Turnstile Site Key**           | Cloudflare Turnstile site key                    |
| **Turnstile Secret Key**         | Cloudflare Turnstile secret key                  |
| **Registration CAPTCHA**         | Enable/disable CAPTCHA for account creation      |
| **Login CAPTCHA**                | Enable/disable CAPTCHA for login                 |

### Domain Configuration

Add and manage multiple domains in the admin panel:

| Setting          | Description                                      |
| ---------------- | ------------------------------------------------ |
| **Domain Name**  | e.g. `example.com`                               |
| **IMAP Host**    | e.g. `imap.example.com`                          |
| **IMAP Port**    | Usually `993` for TLS                            |
| **IMAP User**    | Catch-all account (e.g. `catchall@example.com`)  |
| **IMAP Password**| Password for IMAP account                        |
| **Use TLS**      | Enable TLS/SSL (recommended)                     |
| **Active**       | Enable/disable domain for new registrations      |

**Important:** Each domain requires a catch-all IMAP mailbox that receives all emails sent to `*@yourdomain.com`.

**Default Admin Credentials:**
- Username: `admin`
- Password: `changeme`

**⚠️ Change your password immediately after first login!**

---

## Project Structure

```
src/
├── pages/
│   ├── index.js                    # Landing page: account creation & login
│   ├── inbox.js                    # User inbox with email list & detail view
│   ├── [adminPath]/
│   │   ├── index.js                # Admin dashboard
│   │   └── login.js                # Admin login page
│   └── api/
│       ├── users/
│       │   ├── create.js           # User registration
│       │   ├── login.js            # User authentication
│       │   ├── logout.js           # User logout
│       │   └── me.js               # Get current user
│       ├── account/
│       │   ├── info.js             # Get user account details
│       │   └── regenerate-passkey.js # Regenerate user passkey
│       ├── [adminPath]/
│       │   ├── login.js            # Admin authentication
│       │   ├── logout.js           # Admin logout
│       │   ├── config.js           # Admin settings management
│       │   ├── domains.js          # Domain CRUD operations
│       │   ├── change-username.js  # Change admin username
│       │   └── change-password.js  # Change admin password
│       ├── emails.js               # Fetch IMAP messages for user
│       ├── domains.js              # Get active domains list
│       └── info.js                 # Get public site info
├── lib/
│   ├── db.js                       # SQLite database & schema
│   ├── session.js                  # Admin session management
│   ├── user-session.js             # User session management
│   ├── user-auth.js                # User authentication helpers
│   └── turnstile.js                # Turnstile verification
├── components/
│   ├── modern-ui/                  # Custom UI components
│   │   ├── Button.js
│   │   ├── Card.js
│   │   ├── Input.js
│   │   ├── EmailInput.js
│   │   ├── Layout.js
│   │   └── ...
│   └── ui/                         # shadcn/ui components
│       └── ...
└── styles/
    └── globals.css                 # Global styles & Tailwind
data/
└── temp-mail.db                    # SQLite database (auto-created)
```

### Key Components

- **`db.js`** - Database schema with tables for admin, settings, domains, emails, and sessions
- **`user-auth.js`** - Server-side authentication wrapper for protected pages
- **`emails.js`** - IMAP client that fetches messages for specific email addresses
- **`inbox.js`** - Real-time inbox UI with auto-refresh every 5 seconds
- **`[adminPath]`** - Dynamic admin routes based on configured admin path

---

## Deployment

### Production Build

```bash
npm run build
npm start
```

### Vercel Deployment

Mailsy can be deployed to Vercel, but note that SQLite requires a persistent filesystem:

1. Connect your GitHub repository to Vercel
2. Ensure the `data/` directory is writable and persisted
3. Consider using a volume or external database for production

### Docker Deployment

```bash
# Build the image
docker build -t mailsy .

# Run the container
docker run -d -p 3000:3000 -v $(pwd)/data:/app/data mailsy
```

### Environment Variables

All configuration is done through the admin panel. Optional environment variables:

- `ADMIN_USERNAME` - Override default admin username (default: `admin`)
- `ADMIN_PASSWORD` - Override default admin password (default: `changeme`)
- `NEXT_PUBLIC_BASE_URL` - Base URL for API calls (default: `http://localhost:3000`)

---

## Security Features

- **Session-based authentication** with `iron-session` for both admin and users
- **Bcrypt password hashing** for all credentials (admin and user passkeys)
- **Secure passkey management** with regeneration and manual masking controls
- **Optional CAPTCHA protection** via Cloudflare Turnstile for registration and login
- **No plaintext secrets** - all sensitive data encrypted in SQLite database
- **CSRF protection** through session tokens
- **Secure cookie settings** with httpOnly and secure flags

---

## User Experience

- **Responsive Design** - Mobile-first layout that adapts to all screen sizes
- **Dark Mode Support** - Automatic theme switching based on system preferences
- **Real-time Updates** - Inbox auto-refreshes every 5 seconds without page reload
- **Smooth Animations** - Polished transitions and loading states
- **Accessible UI** - Keyboard navigation and screen reader support
- **Copy to Clipboard** - One-click copying of email addresses and passkeys

---

## License

This project is [MIT-licensed](./LICENSE). Feel free to fork and adapt!
