import { useState, useMemo, useEffect, useRef } from 'react';
import './RoommateFinderPage.css';
import {
  mockRoommates,
  defaultUserLivingPreferences,
  filterRoommateCandidates,
} from '../data/mockRoommateData';
import {
  loadUserProfile,
  saveUserProfile,
  mapCleanlinessToDb,
  mapSleepScheduleToDb,
} from '../types/profile';

/**
 * RoommateFinderPage Component
 *
 * Skeleton layout for the UNC Charlotte Roommate Finder and Matching system.
 *
 * Backend Integration Plan:
 * ------------------------------------------------------------
 * 1. Data Source:
 *    - Roommate profiles and preferences are loaded from
 *      `src/data/mockRoommateData.js`, mirroring:
 *      * `UniVerse/src/database/roommateDB.ts` (RoommatePreferenceTable, RoommateFilterOptions)
 *      * `UniVerse/src/database/userDB.ts` (UserTable, ProfileTable)
 *      * `UniVerse/docs/ERD.md` (USER ||--o| ROOMMATE_PREFERENCE)
 *    - roommate_preferences has no display_name / bio / interests / major / email,
 *      so the real endpoint must join with the profiles table.
 * 2. Fetching Matches:
 *    - Replace client-side filtering with `findRoommateMatches(db, filters)`
 *      or `GET /api/roommates?maxBudget=...&sleepSchedule=...`
 * 3. Saving User Preferences:
 *    - `upsertRoommatePreference(db, preference)` or `PUT /api/users/:userId/roommate-preference`
 * 4. Messaging & Outreach:
 *    - The connection modal should call the student messaging / notifications service.
 *      Keep candidate emails server-side; do not expose them to the client.
 */

// ---------------------------------------------------------------------------
// Constants & helpers
// ---------------------------------------------------------------------------

const DEFAULT_FILTERS = {
  searchQuery: '',
  maxBudget: 1200,
  sleepSchedule: 'all',
  cleanliness: 'all',
  petsOnly: false,
  nonSmokingOnly: true,
};

// Inverse of mapSleepScheduleToDb / mapCleanlinessToDb.
// Better long-term home: src/types/profile (next to the forward mappers).
function mapSleepScheduleFromDb(val) {
  if (val === 'early_bird') return 'Early Bird';
  if (val === 'night_owl') return 'Night Owl';
  return 'Flexible';
}

function mapCleanlinessFromDb(val) {
  if (val === 'neat') return 'Neat & Organized';
  if (val === 'moderate') return 'Moderate';
  return 'Relaxed';
}

// Builds the "My Living Preferences" form state from a profile.
function buildMyPreferences(profile) {
  const prefs = profile?.preferences;
  return {
    ...defaultUserLivingPreferences,
    budget_max: prefs?.budgetMax || defaultUserLivingPreferences.budget_max,
    sleep_schedule: mapSleepScheduleToDb(prefs?.sleepSchedule || 'Flexible'),
    cleanliness: mapCleanlinessToDb(prefs?.cleanliness || 'Moderate'),
    pets_ok: prefs?.petPolicy !== 'No pets',
    smoking_ok: prefs?.smoking === 'Yes',
    preferred_move_in: prefs?.moveInTerm || defaultUserLivingPreferences.preferred_move_in,
    housing_preference:
      (prefs?.preferredAreas || []).join(', ') || defaultUserLivingPreferences.housing_preference,
    bio: profile?.base?.bio || defaultUserLivingPreferences.bio,
  };
}

