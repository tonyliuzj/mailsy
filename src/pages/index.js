'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { Card, CardContent, CardHeader } from '../components/modern-ui/Card';
import { Button } from '../components/modern-ui/Button';
import { LoadingSpinner } from '../components/modern-ui/LoadingSpinner';
import { Layout } from '../components/modern-ui/Layout';
import { EmailInput } from '../components/modern-ui/EmailInput';
import { Input } from '../components/modern-ui/Input';
import { withUser } from '../lib/user-auth';

export const getServerSideProps = withUser(async ({ user }) => {
  try {
    const { getSiteTitle, getTurnstileConfig } = await import('../lib/db');
    const siteTitle = getSiteTitle() || 'Mailsy';
    const turnstile = getTurnstileConfig();
    return {
      props: {
        siteTitle,
        user: user || null,
        turnstileSiteKey: turnstile.siteKey || '',
        turnstileRegistrationEnabled: Boolean(turnstile.registrationEnabled),
        turnstileLoginEnabled: Boolean(turnstile.loginEnabled),
      },
    };
  } catch {
    return {
      props: {
        siteTitle: 'Mailsy',
        user: user || null,
        turnstileSiteKey: '',
        turnstileRegistrationEnabled: false,
        turnstileLoginEnabled: false,
      },
    };
  }
});

