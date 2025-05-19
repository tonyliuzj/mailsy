import { useState } from 'react'
import { useRouter } from 'next/router'

export default function Login() {
  const [username, setUsername] = useState('admin')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const router = useRouter()

  const submit = async e => {
    e.preventDefault()
    setError('')
    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ username, password }),
    })
    if (res.ok) router.push('/admin')
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
                 className="w-full border p-2 rounded mt-1"/>
        </label>
        <label className="block mb-4">
          Password
          <input type="password" value={password}
                 onChange={e => setPassword(e.target.value)}
                 className="w-full border p-2 rounded mt-1"/>
        </label>
        <button type="submit"
                className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 rounded">
          Login
        </button>
      </form>
    </div>
  )
}
