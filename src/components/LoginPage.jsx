import { useState } from 'react';
import { GoogleLogin } from '@react-oauth/google';

export default function LoginPage({ initialMode = 'login', onNavigateToLanding, onSwitchMode, onAuthSuccess }) {
  // 'login' (Sign In) or 'register' (Sign Up)
  const [internalMode, setInternalMode] = useState(null);
  const isRegistering = internalMode !== null ? internalMode === 'register' : initialMode === 'register';

  // Form Fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [oauthError, setOauthError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Restrict to university email domains
  const isValidCampusEmail = (val) => {
    const pattern = /^[a-zA-Z0-9._%+-]+@(charlotte\.edu|uncc\.edu)$/i;
    return pattern.test(val.trim());
  };

  const handleEmailChange = (e) => {
    const val = e.target.value;
    setEmail(val);
    if (val && !isValidCampusEmail(val)) {
      setEmailError('Email must end with @charlotte.edu or @uncc.edu');
    } else {
      setEmailError('');
    }
  };

  const handleToggleMode = (registering) => {
    setInternalMode(registering ? 'register' : 'login');
    setEmailError('');
    setOauthError('');
    if (onSwitchMode) {
      onSwitchMode(registering ? 'register' : 'login');
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      setIsLoading(true);
      setOauthError('');

      const res = await fetch('/api/auth/google', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ credential: credentialResponse.credential }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Google authentication failed.');
      }

      if (data.token) {
        localStorage.setItem('universe_auth_token', data.token);
      }

      if (onAuthSuccess) {
        onAuthSuccess(data.user);
      }
    } catch (err) {
      console.error('OAuth sign in error:', err);
      setOauthError(err.message || 'Unable to sign in with Google. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleError = () => {
    setOauthError('Google sign in was closed or failed to connect.');
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!isValidCampusEmail(email)) {
      setEmailError('Please use a valid @charlotte.edu or @uncc.edu address.');
      return;
    }

    if (isRegistering) {
      if (password !== confirmPassword) {
        alert('Passwords do not match!');
        return;
      }
      if (!acceptedTerms) {
        alert('You must acknowledge the Terms of Service and Privacy Policy.');
        return;
      }
      console.log('Sign Up submitted:', { fullName, email, password });
      if (onAuthSuccess) {
        onAuthSuccess({
          user_id: 1,
          id: 1,
          fullName,
          display_name: fullName,
          email,
        });
      }
    } else {
      console.log('Sign In submitted:', { email, password });

      if (onAuthSuccess) {
        const name = fullName || email.split('@')[0];
        onAuthSuccess({
          user_id: 1,
          id: 1,
          email,
          fullName: name,
          display_name: name,
        });
      }
    }
  };

  return (
    <main>
      <header>
        <button type="button" onClick={onNavigateToLanding}>
          &larr; Back to UniVerse Home
        </button>
        <h1>{isRegistering ? 'Sign Up' : 'Sign In'}</h1>
        <p>
          {isRegistering
            ? 'Create a UniVerse profile with your UNC Charlotte student email.'
            : 'Access your saved housing bookmarks, roommate chats, and academic plans.'}
        </p>
      </header>

      {/* Google OAuth Section */}
      <section style={{ margin: '1.5rem auto', maxWidth: '400px', textAlign: 'center' }}>
        <p style={{ fontWeight: 600, marginBottom: '0.75rem', color: '#005035' }}>
          Recommended: Sign in with your UNC Charlotte Account
        </p>
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={handleGoogleError}
            useOneTap
            theme="filled_blue"
            size="large"
            text={isRegistering ? 'signup_with' : 'signin_with'}
            shape="rectangular"
          />
        </div>
        {isLoading && (
          <p role="status" style={{ color: '#005035', marginTop: '0.75rem', fontSize: '0.9rem' }}>
            Verifying campus student credentials...
          </p>
        )}
        {oauthError && (
          <p role="alert" style={{ color: '#d32f2f', marginTop: '0.75rem', fontSize: '0.9rem', fontWeight: 600 }}>
            {oauthError}
          </p>
        )}
        <div style={{ display: 'flex', alignItems: 'center', width: '100%', margin: '1.5rem 0' }}>
          <hr style={{ flex: 1, border: 'none', borderTop: '1px solid #ccc' }} />
          <span style={{ padding: '0 0.75rem', color: '#666', fontSize: '0.85rem' }}>or use password</span>
          <hr style={{ flex: 1, border: 'none', borderTop: '1px solid #ccc' }} />
        </div>
      </section>

      <section>
        <form onSubmit={handleSubmit}>
          <fieldset>
            <legend>{isRegistering ? 'Student Registration' : 'Account Credentials'}</legend>

            {isRegistering && (
              <div>
                <label htmlFor="fullName">Full Name:</label>
                <input
                  id="fullName"
                  name="fullName"
                  type="text"
                  required
                  placeholder="e.g. Alex Johnson"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              </div>
            )}

            <div>
              <label htmlFor="email">Campus Email:</label>
              <input
                id="email"
                name="email"
                type="email"
                required
                pattern="^[a-zA-Z0-9._%+-]+@(charlotte\.edu|uncc\.edu)$"
                placeholder="student@charlotte.edu"
                value={email}
                onChange={handleEmailChange}
              />
              {emailError && (
                <p role="alert" style={{ color: 'red' }}>
                  {emailError}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="password">Password:</label>
              <input
                id="password"
                name="password"
                type="password"
                required
                minLength={8}
                placeholder="Minimum 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            {isRegistering && (
              <div>
                <label htmlFor="confirmPassword">Confirm Password:</label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  required
                  minLength={8}
                  placeholder="Re-enter password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
            )}

            {isRegistering && (
              <div>
                <label>
                  <input
                    type="checkbox"
                    required
                    checked={acceptedTerms}
                    onChange={(e) => setAcceptedTerms(e.target.checked)}
                  />{' '}
                  I agree to the <a href="#terms">Terms of Service</a> and <a href="#privacy">Privacy Policy</a>.
                </label>
              </div>
            )}

            <div>
              <button type="submit">
                {isRegistering ? 'Complete Registration' : 'Log In'}
              </button>
            </div>
          </fieldset>
        </form>
      </section>

      {/* Switcher matching Sign In <-> Sign Up in flowchart */}
      <section>
        {isRegistering ? (
          <p>
            Already have an account?{' '}
            <button type="button" onClick={() => handleToggleMode(false)}>
              Go to Sign In
            </button>
          </p>
        ) : (
          <div>
            <p>
              Don&apos;t have an account yet?{' '}
              <button type="button" onClick={() => handleToggleMode(true)}>
                Go to Sign Up
              </button>
            </p>
            <p>
              <a href="#forgot-password">Forgot password?</a>
            </p>
          </div>
        )}
      </section>

      <footer>
        <p>UniVerse &copy; 2026. WCAG 2.1 AA compliant semantic structure.</p>
      </footer>
    </main>
  );
}