export default function Home({
  siteTitle,
  user,
  turnstileSiteKey: initialTurnstileSiteKey,
  turnstileRegistrationEnabled: initialTurnstileRegistrationEnabled,
  turnstileLoginEnabled: initialTurnstileLoginEnabled,
}) {
  const router = useRouter();
  const [started, setStarted] = useState(false);
  const [domains, setDomains] = useState([]);
  const [selectedDomain, setSelectedDomain] = useState('');
  const [emailInput, setEmailInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isLoginView, setIsLoginView] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPasskey, setLoginPasskey] = useState('');

  const [turnstileSiteKey, setTurnstileSiteKey] = useState(initialTurnstileSiteKey || '');
  const [turnstileRegistrationEnabled, setTurnstileRegistrationEnabled] = useState(
    Boolean(initialTurnstileRegistrationEnabled)
  );
  const [turnstileLoginEnabled, setTurnstileLoginEnabled] = useState(
    Boolean(initialTurnstileLoginEnabled)
  );
  const registerContainerRef = useRef(null);
  const loginContainerRef = useRef(null);
  const registerWidgetIdRef = useRef(null);
  const loginWidgetIdRef = useRef(null);
  const [registerToken, setRegisterToken] = useState('');
  const [loginToken, setLoginToken] = useState('');

  useEffect(() => {
    setTurnstileSiteKey(initialTurnstileSiteKey || '');
    setTurnstileRegistrationEnabled(Boolean(initialTurnstileRegistrationEnabled));
    setTurnstileLoginEnabled(Boolean(initialTurnstileLoginEnabled));
  }, [initialTurnstileSiteKey, initialTurnstileRegistrationEnabled, initialTurnstileLoginEnabled]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (user) return;

    const requiresTurnstile =
      Boolean(turnstileSiteKey) && (turnstileRegistrationEnabled || turnstileLoginEnabled);

    if (!requiresTurnstile) {
      if (registerWidgetIdRef.current && window.turnstile) {
        window.turnstile.remove(registerWidgetIdRef.current);
      }
      if (loginWidgetIdRef.current && window.turnstile) {
        window.turnstile.remove(loginWidgetIdRef.current);
      }
      registerWidgetIdRef.current = null;
      loginWidgetIdRef.current = null;
      setRegisterToken('');
      setLoginToken('');
      return;
    }

    const renderWidgets = () => {
      if (!window.turnstile) return;

      if (turnstileRegistrationEnabled && registerContainerRef.current) {
        if (registerWidgetIdRef.current) {
          window.turnstile.reset(registerWidgetIdRef.current);
        } else {
          registerWidgetIdRef.current = window.turnstile.render(registerContainerRef.current, {
            sitekey: turnstileSiteKey,
            callback: token => setRegisterToken(token),
            'expired-callback': () => setRegisterToken(''),
            'error-callback': () => setRegisterToken(''),
          });
        }
      } else if (registerWidgetIdRef.current) {
        window.turnstile.remove(registerWidgetIdRef.current);
        registerWidgetIdRef.current = null;
        setRegisterToken('');
      }

      if (turnstileLoginEnabled && loginContainerRef.current) {
        if (loginWidgetIdRef.current) {
          window.turnstile.reset(loginWidgetIdRef.current);
        } else {
          loginWidgetIdRef.current = window.turnstile.render(loginContainerRef.current, {
            sitekey: turnstileSiteKey,
            callback: token => setLoginToken(token),
            'expired-callback': () => setLoginToken(''),
            'error-callback': () => setLoginToken(''),
          });
        }
      } else if (loginWidgetIdRef.current) {
        window.turnstile.remove(loginWidgetIdRef.current);
        loginWidgetIdRef.current = null;
        setLoginToken('');
      }
    };

    if (window.turnstile) {
      renderWidgets();
      return;
    }

    let script = document.querySelector('script[data-turnstile-script]');
    const handleLoad = () => {
      if (script) {
        script.setAttribute('data-loaded', 'true');
      }
      renderWidgets();
    };

    if (!script) {
      script = document.createElement('script');
      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
      script.async = true;
      script.defer = true;
      script.setAttribute('data-turnstile-script', 'true');
      script.addEventListener('load', handleLoad);
      document.head.appendChild(script);
    } else {
      script.addEventListener('load', handleLoad);
      if (script.getAttribute('data-loaded') === 'true' || script.readyState === 'complete') {
        renderWidgets();
      }
    }

    return () => {
      script?.removeEventListener('load', handleLoad);
    };
  }, [user, turnstileSiteKey, turnstileRegistrationEnabled, turnstileLoginEnabled]);

  useEffect(() => {
    if (user) return;
    fetch('/api/domains')
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) {
          setDomains(data);
          if (data.length > 0) {
            setSelectedDomain(data[0].name);
          }
        }
      })
      .catch(error => {
        console.error('Error fetching domains:', error);
        setDomains([]);
      });
  }, [user]);

  
  const generateRandomPrefix = () => {
    const adjectives = ['quick', 'swift', 'fast', 'rapid', 'instant', 'speedy', 'hasty', 'nimble'];
    const nouns = ['mail', 'email', 'message', 'letter', 'note', 'memo', 'dispatch', 'courier'];
    const randomAdj = adjectives[Math.floor(Math.random() * adjectives.length)];
    const randomNoun = nouns[Math.floor(Math.random() * nouns.length)];
    const randomNumber = Math.floor(Math.random() * 1000);
    return `${randomAdj}${randomNoun}${randomNumber}`;
  };

  const handleRandomClick = () => {
    const randomPrefix = generateRandomPrefix();
    setEmailInput(randomPrefix);
  };


  const handleSubmit = async () => {
    if (!emailInput || !selectedDomain) {
      setError('Please enter an email address');
      return;
    }

    if (turnstileRegistrationEnabled && turnstileSiteKey && !registerToken) {
      setError('Please complete the Turnstile challenge.');
      return;
    }

    
    setIsLoading(true);
    setError('');

    try {
      const payload = {
        userEmail: emailInput,
        emailType: 'username',
        domainName: selectedDomain,
      };

      if (turnstileRegistrationEnabled && turnstileSiteKey) {
        payload.turnstileToken = registerToken;
      }

      const res = await fetch('/api/users/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (data.success) {
        localStorage.setItem('email', data.email.email);
        localStorage.setItem('apiKey', data.email.apiKey);
        localStorage.setItem('passkey', data.passkey);
        setStarted(true);
        
        
        setEmailInput('');
        router.push('/inbox');
      } else {
        setError(data.error || 'Failed to create account');
      }
    } catch (err) {
      console.error('Account creation error:', err);
      setError('Failed to create account. Please try again.');
    } finally {
      if (turnstileRegistrationEnabled && typeof window !== 'undefined' && window.turnstile && registerWidgetIdRef.current) {
        window.turnstile.reset(registerWidgetIdRef.current);
        setRegisterToken('');
      }
      setIsLoading(false);
    }
  };

  const handleLogin = async () => {
    if (!loginEmail || !loginPasskey) {
      setError('Please enter both email and passkey.');
      return;
    }
    if (turnstileLoginEnabled && turnstileSiteKey && !loginToken) {
      setError('Please complete the Turnstile challenge.');
      return;
    }
    setIsLoading(true);
    setError('');
    try {
      const payload = { email: loginEmail, passkey: loginPasskey };
      if (turnstileLoginEnabled && turnstileSiteKey) {
        payload.turnstileToken = loginToken;
      }
      const res = await fetch('/api/users/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        router.push('/inbox');
      } else {
        setError(data.error || 'Login failed.');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('An error occurred during login.');
    } finally {
      if (turnstileLoginEnabled && typeof window !== 'undefined' && window.turnstile && loginWidgetIdRef.current) {
        window.turnstile.reset(loginWidgetIdRef.current);
        setLoginToken('');
      }
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/users/logout', { method: 'POST' });
      router.reload();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  if (user) {
    return (
      <Layout siteTitle={siteTitle}>
        <div className="flex justify-center items-center min-h-screen p-4">
          <div className="w-full max-w-md animate-in fade-in zoom-in-95 duration-500">
            <Card className="h-fit backdrop-blur-sm bg-card/95 border-primary/10 shadow-2xl">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-foreground transition-colors">
                    Welcome Back!
                  </h2>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground transition-colors">
                    You are already logged in.
                  </p>
                </div>
                <div className="space-y-4">
                  <Button
                    onClick={() => router.push('/inbox')}
                    className="w-full"
                    size="lg"
                  >
                    Go to My Inbox
                  </Button>
                  <Button
                    onClick={handleLogout}
                    className="w-full"
                    size="lg"
                    variant="secondary"
                  >
                    Logout
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout siteTitle={siteTitle}>
      <div className="flex justify-center items-center min-h-screen p-4">
        <div className="w-full max-w-md animate-in fade-in zoom-in-95 duration-500">
          <Card className="h-fit backdrop-blur-sm bg-card/95 border-primary/10 shadow-2xl">
            <CardHeader className="pb-6">
              <div className="bg-muted/50 p-1 rounded-lg flex relative">
                <div
                  className={`absolute inset-y-1 w-[calc(50%-4px)] bg-background shadow-sm rounded-md transition-all duration-300 ease-[cubic-bezier(0.25,0.1,0.25,1)] ${
                    isLoginView ? 'translate-x-[calc(100%+4px)]' : 'translate-x-1'
                  }`}
                />
                <button
                  onClick={() => setIsLoginView(false)}
                  className={`flex-1 relative z-10 py-2 text-sm font-medium rounded-md transition-colors duration-300 ${
                    !isLoginView ? 'text-foreground' : 'text-muted-foreground hover:text-foreground/80'
                  }`}
                >
                  Create Account
                </button>
                <button
                  onClick={() => setIsLoginView(true)}
                  className={`flex-1 relative z-10 py-2 text-sm font-medium rounded-md transition-colors duration-300 ${
                    isLoginView ? 'text-foreground' : 'text-muted-foreground hover:text-foreground/80'
                  }`}
                >
                  Login
                </button>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-6">
              {isLoginView ? (
                <>
                  <div className="text-center">
                    <h2 className="text-2xl font-bold text-foreground transition-colors">
                      Login to Your Account
                    </h2>
                    <p className="text-sm text-muted-foreground transition-colors">
                      Enter your credentials to access your account.
                    </p>
                  </div>
                  <div className="space-y-4">
                    <Input
                      label="Email Address"
                      type="email"
                      value={loginEmail}
                      onChange={setLoginEmail}
                      placeholder="you@example.com"
                      disabled={isLoading}
                    />
                    <Input
                      label="Passkey"
                      type="password"
                      value={loginPasskey}
                      onChange={setLoginPasskey}
                      placeholder="Your passkey"
                      disabled={isLoading}
                    />
                    {turnstileLoginEnabled && turnstileSiteKey && (
                      <div className="flex justify-center">
                        <div ref={loginContainerRef} className="cf-turnstile" />
                      </div>
                    )}
                    {error && (
                      <div className="bg-red-50 border border-red-200 dark:bg-red-500/10 dark:border-red-400/40 rounded-md p-3">
                        <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
                      </div>
                    )}
                    <Button
                      onClick={handleLogin}
                      disabled={
                        !loginEmail ||
                        !loginPasskey ||
                        isLoading ||
                        (turnstileLoginEnabled && turnstileSiteKey && !loginToken)
                      }
                      className="w-full"
                      size="lg"
                    >
                      {isLoading ? (
                        <div className="flex items-center justify-center">
                          <LoadingSpinner size="sm" className="mr-2" />
                          Logging in...
                        </div>
                      ) : (
                        'Login'
                      )}
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <div className="text-center">
                    <h2 className="text-2xl font-bold text-foreground transition-colors">
                      Create Email Address
                    </h2>
                    <p className="text-sm text-muted-foreground transition-colors">
                      Create your persistent email address with login credentials
                    </p>
                  </div>
                  <div className="space-y-4">
                    <EmailInput
                      label="Email Address"
                      value={emailInput}
                      onChange={setEmailInput}
                      domains={domains}
                      selectedDomain={selectedDomain}
                      onDomainChange={setSelectedDomain}
                      placeholder="your-email"
                      disabled={isLoading || started}
                      onRandom={handleRandomClick}
                    />
                    {turnstileRegistrationEnabled && turnstileSiteKey && (
                      <div className="flex justify-center">
                        <div ref={registerContainerRef} className="cf-turnstile" />
                      </div>
                    )}
                    {error && (
                      <div className="bg-red-50 border border-red-200 dark:bg-red-500/10 dark:border-red-400/40 rounded-md p-3">
                        <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
                      </div>
                    )}
                    <Button
                      onClick={handleSubmit}
                      disabled={
                        (!emailInput || !selectedDomain || domains.length === 0) ||
                        isLoading ||
                        (turnstileRegistrationEnabled && turnstileSiteKey && !registerToken)
                      }
                      className="w-full"
                      size="lg"
                    >
                      {isLoading ? (
                        <div className="flex items-center justify-center">
                          <LoadingSpinner size="sm" className="mr-2" />
                          Creating...
                        </div>
                      ) : (
                        'Create Account'
                      )}
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
