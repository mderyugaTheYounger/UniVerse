import { useState } from 'react';
import LandingPage from './components/LandingPage';
import LoginPage from './components/LoginPage';
import ProfilePage from './components/ProfilePage';

export default function App() {
  const [currentView, setCurrentView] = useState('landing');
  const [currentUser, setCurrentUser] = useState(null);

  const handleAuthSuccess = (userData) => {
    setCurrentUser(userData);
    setCurrentView('profile'); // Switches view to profile upon sign up/in
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setCurrentView('landing');
  };

  return (
    <div>
      {currentView === 'landing' && (
        <LandingPage
          currentUser={currentUser}
          onNavigateToSignIn={() => setCurrentView('signin')}
          onNavigateToSignUp={() => setCurrentView('signup')}
          onNavigateToProfile={() => setCurrentView('profile')}
          onLogout={handleLogout}
        />
      )}

      {(currentView === 'signin' || currentView === 'signup') && (
        <LoginPage
          initialMode={currentView === 'signup' ? 'register' : 'login'}
          onNavigateToLanding={() => setCurrentView('landing')}
          onSwitchMode={(mode) => setCurrentView(mode === 'register' ? 'signup' : 'signin')}
          onAuthSuccess={handleAuthSuccess}
        />
      )}

      {currentView === 'profile' && (
        <ProfilePage
          currentUser={currentUser}
          onLogout={handleLogout}
          onNavigateToLanding={() => setCurrentView('landing')}
        />
      )}
    </div>
  );
}