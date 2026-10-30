import React, { useState, useEffect } from 'react';

export default function LoginPage({ initialMode = 'login', onNavigateToLanding, onSwitchMode, onAuthSuccess }) {
  // 'login' (Sign In) or 'register' (Sign Up)
  const [isRegistering, setIsRegistering] = useState(initialMode === 'register');

  // Form Fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [emailError, setEmailError] = useState('');

  // Synchronize when parent toggles initialMode
  useEffect(() => {
    setIsRegistering(initialMode === 'register');
  }, [initialMode]);

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
    setIsRegistering(registering);
    setEmailError('');
    if (onSwitchMode) {
      onSwitchMode(registering ? 'register' : 'login');
    }
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
        onAuthSuccess({ fullName, email });
      }
    } else {
      console.log('Sign In submitted:', { email, password });

      if (onAuthSuccess) {
        onAuthSuccess({ email, fullName: fullName || email.split('@')[0] });
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