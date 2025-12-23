'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/router';
import { Copy, EyeOff, RefreshCw, LogOut, Inbox as InboxIcon, ArrowLeft, User, Calendar, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader } from '../components/modern-ui/Card';
import { Button } from '../components/modern-ui/Button';
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
  } catch {
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
            
            // Update the first email with the actual passkey
            const updatedEmails = emails.map((email, index) => 
              index === 0 ? { ...email, passkey: storedPasskey } : email
            )
            
            setUserEmails(updatedEmails)
            
            // Mark this as a first-time user (no timer, permanent unmasking)
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
  }, [passkeyTimers]);

  const getSnippet = text => {
    const first = (text || '').split('\n')[0];
    return first.length > 50 ? `${first.slice(0, 50)}...` : first;
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
        <div className="flex-grow flex justify-center items-center h-full">
          <LoadingSpinner />
        </div>
      </Layout>
    );
  }

  return (
    <Layout siteTitle={siteTitle} user={user}>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6 items-start p-2 sm:p-4 lg:p-8 max-w-7xl mx-auto">
        {/* Sidebar */}
        <div className="lg:col-span-4 xl:col-span-3 space-y-4 lg:space-y-6">
          <Card className="overflow-hidden border-none shadow-lg bg-card/50 backdrop-blur-sm">
            <CardHeader className="bg-primary/5 border-b border-primary/10 pb-3 sm:pb-4 px-4 sm:px-6">
              <h3 className="text-base sm:text-lg font-semibold flex items-center gap-2">
                <User className="w-4 h-4 text-primary" />
                Account Details
              </h3>
            </CardHeader>
            <CardContent className="pt-4 sm:pt-6 px-4 sm:px-6">
              {success && (
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300 rounded-lg p-3 mb-4 text-sm animate-in slide-in-from-top-2">
                  {success}
                </div>
              )}
              {error && (
                <div className="bg-destructive/10 border border-destructive/20 text-destructive rounded-lg p-3 mb-4 text-sm animate-in slide-in-from-top-2">
                  {error}
                </div>
              )}
              
              {userEmails.map(email => (
                <div key={email.id} className="space-y-4 sm:space-y-6">
                  <div className="space-y-1">
                    <label className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Email Address</label>
                    <div className="group flex items-center justify-between p-3 bg-muted/50 rounded-lg border border-border hover:border-primary/30 transition-all">
                      <span className="font-mono text-xs sm:text-sm truncate mr-2">{email.email_address}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-foreground flex-shrink-0"
                        onClick={() => copyToClipboard(email.email_address, email.id, 'email')}
                      >
                        {copyFeedback[`${email.id}-email`] ? <span className="text-xs font-bold text-green-500">✓</span> : <Copy className="w-4 h-4" />}
                      </Button>
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground px-1">
                      <span className="truncate mr-2">@{email.domain_name}</span>
                      <span className="flex-shrink-0">{formatDate(email.created_at)}</span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Passkey</label>
                    <div className="group flex items-center gap-2 p-3 bg-muted/50 rounded-lg border border-border hover:border-primary/30 transition-all">
                      <div className="flex-1 font-mono text-xs sm:text-sm overflow-hidden break-all">
                         {email.passkey ? (
                           <span className={newlyGeneratedPasskeys.has(email.id) ? "text-green-600 dark:text-green-400 font-bold" : ""}>
                             {email.passkey}
                           </span>
                         ) : (
                           <span className="text-muted-foreground tracking-widest">••••••••••••</span>
                         )}
                      </div>
                      {email.passkey && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-foreground"
                          onClick={() => copyToClipboard(email.passkey, email.id, 'passkey')}
                        >
                          {copyFeedback[`${email.id}-passkey`] ? <span className="text-xs font-bold text-green-500">✓</span> : <Copy className="w-4 h-4" />}
                        </Button>
                      )}
                    </div>
                    
                    {email.passkey ? (
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full gap-2 text-muted-foreground hover:text-foreground"
                        onClick={() => handleMaskPasskey(email.id)}
                      >
                        <EyeOff className="w-3 h-3" />
                        Mask Passkey
                      </Button>
                    ) : (
                      <Button
                        variant="secondary"
                        size="sm"
                        className="w-full gap-2"
                        onClick={() => handleRegeneratePasskey(email.id)}
                        disabled={regeneratingId === email.id}
                      >
                        <RefreshCw className={`w-3 h-3 ${regeneratingId === email.id ? 'animate-spin' : ''}`} />
                        {regeneratingId === email.id ? 'Regenerating...' : 'Regenerate Passkey'}
                      </Button>
                    )}
                  </div>
                </div>
              ))}

              <div className="pt-6 mt-6 border-t border-border">
                <Button
                  variant="ghost"
                  className="w-full gap-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                  onClick={handleLogout}
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Inbox Area */}
        <div className="lg:col-span-8 xl:col-span-9 lg:h-[calc(100vh-8rem)] min-h-[400px] sm:min-h-[600px]">
          <Card className="lg:h-full border-none shadow-xl bg-card/80 backdrop-blur-md flex flex-col lg:overflow-hidden">
            {selectedEmail ? (
              // Email Detail View
              <div className="flex flex-col lg:h-full animate-in slide-in-from-right-4 duration-300">
                <div className="border-b border-border p-3 sm:p-4 bg-muted/30">
                  <div className="flex items-center gap-2 sm:gap-4 mb-3 sm:mb-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedEmail(null)}
                      className="gap-2 pl-0 hover:pl-2 transition-all text-xs sm:text-sm"
                    >
                      <ArrowLeft className="w-3 h-3 sm:w-4 sm:h-4" />
                      Back to Inbox
                    </Button>
                  </div>
                  <h2 className="text-lg sm:text-2xl font-bold text-foreground mb-2 leading-tight break-words">
                    {selectedEmail.subject || '(No Subject)'}
                  </h2>
                  <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm text-muted-foreground">
                    <div className="flex items-center gap-2 bg-background px-2 py-1 rounded-md border shadow-sm">
                      <User className="w-3 h-3 flex-shrink-0" />
                      <span className="font-medium text-foreground truncate max-w-[150px] sm:max-w-none">{selectedEmail.from}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3 h-3 flex-shrink-0" />
                      <span>{new Date(selectedEmail.date).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-3 h-3 flex-shrink-0" />
                      <span>{new Date(selectedEmail.date).toLocaleTimeString()}</span>
                    </div>
                  </div>
                </div>
                <div className="flex-1 lg:overflow-y-auto p-3 sm:p-6 bg-background/50">
                  <div className="max-w-4xl mx-auto">
                    {selectedEmail.html ? (
                      <div
                        className="prose prose-zinc dark:prose-invert max-w-none
                          prose-headings:font-bold prose-a:text-primary 
                          prose-img:rounded-lg prose-img:shadow-md"
                        dangerouslySetInnerHTML={{ __html: selectedEmail.html }}
                      />
                    ) : (
                      <div className="whitespace-pre-wrap font-mono text-sm bg-muted p-4 rounded-lg border">
                        {selectedEmail.text}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              // Inbox List View
              <div className="flex flex-col h-full">
                <div className="p-3 sm:p-4 border-b border-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-muted/30">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <InboxIcon className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-base sm:text-lg">Inbox</h3>
                      <p className="text-xs text-muted-foreground">
                        {inbox.length} message{inbox.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 w-full sm:w-auto">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground bg-background px-3 py-1.5 rounded-full border shadow-sm">
                      {isRefreshing ? (
                        <RefreshCw className="w-3 h-3 animate-spin text-primary" />
                      ) : (
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                      )}
                      <span className="whitespace-nowrap">{isRefreshing ? 'Syncing...' : `Auto-refresh in ${countdown}s`}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex-1 overflow-y-auto p-2 space-y-2 bg-muted/10">
                  {inbox.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-muted-foreground p-8 text-center animate-in fade-in duration-500">
                      <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-6">
                        <InboxIcon className="w-12 h-12 opacity-20" />
                      </div>
                      <h4 className="text-xl font-semibold text-foreground mb-2">Your inbox is empty</h4>
                      <p className="max-w-sm text-sm opacity-70">
                        Messages will appear here automatically. No need to refresh the page.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {inbox.map((email, i) => (
                        <div
                          key={email.uid}
                          onClick={() => setSelectedEmail(email)}
                          className="group bg-background hover:bg-accent/50 p-4 rounded-xl border border-border/50 hover:border-primary/20 shadow-sm hover:shadow-md transition-all cursor-pointer animate-in slide-in-from-bottom-2 duration-300"
                          style={{ animationDelay: `${i * 50}ms` }}
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex items-start gap-4 min-w-0 flex-1">
                              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center text-primary font-bold text-sm ring-2 ring-background shadow-sm">
                                {email.from.replace(/^["']/, '').charAt(0).toUpperCase()}
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center justify-between mb-1">
                                  <span className="font-semibold text-foreground truncate pr-2">
                                    {email.from}
                                  </span>
                                  <span className="text-xs text-muted-foreground whitespace-nowrap font-medium">
                                    {formatDate(email.date)}
                                  </span>
                                </div>
                                <h4 className="text-sm font-medium text-foreground/90 truncate mb-1">
                                  {email.subject || '(No Subject)'}
                                </h4>
                                <p className="text-xs text-muted-foreground truncate line-clamp-2 opacity-80">
                                  {getSnippet(email.text)}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
    </Layout>
  );
}
