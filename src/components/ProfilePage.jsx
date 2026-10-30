import React, { useState } from 'react';

export default function ProfilePage({ currentUser, onLogout, onNavigateToLanding }) {
  const [isEditing, setIsEditing] = useState(false);

  const defaultUsername = currentUser?.email
    ? currentUser.email.split('@')[0]
    : 'niner_student';

  const [profileData, setProfileData] = useState({
    username: defaultUsername,
    fullName: currentUser?.fullName || 'Charlotte Student',
    email: currentUser?.email || 'student@charlotte.edu',
    major: 'Computer Science',
    graduationYear: '2027',
    bio: 'Looking for roommates near campus for the upcoming term.',
    cleanliness: 'Neat',
    sleepSchedule: 'Night owl',
    budgetMax: '850'
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfileData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = (e) => {
    e.preventDefault();
    setIsEditing(false);
  };

  return (
    <main style={{ padding: '24px', fontFamily: 'sans-serif' }}>
      <header>
        <button type="button" onClick={onNavigateToLanding} style={{ marginRight: '10px' }}>
          &larr; Back to Home
        </button>
        <button type="button" onClick={onLogout}>
          Sign Out
        </button>

        <h1>Student Profile</h1>
        <p>
          Viewing profile for: <strong>@{profileData.username}</strong> ({profileData.email})
        </p>
      </header>

      <section style={{ margin: '16px 0' }}>
        <button type="button" onClick={() => setIsEditing(!isEditing)}>
          {isEditing ? 'Cancel Editing' : 'Edit Profile'}
        </button>
      </section>

      {isEditing ? (
        <form onSubmit={handleSave}>
          <fieldset>
            <legend>Edit Details for @{profileData.username}</legend>

            <div style={{ margin: '8px 0' }}>
              <label htmlFor="fullName">Full Name: </label>
              <input
                id="fullName"
                name="fullName"
                type="text"
                value={profileData.fullName}
                onChange={handleChange}
              />
            </div>

            <div style={{ margin: '8px 0' }}>
              <label htmlFor="major">Major / Program: </label>
              <input
                id="major"
                name="major"
                type="text"
                value={profileData.major}
                onChange={handleChange}
              />
            </div>

            <div style={{ margin: '8px 0' }}>
              <label htmlFor="graduationYear">Class of: </label>
              <input
                id="graduationYear"
                name="graduationYear"
                type="text"
                value={profileData.graduationYear}
                onChange={handleChange}
              />
            </div>

            <div style={{ margin: '8px 0' }}>
              <label htmlFor="bio">Bio: </label>
              <textarea
                id="bio"
                name="bio"
                rows={3}
                value={profileData.bio}
                onChange={handleChange}
              />
            </div>

            <button type="submit">Save Changes</button>
          </fieldset>
        </form>
      ) : (
        <article>
          <section>
            <h2>Academic Details</h2>
            <ul>
              <li><strong>Display Name:</strong> {profileData.fullName}</li>
              <li><strong>Campus Email:</strong> {profileData.email}</li>
              <li><strong>Major:</strong> {profileData.major}</li>
              <li><strong>Expected Graduation:</strong> {profileData.graduationYear}</li>
            </ul>
          </section>

          <section>
            <h2>Living Preferences</h2>
            <p><strong>Bio:</strong> {profileData.bio}</p>
            <ul>
              <li><strong>Cleanliness:</strong> {profileData.cleanliness}</li>
              <li><strong>Sleep Schedule:</strong> {profileData.sleepSchedule}</li>
              <li><strong>Max Rent:</strong> ${profileData.budgetMax} / month</li>
            </ul>
          </section>
        </article>
      )}
    </main>
  );
}