function splitInterests(value) {
  return (value || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

export default function RoommateFinderPage({
  currentUser,
  isSeekingRoommate,
  onNavigateToLanding,
  onNavigateToCatalog,
  onNavigateToProfile,
  onNavigateToSignIn,
  onLogout,
}) {
  // Navigation & View Tabs
  const [activeTab, setActiveTab] = useState('browse'); // 'browse' | 'preferences' | 'saved'

  // Dynamic Profile Context & Persistence
  const [userProfile, setUserProfile] = useState(() => loadUserProfile(currentUser));
  const [prevUser, setPrevUser] = useState(currentUser);

  // User's own living habits form state (mirrors RoommatePreferenceTable, synced with userProfile)
  const [myPreferences, setMyPreferences] = useState(() =>
    buildMyPreferences(loadUserProfile(currentUser))
  );
  const [showSaveSuccess, setShowSaveSuccess] = useState(false);

  // Re-sync profile and form when the logged-in user changes
  if (currentUser !== prevUser) {
    const fresh = loadUserProfile(currentUser);
    setPrevUser(currentUser);
    setUserProfile(fresh);
    setMyPreferences(buildMyPreferences(fresh));
  }

  // Re-sync profile and form when the profile is saved elsewhere
  useEffect(() => {
    const handleProfileUpdate = () => {
      const fresh = loadUserProfile(currentUser);
      setUserProfile(fresh);
      setMyPreferences(buildMyPreferences(fresh));
    };
    window.addEventListener('universe_profile_saved', handleProfileUpdate);
    window.addEventListener('storage', handleProfileUpdate);
    return () => {
      window.removeEventListener('universe_profile_saved', handleProfileUpdate);
      window.removeEventListener('storage', handleProfileUpdate);
    };
  }, [currentUser]);

  const isUserSeeking =
    typeof isSeekingRoommate === 'boolean'
      ? isSeekingRoommate
      : userProfile?.preferences?.isSeekingRoommate === true;

  // Filter State (reflects RoommateFilterOptions from roommateDB.ts)
  const [filters, setFilters] = useState(DEFAULT_FILTERS);

  // Saved / Bookmarked roommates
  const [savedUserIds, setSavedUserIds] = useState(() => new Set());

  // Connect / Message Modal State
  const [messageTarget, setMessageTarget] = useState(null);
  const [messageText, setMessageText] = useState('');
  const [messageSentNotice, setMessageSentNotice] = useState(null);

  // Timer refs so timeouts can be cleared on unmount
  const noticeTimerRef = useRef(null);
  const saveTimerRef = useRef(null);
  useEffect(() => {
    return () => {
      clearTimeout(noticeTimerRef.current);
      clearTimeout(saveTimerRef.current);
    };
  }, []);

  // Other students (mock pool, excluding the current user)
  const otherCandidates = useMemo(() => {
    const userEmail = (userProfile?.base?.campusEmail || currentUser?.email || '')
      .toLowerCase()
      .trim();
    const userId = currentUser?.user_id || currentUser?.id;

    return mockRoommates.filter((rm) => {
      if (userEmail && rm.email && rm.email.toLowerCase().trim() === userEmail) return false;
      if (userId && rm.user_id === userId) return false;
      return true;
    });
  }, [userProfile, currentUser]);

  // The current user's own listing (only when actively seeking)
  const userCandidate = useMemo(() => {
    if (!isUserSeeking) return null;
    const base = userProfile?.base;
    const prefs = userProfile?.preferences;
    const userId = currentUser?.user_id || currentUser?.id;

    return {
      user_id: userId || 9999,
      preference_id: 9999,
      display_name: base?.displayName || currentUser?.fullName || 'Current Student',
      email: base?.campusEmail || currentUser?.email || 'student@charlotte.edu',
      major: base?.major || 'Undergraduate Studies',
      graduation_year: base?.gradYear || '2027',
      bio: base?.bio || 'Charlotte student seeking off-campus roommates.',
      interests:
        prefs?.amenities && prefs.amenities.length > 0
          ? prefs.amenities.join(', ')
          : 'Off-campus housing, Study groups',
      budget_max: prefs?.budgetMax || 850,
      sleep_schedule: mapSleepScheduleToDb(prefs?.sleepSchedule),
      cleanliness: mapCleanlinessToDb(prefs?.cleanliness),
      pets_ok: prefs?.petPolicy !== 'No pets',
      smoking_ok: prefs?.smoking === 'Yes',
      preferred_move_in: prefs?.moveInTerm || 'Fall 2027',
      housing_preference:
        prefs?.preferredAreas && prefs.preferredAreas.length > 0
          ? prefs.preferredAreas.join(', ')
          : '2 Bed / 2 Bath near campus',
      is_current_user: true,
    };
  }, [userProfile, currentUser, isUserSeeking]);

  // Filtered other students
  const matchingRoommates = useMemo(
    () => filterRoommateCandidates(otherCandidates, filters),
    [otherCandidates, filters]
  );

  // Your own card is always pinned first and is not affected by the filters
  const displayList = useMemo(
    () => (userCandidate ? [userCandidate, ...matchingRoommates] : matchingRoommates),
    [userCandidate, matchingRoommates]
  );

  const savedRoommates = useMemo(
    () => otherCandidates.filter((rm) => savedUserIds.has(rm.user_id)),
    [otherCandidates, savedUserIds]
  );

  // Handlers
  const handleFilterChange = (field, value) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
  };

  const handleResetFilters = () => {
    setFilters(DEFAULT_FILTERS);
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
    const current = userProfile.preferences;

    // Only overwrite petPolicy / smoking if the checkbox actually changed, so richer
    // values like 'Has pet' or 'Outside only' are not flattened by a save.
    const currentPetsOk = current.petPolicy !== 'No pets';
    const petPolicy =
      myPreferences.pets_ok === currentPetsOk
        ? current.petPolicy
        : myPreferences.pets_ok
        ? 'Pet friendly'
        : 'No pets';

    const currentSmokingOk = current.smoking === 'Yes';
    const smoking =
      myPreferences.smoking_ok === currentSmokingOk
        ? current.smoking
        : myPreferences.smoking_ok
        ? 'Yes'
        : 'No';

    // Build only { base, preferences } so the stale `roommatePreferences` alias is not carried over.
    const updated = {
      base: {
        ...userProfile.base,
        bio: myPreferences.bio || userProfile.base.bio,
      },
      preferences: {
        ...current,
        budgetMax: Number(myPreferences.budget_max) || current.budgetMax,
        sleepSchedule: mapSleepScheduleFromDb(myPreferences.sleep_schedule),
        cleanliness: mapCleanlinessFromDb(myPreferences.cleanliness),
        petPolicy,
        smoking,
        moveInTerm: myPreferences.preferred_move_in || current.moveInTerm,
        preferredAreas: myPreferences.housing_preference
          ? myPreferences.housing_preference
              .split(',')
              .map((s) => s.trim())
              .filter(Boolean)
          : current.preferredAreas,
      },
    };

    saveUserProfile(updated);
    setUserProfile(updated);
    setShowSaveSuccess(true);
    clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => setShowSaveSuccess(false), 4000);
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!messageTarget) return;

    // TODO: send `messageText` through the messaging API once the backend exists.
    setMessageSentNotice(
      `Demo only: your message to ${messageTarget.display_name} was not sent (messaging backend not connected yet).`
    );
    setMessageTarget(null);
    setMessageText('');

    clearTimeout(noticeTimerRef.current);
    noticeTimerRef.current = setTimeout(() => setMessageSentNotice(null), 4500);
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
          <button type="button" className="roommate-back-btn" onClick={onNavigateToLanding}>
            &larr; Back to Home
          </button>
        </div>

        <nav className="roommate-header-nav" aria-label="Roommate Navigation">
          <button type="button" className="roommate-nav-link" onClick={onNavigateToCatalog}>
            Course Catalog
          </button>
          {isUserSeeking && (
            <button
              type="button"
              className="roommate-nav-link active"
              onClick={() => setActiveTab('browse')}
            >
              Roommate Finder
            </button>
          )}
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
                <button type="button" className="roommate-back-btn" onClick={onLogout}>
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
            Browse Candidates ({otherCandidates.length})
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
            Saved Profiles ({savedRoommates.length})
          </button>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="roommate-content">
        {/* Architecture Note (development builds only) */}
        {import.meta.env?.DEV && (
          <aside className="roommate-integration-banner" aria-label="Developer Architecture Note">
            <strong>Architecture Planning:</strong> This roommate skeleton mirrors entities in{' '}
            <code>UniVerse/src/database/roommateDB.ts</code> (table: <code>roommate_preferences</code>,
            query: <code>findRoommateMatches()</code>) and <code>userDB.ts</code> (table:{' '}
            <code>profiles</code>). Backend integration hooks directly into these database functions
            without schema changes.
          </aside>
        )}

        {/* Success Alert for Message */}
        {messageSentNotice && (
          <div className="pref-success-alert" role="status">
            {messageSentNotice}
          </div>
        )}

        {/* TAB 1: BROWSE CANDIDATES */}
        {activeTab === 'browse' && (
          <section aria-label="Roommate Candidates Search">
            {!isUserSeeking ? (
              <div
                className="roommate-empty-prompt-card"
                style={{
                  textAlign: 'center',
                  padding: '56px 24px',
                  backgroundColor: 'var(--white)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '6px',
                  marginBottom: '24px',
                  boxShadow: 'var(--shadow-sm)',
                }}
              >
                <div style={{ marginBottom: '14px' }}>
                  <span
                    className="status-pill status-pill-inactive"
                    style={{ fontSize: '13px', padding: '6px 14px' }}
                  >
                    &bull; Status: Not looking for roommates
                  </span>
                </div>
                <h2 style={{ color: 'var(--niner-green)', marginBottom: '10px' }}>
                  Roommate Matching is Inactive
                </h2>
                <p
                  style={{
                    maxWidth: '540px',
                    margin: '0 auto 24px',
                    color: 'var(--text-secondary)',
                    fontSize: '15px',
                    lineHeight: '1.6',
                  }}
                >
                  You are currently not looking for a roommate. Turn on the toggle in your profile to
                  participate and view matches.
                </p>
                {onNavigateToProfile && (
                  <button
                    type="button"
                    className="btn-primary"
                    onClick={onNavigateToProfile}
                    style={{ fontSize: '15px', padding: '10px 24px' }}
                  >
                    Go to Profile &amp; Turn On
                  </button>
                )}
              </div>
            ) : (
              <>
                {/* User Roommate Search Status Banner */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 18px',
                    marginBottom: '16px',
                    borderRadius: '6px',
                    flexWrap: 'wrap',
                    gap: '12px',
                    backgroundColor: '#e8f5e9',
                    border: '1px solid #81c784',
                  }}
                >
                  <div
                    style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}
                  >
                    <span className="status-pill status-pill-active">
                      &bull; Status: Actively searching for roommates
                    </span>
                    <span style={{ fontSize: '13px', color: '#1b5e20' }}>
                      Your profile is published and active in the public Charlotte directory.
                    </span>
                  </div>

                  {onNavigateToProfile && (
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={onNavigateToProfile}
                      style={{ fontSize: '13px', padding: '5px 12px' }}
                    >
                      Manage Preferences
                    </button>
                  )}
                </div>

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

                    <button type="button" className="roommate-reset-btn" onClick={handleResetFilters}>
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
                      <strong>{otherCandidates.length}</strong> profiles
                    </span>
                    <span>
                      Saved: <strong>{savedRoommates.length}</strong> roommates
                    </span>
                  </div>
                </div>

                {/* No-match notice (your own pinned card still shows below) */}
                {matchingRoommates.length === 0 && (
                  <div
                    style={{
                      textAlign: 'center',
                      padding: '40px',
                      marginBottom: '16px',
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
                )}

                {/* Candidates Grid */}
                {displayList.length > 0 && (
                  <div className="roommate-grid">
                    {displayList.map((candidate) => {
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
                                {candidate.is_current_user ? (
                                  <span
                                    className="roommate-verified-badge"
                                    style={{
                                      backgroundColor: '#e8f5e9',
                                      color: 'var(--niner-green)',
                                      borderColor: 'var(--niner-green)',
                                      fontWeight: 700,
                                    }}
                                  >
                                    [Your Active Listing]
                                  </span>
                                ) : (
                                  <span className="roommate-verified-badge">[UNCC Verified]</span>
                                )}
                              </div>
                              <span className="habit-badge habit-badge-budget">
                                Max ${candidate.budget_max}/mo
                              </span>
                            </div>

                            <div className="roommate-academic-line">
                              <strong>{candidate.major}</strong> &bull; Class of{' '}
                              {candidate.graduation_year}
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
                              <div className="roommate-interests-label">
                                {candidate.is_current_user
                                  ? 'Preferred Amenities:'
                                  : 'Interests & Hobbies:'}
                              </div>
                              <div className="roommate-interest-tags">
                                {splitInterests(candidate.interests).map((interest, idx) => (
                                  <span key={`${interest}-${idx}`} className="roommate-interest-tag">
                                    {interest}
                                  </span>
                                ))}
                              </div>
                            </div>

                            <div
                              style={{
                                fontSize: '12px',
                                color: 'var(--text-muted)',
                                marginBottom: '8px',
                              }}
                            >
                              Target Housing: <strong>{candidate.housing_preference}</strong> &bull;
                              Move-in: {candidate.preferred_move_in}
                            </div>
                          </div>

                          <div className="roommate-card-actions">
                            {candidate.is_current_user ? (
                              <button
                                type="button"
                                className="btn-primary"
                                onClick={onNavigateToProfile}
                              >
                                Edit My Profile
                              </button>
                            ) : (
                              <>
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
                              </>
                            )}
                          </div>
                        </article>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </section>
        )}

        {/* TAB 2: MY LIVING PREFERENCES FORM */}
        {activeTab === 'preferences' && (
          <section className="roommate-pref-form-card" aria-label="My Living Preferences">
            {showSaveSuccess && (
              <div className="pref-success-alert" role="status">
                [Saved] Your roommate matching preferences have been updated.
              </div>
            )}

            <form onSubmit={handleSaveMyPreferences}>
              <fieldset>
                <legend>My Living Habit Profile</legend>
                <p className="pref-form-intro">
                  Set your personal living habits and budget. These values are saved to your user
                  profile and matched against other Charlotte students via the{' '}
                  <code>roommate_preferences</code> database schema.
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

                <div className="pref-row" role="radiogroup" aria-labelledby="pref-sleep-label">
                  <span id="pref-sleep-label" className="pref-row-label">
                    Sleep &amp; Wake Schedule
                  </span>
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

                <div className="pref-row" role="radiogroup" aria-labelledby="pref-clean-label">
                  <span id="pref-clean-label" className="pref-row-label">
                    Cleanliness Standards
                  </span>
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

                <div className="pref-row" role="group" aria-labelledby="pref-policy-label">
                  <span id="pref-policy-label" className="pref-row-label">
                    Household Policies
                  </span>
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
                    placeholder="e.g. University City North, College Downs"
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
                  Browse candidates and click &ldquo;Save Profile&rdquo; to shortlist students you
                  would like to contact.
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
                      {/* Email intentionally not shown: contact goes through the message flow */}
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

            <p
              style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '14px' }}
            >
              Send an introduction message regarding housing preferences. Your message will be
              delivered through UniVerse to their verified UNC Charlotte account.
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

              <div
                style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '16px' }}
              >
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
        <p>
          &copy; 2026 UniVerse. Verified UNC Charlotte student housing and roommate directory.
        </p>
      </footer>
    </div>
  );
}