import React, { useState } from 'react';

export default function LandingPage({
  currentUser,
  onNavigateToSignIn,
  onNavigateToSignUp,
  onNavigateToProfile,
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

      {/* Header with Navigation and Profile Icon Menu on the right */}
      <header>
        <div>
          <h1>UniVerse</h1>
        </div>

        <nav aria-label="Main Navigation">
          <ul>
            <li><button type="button" onClick={() => alert('Map coming soon')}>Map</button></li>
            <li><button type="button" onClick={() => alert('Forum coming soon')}>Forum</button></li>
          </ul>

          {/* Profile Icon / Account Menu */}
          <div aria-label="User Account Menu">
            <button
              type="button"
              aria-expanded={isMenuOpen}
              aria-haspopup="true"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {/* Fallback to simple SVG / text profile icon */}
              👤 {currentUser ? currentUser.fullName || currentUser.email : 'Profile'}
            </button>

            {/* Dropdown Menu */}
            {isMenuOpen && (
              <div>
                {currentUser ? (
                  // Logged-in Menu Options
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
                  // Guest / Logged-out Menu Options
                  <ul>
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

      {/* Hero Section */}
      <section id="hero">
        <h2>Your University Companion</h2>
        <p>Explore courses, find housing, review apartments, and match with roommates.</p>
        <div>
          {currentUser ? (
            <button type="button" onClick={onNavigateToProfile}>
              Go to Your Profile
            </button>
          ) : (
            <button type="button" onClick={onNavigateToSignUp}>
              Get Started
            </button>
          )}
        </div>
      </section>

      {/* Feature Summaries */}
      <section id="features">
        <h2>Services Overview</h2>
        <article>
          <h3>Campus & Housing Map</h3>
          <p>Explore off-campus complexes with crime and noise statistics.</p>
        </article>
        <article>
          <h3>Course Catalog</h3>
          <p>Degree requirements, majors, minors, and prerequisite trees.</p>
        </article>
        <article>
          <h3>Roommate Matching</h3>
          <p>Find roommates based on living habits, cleanliness, and budgets.</p>
        </article>
      </section>

      <footer>
        <p>&copy; 2026 UniVerse. All rights reserved.</p>
      </footer>
    </main>
  );
}