import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/router'
import { withSessionSsr } from '../../lib/session'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card'
import { Input } from '../../components/ui/input'
import { Button } from '../../components/ui/button'
import { Badge } from '../../components/ui/badge'
import {
  LogOut, Key, User, Settings, Globe, ShieldCheck,
  Edit, Trash2, Plus, Save, X, Server
} from 'lucide-react'

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
    // Scroll to form
    document.getElementById('domain-form')?.scrollIntoView({ behavior: 'smooth' })
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
    <div className="min-h-screen bg-muted/40 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Admin Panel</h1>
            <p className="text-muted-foreground">Manage your Mailsy instance</p>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium">Logged in as {admin.username}</span>
            <Button variant="destructive" size="sm" onClick={logout} className="gap-2">
              <LogOut className="h-4 w-4" /> Logout
            </Button>
          </div>
        </div>

        {/* Admin Settings Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          
          {/* Change Password */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Key className="h-5 w-5 text-primary" /> Change Password
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={changePwd} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Current Password</label>
                  <Input
                    type="password"
                    value={pwd.current}
                    onChange={e => setPwd({ ...pwd, current: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">New Password</label>
                  <Input
                    type="password"
                    value={pwd.new}
                    onChange={e => setPwd({ ...pwd, new: e.target.value })}
                  />
                </div>
                <Button type="submit" className="w-full">Update Password</Button>
                {pwdMsg && <p className={`text-sm ${pwdMsg.includes('Error') ? 'text-destructive' : 'text-green-600'}`}>{pwdMsg}</p>}
              </form>
            </CardContent>
          </Card>

          {/* Change Username */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <User className="h-5 w-5 text-primary" /> Change Username
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={changeUsername} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">New Username</label>
                  <Input
                    type="text"
                    value={newUsername}
                    onChange={e => setNewUsername(e.target.value)}
                    minLength={3}
                    required
                  />
                </div>
                <Button type="submit" className="w-full">Update Username</Button>
                {usernameMsg && <p className={`text-sm ${usernameMsg.includes('Failed') ? 'text-destructive' : 'text-green-600'}`}>{usernameMsg}</p>}
              </form>
            </CardContent>
          </Card>

          {/* Change Admin Path */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Settings className="h-5 w-5 text-primary" /> Admin Path
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={changeAdminPath} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Path</label>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground text-sm">/</span>
                    <Input
                      type="text"
                      value={newPath}
                      onChange={e => setNewPath(e.target.value)}
                      minLength={3}
                      required
                    />
                  </div>
                </div>
                <Button type="submit" className="w-full">Update Path</Button>
                {pathMsg && <p className={`text-sm ${pathMsg.includes('Failed') ? 'text-destructive' : 'text-green-600'}`}>{pathMsg}</p>}
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Global Settings Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* General Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5 text-primary" /> General Settings
              </CardTitle>
              <CardDescription>Basic site configuration</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={saveSiteTitle} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Site Title</label>
                  <Input
                    type="text"
                    value={siteTitle}
                    onChange={e => setSiteTitle(e.target.value)}
                    placeholder="My Email Service"
                  />
                </div>
                <Button type="submit">Save Settings</Button>
                {siteTitleMsg && <p className={`text-sm ${siteTitleMsg.includes('Error') ? 'text-destructive' : 'text-green-600'}`}>{siteTitleMsg}</p>}
              </form>
            </CardContent>
          </Card>

          {/* Turnstile Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-primary" /> Cloudflare Turnstile
              </CardTitle>
              <CardDescription>Spam protection settings</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={saveTurnstileSettings} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Site Key</label>
                    <Input
                      type="text"
                      value={turnstileSettings.siteKey}
                      onChange={e => setTurnstileSettings(prev => ({ ...prev, siteKey: e.target.value }))}
                      placeholder="0x4AAAA..."
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Secret Key</label>
                    <Input
                      type="password"
                      value={turnstileSettings.secretKey}
                      onChange={e => setTurnstileSettings(prev => ({ ...prev, secretKey: e.target.value }))}
                      placeholder="0x4AAAA..."
                    />
                  </div>
                </div>
                
                <div className="flex flex-col gap-2 pt-2">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={turnstileSettings.registrationEnabled}
                      onChange={e => setTurnstileSettings(prev => ({ ...prev, registrationEnabled: e.target.checked }))}
                      className="rounded border-gray-300 text-primary focus:ring-primary h-4 w-4"
                    />
                    <span className="text-sm">Require Turnstile for registration</span>
                  </label>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={turnstileSettings.loginEnabled}
                      onChange={e => setTurnstileSettings(prev => ({ ...prev, loginEnabled: e.target.checked }))}
                      className="rounded border-gray-300 text-primary focus:ring-primary h-4 w-4"
                    />
                    <span className="text-sm">Require Turnstile for login</span>
                  </label>
                </div>

                <Button type="submit">Save Turnstile Settings</Button>
                {turnstileMsg && <p className={`text-sm ${turnstileMsg.includes('Error') ? 'text-destructive' : 'text-green-600'}`}>{turnstileMsg}</p>}
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Domain Management */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Domain Form */}
          <Card className="lg:col-span-1" id="domain-form">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Server className="h-5 w-5 text-primary" /> 
                {domainForm.id ? 'Edit Domain' : 'Add Domain'}
              </CardTitle>
              <CardDescription>
                {domainForm.id ? 'Update domain details' : 'Configure a new email domain'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={saveDomain} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Domain Name</label>
                  <Input
                    name="name"
                    value={domainForm.name || ''}
                    onChange={e => setDomainForm({ ...domainForm, name: e.target.value })}
                    placeholder="example.com"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">IMAP Host</label>
                  <Input
                    name="imap_host"
                    value={domainForm.imap_host || ''}
                    onChange={e => setDomainForm({ ...domainForm, imap_host: e.target.value })}
                    placeholder="imap.example.com"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Port</label>
                    <Input
                      type="number"
                      name="imap_port"
                      value={domainForm.imap_port || ''}
                      onChange={e => setDomainForm({ ...domainForm, imap_port: e.target.value })}
                      placeholder="993"
                    />
                  </div>
                  <div className="flex items-end pb-2">
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        name="imap_tls"
                        checked={domainForm.imap_tls || false}
                        onChange={e => setDomainForm({ ...domainForm, imap_tls: e.target.checked })}
                        className="rounded border-gray-300 text-primary focus:ring-primary h-4 w-4"
                      />
                      <span className="text-sm font-medium">Use TLS</span>
                    </label>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">IMAP User</label>
                  <Input
                    name="imap_user"
                    value={domainForm.imap_user || ''}
                    onChange={e => setDomainForm({ ...domainForm, imap_user: e.target.value })}
                    placeholder="user@example.com"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">IMAP Password</label>
                  <Input
                    type="password"
                    name="imap_password"
                    value={domainForm.imap_password || ''}
                    onChange={e => setDomainForm({ ...domainForm, imap_password: e.target.value })}
                    placeholder="••••••••"
                  />
                </div>
                
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    name="is_active"
                    checked={domainForm.is_active ?? true}
                    onChange={e => setDomainForm({ ...domainForm, is_active: e.target.checked })}
                    className="rounded border-gray-300 text-primary focus:ring-primary h-4 w-4"
                  />
                  <span className="text-sm font-medium">Active</span>
                </label>

                <div className="flex gap-2">
                  <Button type="submit" className="flex-1">
                    {domainForm.id ? <Save className="h-4 w-4 mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
                    {domainForm.id ? 'Update' : 'Add'}
                  </Button>
                  {domainForm.id && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setDomainForm({});
                        setDomainMsg('');
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                {domainMsg && <p className={`text-sm ${domainMsg.includes('Error') ? 'text-destructive' : 'text-green-600'}`}>{domainMsg}</p>}
              </form>
            </CardContent>
          </Card>

          {/* Domain List */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Domains</CardTitle>
              <CardDescription>Managed email domains</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                {domains.length > 0 ? (
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs text-muted-foreground uppercase bg-muted/50">
                      <tr>
                        <th className="px-4 py-3 rounded-tl-lg">Domain</th>
                        <th className="px-4 py-3">IMAP Host</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3 rounded-tr-lg text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {domains.map((domain) => (
                        <tr key={domain.id} className="border-b last:border-0 hover:bg-muted/50 transition-colors">
                          <td className="px-4 py-3 font-medium">{domain.name}</td>
                          <td className="px-4 py-3 text-muted-foreground">{domain.imap_host}</td>
                          <td className="px-4 py-3">
                            <Badge variant={domain.is_active ? 'default' : 'destructive'}>
                              {domain.is_active ? 'Active' : 'Inactive'}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex justify-end gap-2">
                              <Button variant="ghost" size="icon" onClick={() => editDomain(domain)} title="Edit">
                                <Edit className="h-4 w-4 text-muted-foreground hover:text-primary" />
                              </Button>
                              <Button variant="ghost" size="icon" onClick={() => deleteDomain(domain.id)} title="Delete">
                                <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No domains configured yet.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  )
}
