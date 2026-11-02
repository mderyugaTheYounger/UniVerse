import { useState, useMemo } from 'react';
import './RoommateFinderPage.css';
import {
  mockRoommates,
  defaultUserLivingPreferences,
  filterRoommateCandidates,
} from '../data/mockRoommateData';

/**
 * RoommateFinderPage Component
 *
 * Provides a skeleton layout for the UNC Charlotte Roommate Finder and Matching system.
 *
 * Backend Integration Plan:
 * ------------------------------------------------------------
 * 1. Data Source:
 *    - In this skeleton, roommate profiles and preferences are loaded from
 *      `src/data/mockRoommateData.js`, mirroring:
 *      * `UniVerse/src/database/roommateDB.ts` (RoommatePreferenceTable, RoommateFilterOptions)
 *      * `UniVerse/src/database/userDB.ts` (UserTable, ProfileTable)
 *      * `UniVerse/docs/ERD.md` (USER ||--o| ROOMMATE_PREFERENCE)
 * 2. Fetching Matches:
 *    - Replace client-side filtering with query execution via:
 *        `findRoommateMatches(db, filters: RoommateFilterOptions)`
 *      or `GET /api/roommates?maxBudget=...&sleepSchedule=...`
 * 3. Saving User Preferences:
 *    - The "My Living Preferences" form maps directly to:
 *        `upsertRoommatePreference(db, preference: NewRoommatePreference)`
 *      or `PUT /api/users/:userId/roommate-preference`
 * 4. Messaging & Outreach:
 *    - The connection modal links to the student messaging / notifications service.
 */
