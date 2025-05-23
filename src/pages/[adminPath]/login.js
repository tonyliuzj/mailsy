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
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <form onSubmit={submit}
            className="bg-white p-6 rounded shadow w-full max-w-sm">
        <h1 className="text-xl font-bold mb-4">Admin Login</h1>
        {error && <p className="text-red-500">{error}</p>}
        <label className="block mb-2">
          Username
          <input value={username}
                 onChange={e => setUsername(e.target.value)}
                 className="w-full border p-2 rounded mt-1"
                 autoFocus
                 autoComplete="username"
                 required
          />
        </label>
        <label className="block mb-4">
          Password
          <input type="password" value={password}
                 onChange={e => setPassword(e.target.value)}
                 className="w-full border p-2 rounded mt-1"
                 autoComplete="current-password"
                 required
          />
        </label>
        <button type="submit"
                className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 rounded">
          Login
        </button>
      </form>
    </div>
  )
}
