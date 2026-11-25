import { useState, useEffect } from 'react';
import LandingPage from './components/LandingPage';
import LoginPage from './components/LoginPage';
import ProfilePage from './components/ProfilePage';
import CourseCatalogPage from './components/CourseCatalogPage';
import RoommateFinderPage from './components/RoommateFinderPage';
import HousingMap from './components/Map';
import { loadUserProfile } from './types/profile';
import './App.css';

export default function App() {
  const [currentView, setCurrentView] = useState('landing');
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(() => loadUserProfile(null));
  const [prevUser, setPrevUser] = useState(currentUser);

  // Sync profile when currentUser updates
  if (currentUser !== prevUser) {
    setPrevUser(currentUser);
    setUserProfile(loadUserProfile(currentUser));
  }

  // Subscribe to profile update events for immediate reactive navigation
  useEffect(() => {
    const handleProfileUpdate = () => {
      setUserProfile(loadUserProfile(currentUser));
    };
    window.addEventListener('profileUpdated', handleProfileUpdate);
    window.addEventListener('universe_profile_saved', handleProfileUpdate);
    window.addEventListener('storage', handleProfileUpdate);
    return () => {
      window.removeEventListener('profileUpdated', handleProfileUpdate);
      window.removeEventListener('universe_profile_saved', handleProfileUpdate);
      window.removeEventListener('storage', handleProfileUpdate);
    };
  }, [currentUser]);

  const isSeekingRoommate = userProfile?.preferences?.isSeekingRoommate === true;

  // Restore authenticated session on page refresh
  useEffect(() => {
    const token = localStorage.getItem('universe_auth_token');
    if (!token) return;

    fetch('/api/auth/me', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error('Session expired');
        }
        return res.json();
      })
      .then((data) => {
        if (data.user) {
          setCurrentUser(data.user);
        }
      })
      .catch(() => {
        localStorage.removeItem('universe_auth_token');
      });
  }, []);

  const handleAuthSuccess = (userData) => {
    setCurrentUser(userData);
    setCurrentView('profile'); // Switches view to profile upon sign up/in
  };

  const handleLogout = () => {
    localStorage.removeItem('universe_auth_token');
    setCurrentUser(null);
    setCurrentView('landing');
  };

  const navigateToRoommates = isSeekingRoommate
    ? () => setCurrentView('roommates')
    : undefined;

  return (
    <div>
      {currentView === 'landing' && (
        <LandingPage
          currentUser={currentUser}
          isSeekingRoommate={isSeekingRoommate}
          onNavigateToSignIn={() => setCurrentView('signin')}
          onNavigateToSignUp={() => setCurrentView('signup')}
          onNavigateToProfile={() => setCurrentView('profile')}
          onNavigateToCatalog={() => setCurrentView('catalog')}
          onNavigateToRoommates={navigateToRoommates}
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
          isSeekingRoommate={isSeekingRoommate}
          onLogout={handleLogout}
          onNavigateToLanding={() => setCurrentView('landing')}
          onNavigateToCatalog={() => setCurrentView('catalog')}
          onNavigateToRoommates={navigateToRoommates}
        />
      )}

      {currentView === 'catalog' && (
        <CourseCatalogPage
          currentUser={currentUser}
          isSeekingRoommate={isSeekingRoommate}
          onNavigateToLanding={() => setCurrentView('landing')}
          onNavigateToRoommates={navigateToRoommates}
          onNavigateToProfile={() => setCurrentView('profile')}
          onNavigateToSignIn={() => setCurrentView('signin')}
          onLogout={handleLogout}
        />
      )}

      {currentView === 'roommates' && (
        <RoommateFinderPage
          currentUser={currentUser}
          isSeekingRoommate={isSeekingRoommate}
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
