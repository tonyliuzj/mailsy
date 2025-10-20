import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/router';
import { Card, CardContent, CardHeader } from '../components/modern-ui/Card';
import { Button } from '../components/modern-ui/Button';
import { Badge } from '../components/modern-ui/Badge';
import { LoadingSpinner } from '../components/modern-ui/LoadingSpinner';
import { Layout } from '../components/modern-ui/Layout';
import { withUser } from '../lib/user-auth';

export const getServerSideProps = withUser(async ({ user }) => {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/info`);
    const data = await res.json();
    return {
      props: {
        siteTitle: data.title || 'Mailsy',
        user: user || null,
      }
    };
  } catch (error) {
    return {
      props: {
        siteTitle: 'Mailsy',
        user: user || null,
      }
    };
  }
});

export default function Inbox({ siteTitle, user }) {
  const router = useRouter();
  const [inbox, setInbox] = useState([]);
  const [selectedEmail, setSelectedEmail] = useState(null);
  const [countdown, setCountdown] = useState(5);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const seenUids = useRef(new Set());
  const [userEmails, setUserEmails] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [regeneratingId, setRegeneratingId] = useState(null)
  const [newlyGeneratedPasskeys, setNewlyGeneratedPasskeys] = useState(new Set())
  const [firstTimeUsers, setFirstTimeUsers] = useState(new Set())
  const [passkeyTimers, setPasskeyTimers] = useState({})
  const [copyFeedback, setCopyFeedback] = useState({})

  useEffect(() => {
    
    const fetchUserEmails = async () => {
      try {
        const response = await fetch('/api/account/info')
        if (response.ok) {
          const data = await response.json()
          const emails = data.emails || []
          
          // Check for newly created account passkey in localStorage
          const storedPasskey = localStorage.getItem('passkey')
          if (storedPasskey && emails.length > 0) {
            // This is a newly created account, show the passkey unmasked permanently
            const primaryEmail = emails[0]
            
            // Update the first email with the actual passkey
            const updatedEmails = emails.map((email, index) => 
              index === 0 ? { ...email, passkey: storedPasskey } : email
            )
            
            setUserEmails(updatedEmails)
            
            // Mark this as a first-time user (no timer, permanent unmasking)
            setFirstTimeUsers(prev => new Set([...prev, primaryEmail.id]))
            setSuccess('Welcome! Your passkey is shown below. You can mask it manually when ready.')
            
            // Clear the localStorage to prevent showing on subsequent visits
            localStorage.removeItem('passkey')
          } else {
            setUserEmails(emails)
          }
        } else {
          
          router.push('/')
        }
      } catch (error) {
        console.error('Error fetching user emails:', error)
        router.push('/')
      } finally {
        setLoading(false)
      }
    }

    fetchUserEmails()
  }, [router])

  const fetchEmails = useCallback(async () => {
    if (userEmails.length === 0) return;
    
    const primaryEmail = userEmails[0];
    if (!primaryEmail) return;

    try {
      setIsRefreshing(true);
      const res = await fetch('/api/emails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: primaryEmail.email_address, apiKey: primaryEmail.apiKey }),
        credentials: 'include',
      });
      const { emails } = await res.json();
      const newOnes = emails?.filter(m => {
        if (seenUids.current.has(m.uid)) return false;
        seenUids.current.add(m.uid);
        return true;
      }) || [];
      if (newOnes.length) setInbox(prev => [...newOnes, ...prev]);
    } catch (err) {
      console.error(err);
    } finally {
      setIsRefreshing(false);
    }
  }, [userEmails]);

  useEffect(() => {
    let timer;
    if (userEmails.length > 0) {
      fetchEmails();
      setCountdown(5);
      timer = setInterval(() => {
        setCountdown(c => {
          if (c <= 1) {
            fetchEmails();
            return 5;
          }
          return c - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [userEmails, fetchEmails]);

  // Cleanup effect for passkey timers
  useEffect(() => {
    return () => {
      // Clear all passkey timers on component unmount
      Object.values(passkeyTimers).forEach(timer => {
        if (typeof timer === 'object' && timer.clear) {
          timer.clear();
        }
      });
    };
  }, []);

  const getSnippet = text => {
    const first = (text || '').split('\n')[0];
    return first.length > 50 ? first.slice(0, 50) + '…' : first;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const handleMaskPasskey = (emailId) => {
    // Manually mask the passkey for both first-time users and regenerated passkeys
    setUserEmails(prevEmails =>
      prevEmails.map(email =>
        email.id === emailId
          ? { ...email, passkey: null }
          : email
      )
    )
    
    // Remove from first-time users set
    setFirstTimeUsers(prev => {
      const newSet = new Set(prev)
      newSet.delete(emailId)
      return newSet
    })
    
    // Remove from newly generated passkeys set
    setNewlyGeneratedPasskeys(prev => {
      const newSet = new Set(prev)
      newSet.delete(emailId)
      return newSet
    })
    
    setSuccess('Passkey has been masked. Use "Regenerate Passkey" to view it again.')
  }

  const handleRegeneratePasskey = async (emailId) => {
    setRegeneratingId(emailId)
    setError('')
    setSuccess('')

    try {
      const response = await fetch('/api/account/regenerate-passkey', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ emailId }),
        credentials: 'include',
      })

      if (response.ok) {
        const data = await response.json()
        setSuccess('Passkey regenerated successfully! You can mask it manually when ready.')
        
        // Update the email with the new passkey
        setUserEmails(prevEmails =>
          prevEmails.map(email =>
            email.id === emailId
              ? { ...email, passkey: data.newPasskey }
              : email
          )
        )

        // Mark this passkey as newly generated (permanent unmasking, no timer)
        setNewlyGeneratedPasskeys(prev => new Set([...prev, emailId]))

        // Clear any existing timer for this email
        if (passkeyTimers[emailId]) {
          clearInterval(passkeyTimers[emailId])
          setPasskeyTimers(prev => {
            const newTimers = { ...prev }
            delete newTimers[emailId]
            return newTimers
          })
        }

      } else {
        const data = await response.json()
        setError(data.error || 'Failed to regenerate passkey')
      }
    } catch (error) {
      console.error('Passkey regeneration error:', error)
      setError('Failed to regenerate passkey. Please try again.')
    } finally {
      setRegeneratingId(null)
    }
  }

  const copyToClipboard = async (text, emailId, type = 'text') => {
    try {
      await navigator.clipboard.writeText(text)
      
      // Show copy feedback
      const key = `${emailId}-${type}`
      setCopyFeedback(prev => ({ ...prev, [key]: true }))
      
      // Clear feedback after 2 seconds
      setTimeout(() => {
        setCopyFeedback(prev => {
          const newFeedback = { ...prev }
          delete newFeedback[key]
          return newFeedback
        })
      }, 2000)
    } catch (error) {
      console.error('Failed to copy to clipboard:', error)
    }
  }

  const handleLogout = async () => {
    try {
      await fetch('/api/users/logout', { method: 'POST' })
      router.push('/')
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  if (loading) {
    return (
      <Layout siteTitle={siteTitle} user={user}>
        <div className="flex justify-center items-center min-h-screen">
          <LoadingSpinner />
        </div>
      </Layout>
    );
  }

  return (
    <Layout siteTitle={siteTitle} user={user}>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start p-6">
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold">Account Details</h3>
            </CardHeader>
            <CardContent>
              {success && (
                <div className="bg-green-50 border border-green-200 rounded-md p-3 mb-4">
                  <p className="text-sm text-green-800">{success}</p>
                </div>
              )}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-4">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              )}
              {userEmails.map(email => (
                <div key={email.id} className="border-b last:border-b-0 py-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">{email.email_address}</h4>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(email.email_address, email.id, 'email')}
                    >
                      {copyFeedback[`${email.id}-email`] ? '✓ Copied!' : 'Copy'}
                    </Button>
                  </div>
                  <div className="text-sm text-gray-500 mt-1">
                    Domain: @{email.domain_name} • Created: {formatDate(email.created_at)}
                  </div>
                  <div className="mt-4">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium text-gray-700">Passkey:</label>
                    </div>
                    <div className="flex items-center space-x-2 mt-1">
                      <code className={`flex-1 text-xs p-2 rounded transition-colors ${
                        firstTimeUsers.has(email.id)
                          ? 'bg-blue-100 border-2 border-blue-300 text-blue-900'
                          : newlyGeneratedPasskeys.has(email.id) 
                            ? 'bg-green-100 border-2 border-green-300 text-green-900' 
                            : 'bg-gray-100'
                      }`}>
                        {email.passkey ? email.passkey : '••••••••••••••••'}
                      </code>
                      {email.passkey && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(email.passkey, email.id, 'passkey')}
                        >
                          {copyFeedback[`${email.id}-passkey`] ? '✓ Copied!' : 'Copy'}
                        </Button>
                      )}
                    </div>
                    {firstTimeUsers.has(email.id) && (
                      <p className="text-xs text-blue-700 mt-1">
                        🎉 Welcome! Your passkey is visible. Click "Mask Passkey" when you're ready to hide it.
                      </p>
                    )}
                    {newlyGeneratedPasskeys.has(email.id) && (
                      <p className="text-xs text-green-700 mt-1">
                        🔑 New passkey generated! Click "Mask Passkey" when you're ready to hide it.
                      </p>
                    )}
                  </div>
                  {(firstTimeUsers.has(email.id) || newlyGeneratedPasskeys.has(email.id)) ? (
                    <Button
                      variant="secondary"
                      size="sm"
                      className="mt-4 w-full"
                      onClick={() => handleMaskPasskey(email.id)}
                    >
                      Mask Passkey
                    </Button>
                  ) : (
                    <Button
                      variant="destructive"
                      size="sm"
                      className="mt-4 w-full"
                      onClick={() => handleRegeneratePasskey(email.id)}
                      disabled={regeneratingId === email.id}
                    >
                      {regeneratingId === email.id ? 'Regenerating...' : 'Regenerate Passkey'}
                    </Button>
                  )}
                </div>
              ))}
              <Button
                variant="secondary"
                className="w-full mt-4"
                onClick={handleLogout}
              >
                Logout
              </Button>
            </CardContent>
          </Card>
        </div>
        <div className="lg:col-span-2">
          <Card className="h-full">
            <CardContent className="p-0 h-full flex flex-col">
              {selectedEmail ? (
                <div className="flex flex-col flex-1">
                  <div className="border-b dark:border-gray-700">
                    <div className="p-6">
                      <Button
                        variant="ghost"
                        onClick={() => setSelectedEmail(null)}
                        className="flex items-center text-gray-600 dark:text-gray-400 mb-4"
                      >
                        ← Back to inbox
                      </Button>
                    </div>
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                      {selectedEmail.subject || '(no subject)'}
                    </h2>
                    <div className="flex items-center text-sm text-gray-600 dark:text-gray-400 mb-4">
                      <span className="font-medium">{selectedEmail.from}</span>
                      <span className="mx-2">•</span>
                      <span>{new Date(selectedEmail.date).toLocaleString()}</span>
                    </div>
                  </div>
                  <div className="flex-1 overflow-y-auto p-6">
                    {selectedEmail.html ? (
                      <div
                        className="prose prose max-w-none dark:prose-invert"
                        dangerouslySetInnerHTML={{ __html: selectedEmail.html }}
                      />
                    ) : (
                      <pre className="whitespace-pre-wrap break-words text-sm text-gray-800 dark:text-gray-200 font-mono">
                        {selectedEmail.text}
                      </pre>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex-1 overflow-hidden flex flex-col">
                  <div className="p-6 border-b dark:border-gray-700">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          Inbox
                        </h3>
                      </div>
                      <div className="flex items-center space-x-2">
                        {isRefreshing ? (
                          <LoadingSpinner size="sm" />
                        ) : null}
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {isRefreshing ? 'Checking...' : `Next check in ${countdown}s`}
                        </span>
                      </div>
                    </div>
                    <Badge variant={inbox.length > 0 ? "secondary" : "outline"}>
                      {inbox.length} email{inbox.length !== 1 ? 's' : ''}
                    </Badge>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto">
                    {inbox.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400">
                        <span className="text-4xl mb-4 opacity-50">📭</span>
                        <p className="mt-4 text-lg font-medium">No messages yet</p>
                        <p className="text-sm">
                          Your inbox is empty. Emails will appear here when they arrive.
                        </p>
                      </div>
                    ) : (
                      <div className="divide-y dark:divide-gray-700">
                        {inbox.map((email) => (
                          <div
                            key={email.uid}
                            onClick={() => setSelectedEmail(email)}
                            className="grid grid-cols-[auto_1fr_auto_3fr_auto_auto] items-start gap-4 p-4 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors"
                          >
                            <div className="flex items-start">
                              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                                <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                                  {email.from.charAt(0).toUpperCase()}
                                </span>
                              </div>
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                {email.subject || '(no subject)'}
                              </p>
                              <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                                {getSnippet(email.text)}
                              </p>
                            </div>
                            <div className="text-right text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                              {formatDate(email.date)}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
