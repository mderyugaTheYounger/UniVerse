import { useState } from 'react';

export default function LandingPage({
  currentUser,
  onNavigateToSignIn,
  onNavigateToSignUp,
  onNavigateToProfile,
  onNavigateToCatalog,
  onNavigateToRoommates,
  onNavigateToMap,
  onLogout
}) {
  const [showCookies, setShowCookies] = useState(true);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <main>
      {/* Cookie / Privacy Pop-up Notice */}
      {showCookies && (
        <aside aria-label="Privacy notice">
          <p>
            We collect personal data and utilize AI services. By using UniVerse, you agree to our policies.
          </p>
          <button type="button" onClick={() => setShowCookies(false)}>
            Accept Cookies
          </button>
        </aside>
      )}

      {/* Header — logo + profile button only */}
      <header>
        <div>
          <h1>UniVerse</h1>
        </div>

        <nav aria-label="Main Navigation">
          {/* Profile Icon / Account Menu */}
          <div aria-label="User Account Menu">
            <button
              type="button"
              aria-expanded={isMenuOpen}
              aria-haspopup="true"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {currentUser ? currentUser.fullName || currentUser.email : 'Profile'}
            </button>

            {/* Dropdown Menu */}
            {isMenuOpen && (
              <div>
                {currentUser ? (
                  <ul>
                    <li>
                      <p>
                        Signed in as:<br />
                        <strong>{currentUser.email}</strong>
                      </p>
                    </li>
                    <li>
                      <button
                        type="button"
                        onClick={() => {
                          setIsMenuOpen(false);
                          onNavigateToMap && onNavigateToMap();
                        }}
                      >
                        Housing &amp; Safety Map
                      </button>
                    </li>
                    <li>
                      <button
                        type="button"
                        onClick={() => {
                          setIsMenuOpen(false);
                          onNavigateToCatalog && onNavigateToCatalog();
                        }}
                      >
                        Course Catalog
                      </button>
                    </li>
                    <li>
                      <button
                        type="button"
                        onClick={() => {
                          setIsMenuOpen(false);
                          onNavigateToRoommates && onNavigateToRoommates();
                        }}
                      >
                        Roommate Finder
                      </button>
                    </li>
                    <li>
                      <button
                        type="button"
                        onClick={() => {
                          setIsMenuOpen(false);
                          onNavigateToProfile();
                        }}
                      >
                        View / Edit Profile
                      </button>
                    </li>
                    <li>
                      <button
                        type="button"
                        onClick={() => {
                          setIsMenuOpen(false);
                          onLogout();
                        }}
                      >
                        Sign Out
                      </button>
                    </li>
                  </ul>
                ) : (
                  <ul>
                    <li>
                      <button
                        type="button"
                        onClick={() => {
                          setIsMenuOpen(false);
                          onNavigateToMap && onNavigateToMap();
                        }}
                      >
                        Housing &amp; Safety Map
                      </button>
                    </li>
                    <li>
                      <button
                        type="button"
                        onClick={() => {
                          setIsMenuOpen(false);
                          onNavigateToCatalog && onNavigateToCatalog();
                        }}
                      >
                        Course Catalog
                      </button>
                    </li>
                    <li>
                      <button
                        type="button"
                        onClick={() => {
                          setIsMenuOpen(false);
                          onNavigateToRoommates && onNavigateToRoommates();
                        }}
                      >
                        Roommate Finder
                      </button>
                    </li>
                    <li>
                      <button
                        type="button"
                        onClick={() => {
                          setIsMenuOpen(false);
                          onNavigateToSignIn();
                        }}
                      >
                        Sign In
                      </button>
                    </li>
                    <li>
                      <button
                        type="button"
                        onClick={() => {
                          setIsMenuOpen(false);
                          onNavigateToSignUp();
                        }}
                      >
                        Sign Up
                      </button>
                    </li>
                  </ul>
                )}
              </div>
            )}
          </div>
        </nav>
      </header>

      {/* Services Nav Bar — directly below topbar, above hero */}
      <section id="features" aria-label="Services Navigation">
        <h2>Services</h2>
        <article
          role="button"
          tabIndex={0}
          onClick={onNavigateToMap}
          onKeyDown={e => e.key === 'Enter' && onNavigateToMap && onNavigateToMap()}
        >
          <h3>Campus &amp; Housing Map</h3>
          <p>Explore off-campus complexes with crime and noise statistics.</p>
        </article>
        <article
          role="button"
          tabIndex={0}
          onClick={onNavigateToCatalog}
          onKeyDown={e => e.key === 'Enter' && onNavigateToCatalog && onNavigateToCatalog()}
        >
          <h3>Course Catalog</h3>
          <p>Degree requirements, majors, minors, and prerequisite trees.</p>
        </article>
        <article
          role="button"
          tabIndex={0}
          onClick={onNavigateToRoommates}
          onKeyDown={e => e.key === 'Enter' && onNavigateToRoommates && onNavigateToRoommates()}
        >
          <h3>Roommate Matching</h3>
          <p>Find roommates based on living habits, cleanliness, and budgets.</p>
        </article>
        <article
          role="button"
          tabIndex={0}
          onClick={() => alert('Forum coming soon')}
          onKeyDown={e => e.key === 'Enter' && alert('Forum coming soon')}
        >
          <h3>Forum</h3>
          <p>Discuss housing, courses, and campus life with other students.</p>
        </article>
      </section>

      {/* Hero Section */}
      <section id="hero">
        <h2>Your University Companion</h2>
        <p>Explore courses, find housing, review apartments, and match with roommates.</p>
        <div style={{ display: 'flex', gap: '10px' }}>
          {currentUser ? (
            <button type="button" onClick={onNavigateToProfile}>
              Go to Your Profile
            </button>
          ) : (
            <button type="button" onClick={onNavigateToSignUp}>
              Get Started
            </button>
          )}
          <button type="button" onClick={onNavigateToMap}>
            View Housing Map
          </button>
        </div>
      </section>

      <footer>
        <p>&copy; 2026 UniVerse. All rights reserved.</p>
      </footer>
    </main>
  );
}