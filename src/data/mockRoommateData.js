/**
 * Mock Roommate Database and Schema Definitions
 *
 * Designed to mirror the relational database schema implemented in:
 * - UniVerse/src/database/roommateDB.ts (RoommatePreferenceTable, RoommateFilterOptions)
 * - UniVerse/src/database/userDB.ts (UserTable, ProfileTable)
 * - UniVerse/docs/ERD.md
 *
 * Database fields mirrored:
 * - user_id (FK to users)
 * - budget_max (USD/month, nullable or >= 0)
 * - sleep_schedule ('early_bird' | 'night_owl' | 'flexible')
 * - cleanliness ('neat' | 'moderate' | 'relaxed')
 * - pets_ok (boolean)
 * - smoking_ok (boolean)
 * - updated_at (timestamptz)
 * - Joined with User (display_name, email) and Profile (bio, interests, graduation_year, major)
 *
 * Future Backend Integration:
 * When connecting to live PostgreSQL / Kysely backend:
 * 1. Replace with calls to backend endpoint GET /api/roommates?budgetMax=...&cleanliness=...
 * 2. Or directly call helper function in roommateDB.ts:
 *      findRoommateMatches(db, filters: RoommateFilterOptions)
 * 3. Saving current user's preferences:
 *      upsertRoommatePreference(db, preference: NewRoommatePreference)
 */

export const mockRoommates = [
  {
    user_id: 101,
    preference_id: 1,
    display_name: 'Maya Patel',
    email: 'mpatel2@charlotte.edu',
    major: 'Computer Science',
    graduation_year: 2026,
    bio: 'Junior studying software engineering. I study in Woodward Hall during evenings and keep common living spaces neat. Looking for an apartment along the LYNX Blue Line or University City Blvd.',
    interests: 'Coding, hiking, board games, running',
    budget_max: 850,
    sleep_schedule: 'early_bird',
    cleanliness: 'neat',
    pets_ok: true,
    smoking_ok: false,
    preferred_move_in: 'Fall 2026',
    housing_preference: '2 Bed / 2 Bath off-campus',
    updated_at: '2026-10-24T14:30:00Z',
  },
  {
    user_id: 102,
    preference_id: 2,
    display_name: 'Jordan Vance',
    email: 'jvance5@charlotte.edu',
    major: 'Mechanical Engineering',
    graduation_year: 2027,
    bio: 'Sophomore engineering student. Early riser with 8:00 AM labs. I like cooking dinner on weekends and always wash dishes immediately. Respectful of quiet study hours.',
    interests: 'Robotics, 3D printing, soccer, cycling',
    budget_max: 750,
    sleep_schedule: 'early_bird',
    cleanliness: 'moderate',
    pets_ok: false,
    smoking_ok: false,
    preferred_move_in: 'Fall 2026',
    housing_preference: '4 Bed / 4 Bath student complex',
    updated_at: '2026-10-28T09:15:00Z',
  },
  {
    user_id: 103,
    preference_id: 3,
    display_name: 'Samantha Chen',
    email: 'schen41@charlotte.edu',
    major: 'Health Systems Management',
    graduation_year: 2026,
    bio: 'Senior looking for a relaxed, tidy household. Non-smoker, friendly, and easy-going. Love weekend coffee runs and campus volunteering. Seeking a private room near campus shuttles.',
    interests: 'Fitness, podcasts, coffee, campus volunteering',
    budget_max: 950,
    sleep_schedule: 'flexible',
    cleanliness: 'neat',
    pets_ok: true,
    smoking_ok: false,
    preferred_move_in: 'Summer / Fall 2026',
    housing_preference: '2 Bed or 3 Bed townhouse',
    updated_at: '2026-10-30T16:45:00Z',
  },
  {
    user_id: 104,
    preference_id: 4,
    display_name: 'Marcus Washington',
    email: 'mwash12@charlotte.edu',
    major: 'Finance & Business Analytics',
    graduation_year: 2027,
    bio: 'Finance sophomore looking for a lease at Rush, Millennium, or University Walk. Quiet during exam weeks, night owl on Friday/Saturday nights. Very organized with rent and utility splits.',
    interests: 'Intramural basketball, financial markets, video games',
    budget_max: 1100,
    sleep_schedule: 'night_owl',
    cleanliness: 'moderate',
    pets_ok: true,
    smoking_ok: false,
    preferred_move_in: 'Fall 2026',
    housing_preference: '2 Bed / 2 Bath apartment',
    updated_at: '2026-10-20T11:00:00Z',
  },
  {
    user_id: 105,
    preference_id: 5,
    display_name: 'Elena Rostova',
    email: 'erostov1@charlotte.edu',
    major: 'Architecture',
    graduation_year: 2028,
    bio: 'Architecture freshman spending late hours in the design studio. Need a calm, organized sanctuary at home to rest. I have a friendly, quiet hypoallergenic cat (vet vaccinated).',
    interests: 'Drafting, interior design, indie music, coffee brewing',
    budget_max: 900,
    sleep_schedule: 'night_owl',
    cleanliness: 'neat',
    pets_ok: true,
    smoking_ok: false,
    preferred_move_in: 'Fall 2026',
    housing_preference: 'Private bedroom with pet-friendly lease',
    updated_at: '2026-11-01T13:20:00Z',
  },
  {
    user_id: 106,
    preference_id: 6,
    display_name: 'Devon Reynolds',
    email: 'dreynol9@charlotte.edu',
    major: 'Electrical Engineering',
    graduation_year: 2026,
    bio: 'Senior working on senior design capstone. Clean, considerate, flexible daily schedule. Enjoys bouldering at the campus rec center and studying along the greenway.',
    interests: 'Circuit design, guitar, rock climbing, electronics',
    budget_max: 700,
    sleep_schedule: 'flexible',
    cleanliness: 'relaxed',
    pets_ok: false,
    smoking_ok: false,
    preferred_move_in: 'August 2026',
    housing_preference: 'Affordable 3 or 4 Bed shared unit',
    updated_at: '2026-10-18T18:00:00Z',
  },
  {
    user_id: 107,
    preference_id: 7,
    display_name: 'Aisha Al-Mansoor',
    email: 'aalmans1@charlotte.edu',
    major: 'Data Science',
    graduation_year: 2027,
    bio: 'Data Science major looking for a female roommate. Non-smoker, neat living habits, studious during midterms. Would love a roommate to explore Charlotte coffee shops with.',
    interests: 'Machine learning, baking, reading, photography',
    budget_max: 800,
    sleep_schedule: 'early_bird',
    cleanliness: 'neat',
    pets_ok: false,
    smoking_ok: false,
    preferred_move_in: 'Fall 2026',
    housing_preference: '2 Bed / 2 Bath apartment',
    updated_at: '2026-10-29T10:40:00Z',
  },
];

