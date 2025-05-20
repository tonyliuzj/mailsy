import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { withSessionSsr } from '../../lib/session'

export const getServerSideProps = withSessionSsr(async ({ req }) => {
  const admin = req.session.get('admin')
  if (!admin) {
    return {
      redirect: {
        destination: '/admin/login',
        permanent: false,
      },
    }
  }
  return { props: { admin } }
})

export default function AdminPage({ admin }) {
  const [cfg, setCfg] = useState(null)
  const [form, setForm] = useState({})
  const [msg, setMsg] = useState('')
  const [pwd, setPwd] = useState({ current: '', new: '' })
  const [pwdMsg, setPwdMsg] = useState('')
  const router = useRouter()

  useEffect(() => {
    fetch('/api/admin/config')
      .then(r => r.json())
      .then(data => {
        setCfg(data)
        setForm(data)
      })
  }, [])

  const saveConfig = async e => {
    e.preventDefault()
    setMsg('')
    const res = await fetch('/api/admin/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    setMsg(res.ok ? 'Config updated successfully.' : 'Error saving configuration.')
  }

  const changePwd = async e => {
    e.preventDefault()
    setPwdMsg('')
    const res = await fetch('/api/admin/change-password', {
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

  const logout = async () => {
    await fetch('/api/admin/logout')
    router.push('/admin/login')
  }

  if (!cfg) return <p>Loading…</p>

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-2xl mx-auto bg-white p-8 rounded-lg shadow">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold">
            Admin Panel{admin.username && ` — ${admin.username}`}
          </h1>
          <button
            onClick={logout}
            className="text-red-500 hover:underline"
          >
            Logout
          </button>
        </div>

        <form onSubmit={saveConfig} className="space-y-6 mb-8">
          <h2 className="text-xl font-semibold border-b pb-2">Mail & CAPTCHA Configuration</h2>

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
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200"
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

          <label className="block items-center">
            <input
              type="checkbox"
              name="imap_tls"
              checked={form.imap_tls}
              onChange={e =>
                setForm({ ...form, imap_tls: e.target.checked })
              }
              className="mr-2"
            />
            <span className="font-medium">Use TLS</span>
          </label>

          <label className="block">
            <span className="block font-medium">Domain</span>
            <input
              type="text"
              name="domain"
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200"
              value={form.domain}
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

        <form onSubmit={changePwd} className="space-y-6">
          <h2 className="text-xl font-semibold border-b pb-2">Change Admin Password</h2>

          <label className="block">
            <span className="block font-medium">Current Password</span>
            <input
              type="password"
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200"
              value={pwd.current}
              onChange={e => setPwd({ ...pwd, current: e.target.value })}
            />
          </label>

          <label className="block">
            <span className="block font-medium">New Password</span>
            <input
              type="password"
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200"
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
    </div>
  )
}
