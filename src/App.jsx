import { useState } from 'react';
import LandingPage from './components/LandingPage';
import LoginPage from './components/LoginPage';
import ProfilePage from './components/ProfilePage';
import CourseCatalogPage from './components/CourseCatalogPage';
import RoommateFinderPage from './components/RoommateFinderPage';
import HousingMap from './components/Map';
import './App.css';

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
          onNavigateToCatalog={() => setCurrentView('catalog')}
          onNavigateToRoommates={() => setCurrentView('roommates')}
          onNavigateToMap={() => setCurrentView('map')}
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
          onNavigateToCatalog={() => setCurrentView('catalog')}
          onNavigateToRoommates={() => setCurrentView('roommates')}
        />
      )}

      {currentView === 'catalog' && (
        <CourseCatalogPage
          currentUser={currentUser}
          onNavigateToLanding={() => setCurrentView('landing')}
          onNavigateToRoommates={() => setCurrentView('roommates')}
          onNavigateToProfile={() => setCurrentView('profile')}
          onNavigateToSignIn={() => setCurrentView('signin')}
          onLogout={handleLogout}
        />
      )}

      {currentView === 'roommates' && (
        <RoommateFinderPage
          currentUser={currentUser}
          onNavigateToLanding={() => setCurrentView('landing')}
          onNavigateToCatalog={() => setCurrentView('catalog')}
          onNavigateToProfile={() => setCurrentView('profile')}
          onNavigateToSignIn={() => setCurrentView('signin')}
          onLogout={handleLogout}
        />
      )}

      {currentView === 'map' && (
        <HousingMap onNavigateBack={() => setCurrentView('landing')} />
      )}
    </div>
  );
}