export const defaultUserLivingPreferences = {
  budget_max: 850,
  sleep_schedule: 'flexible',
  cleanliness: 'neat',
  pets_ok: true,
  smoking_ok: false,
  preferred_move_in: 'Fall 2026',
  housing_preference: '2 Bed / 2 Bath near campus',
  bio: 'Charlotte student looking for responsible roommates with tidy habits.',
};

/**
 * Filter function implementing the criteria from RoommateFilterOptions in roommateDB.ts
 */
export function filterRoommateCandidates(candidates, filters) {
  return candidates.filter((candidate) => {
    // Max budget filter
    if (filters.maxBudget && candidate.budget_max !== null) {
      if (candidate.budget_max > filters.maxBudget) {
        return false;
      }
    }

    // Sleep schedule filter
    if (filters.sleepSchedule && filters.sleepSchedule !== 'all') {
      if (candidate.sleep_schedule !== filters.sleepSchedule) {
        return false;
      }
    }

    // Cleanliness filter
    if (filters.cleanliness && filters.cleanliness !== 'all') {
      if (candidate.cleanliness !== filters.cleanliness) {
        return false;
      }
    }

    // Pet filter: if user requires pets allowed
    if (filters.petsOnly) {
      if (!candidate.pets_ok) {
        return false;
      }
    }

    // Non-smoking filter
    if (filters.nonSmokingOnly) {
      if (candidate.smoking_ok) {
        return false;
      }
    }

    // Keyword search (name, major, interests, bio)
    if (filters.searchQuery && filters.searchQuery.trim() !== '') {
      const q = filters.searchQuery.toLowerCase();
      const matchName = candidate.display_name.toLowerCase().includes(q);
      const matchMajor = candidate.major.toLowerCase().includes(q);
      const matchBio = candidate.bio.toLowerCase().includes(q);
      const matchInterests = candidate.interests.toLowerCase().includes(q);
      if (!matchName && !matchMajor && !matchBio && !matchInterests) {
        return false;
      }
    }

    return true;
  });
}

