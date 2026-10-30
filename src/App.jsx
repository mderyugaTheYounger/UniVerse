import { useState } from 'react';
import LandingPage from './components/LandingPage';
import LoginPage from './components/LoginPage';

export default function App() {
  const [view, setView] = useState('landing'); // 'landing' | 'signin' | 'signup'

  return (
    <div>
      {view === 'landing' && (
        <LandingPage
          onNavigateToSignIn={() => setView('signin')}
          onNavigateToSignUp={() => setView('signup')}
        />
      )}

      {(view === 'signin' || view === 'signup') && (
        <LoginPage
          initialMode={view === 'signup' ? 'register' : 'login'}
          onNavigateToLanding={() => setView('landing')}
          onSwitchMode={(mode) => setView(mode === 'register' ? 'signup' : 'signin')}
        />
      )}
    </div>
  );
}