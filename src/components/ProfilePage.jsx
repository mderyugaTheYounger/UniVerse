import { useState } from 'react';
import './ProfilePage.css';
import {
  loadUserProfile,
  saveUserProfile,
  DEGREE_LEVEL_OPTIONS,
  CONTACT_PREFERENCE_OPTIONS,
  CLEANLINESS_OPTIONS,
  SLEEP_SCHEDULE_OPTIONS,
  STUDY_HABIT_OPTIONS,
  SOCIAL_HABIT_OPTIONS,
  SMOKING_OPTIONS,
  OVERNIGHT_GUEST_OPTIONS,
  PET_POLICY_OPTIONS,
  AVAILABLE_CAMPUS_AREAS,
  AVAILABLE_AMENITIES,
} from '../types/profile';

/**
 * ProfilePage Component
 *
 * Provides student profile management with strict separation between universal
 * academic attributes (BaseUserProfile) and dynamic roommate preferences (RoommatePreferences).
 */
export default function ProfilePage({
  currentUser,
  onLogout,
  onNavigateToLanding,
  onNavigateToCatalog,
  onNavigateToRoommates,
}) {
  // Initialize state cleanly from local storage without hardcoded dummy values
  const [profile, setProfile] = useState(() => loadUserProfile(currentUser));
  const [showSaveSuccess, setShowSaveSuccess] = useState(false);
  const [prevUser, setPrevUser] = useState(currentUser);

  // Sync if currentUser context updates from auth session without effect cascade
  if (currentUser !== prevUser) {
    setPrevUser(currentUser);
    const updated = loadUserProfile(currentUser);
    setProfile((prev) => ({
      base: {
        ...updated.base,
        displayName: prev.base.displayName || updated.base.displayName,
        campusEmail: prev.base.campusEmail || updated.base.campusEmail,
        major: prev.base.major || updated.base.major,
        gradYear: prev.base.gradYear || updated.base.gradYear,
        degreeLevel: prev.base.degreeLevel || updated.base.degreeLevel,
        genderIdentity: prev.base.genderIdentity || updated.base.genderIdentity,
        bio: prev.base.bio || updated.base.bio,
        contact: {
          ...updated.base.contact,
          ...prev.base.contact,
        },
      },
      preferences: {
        ...prev.preferences,
      },
    }));
  }

  // Handlers for Universal Base Attributes
  const handleBaseChange = (field, value) => {
    setProfile((prev) => ({
      ...prev,
      base: {
        ...prev.base,
        [field]: value,
      },
    }));
  };

  const handleContactChange = (field, value) => {
    setProfile((prev) => ({
      ...prev,
      base: {
        ...prev.base,
        contact: {
          ...prev.base.contact,
          [field]: value,
        },
      },
    }));
  };

  // Handlers for Roommate Preferences
  const handleRoommateToggle = (e) => {
    const isSeeking = e.target.checked;
    setProfile((prev) => ({
      ...prev,
      preferences: {
        ...prev.preferences,
        isSeekingRoommate: isSeeking,
      },
    }));
  };

  const handlePreferenceChange = (field, value) => {
    setProfile((prev) => ({
      ...prev,
      preferences: {
        ...prev.preferences,
        [field]: value,
      },
    }));
  };

  const handleAreaToggle = (area) => {
    setProfile((prev) => {
      const currentAreas = prev.preferences.preferredAreas || [];
      const nextAreas = currentAreas.includes(area)
        ? currentAreas.filter((a) => a !== area)
        : [...currentAreas, area];
      return {
        ...prev,
        preferences: {
          ...prev.preferences,
          preferredAreas: nextAreas,
        },
      };
    });
  };

  const handleAmenityToggle = (amenity) => {
    setProfile((prev) => {
      const currentAmenities = prev.preferences.amenities || [];
      const nextAmenities = currentAmenities.includes(amenity)
        ? currentAmenities.filter((a) => a !== amenity)
        : [...currentAmenities, amenity];
      return {
        ...prev,
        preferences: {
          ...prev.preferences,
          amenities: nextAmenities,
        },
      };
    });
  };

  // Save profile to persistent storage
  const handleSaveProfile = (e) => {
    e.preventDefault();
    saveUserProfile(profile);
    setShowSaveSuccess(true);
    setTimeout(() => {
      setShowSaveSuccess(false), 4500;
    }, 4500);
  };

  // Reset to last saved state
  const handleResetForm = () => {
    setProfile(loadUserProfile(currentUser));
  };

  const initials = profile.base.displayName
    ? profile.base.displayName
        .split(' ')
        .map((n) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : '49';

  return (
    <div className="profile-page">
      {/* Top Header matching Charlotte standards */}
      <header className="profile-header">
        <div className="profile-header-left">
          <button
            type="button"
            className="profile-header-brand"
            onClick={onNavigateToLanding}
            title="Go to UniVerse Home"
          >
            UniVerse
          </button>
        </div>

        <nav className="profile-nav" aria-label="Student Profile Navigation">
          <button type="button" className="profile-nav-btn" onClick={onNavigateToLanding}>
            &larr; Back to Home
          </button>
          {onNavigateToCatalog && (
            <button type="button" className="profile-nav-btn" onClick={onNavigateToCatalog}>
              Course Catalog
            </button>
          )}
          {onNavigateToRoommates && (
            <button type="button" className="profile-nav-btn" onClick={onNavigateToRoommates}>
              Roommate Finder
            </button>
          )}
          <button type="button" className="profile-nav-btn signout" onClick={onLogout}>
            Sign Out
          </button>
        </nav>
      </header>

      {/* Identity Banner */}
      <section className="profile-banner">
        <div className="profile-banner-inner">
          <div className="profile-identity">
            {currentUser?.avatar_url ? (
              <img
                src={currentUser.avatar_url}
                alt={profile.base.displayName || 'Student Profile'}
                referrerPolicy="no-referrer"
                className="profile-avatar"
              />
            ) : (
              <div className="profile-avatar-fallback">{initials}</div>
            )}
            <div className="profile-titles">
              <h1>{profile.base.displayName || 'Charlotte Student'}</h1>
              <p className="profile-subline">
                {profile.base.campusEmail || currentUser?.email || 'student@charlotte.edu'} &bull;{' '}
                {profile.base.degreeLevel || 'Student'} &bull; Class of {profile.base.gradYear || '2027'}
              </p>
              {currentUser?.auth_provider === 'google' && (
                <span className="verified-badge">
                  Verified UNC Charlotte Google Account
                </span>
              )}
            </div>
          </div>

          <div>
            {profile.preferences.isSeekingRoommate ? (
              <span className="status-pill status-pill-active">
                &bull; Status: Actively searching for roommates
              </span>
            ) : (
              <span className="status-pill status-pill-inactive">
                &bull; Status: Not looking for roommates
              </span>
            )}
          </div>
        </div>
      </section>

      {/* Main Profile Form */}
      <main className="profile-container">
        {showSaveSuccess && (
          <div className="profile-success-alert" role="status">
            <span>
              <strong>Success:</strong> Your universal student profile and living preferences have
              been saved to storage!
            </span>
            <button
              type="button"
              onClick={() => setShowSaveSuccess(false)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}
            >
              &times;
            </button>
          </div>
        )}

        <form onSubmit={handleSaveProfile}>
          {/* SECTION 1: TOP SECTION (UNIVERSAL STUDENT INFO) */}
          <section className="profile-card" aria-labelledby="universal-student-info-heading">
            <div className="profile-card-header">
              <h2 id="universal-student-info-heading" className="profile-card-title">
                Universal Student Information
              </h2>
              <p className="profile-card-desc">
                Your standard UNC Charlotte student details. These are shared across all campus
                services and are visible even if you never look for a roommate.
              </p>
            </div>

            <div className="form-grid">
              <div className="form-field">
                <label htmlFor="displayName">Display Name</label>
                <input
                  id="displayName"
                  type="text"
                  placeholder="e.g. Maya Patel"
                  value={profile.base.displayName}
                  onChange={(e) => handleBaseChange('displayName', e.target.value)}
                  required
                />
              </div>

              <div className="form-field">
                <label htmlFor="campusEmail">Campus Email</label>
                <input
                  id="campusEmail"
                  type="email"
                  placeholder="e.g. mpatel2@charlotte.edu"
                  value={profile.base.campusEmail}
                  onChange={(e) => handleBaseChange('campusEmail', e.target.value)}
                  required
                />
              </div>

              <div className="form-field">
                <label htmlFor="major">Major / Academic Program</label>
                <input
                  id="major"
                  type="text"
                  placeholder="e.g. Computer Science, Mechanical Engineering"
                  value={profile.base.major}
                  onChange={(e) => handleBaseChange('major', e.target.value)}
                  required
                />
              </div>

              <div className="form-field">
                <label htmlFor="gradYear">Graduation Year</label>
                <input
                  id="gradYear"
                  type="text"
                  placeholder="e.g. 2027"
                  value={profile.base.gradYear}
                  onChange={(e) => handleBaseChange('gradYear', e.target.value)}
                  required
                />
              </div>

              <div className="form-field">
                <label htmlFor="degreeLevel">Degree Level</label>
                <select
                  id="degreeLevel"
                  value={profile.base.degreeLevel}
                  onChange={(e) => handleBaseChange('degreeLevel', e.target.value)}
                >
                  {DEGREE_LEVEL_OPTIONS.map((lvl) => (
                    <option key={lvl} value={lvl}>
                      {lvl}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-field">
                <label htmlFor="genderIdentity">Gender Identity (Optional)</label>
                <input
                  id="genderIdentity"
                  type="text"
                  placeholder="e.g. Female, Male, Non-binary, Prefer not to say"
                  value={profile.base.genderIdentity}
                  onChange={(e) => handleBaseChange('genderIdentity', e.target.value)}
                />
              </div>

              <div className="form-field full-width">
                <label htmlFor="bio">Student Bio &amp; Campus Summary</label>
                <textarea
                  id="bio"
                  rows={3}
                  placeholder="Share a short bio, study interests, campus clubs, or academic goals..."
                  value={profile.base.bio}
                  onChange={(e) => handleBaseChange('bio', e.target.value)}
                />
              </div>

              <div className="form-field">
                <label htmlFor="contactPreferred">Preferred Contact Channel</label>
                <select
                  id="contactPreferred"
                  value={profile.base.contact.preferred}
                  onChange={(e) => handleContactChange('preferred', e.target.value)}
                >
                  {CONTACT_PREFERENCE_OPTIONS.map((pref) => (
                    <option key={pref} value={pref}>
                      {pref.charAt(0).toUpperCase() + pref.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-field">
                <label htmlFor="contactPhone">Phone Number (Optional)</label>
                <input
                  id="contactPhone"
                  type="text"
                  placeholder="e.g. (704) 555-0199"
                  value={profile.base.contact.phone || ''}
                  onChange={(e) => handleContactChange('phone', e.target.value)}
                />
              </div>

              <div className="form-field">
                <label htmlFor="socialHandle">Social Handle / LinkedIn (Optional)</label>
                <input
                  id="socialHandle"
                  type="text"
                  placeholder="e.g. @maya_uncc or linkedin.com/in/maya"
                  value={profile.base.contact.socialHandle || ''}
                  onChange={(e) => handleContactChange('socialHandle', e.target.value)}
                />
              </div>
            </div>
          </section>

          {/* SECTION 2: ROOMMATE OPT-IN TOGGLE BANNER */}
          <section className="roommate-toggle-banner" aria-labelledby="roommate-toggle-heading">
            <div className="roommate-toggle-inner">
              <div className="roommate-toggle-info">
                <h2 id="roommate-toggle-heading">Are you looking for off-campus roommates?</h2>
                <p>
                  Enable this toggle to publish your living preferences to the Charlotte Student
                  Roommate Directory. When turned off, your preferences are saved privately and
                  your profile is excluded from public search results.
                </p>
                <div>
                  {profile.preferences.isSeekingRoommate ? (
                    <span className="status-pill status-pill-active">
                      Status: Actively searching for roommates
                    </span>
                  ) : (
                    <span className="status-pill status-pill-inactive">
                      Status: Not looking for roommates
                    </span>
                  )}
                </div>
              </div>

              <div className="toggle-switch-wrapper">
                <label className="switch" htmlFor="roommateSeekingToggle" aria-label="Toggle roommate search">
                  <input
                    id="roommateSeekingToggle"
                    type="checkbox"
                    checked={profile.preferences.isSeekingRoommate}
                    onChange={handleRoommateToggle}
                  />
                  <span className="slider"></span>
                </label>
              </div>
            </div>
          </section>

          {/* SECTION 3: CONDITIONAL ROOMMATE PREFERENCE CARDS */}
          {profile.preferences.isSeekingRoommate && (
            <div className="roommate-collapsible-section">
              {/* CARD 1: LIVING HABITS */}
              <section className="profile-card" aria-labelledby="living-habits-heading">
                <div className="profile-card-header">
                  <h2 id="living-habits-heading" className="profile-card-title">
                    Living Habits &amp; Daily Routine
                  </h2>
                  <p className="profile-card-desc">
                    Specify your lifestyle compatibility factors to help match with compatible roommates.
                  </p>
                </div>

                <div className="form-grid">
                  {/* Cleanliness */}
                  <div className="form-field full-width">
                    <label>Cleanliness Standards</label>
                    <div className="radio-button-group">
                      {CLEANLINESS_OPTIONS.map((opt) => (
                        <label
                          key={opt}
                          className={`radio-pill ${
                            profile.preferences.cleanliness === opt ? 'selected' : ''
                          }`}
                        >
                          <input
                            type="radio"
                            name="cleanliness"
                            value={opt}
                            checked={profile.preferences.cleanliness === opt}
                            onChange={(e) => handlePreferenceChange('cleanliness', e.target.value)}
                          />
                          {opt}
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Sleep Schedule */}
                  <div className="form-field full-width">
                    <label>Sleep &amp; Wake Schedule</label>
                    <div className="radio-button-group">
                      {SLEEP_SCHEDULE_OPTIONS.map((opt) => (
                        <label
                          key={opt}
                          className={`radio-pill ${
                            profile.preferences.sleepSchedule === opt ? 'selected' : ''
                          }`}
                        >
                          <input
                            type="radio"
                            name="sleepSchedule"
                            value={opt}
                            checked={profile.preferences.sleepSchedule === opt}
                            onChange={(e) => handlePreferenceChange('sleepSchedule', e.target.value)}
                          />
                          {opt}
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Study Habit */}
                  <div className="form-field full-width">
                    <label>Study Habit</label>
                    <div className="radio-button-group">
                      {STUDY_HABIT_OPTIONS.map((opt) => (
                        <label
                          key={opt}
                          className={`radio-pill ${
                            profile.preferences.studyHabit === opt ? 'selected' : ''
                          }`}
                        >
                          <input
                            type="radio"
                            name="studyHabit"
                            value={opt}
                            checked={profile.preferences.studyHabit === opt}
                            onChange={(e) => handlePreferenceChange('studyHabit', e.target.value)}
                          />
                          {opt}
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Social Habit */}
                  <div className="form-field full-width">
                    <label>Social Habits at Home</label>
                    <div className="radio-button-group">
                      {SOCIAL_HABIT_OPTIONS.map((opt) => (
                        <label
                          key={opt}
                          className={`radio-pill ${
                            profile.preferences.socialHabit === opt ? 'selected' : ''
                          }`}
                        >
                          <input
                            type="radio"
                            name="socialHabit"
                            value={opt}
                            checked={profile.preferences.socialHabit === opt}
                            onChange={(e) => handlePreferenceChange('socialHabit', e.target.value)}
                          />
                          {opt}
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Smoking */}
                  <div className="form-field full-width">
                    <label>Smoking / Vaping Tolerance</label>
                    <div className="radio-button-group">
                      {SMOKING_OPTIONS.map((opt) => (
                        <label
                          key={opt}
                          className={`radio-pill ${
                            profile.preferences.smoking === opt ? 'selected' : ''
                          }`}
                        >
                          <input
                            type="radio"
                            name="smoking"
                            value={opt}
                            checked={profile.preferences.smoking === opt}
                            onChange={(e) => handlePreferenceChange('smoking', e.target.value)}
                          />
                          {opt}
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Overnight Guests */}
                  <div className="form-field full-width">
                    <label>Overnight Guests Policy</label>
                    <div className="radio-button-group">
                      {OVERNIGHT_GUEST_OPTIONS.map((opt) => (
                        <label
                          key={opt}
                          className={`radio-pill ${
                            profile.preferences.overnightGuests === opt ? 'selected' : ''
                          }`}
                        >
                          <input
                            type="radio"
                            name="overnightGuests"
                            value={opt}
                            checked={profile.preferences.overnightGuests === opt}
                            onChange={(e) => handlePreferenceChange('overnightGuests', e.target.value)}
                          />
                          {opt}
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Pet Policy */}
                  <div className="form-field full-width">
                    <label>Pet Policy &amp; Ownership</label>
                    <div className="radio-button-group">
                      {PET_POLICY_OPTIONS.map((opt) => (
                        <label
                          key={opt}
                          className={`radio-pill ${
                            profile.preferences.petPolicy === opt ? 'selected' : ''
                          }`}
                        >
                          <input
                            type="radio"
                            name="petPolicy"
                            value={opt}
                            checked={profile.preferences.petPolicy === opt}
                            onChange={(e) => handlePreferenceChange('petPolicy', e.target.value)}
                          />
                          {opt}
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </section>

              {/* CARD 2: HOUSING & BUDGET NEEDS */}
              <section className="profile-card" aria-labelledby="housing-budget-heading">
                <div className="profile-card-header">
                  <h2 id="housing-budget-heading" className="profile-card-title">
                    Housing &amp; Budget Needs
                  </h2>
                  <p className="profile-card-desc">
                    Set your target budget, lease move-in term, preferred areas around Charlotte, and amenities.
                  </p>
                </div>

                <div className="form-grid">
                  <div className="form-field">
                    <label htmlFor="budgetMax">Max Monthly Rent Budget ($ USD)</label>
                    <input
                      id="budgetMax"
                      type="number"
                      min="300"
                      max="3000"
                      step="25"
                      placeholder="e.g. 850"
                      value={profile.preferences.budgetMax || ''}
                      onChange={(e) =>
                        handlePreferenceChange('budgetMax', Number(e.target.value) || 0)
                      }
                      required
                    />
                    <span className="field-hint">Target individual rent share per month</span>
                  </div>

                  <div className="form-field">
                    <label htmlFor="moveInTerm">Move-In Term</label>
                    <input
                      id="moveInTerm"
                      type="text"
                      placeholder="e.g. Fall 2027, Spring 2027"
                      value={profile.preferences.moveInTerm}
                      onChange={(e) => handlePreferenceChange('moveInTerm', e.target.value)}
                      required
                    />
                    <span className="field-hint">Anticipated lease commencement</span>
                  </div>

                  {/* Preferred Areas */}
                  <div className="form-field full-width">
                    <label>Preferred Areas near Campus</label>
                    <div className="tags-group">
                      {AVAILABLE_CAMPUS_AREAS.map((area) => {
                        const isChecked = (profile.preferences.preferredAreas || []).includes(area);
                        return (
                          <label key={area} className={`tag-checkbox ${isChecked ? 'checked' : ''}`}>
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => handleAreaToggle(area)}
                            />
                            {area}
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  {/* Amenities */}
                  <div className="form-field full-width">
                    <label>Desired Amenities</label>
                    <div className="tags-group">
                      {AVAILABLE_AMENITIES.map((amenity) => {
                        const isChecked = (profile.preferences.amenities || []).includes(amenity);
                        return (
                          <label
                            key={amenity}
                            className={`tag-checkbox ${isChecked ? 'checked' : ''}`}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => handleAmenityToggle(amenity)}
                            />
                            {amenity}
                          </label>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </section>
            </div>
          )}

          {/* Form Actions Footer */}
          <div className="profile-actions">
            <div>
              <button type="submit" className="save-profile-btn">
                Save Profile
              </button>
            </div>
            <div>
              <button
                type="button"
                className="reset-profile-btn"
                onClick={handleResetForm}
                title="Discard unsaved changes"
              >
                Reset to Saved
              </button>
            </div>
          </div>
        </form>
      </main>
    </div>
  );
}
