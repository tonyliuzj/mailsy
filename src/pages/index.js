import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { Card, CardContent, CardHeader } from '../components/modern-ui/Card';
import { Button } from '../components/modern-ui/Button';
import { Badge } from '../components/modern-ui/Badge';
import { LoadingSpinner } from '../components/modern-ui/LoadingSpinner';
import { Layout } from '../components/modern-ui/Layout';
import { EmailInput } from '../components/modern-ui/EmailInput';
import { Input } from '../components/modern-ui/Input';
import { withUser } from '../lib/user-auth';

export const getServerSideProps = withUser(async ({ user }) => {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/info`);
    const data = await res.json();
    return {
      props: {
        siteTitle: data.title || 'Mailsy',
        user: user || null,
      },
    };
  } catch (error) {
    return {
      props: {
        siteTitle: 'Mailsy',
        user: user || null,
      },
    };
  }
});

export default function Home({ siteTitle, user }) {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [showCaptcha, setShowCaptcha] = useState(false);
  const [started, setStarted] = useState(false);
  const [domains, setDomains] = useState([]);
  const [selectedDomain, setSelectedDomain] = useState('');
  const [emailInput, setEmailInput] = useState('');
  const [password, setPassword] = useState('');
  const [generatedPassword, setGeneratedPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [createdAccount, setCreatedAccount] = useState(null);
  const widgetIdRef = useRef(null);
  const [isLoginView, setIsLoginView] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPasskey, setLoginPasskey] = useState('');

  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITEKEY;

  useEffect(() => {
    if (user) return;
    if (!siteKey || !showCaptcha) return;
    const script = document.createElement('script');
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js';
    script.async = true;
    document.body.appendChild(script);
    script.onload = () => {
      widgetIdRef.current = window.turnstile.render('#cf-turnstile', {
        sitekey: siteKey,
        callback: handleCaptcha,
      });
    };
    return () => {
      document.body.removeChild(script);
      widgetIdRef.current = null;
    };
  }, [siteKey, showCaptcha, user]);

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

  const handleCaptcha = async token => {
    if (!selectedDomain || !emailInput) return;
    
    setShowCaptcha(false);
    setStarted(true);
    
    const domain = domains.find(d => d.name === selectedDomain);
    const fullEmail = `${emailInput}@${domain.name}`;
    
    const res = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        cf_turnstile_token: token,
        domainName: selectedDomain,
        email_prefix: emailInput
      }),
    });
    const { email: alias, apiKey: key } = await res.json();
    if (alias && key) {
      setEmail(alias);
      setApiKey(key);
    }
  };


  const handleSubmit = async () => {
    if (!emailInput || !selectedDomain) {
      setError('Please enter an email address');
      return;
    }

    
    setIsLoading(true);
    setError('');

    try {
      const res = await fetch('/api/users/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userEmail: emailInput,
          emailType: 'username',
          domainName: selectedDomain
        }),
      });

      const data = await res.json();

      if (data.success) {
        localStorage.setItem('email', data.email.email);
        localStorage.setItem('apiKey', data.email.apiKey);
        localStorage.setItem('passkey', data.passkey);
        setCreatedAccount({
          email: data.email.email,
          passkey: data.passkey
        });
        setEmail(data.email.email);
        setApiKey(data.email.apiKey);
        setStarted(true);
        
        
        setEmailInput('');
        setPassword('');
        router.push('/inbox');
      } else {
        setError(data.error || 'Failed to create account');
      }
    } catch (err) {
      console.error('Account creation error:', err);
      setError('Failed to create account. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async () => {
    if (!loginEmail || !loginPasskey) {
      setError('Please enter both email and passkey.');
      return;
    }
    setIsLoading(true);
    setError('');
    try {
      const res = await fetch('/api/users/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, passkey: loginPasskey }),
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
        <div className="flex justify-center items-center min-h-screen">
          <div className="w-full max-w-md">
            <Card className="h-fit">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Welcome Back!
                  </h2>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="text-center">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
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
      <div className="flex justify-center items-center min-h-screen">
        <div className="w-full max-w-md">
          <Card className="h-fit">
            <CardHeader className="pb-4">
              <div className="flex border-b">
                <button
                  onClick={() => setIsLoginView(false)}
                  className={`flex-1 py-2 text-center font-medium ${!isLoginView ? 'border-b-2 border-black text-black' : 'text-gray-500'}`}
                >
                  Create Account
                </button>
                <button
                  onClick={() => setIsLoginView(true)}
                  className={`flex-1 py-2 text-center font-medium ${isLoginView ? 'border-b-2 border-black text-black' : 'text-gray-500'}`}
                >
                  Login
                </button>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-6">
              {isLoginView ? (
                <>
                  <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                      Login to Your Account
                    </h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
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
                    {error && (
                      <div className="bg-red-50 border border-red-200 rounded-md p-3">
                        <p className="text-sm text-red-800">{error}</p>
                      </div>
                    )}
                    <Button
                      onClick={handleLogin}
                      disabled={!loginEmail || !loginPasskey || isLoading}
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
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                      Create Email Address
                    </h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
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
                    {error && (
                      <div className="bg-red-50 border border-red-200 rounded-md p-3">
                        <p className="text-sm text-red-800">{error}</p>
                      </div>
                    )}
                    <Button
                      onClick={handleSubmit}
                      disabled={
                        (!emailInput || !selectedDomain || domains.length === 0) ||
                        isLoading
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
