import { useState } from 'react'
import { useRouter } from 'next/router'
import { withSessionSsr } from '../../lib/session'

export const getServerSideProps = withSessionSsr(async ({ req, params }) => {
  const { getAdminPath } = await import('../../lib/db')
  const currentAdminPath = getAdminPath()
  if (!params || params.adminPath !== currentAdminPath) {
    return { notFound: true }
  }
  const admin = req.session.get('admin')
  if (admin) {
    return {
      redirect: {
        destination: `/${currentAdminPath}`,
        permanent: false,
      },
    }
  }
  return { props: { adminPath: currentAdminPath } }
})

export default function Login({ adminPath }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const router = useRouter()

  const submit = async e => {
    e.preventDefault()
    setError('')
    const res = await fetch(`/api/${adminPath}/login`, {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ username, password }),
    })
    if (res.ok) router.push(`/${adminPath}`)
    else {
      const { error: msg } = await res.json()
      setError(msg || 'Login failed')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background text-foreground px-4">
      <form
        onSubmit={submit}
        className="w-full max-w-sm rounded-lg border border-border bg-card shadow-sm p-6 space-y-4"
      >
        <h1 className="text-xl font-bold">Admin Login</h1>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <label className="block text-sm font-medium text-muted-foreground">
          Username
          <input
            value={username}
            onChange={e => setUsername(e.target.value)}
            className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background"
            autoFocus
            autoComplete="username"
            required
          />
        </label>
        <label className="block text-sm font-medium text-muted-foreground">
          Password
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background"
            autoComplete="current-password"
            required
          />
        </label>
        <button
          type="submit"
          className="w-full rounded-md bg-primary py-2 text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          Login
        </button>
      </form>
    </div>
  )
}
