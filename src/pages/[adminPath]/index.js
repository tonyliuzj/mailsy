import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { withSessionSsr } from '../../lib/session'

export const getServerSideProps = withSessionSsr(async ({ req, params }) => {
  const { getAdminPath } = await import('../../lib/db')
  const currentAdminPath = getAdminPath()
  if (!params || params.adminPath !== currentAdminPath) {
    return { notFound: true }
  }

  const admin = req.session.get('admin')
  if (!admin) {
    return {
      redirect: {
        destination: `/${currentAdminPath}/login`,
        permanent: false,
      },
    }
  }

  return { props: { admin, adminPath: currentAdminPath } }
})

export default function AdminPage({ admin, adminPath }) {
  const [cfg, setCfg] = useState(null)
  const [form, setForm] = useState({})
  const [msg, setMsg] = useState('')
  const [pwd, setPwd] = useState({ current: '', new: '' })
  const [pwdMsg, setPwdMsg] = useState('')
  const [pathMsg, setPathMsg] = useState('')
  const [newPath, setNewPath] = useState(adminPath || '')
  const [usernameMsg, setUsernameMsg] = useState('')
  const [newUsername, setNewUsername] = useState(admin.username)
  const router = useRouter()

  useEffect(() => {
    fetch(`/api/${adminPath}/config`)
      .then(r => r.json())
      .then(data => {
        setCfg(data)
        setForm(data)
      })
  }, [adminPath])

  const saveConfig = async e => {
    e.preventDefault()
    setMsg('')
    const res = await fetch(`/api/${adminPath}/config`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    setMsg(res.ok ? 'Config updated successfully.' : 'Error saving configuration.')
  }

  const changePwd = async e => {
    e.preventDefault()
    setPwdMsg('')
    const res = await fetch(`/api/${adminPath}/change-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        currentPassword: pwd.current,
        newPassword: pwd.new,
      }),
    })
    const data = await res.json()
    setPwdMsg(res.ok ? 'Password changed successfully.' : data.error || 'Error changing password.')
  }

  const changeUsername = async e => {
    e.preventDefault()
    setUsernameMsg('')
    if (!newUsername || newUsername.length < 3) {
      setUsernameMsg('Username must be at least 3 characters.')
      return
    }
    const res = await fetch(`/api/${adminPath}/change-username`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ newUsername }),
    })
    const data = await res.json()
    if (res.ok) {
      setUsernameMsg('Username updated! You must log in again.')
      setTimeout(() => {
        router.push(`/${adminPath}/login`)
      }, 2000)
    } else {
      setUsernameMsg(data.error || 'Failed to update username.')
    }
  }

  const changeAdminPath = async e => {
    e.preventDefault()
    setPathMsg('')
    if (!newPath || newPath.length < 3) {
      setPathMsg('Admin path must be at least 3 characters.')
      return
    }
    const res = await fetch(`/api/${adminPath}/config-path`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ adminPath: newPath }),
    })
    if (res.ok) {
      setPathMsg(`Path updated! You must log in again at /${newPath}.`)
      setTimeout(() => {
        router.push(`/${newPath}/login`)
      }, 2000)
    } else {
      setPathMsg('Failed to update admin path.')
    }
  }

  const logout = async () => {
    await fetch(`/api/${adminPath}/logout`)
    router.push(`/${adminPath}/login`)
  }

  if (!cfg) return <div className="flex items-center justify-center min-h-screen bg-gray-50"><p>Loading…</p></div>

  return (
    <div className="min-h-screen bg-gradient-to-tr from-gray-100 to-blue-50 p-4">
      <div className="max-w-4xl mx-auto pt-6">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-blue-800">
            Admin Panel {admin.username && <span className="text-gray-500 text-lg font-normal ml-4">{admin.username}</span>}
          </h1>
          <button
            onClick={logout}
            className="text-white bg-red-500 hover:bg-red-600 px-4 py-2 rounded shadow transition"
          >
            Logout
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <form onSubmit={saveConfig} className="space-y-4">
              <h2 className="text-xl font-semibold border-b pb-2 mb-3">Mail & CAPTCHA Configuration</h2>

              <label className="block">
                <span className="block font-medium">Site Title</span>
                <input
                  type="text"
                  name="title"
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200"
                  value={form.title || ''}
                  onChange={e => setForm({ ...form, title: e.target.value })}
                />
              </label>

              {[
                ['imap_host', 'IMAP Host', 'text'],
                ['imap_port', 'IMAP Port', 'number'],
                ['imap_user', 'IMAP User', 'text'],
                ['imap_password', 'IMAP Password', 'password'],
              ].map(([key, label, type]) => (
                <label key={key} className="block">
                  <span className="block font-medium">{label}</span>
                  <input
                    type={type}
                    name={key}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200"
                    value={form[key]}
                    onChange={e =>
                      setForm({
                        ...form,
                        [key]: type === 'number' ? Number(e.target.value) : e.target.value,
                      })
                    }
                  />
                </label>
              ))}

              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  name="imap_tls"
                  checked={form.imap_tls}
                  onChange={e =>
                    setForm({ ...form, imap_tls: e.target.checked })
                  }
                  className="rounded"
                />
                <span className="font-medium">Use TLS</span>
              </label>

              <label className="block">
                <span className="block font-medium">Domain</span>
                <input
                  type="text"
                  name="domain"
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200"
                  value={form.domain || ''}
                  onChange={e => setForm({ ...form, domain: e.target.value })}
                />
              </label>

              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-md shadow"
              >
                Save Configuration
              </button>
              {msg && <p className="text-green-600 mt-2">{msg}</p>}
            </form>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <form onSubmit={changePwd} className="space-y-4">
              <h2 className="text-xl font-semibold border-b pb-2 mb-3">Change Admin Password</h2>

              <label className="block">
                <span className="block font-medium">Current Password</span>
                <input
                  type="password"
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200"
                  value={pwd.current}
                  onChange={e => setPwd({ ...pwd, current: e.target.value })}
                />
              </label>

              <label className="block">
                <span className="block font-medium">New Password</span>
                <input
                  type="password"
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200"
                  value={pwd.new}
                  onChange={e => setPwd({ ...pwd, new: e.target.value })}
                />
              </label>

              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-md shadow"
              >
                Change Password
              </button>
              {pwdMsg && <p className="text-green-600 mt-2">{pwdMsg}</p>}
            </form>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <form onSubmit={changeUsername} className="space-y-4">
              <h2 className="text-xl font-semibold border-b pb-2 mb-3">Change Admin Username</h2>
              <label className="block">
                <span className="block font-medium">New Username</span>
                <input
                  type="text"
                  className="mt-1 block w-full border border-gray-300 rounded-md"
                  value={newUsername}
                  onChange={e => setNewUsername(e.target.value)}
                  minLength={3}
                  required
                />
              </label>
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-md shadow"
              >
                Change Username
              </button>
              {usernameMsg && <p className="text-green-600 mt-2">{usernameMsg}</p>}
            </form>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <form onSubmit={changeAdminPath} className="space-y-4">
              <h2 className="text-xl font-semibold border-b pb-2 mb-3">Change Admin Path</h2>
              <label className="block">
                <span className="block font-medium">Current Path</span>
                <input
                  type="text"
                  className="mt-1 block w-full border border-gray-300 rounded-md"
                  value={newPath}
                  onChange={e => setNewPath(e.target.value)}
                  minLength={3}
                  required
                />
              </label>
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-md shadow"
              >
                Change Path
              </button>
              {pathMsg && <p className="text-green-600 mt-2">{pathMsg}</p>}
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