export default function RoommateFinderPage({
  currentUser,
  onNavigateToLanding,
  onNavigateToCatalog,
  onNavigateToProfile,
  onNavigateToSignIn,
  onLogout,
}) {
  // Navigation & View Tabs
  const [activeTab, setActiveTab] = useState('browse'); // 'browse' | 'preferences' | 'saved'

  // Filter State (strictly reflects RoommateFilterOptions from roommateDB.ts)
  const [filters, setFilters] = useState({
    searchQuery: '',
    maxBudget: 1200,
    sleepSchedule: 'all',
    cleanliness: 'all',
    petsOnly: false,
    nonSmokingOnly: true,
  });

  // User's own living habits form state (mirrors RoommatePreferenceTable)
  const [myPreferences, setMyPreferences] = useState(defaultUserLivingPreferences);
  const [showSaveSuccess, setShowSaveSuccess] = useState(false);

  // Saved / Bookmarked roommates
  const [savedUserIds, setSavedUserIds] = useState(new Set([101, 105]));

  // Connect / Message Modal State
  const [messageTarget, setMessageTarget] = useState(null);
  const [messageText, setMessageText] = useState('');
  const [messageSentNotice, setMessageSentNotice] = useState(null);

  // Computed matching list
  const matchingRoommates = useMemo(() => {
    return filterRoommateCandidates(mockRoommates, filters);
  }, [filters]);

  const savedRoommates = useMemo(() => {
    return mockRoommates.filter((rm) => savedUserIds.has(rm.user_id));
  }, [savedUserIds]);

  // Handlers
  const handleFilterChange = (field, value) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
  };

  const handleResetFilters = () => {
    setFilters({
      searchQuery: '',
      maxBudget: 1200,
      sleepSchedule: 'all',
      cleanliness: 'all',
      petsOnly: false,
      nonSmokingOnly: false,
    });
  };

  const toggleSaveRoommate = (userId) => {
    setSavedUserIds((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) {
        next.delete(userId);
      } else {
        next.add(userId);
      }
      return next;
    });
  };

  const handleSaveMyPreferences = (e) => {
    e.preventDefault();
    setShowSaveSuccess(true);
    setTimeout(() => setShowSaveSuccess(false), 4000);
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!messageTarget) return;

    setMessageSentNotice(`Connection request dispatched to ${messageTarget.display_name}!`);
    setMessageTarget(null);
    setMessageText('');

    setTimeout(() => {
      setMessageSentNotice(null);
    }, 4500);
  };

  return (
    <div className="roommate-page">
      {/* Top Header matching landing page layout */}
      <header className="roommate-header">
        <div className="roommate-header-left">
          <button
            type="button"
            className="roommate-header-brand"
            onClick={onNavigateToLanding}
            title="Go to UniVerse Home"
          >
            UniVerse
          </button>
          <button
            type="button"
            className="roommate-back-btn"
            onClick={onNavigateToLanding}
          >
            &larr; Back to Home
          </button>
        </div>

        <nav className="roommate-header-nav" aria-label="Roommate Navigation">
          <button
            type="button"
            className="roommate-nav-link"
            onClick={onNavigateToCatalog}
          >
            Course Catalog
          </button>
          <button
            type="button"
            className="roommate-nav-link active"
            onClick={() => setActiveTab('browse')}
          >
            Roommate Finder
          </button>
          {currentUser ? (
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <button
                type="button"
                className="roommate-header-profile-btn"
                onClick={onNavigateToProfile}
              >
                {currentUser.fullName || currentUser.email}
              </button>
              {onLogout && (
                <button
                  type="button"
                  className="roommate-back-btn"
                  onClick={onLogout}
                >
                  Sign Out
                </button>
              )}
            </div>
          ) : (
            <button
              type="button"
              className="roommate-header-profile-btn"
              onClick={onNavigateToSignIn}
            >
              Sign In
            </button>
          )}
        </nav>
      </header>

      {/* Banner / Title Area */}
      <section className="roommate-banner">
        <div className="roommate-banner-inner">
          <span className="roommate-badge-institution">UNC Charlotte Housing Network</span>
          <h1>Roommate Matching &amp; Off-Campus Living</h1>
          <p>
            Find compatible student roommates based on living habits, cleanliness levels, sleep
            schedules, and monthly budgets. Connect directly with verified 49er classmates.
          </p>
        </div>
      </section>

      {/* Tabs Navigation */}
      <nav className="roommate-tabs-bar" aria-label="Roommate Views">
        <div className="roommate-tabs-inner">
          <button
            type="button"
            className={`roommate-tab-btn ${activeTab === 'browse' ? 'active' : ''}`}
            onClick={() => setActiveTab('browse')}
          >
            Browse Candidates ({mockRoommates.length})
          </button>
          <button
            type="button"
            className={`roommate-tab-btn ${activeTab === 'preferences' ? 'active' : ''}`}
            onClick={() => setActiveTab('preferences')}
          >
            My Living Preferences
          </button>
          <button
            type="button"
            className={`roommate-tab-btn ${activeTab === 'saved' ? 'active' : ''}`}
            onClick={() => setActiveTab('saved')}
          >
            Saved Profiles ({savedUserIds.size})
          </button>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="roommate-content">
        {/* Architecture Note */}
        <aside className="roommate-integration-banner" aria-label="Developer Architecture Note">
          <strong>Architecture Planning:</strong> This roommate skeleton mirrors entities in{' '}
          <code>UniVerse/src/database/roommateDB.ts</code> (table: <code>roommate_preferences</code>,
          query: <code>findRoommateMatches()</code>) and <code>userDB.ts</code> (table: <code>profiles</code>).
          Backend integration hooks directly into these database functions without schema changes.
        </aside>

        {/* Success Alert for Message or Preferences */}
        {messageSentNotice && (
          <div className="pref-success-alert" role="status">
            [Success] {messageSentNotice}
          </div>
        )}

        {/* TAB 1: BROWSE CANDIDATES */}
        {activeTab === 'browse' && (
          <section aria-label="Roommate Candidates Search">
            {/* Filter controls */}
            <div className="roommate-filter-card">
              <h2>Filter Potential Roommates</h2>
              <div className="roommate-filters-grid">
                <div className="roommate-field">
                  <label htmlFor="search-input">Search by Name, Major, or Interests</label>
                  <input
                    id="search-input"
                    type="text"
                    placeholder="e.g. Computer Science, hiking, Maya"
                    value={filters.searchQuery}
                    onChange={(e) => handleFilterChange('searchQuery', e.target.value)}
                  />
                </div>

                <div className="roommate-field">
                  <label htmlFor="budget-select">Max Monthly Rent: ${filters.maxBudget}</label>
                  <select
                    id="budget-select"
                    value={filters.maxBudget}
                    onChange={(e) => handleFilterChange('maxBudget', Number(e.target.value))}
                  >
                    <option value={750}>Up to $750 / mo</option>
                    <option value={850}>Up to $850 / mo</option>
                    <option value={1000}>Up to $1,000 / mo</option>
                    <option value={1200}>Up to $1,200 / mo</option>
                    <option value={1500}>Up to $1,500 / mo</option>
                  </select>
                </div>

                <div className="roommate-field">
                  <label htmlFor="sleep-select">Sleep Schedule</label>
                  <select
                    id="sleep-select"
                    value={filters.sleepSchedule}
                    onChange={(e) => handleFilterChange('sleepSchedule', e.target.value)}
                  >
                    <option value="all">All Schedules</option>
                    <option value="early_bird">Early Bird (Early riser)</option>
                    <option value="night_owl">Night Owl (Late hours)</option>
                    <option value="flexible">Flexible / Variable</option>
                  </select>
                </div>

                <div className="roommate-field">
                  <label htmlFor="clean-select">Cleanliness</label>
                  <select
                    id="clean-select"
                    value={filters.cleanliness}
                    onChange={(e) => handleFilterChange('cleanliness', e.target.value)}
                  >
                    <option value="all">All Cleanliness Levels</option>
                    <option value="neat">Neat (Very tidy)</option>
                    <option value="moderate">Moderate (Reasonably organized)</option>
                    <option value="relaxed">Relaxed (Casual upkeep)</option>
                  </select>
                </div>

                <button
                  type="button"
                  className="roommate-reset-btn"
                  onClick={handleResetFilters}
                >
                  Reset Filters
                </button>
              </div>

              <div className="roommate-checkbox-group">
                <label>
                  <input
                    type="checkbox"
                    checked={filters.petsOnly}
                    onChange={(e) => handleFilterChange('petsOnly', e.target.checked)}
                  />
                  Pet-Friendly Homes Only (pets_ok)
                </label>
                <label>
                  <input
                    type="checkbox"
                    checked={filters.nonSmokingOnly}
                    onChange={(e) => handleFilterChange('nonSmokingOnly', e.target.checked)}
                  />
                  Strictly Non-Smoking (smoking_ok = false)
                </label>
              </div>

              <div className="roommate-results-status">
                <span>
                  Showing <strong>{matchingRoommates.length}</strong> matching candidates out of{' '}
                  <strong>{mockRoommates.length}</strong> profiles
                </span>
                <span>
                  Saved: <strong>{savedUserIds.size}</strong> roommates
                </span>
              </div>
            </div>

            {/* Candidates Grid */}
            {matchingRoommates.length === 0 ? (
              <div
                style={{
                  textAlign: 'center',
                  padding: '40px',
                  backgroundColor: 'var(--white)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '4px',
                }}
              >
                <h3>No roommates match the selected criteria.</h3>
                <p style={{ color: 'var(--text-muted)' }}>
                  Try raising your budget threshold or setting Sleep Schedule to All.
                </p>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={handleResetFilters}
                  style={{ marginTop: '12px' }}
                >
                  Reset Filters
                </button>
              </div>
            ) : (
              <div className="roommate-grid">
                {matchingRoommates.map((candidate) => {
                  const isSaved = savedUserIds.has(candidate.user_id);
                  const cleanLabel =
                    candidate.cleanliness === 'neat'
                      ? 'Cleanliness: Neat'
                      : candidate.cleanliness === 'moderate'
                      ? 'Cleanliness: Moderate'
                      : 'Cleanliness: Relaxed';

                  const sleepLabel =
                    candidate.sleep_schedule === 'early_bird'
                      ? 'Sleep: Early Bird'
                      : candidate.sleep_schedule === 'night_owl'
                      ? 'Sleep: Night Owl'
                      : 'Sleep: Flexible';

                  return (
                    <article key={candidate.user_id} className="roommate-card">
                      <div>
                        <div className="roommate-card-top">
                          <div className="roommate-card-identity">
                            <h3>{candidate.display_name}</h3>
                            <span className="roommate-verified-badge">[UNCC Verified]</span>
                          </div>
                          <span className="habit-badge habit-badge-budget">
                            Max ${candidate.budget_max}/mo
                          </span>
                        </div>

                        <div className="roommate-academic-line">
                          <strong>{candidate.major}</strong> &bull; Class of {candidate.graduation_year}
                        </div>

                        {/* Living Habit Badges */}
                        <div className="roommate-habits-group">
                          <span className="habit-badge habit-badge-schedule">{sleepLabel}</span>
                          <span className="habit-badge habit-badge-clean">{cleanLabel}</span>
                          <span className="habit-badge habit-badge-pet">
                            {candidate.pets_ok ? 'Pets: Welcome' : 'Pets: No pets'}
                          </span>
                          <span className="habit-badge habit-badge-smoke">
                            {candidate.smoking_ok ? 'Smoking: OK' : 'Non-Smoker'}
                          </span>
                        </div>

                        <p className="roommate-bio-text">{candidate.bio}</p>

                        <div className="roommate-interests-section">
                          <div className="roommate-interests-label">Interests &amp; Hobbies:</div>
                          <div className="roommate-interest-tags">
                            {candidate.interests.split(',').map((interest, idx) => (
                              <span key={idx} className="roommate-interest-tag">
                                {interest.trim()}
                              </span>
                            ))}
                          </div>
                        </div>

                        <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px' }}>
                          Target Housing: <strong>{candidate.housing_preference}</strong> &bull; Move-in:{' '}
                          {candidate.preferred_move_in}
                        </div>
                      </div>

                      <div className="roommate-card-actions">
                        <button
                          type="button"
                          className="btn-primary"
                          onClick={() => setMessageTarget(candidate)}
                        >
                          Connect
                        </button>
                        <button
                          type="button"
                          className="btn-secondary"
                          onClick={() => toggleSaveRoommate(candidate.user_id)}
                        >
                          {isSaved ? '[Saved]' : 'Save Profile'}
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {/* TAB 2: MY LIVING PREFERENCES FORM */}
        {activeTab === 'preferences' && (
          <section className="roommate-pref-form-card" aria-label="My Living Preferences">
            {showSaveSuccess && (
              <div className="pref-success-alert" role="status">
                [Saved] Your roommate matching preferences have been updated. Recommended candidates have been refreshed.
              </div>
            )}

            <form onSubmit={handleSaveMyPreferences}>
              <fieldset>
                <legend>My Living Habit Profile</legend>
                <p className="pref-form-intro">
                  Set your personal living habits and budget. These values are saved to your user profile
                  and matched against other Charlotte students via the <code>roommate_preferences</code> database schema.
                </p>

                <div className="pref-row">
                  <label htmlFor="pref-budget">Maximum Monthly Rent Budget ($ USD)</label>
                  <input
                    id="pref-budget"
                    type="number"
                    min="300"
                    max="3000"
                    step="50"
                    value={myPreferences.budget_max || ''}
                    onChange={(e) =>
                      setMyPreferences((p) => ({ ...p, budget_max: Number(e.target.value) }))
                    }
                    required
                  />
                </div>

                <div className="pref-row">
                  <label>Sleep &amp; Wake Schedule</label>
                  <div className="pref-radio-group">
                    <label>
                      <input
                        type="radio"
                        name="sleep_schedule"
                        value="early_bird"
                        checked={myPreferences.sleep_schedule === 'early_bird'}
                        onChange={(e) =>
                          setMyPreferences((p) => ({ ...p, sleep_schedule: e.target.value }))
                        }
                      />
                      Early Bird
                    </label>
                    <label>
                      <input
                        type="radio"
                        name="sleep_schedule"
                        value="night_owl"
                        checked={myPreferences.sleep_schedule === 'night_owl'}
                        onChange={(e) =>
                          setMyPreferences((p) => ({ ...p, sleep_schedule: e.target.value }))
                        }
                      />
                      Night Owl
                    </label>
                    <label>
                      <input
                        type="radio"
                        name="sleep_schedule"
                        value="flexible"
                        checked={myPreferences.sleep_schedule === 'flexible'}
                        onChange={(e) =>
                          setMyPreferences((p) => ({ ...p, sleep_schedule: e.target.value }))
                        }
                      />
                      Flexible
                    </label>
                  </div>
                </div>

                <div className="pref-row">
                  <label>Cleanliness Standards</label>
                  <div className="pref-radio-group">
                    <label>
                      <input
                        type="radio"
                        name="cleanliness"
                        value="neat"
                        checked={myPreferences.cleanliness === 'neat'}
                        onChange={(e) =>
                          setMyPreferences((p) => ({ ...p, cleanliness: e.target.value }))
                        }
                      />
                      Neat (Dishes done daily, shared areas clean)
                    </label>
                    <label>
                      <input
                        type="radio"
                        name="cleanliness"
                        value="moderate"
                        checked={myPreferences.cleanliness === 'moderate'}
                        onChange={(e) =>
                          setMyPreferences((p) => ({ ...p, cleanliness: e.target.value }))
                        }
                      />
                      Moderate (Organized with weekend resets)
                    </label>
                    <label>
                      <input
                        type="radio"
                        name="cleanliness"
                        value="relaxed"
                        checked={myPreferences.cleanliness === 'relaxed'}
                        onChange={(e) =>
                          setMyPreferences((p) => ({ ...p, cleanliness: e.target.value }))
                        }
                      />
                      Relaxed
                    </label>
                  </div>
                </div>

                <div className="pref-row">
                  <label>Household Policies</label>
                  <div className="pref-check-group">
                    <label>
                      <input
                        type="checkbox"
                        checked={myPreferences.pets_ok}
                        onChange={(e) =>
                          setMyPreferences((p) => ({ ...p, pets_ok: e.target.checked }))
                        }
                      />
                      Comfortable living with pets (cats / dogs)
                    </label>
                    <label>
                      <input
                        type="checkbox"
                        checked={myPreferences.smoking_ok}
                        onChange={(e) =>
                          setMyPreferences((p) => ({ ...p, smoking_ok: e.target.checked }))
                        }
                      />
                      Smoking / Vaping acceptable in household
                    </label>
                  </div>
                </div>

                <div className="pref-row">
                  <label htmlFor="pref-housing">Preferred Housing Type &amp; Location</label>
                  <input
                    id="pref-housing"
                    type="text"
                    placeholder="e.g. 2 Bed / 2 Bath apartment near campus or light rail"
                    value={myPreferences.housing_preference}
                    onChange={(e) =>
                      setMyPreferences((p) => ({ ...p, housing_preference: e.target.value }))
                    }
                  />
                </div>

                <div className="pref-row">
                  <label htmlFor="pref-bio">Roommate Search Bio &amp; Note</label>
                  <textarea
                    id="pref-bio"
                    rows={4}
                    placeholder="Describe your daily routine, study habits, and what you are looking for in a living environment..."
                    value={myPreferences.bio}
                    onChange={(e) => setMyPreferences((p) => ({ ...p, bio: e.target.value }))}
                  />
                </div>

                <button type="submit" className="pref-save-btn">
                  Save Living Preferences
                </button>
              </fieldset>
            </form>
          </section>
        )}

        {/* TAB 3: SAVED PROFILES */}
        {activeTab === 'saved' && (
          <section aria-label="Saved Roommate Profiles">
            <h2 style={{ color: 'var(--niner-green)', marginBottom: '16px' }}>
              Saved Roommate Candidates ({savedRoommates.length})
            </h2>

            {savedRoommates.length === 0 ? (
              <div
                style={{
                  textAlign: 'center',
                  padding: '40px',
                  backgroundColor: 'var(--white)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '4px',
                }}
              >
                <h3>No saved profiles yet.</h3>
                <p style={{ color: 'var(--text-muted)' }}>
                  Browse candidates and click &ldquo;Save Profile&rdquo; to shortlist students you would like to contact.
                </p>
                <button
                  type="button"
                  className="btn-primary"
                  onClick={() => setActiveTab('browse')}
                  style={{ marginTop: '12px' }}
                >
                  Browse Roommates
                </button>
              </div>
            ) : (
              <div className="roommate-grid">
                {savedRoommates.map((candidate) => (
                  <article key={candidate.user_id} className="roommate-card">
                    <div>
                      <div className="roommate-card-top">
                        <div className="roommate-card-identity">
                          <h3>{candidate.display_name}</h3>
                          <span className="roommate-verified-badge">[UNCC Verified]</span>
                        </div>
                        <span className="habit-badge habit-badge-budget">
                          Max ${candidate.budget_max}/mo
                        </span>
                      </div>

                      <div className="roommate-academic-line">
                        <strong>{candidate.major}</strong> &bull; Class of {candidate.graduation_year}
                      </div>

                      <p className="roommate-bio-text">{candidate.bio}</p>
                      <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                        <strong>Email:</strong> {candidate.email}
                      </p>
                    </div>

                    <div className="roommate-card-actions">
                      <button
                        type="button"
                        className="btn-primary"
                        onClick={() => setMessageTarget(candidate)}
                      >
                        Send Message
                      </button>
                      <button
                        type="button"
                        className="btn-secondary"
                        onClick={() => toggleSaveRoommate(candidate.user_id)}
                      >
                        Remove from Saved
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        )}
      </main>

      {/* Connect / Message Modal Dialog */}
      {messageTarget && (
        <div
          className="roommate-modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="message-modal-title"
          onClick={() => setMessageTarget(null)}
        >
          <div className="roommate-modal" onClick={(e) => e.stopPropagation()}>
            <div className="roommate-modal-header">
              <h3 id="message-modal-title">Connect with {messageTarget.display_name}</h3>
              <button
                type="button"
                className="roommate-modal-close-btn"
                onClick={() => setMessageTarget(null)}
                aria-label="Close message window"
              >
                &times;
              </button>
            </div>

            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '14px' }}>
              Send an introduction message regarding housing preferences. Messages are sent securely
              to their verified UNC Charlotte campus address (<code>{messageTarget.email}</code>).
            </p>

            <form onSubmit={handleSendMessage}>
              <div className="pref-row">
                <label htmlFor="intro-msg">Introduction Message</label>
                <textarea
                  id="intro-msg"
                  rows={4}
                  placeholder={`Hi ${messageTarget.display_name}, I saw your profile on UniVerse Roommate Finder and noticed our budget and living habits align...`}
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '16px' }}>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setMessageTarget(null)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Send Outreach Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Footer matching standard landing layout */}
      <footer>
        <p>&copy; 2026 UniVerse. Verified UNC Charlotte student housing and roommate directory.</p>
      </footer>
    </div>
  );
}
