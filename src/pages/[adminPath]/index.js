import { useState, useEffect, useCallback } from 'react'
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
  const [pwd, setPwd] = useState({ current: '', new: '' })
  const [pwdMsg, setPwdMsg] = useState('')
  const [pathMsg, setPathMsg] = useState('')
  const [newPath, setNewPath] = useState(adminPath || '')
  const [usernameMsg, setUsernameMsg] = useState('')
  const [newUsername, setNewUsername] = useState(admin.username)
  const [domains, setDomains] = useState([])
  const [domainForm, setDomainForm] = useState({})
  const [domainMsg, setDomainMsg] = useState('')
  const [siteTitle, setSiteTitle] = useState('')
  const [siteTitleMsg, setSiteTitleMsg] = useState('')
  const [turnstileSettings, setTurnstileSettings] = useState({
    siteKey: '',
    secretKey: '',
    registrationEnabled: false,
    loginEnabled: false,
  })
  const [turnstileMsg, setTurnstileMsg] = useState('')
  const router = useRouter()

  const fetchSettings = useCallback(() => {
    fetch(`/api/${adminPath}/settings`)
      .then(r => r.json())
      .then(data => {
        if (data?.site_title !== undefined) {
          setSiteTitle(data.site_title || '')
        }
        setTurnstileSettings(prev => ({
          siteKey: data?.turnstile_site_key ?? prev.siteKey ?? '',
          secretKey: data?.turnstile_secret_key ?? prev.secretKey ?? '',
          registrationEnabled: ['1', 1, true, 'true', 'yes', 'on'].includes(data?.turnstile_registration_enabled),
          loginEnabled: ['1', 1, true, 'true', 'yes', 'on'].includes(data?.turnstile_login_enabled),
        }))
      })
      .catch(console.error)
  }, [adminPath])

  const fetchDomains = useCallback(() => {
    fetch(`/api/${adminPath}/domains`)
      .then(r => r.json())
      .then(setDomains)
      .catch(console.error)
  }, [adminPath])

  useEffect(() => {
    fetchDomains()
    fetchSettings()
  }, [adminPath, fetchDomains, fetchSettings])

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

  const saveDomain = async (e) => {
    e.preventDefault()
    setDomainMsg('')
    const method = domainForm.id ? 'PUT' : 'POST'
    const url = `/api/${adminPath}/domains`
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(domainForm),
    })
    if (res.ok) {
      setDomainMsg('Domain saved successfully.')
      setDomainForm({})
      fetchDomains()
    } else {
      setDomainMsg('Error saving domain.')
    }
  }

  const saveSiteTitle = async (e) => {
    e.preventDefault()
    setSiteTitleMsg('')
    const res = await fetch(`/api/${adminPath}/settings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ site_title: siteTitle }),
    })
    if (res.ok) {
      setSiteTitleMsg('Site title updated successfully.')
      fetchSettings()
    } else {
      setSiteTitleMsg('Error updating site title.')
    }
  }

  const saveTurnstileSettings = async (e) => {
    e.preventDefault()
    setTurnstileMsg('')
    const res = await fetch(`/api/${adminPath}/settings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        turnstile_site_key: turnstileSettings.siteKey,
        turnstile_secret_key: turnstileSettings.secretKey,
        turnstile_registration_enabled: turnstileSettings.registrationEnabled,
        turnstile_login_enabled: turnstileSettings.loginEnabled,
      }),
    })
    if (res.ok) {
      setTurnstileMsg('Turnstile settings updated successfully.')
      fetchSettings()
    } else {
      setTurnstileMsg('Error updating Turnstile settings.')
    }
  }

  const editDomain = (domain) => {
    setDomainForm(domain)
  }

  const deleteDomain = async (id) => {
    if (confirm('Are you sure you want to delete this domain?')) {
      const res = await fetch(`/api/${adminPath}/domains`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      })
      if (res.ok) {
        setDomainMsg('Domain deleted.')
        fetchDomains()
      } else {
        setDomainMsg('Error deleting domain.')
      }
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground p-4">
      <div className="max-w-6xl mx-auto pt-6">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-foreground">
            Admin Panel {admin.username && <span className="text-muted-foreground text-lg font-normal ml-4">{admin.username}</span>}
          </h1>
          <button
            onClick={logout}
            className="text-white bg-red-500 hover:bg-red-600 px-4 py-2 rounded shadow transition"
          >
            Logout
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-card rounded-xl border border-border shadow-sm p-6">
            <form onSubmit={changePwd} className="space-y-4">
              <h2 className="text-xl font-semibold border-b pb-2 mb-3">Change Admin Password</h2>

              <label className="block">
                <span className="block font-medium">Current Password</span>
                <input
                  type="password"
                  className="mt-1 block w-full border border-border rounded-md shadow-sm focus:border-primary focus:ring focus:ring-primary/40"
                  value={pwd.current}
                  onChange={e => setPwd({ ...pwd, current: e.target.value })}
                />
              </label>

              <label className="block">
                <span className="block font-medium">New Password</span>
                <input
                  type="password"
                  className="mt-1 block w-full border border-border rounded-md shadow-sm focus:border-primary focus:ring focus:ring-primary/40"
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

          <div className="bg-card rounded-xl border border-border shadow-sm p-6">
            <form onSubmit={changeUsername} className="space-y-4">
              <h2 className="text-xl font-semibold border-b pb-2 mb-3">Change Admin Username</h2>
              <label className="block">
                <span className="block font-medium">New Username</span>
                <input
                  type="text"
                  className="mt-1 block w-full border border-border rounded-md"
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

          <div className="bg-card rounded-xl border border-border shadow-sm p-6">
            <form onSubmit={changeAdminPath} className="space-y-4">
              <h2 className="text-xl font-semibold border-b pb-2 mb-3">Change Admin Path</h2>
              <label className="block">
                <span className="block font-medium">Current Path</span>
                <input
                  type="text"
                  className="mt-1 block w-full border border-border rounded-md"
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

        <div className="bg-card rounded-xl border border-border shadow-sm p-6 mt-6">
          <form onSubmit={saveSiteTitle} className="space-y-4">
            <h2 className="text-xl font-semibold border-b pb-2 mb-3">General Settings</h2>
            
            <label className="block">
              <span className="block font-medium">Site Title</span>
              <input
                type="text"
                className="mt-1 block w-full border border-border rounded-md shadow-sm focus:border-primary focus:ring focus:ring-primary/40"
                value={siteTitle}
                onChange={e => setSiteTitle(e.target.value)}
              />
            </label>
            
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-md shadow"
            >
              Save Site Title
            </button>
            {siteTitleMsg && <p className="text-green-600 mt-2">{siteTitleMsg}</p>}
          </form>
        </div>

        <div className="bg-card rounded-xl border border-border shadow-sm p-6 mt-6">
          <form onSubmit={saveTurnstileSettings} className="space-y-4">
            <h2 className="text-xl font-semibold border-b pb-2 mb-3">Cloudflare Turnstile</h2>
            <p className="text-sm text-muted-foreground">
              Provide the site and secret keys from your Cloudflare dashboard and choose where Turnstile should be enforced.
            </p>

            <label className="block">
              <span className="block font-medium">Site Key</span>
              <input
                type="text"
                className="mt-1 block w-full border border-border rounded-md shadow-sm focus:border-primary focus:ring focus:ring-primary/40"
                value={turnstileSettings.siteKey}
                onChange={e => setTurnstileSettings(prev => ({ ...prev, siteKey: e.target.value }))}
                placeholder="0x0000000000000000000000000000000AA"
              />
            </label>

            <label className="block">
              <span className="block font-medium">Secret Key</span>
              <input
                type="password"
                className="mt-1 block w-full border border-border rounded-md shadow-sm focus:border-primary focus:ring focus:ring-primary/40"
                value={turnstileSettings.secretKey}
                onChange={e => setTurnstileSettings(prev => ({ ...prev, secretKey: e.target.value }))}
                placeholder="0x0000000000000000000000000000000AA"
              />
            </label>

            <div className="flex flex-col space-y-2">
              <label className="inline-flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={turnstileSettings.registrationEnabled}
                  onChange={e => setTurnstileSettings(prev => ({ ...prev, registrationEnabled: e.target.checked }))}
                  className="rounded"
                />
                <span>Require Turnstile when creating an account</span>
              </label>
              <label className="inline-flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={turnstileSettings.loginEnabled}
                  onChange={e => setTurnstileSettings(prev => ({ ...prev, loginEnabled: e.target.checked }))}
                  className="rounded"
                />
                <span>Require Turnstile at login</span>
              </label>
            </div>

            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-md shadow"
            >
              Save Turnstile Settings
            </button>
            {turnstileMsg && <p className="text-green-600 mt-2">{turnstileMsg}</p>}
          </form>
        </div>

        <div className="bg-card rounded-xl border border-border shadow-sm p-6 mt-6">
          <form onSubmit={saveDomain} className="space-y-4">
            <h2 className="text-xl font-semibold border-b pb-2 mb-3">Domain Management</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                ['name', 'Domain Name', 'text'],
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
                    className="mt-1 block w-full border border-border rounded-md shadow-sm focus:border-primary focus:ring focus:ring-primary/40"
                    value={domainForm[key] || ''}
                    onChange={e => setDomainForm({ ...domainForm, [key]: e.target.value })}
                  />
                </label>
              ))}
              
              <label className="flex items-center space-x-2 col-span-2">
                <input
                  type="checkbox"
                  name="imap_tls"
                  checked={domainForm.imap_tls || false}
                  onChange={e => setDomainForm({ ...domainForm, imap_tls: e.target.checked })}
                  className="rounded"
                />
                <span className="font-medium">Use TLS</span>
              </label>
              
              <label className="flex items-center space-x-2 col-span-2">
                <input
                  type="checkbox"
                  name="is_active"
                  checked={domainForm.is_active ?? true}
                  onChange={e => setDomainForm({ ...domainForm, is_active: e.target.checked })}
                  className="rounded"
                />
                <span className="font-medium">Active</span>
              </label>
            </div>

            <input type="hidden" name="id" value={domainForm.id || ''} />
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-md shadow"
            >
              {domainForm.id ? 'Update Domain' : 'Add Domain'}
            </button>
            {domainForm.id && (
              <button
                type="button"
                onClick={() => {
                  setDomainForm({});
                  setDomainMsg('');
                }}
                className="bg-muted hover:bg-muted/80 text-foreground px-5 py-2 rounded-md shadow ml-2"
              >
                Cancel
              </button>
            )}
            {domainMsg && <p className="text-green-600 mt-2">{domainMsg}</p>}
          </form>
        </div>

        {domains.length > 0 && (
          <div className="bg-card rounded-xl border border-border shadow-sm p-6 mt-6">
            <h2 className="text-xl font-semibold border-b pb-2 mb-3">Domains</h2>
            <table className="min-w-full divide-y divide-border/60">
              <thead className="bg-muted">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Domain</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">IMAP Host</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-card divide-y divide-border/60 dark:divide-border/40">
                {domains.map(domain => (
                  <tr key={domain.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-foreground">{domain.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">{domain.imap_host}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        domain.is_active
                          ? 'bg-green-100 text-green-800 dark:bg-green-500/20 dark:text-green-100'
                          : 'bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-100'
                      }`}>
                        {domain.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button
                        onClick={() => editDomain(domain)}
                        className="text-blue-600 hover:text-blue-900 mr-3"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => deleteDomain(domain.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
