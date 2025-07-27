import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'

export async function getServerSideProps() {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/info`)
    const data = await res.json()
    return {
      props: {
        siteTitle: data.title || 'Mailsy'
      }
    }
  } catch (error) {
    return {
      props: {
        siteTitle: 'Mailsy'
      }
    }
  }
}

export default function Home({ siteTitle }) {
  const [email, setEmail] = useState('')
  const [apiKey, setApiKey] = useState('')
  const [inbox, setInbox] = useState([])
  const [selectedEmail, setSelectedEmail] = useState(null)
  const [countdown, setCountdown] = useState(5)
  const [showCaptcha, setShowCaptcha] = useState(false)
  const [started, setStarted] = useState(false)
  const [domains, setDomains] = useState([])
  const [selectedDomain, setSelectedDomain] = useState('')
  const seenUids = useRef(new Set())
  const widgetIdRef = useRef(null)

  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITEKEY

  useEffect(() => {
    if (!siteKey || !showCaptcha) return
    const script = document.createElement('script')
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js'
    script.async = true
    document.body.appendChild(script)
    script.onload = () => {
      widgetIdRef.current = window.turnstile.render('#cf-turnstile', {
        sitekey: siteKey,
        callback: handleCaptcha,
      })
    }
    return () => {
      document.body.removeChild(script)
      widgetIdRef.current = null
    }
  }, [siteKey, showCaptcha])

  useEffect(() => {
    fetch('/api/domains')
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) {
          setDomains(data)
          if (data.length > 0) {
            setSelectedDomain(data[0].id)
          }
        }
      })
      .catch(error => {
        console.error('Error fetching domains:', error)
        setDomains([])
      })
  }, [])

  const handleCaptcha = async token => {
    if (!selectedDomain) return
    
    setShowCaptcha(false)
    setStarted(true)
    seenUids.current.clear()
    setInbox([])
    setSelectedEmail(null)
    setCountdown(5)
    const res = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        cf_turnstile_token: token,
        domain_id: selectedDomain
      }),
    })
    const { email: alias, apiKey: key } = await res.json()
    if (alias && key) {
      setEmail(alias)
      setApiKey(key)
    }
  }

  const onGenerateClick = () => {
    console.log("Start button pressed. started=", started);
    if (!started) {
      setShowCaptcha(true)
    } else {
      setEmail('')
      setApiKey('')
      setStarted(false)
      setShowCaptcha(false)
      seenUids.current.clear()
      setInbox([])
      setSelectedEmail(null)
      setCountdown(5)
    }
  }

  const fetchEmails = useCallback(async () => {
    if (!email || !apiKey) return
    try {
      const res = await fetch('/api/emails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, apiKey }),
      })
      const { emails } = await res.json()
      const newOnes = emails?.filter(m => {
        if (seenUids.current.has(m.uid)) return false
        seenUids.current.add(m.uid)
        return true
      }) || []
      if (newOnes.length) setInbox(prev => [...newOnes, ...prev])
    } catch (err) {
      console.error(err)
    }
  }, [email, apiKey])

  useEffect(() => {
    let timer
    if (started && email && apiKey) {
      fetchEmails()
      setCountdown(5)
      timer = setInterval(() => {
        setCountdown(c => {
          if (c <= 1) {
            fetchEmails()
            return 5
          }
          return c - 1
        })
      }, 1000)
    }
    return () => clearInterval(timer)
  }, [started, email, apiKey, fetchEmails])

  const getSnippet = text => {
    const first = (text || '').split('\n')[0]
    return first.length > 50 ? first.slice(0, 50) + '…' : first
  }

  const copyEmail = () => email && navigator.clipboard.writeText(email)

  return (
    <>
      <nav className="bg-white shadow">
        <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="text-xl font-bold">{siteTitle || 'Mailsy'}</div>
          <div className="space-x-6 text-gray-600">
            <Link href="/" className="hover:text-gray-900">Home</Link>
            <Link href="https://github.com/isawebapp/mailsy" className="hover:text-gray-900">Project Github</Link>
          </div>
        </div>
      </nav>

      <div className="min-h-screen bg-gray-50 py-12 px-6 sm:px-8 md:px-12 lg:px-16">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
          <div className="md:col-span-1 bg-white p-6 rounded-lg shadow flex flex-col">
            <h1 className="text-2xl md:text-3xl font-bold mb-4 text-center">
              Temp Mail Generator
            </h1>
            <ul className="space-y-2 text-gray-700 mb-6 text-sm md:text-base">
              <li className="flex items-center">
                <span className="mr-2">😊</span> Privacy friendly
              </li>
              <li className="flex items-center">
                <span className="mr-2">⏱️</span> One-time use
              </li>
            </ul>

            {domains.length > 0 ? (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Select Domain</label>
                <select
                  value={selectedDomain}
                  onChange={e => setSelectedDomain(e.target.value)}
                  className="w-full border border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200 p-2"
                >
                  {domains.map(domain => (
                    <option key={domain.id} value={domain.id}>
                      {domain.name}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <p className="text-red-500 text-sm mb-4">No active domains available. Please contact the administrator.</p>
            )}

            <button
              onClick={onGenerateClick}
              disabled={!siteKey || !selectedDomain || domains.length === 0}
              className="w-full bg-black text-white py-2 rounded-md hover:opacity-90 transition mb-4 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {!started ? 'Start' : 'Get New Address'}
            </button>

            {showCaptcha && !email && (
              <div className="flex justify-center">
                <div id="cf-turnstile"></div>
              </div>
            )}

            {started && email && (
              <div className="mt-4 text-center">
                <p
                  onClick={copyEmail}
                  className="font-mono bg-gray-100 p-2 rounded cursor-pointer hover:bg-gray-200 break-all text-sm md:text-base"
                >
                  {email}
                </p>
                <p className="text-gray-500 text-xs md:text-sm mt-1">
                  Refresh in: {countdown} second{countdown !== 1 ? 's' : ''}
                </p>
              </div>
            )}
          </div>

          <div className="md:col-span-2 bg-white p-6 rounded-lg shadow flex flex-col">
            {!started ? (
              <p className="text-gray-500 text-center mt-4">
                Click “Start” to generate an address.
              </p>
            ) : selectedEmail ? (
              <div className="flex flex-col flex-1">
                <button
                  onClick={() => setSelectedEmail(null)}
                  className="self-start text-blue-600 hover:underline mb-4 text-sm"
                >
                  ← Back
                </button>
                <h2 className="text-lg font-semibold mb-2">
                  {selectedEmail.subject || '(no subject)'}
                </h2>
                <p className="text-xs text-gray-600 mb-4">
                  From: {selectedEmail.from} —{' '}
                  {new Date(selectedEmail.date).toLocaleString()}
                </p>
                <div className="flex-1 overflow-y-auto border-t pt-2">
                  {selectedEmail.html ? (
                    <div
                      className="space-y-4 text-sm text-gray-800 break-words"
                      dangerouslySetInnerHTML={{ __html: selectedEmail.html }}
                    />
                  ) : (
                    <pre className="whitespace-pre-wrap break-words text-sm text-gray-800 space-y-2">
                      {selectedEmail.text}
                    </pre>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto">
                <div className="flex items-center mb-4 text-sm text-gray-600">
                  <div className="animate-spin border-[2px] border-gray-300 border-t-black rounded-full w-4 h-4 mr-2"></div>
                  <span>Waiting for emails</span>
                </div>
                {inbox.length === 0 ? (
                  <p className="text-gray-500 text-center">No messages yet.</p>
                ) : (
                  <ul className="divide-y">
                    {inbox.map(m => (
                      <li
                        key={m.uid}
                        onClick={() => setSelectedEmail(m)}
                        className="grid grid-cols-[1fr_3fr_1fr] items-start gap-4 p-3 hover:bg-gray-50 cursor-pointer text-sm"
                      >
                        <div className="truncate font-medium">{m.from}</div>
                        <div>
                          <p className="truncate font-semibold">{m.subject || '(no subject)'}</p>
                          <p className="text-gray-600">{getSnippet(m.text)}</p>
                        </div>
                        <div className="text-right text-xs text-gray-500 whitespace-nowrap">
                          {new Date(m.date).toLocaleDateString(undefined, {
                            month: 'short', day: 'numeric'
                          })}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      <footer className="bg-gray-50 py-4 text-center text-xs text-gray-500 border-t">
        From <i>Is A Web App</i> (
        <a
          href="https://isawebapp.com"
          target="_blank"
          rel="noopener noreferrer"
          className="underline hover:text-gray-700"
        >
          isawebapp.com
        </a>{' '}
        |{' '}
        <a
          href="https://github.com/isawebapp"
          target="_blank"
          rel="noopener noreferrer"
          className="underline hover:text-gray-700"
        >
          GitHub
        </a>
        ) | Powered by{' '}
        <a
          href="https://tony-liu.com"
          target="_blank"
          rel="noopener noreferrer"
          className="underline hover:text-gray-700"
        >
          tony-liu.com
        </a>
      </footer>

    </>
  )
}
