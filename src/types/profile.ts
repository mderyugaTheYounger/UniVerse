/**
 * Profile and Roommate Matching Domain Types & Storage Helpers
 *
 * Implements strict separation between universal student profile data (BaseUserProfile)
 * and optional roommate matching preferences (RoommatePreferences).
 */

export type DegreeLevel = 'Undergraduate' | 'Graduate' | 'Doctoral';

export interface UserContact {
  preferred: 'email' | 'phone' | 'social';
  phone?: string;
  socialHandle?: string;
}

/**
 * Universal Student Attributes (Common to all UNC Charlotte students)
 */
export interface BaseUserProfile {
  displayName: string;
  campusEmail: string;
  major: string;
  gradYear: string; // e.g. "2027"
  degreeLevel: DegreeLevel;
  genderIdentity: string;
  bio: string;
  contact: UserContact;
}

export type CleanlinessPreference = 'Neat & Organized' | 'Moderate' | 'Relaxed';
export type SleepSchedulePreference = 'Early Bird' | 'Night Owl' | 'Flexible';
export type StudyHabitPreference = 'Quiet at home' | 'Studies out/on-campus';
export type SocialHabitPreference = 'Quiet/substance-free' | 'Occasional friends' | 'Social/going out';
export type SmokingPreference = 'No' | 'Outside only' | 'Yes';
export type OvernightGuestsPreference = 'Rarely/Never' | 'Weekends only' | 'Flexible';
export type PetPolicyPreference = 'No pets' | 'Has pet' | 'Pet friendly';

/**
 * Roommate Matching Preferences (Used strictly when student opts into finding roommates)
 */
export interface RoommatePreferences {
  isSeekingRoommate: boolean;
  cleanliness: CleanlinessPreference;
  sleepSchedule: SleepSchedulePreference;
  studyHabit: StudyHabitPreference;
  socialHabit: SocialHabitPreference;
  smoking: SmokingPreference;
  overnightGuests: OvernightGuestsPreference;
  petPolicy: PetPolicyPreference;
  budgetMax: number; // e.g. 850
  moveInTerm: string; // e.g. "Fall 2027"
  preferredAreas: string[]; // e.g. ["University City North", "College Downs"]
  amenities: string[]; // e.g. ["In-unit Laundry", "Parking"]
}

/**
 * Composite User Profile holding both universal data and dynamic roommate preferences
 */
export interface UserProfile {
  base: BaseUserProfile;
  preferences: RoommatePreferences;
  /** Alias for backward compatibility */
  roommatePreferences?: RoommatePreferences;
}

// ----------------------------------------------------------------------------
// Preset Form Options & Validations
// ----------------------------------------------------------------------------

export const DEGREE_LEVEL_OPTIONS: DegreeLevel[] = ['Undergraduate', 'Graduate', 'Doctoral'];

export const CONTACT_PREFERENCE_OPTIONS: Array<'email' | 'phone' | 'social'> = [
  'email',
  'phone',
  'social',
];

export const CLEANLINESS_OPTIONS: CleanlinessPreference[] = [
  'Neat & Organized',
  'Moderate',
  'Relaxed',
];

export const SLEEP_SCHEDULE_OPTIONS: SleepSchedulePreference[] = [
  'Early Bird',
  'Night Owl',
  'Flexible',
];

export const STUDY_HABIT_OPTIONS: StudyHabitPreference[] = [
  'Quiet at home',
  'Studies out/on-campus',
];

export const SOCIAL_HABIT_OPTIONS: SocialHabitPreference[] = [
  'Quiet/substance-free',
  'Occasional friends',
  'Social/going out',
];

export const SMOKING_OPTIONS: SmokingPreference[] = [
  'No',
  'Outside only',
  'Yes',
];

export const OVERNIGHT_GUEST_OPTIONS: OvernightGuestsPreference[] = [
  'Rarely/Never',
  'Weekends only',
  'Flexible',
];

export const PET_POLICY_OPTIONS: PetPolicyPreference[] = [
  'No pets',
  'Has pet',
  'Pet friendly',
];

export const AVAILABLE_CAMPUS_AREAS: string[] = [
  'University City North',
  'College Downs',
  'Mallard Creek',
  'Harris Blvd',
  'NoDa / Light Rail',
  'University Terrace',
  'Campus Walk / Barton Creek',
];

export const AVAILABLE_AMENITIES: string[] = [
  'In-unit Laundry',
  'Parking',
  'Private Bathroom',
  'Furnished',
  'Utilities Included',
  'Gym / Pool',
  'Pet Friendly Complex',
  'High-speed Internet',
];

// ----------------------------------------------------------------------------
// Default Clean Fallbacks (Zero hardcoded mock student identities)
// ----------------------------------------------------------------------------

export const DEFAULT_BASE_USER_PROFILE: BaseUserProfile = {
  displayName: '',
  campusEmail: '',
  major: '',
  gradYear: '',
  degreeLevel: 'Undergraduate',
  genderIdentity: '',
  bio: '',
  contact: {
    preferred: 'email',
    phone: '',
    socialHandle: '',
  },
};

export const DEFAULT_ROOMMATE_PREFERENCES: RoommatePreferences = {
  isSeekingRoommate: false,
  cleanliness: 'Moderate',
  sleepSchedule: 'Flexible',
  studyHabit: 'Quiet at home',
  socialHabit: 'Occasional friends',
  smoking: 'No',
  overnightGuests: 'Weekends only',
  petPolicy: 'Pet friendly',
  budgetMax: 850,
  moveInTerm: 'Fall 2027',
  preferredAreas: ['University City North', 'College Downs'],
  amenities: ['In-unit Laundry', 'Parking'],
};

export const USER_PROFILE_STORAGE_KEY = 'universe_user_profile';

// ----------------------------------------------------------------------------
// Local Storage Persistence & Hydration Helpers
// ----------------------------------------------------------------------------

/**
 * Loads the user profile from local storage, merging with authenticated user context
 * or clean fallback defaults. Never throws and never uses hardcoded dummy values.
 */
export function loadUserProfile(currentUser?: any): UserProfile {
  let saved: any = null;

  if (typeof localStorage !== 'undefined') {
    try {
      const raw = localStorage.getItem(USER_PROFILE_STORAGE_KEY);
      if (raw) {
        saved = JSON.parse(raw);
      }
    } catch (e) {
      console.warn('[UniVerse Profile] Failed to parse profile from localStorage:', e);
    }
  }

  // Pre-fill student identification from currentUser if available
  const fallbackEmail = currentUser?.email || '';
  const fallbackName = currentUser?.fullName || currentUser?.display_name || '';

  // Extract base student attributes (handling nested `base` or flat legacy structure)
  const base: BaseUserProfile = {
    displayName:
      saved?.base?.displayName ??
      saved?.displayName ??
      saved?.fullName ??
      fallbackName,
    campusEmail:
      saved?.base?.campusEmail ??
      saved?.campusEmail ??
      saved?.email ??
      fallbackEmail,
    major: saved?.base?.major ?? saved?.major ?? '',
    gradYear:
      saved?.base?.gradYear ??
      saved?.gradYear ??
      saved?.graduationYear ??
      saved?.graduation_year ??
      '',
    degreeLevel:
      saved?.base?.degreeLevel ??
      saved?.degreeLevel ??
      DEFAULT_BASE_USER_PROFILE.degreeLevel,
    genderIdentity:
      saved?.base?.genderIdentity ??
      saved?.genderIdentity ??
      '',
    bio: saved?.base?.bio ?? saved?.bio ?? '',
    contact: {
      preferred:
        saved?.base?.contact?.preferred ??
        saved?.contact?.preferred ??
        DEFAULT_BASE_USER_PROFILE.contact.preferred,
      phone:
        saved?.base?.contact?.phone ??
        saved?.contact?.phone ??
        '',
      socialHandle:
        saved?.base?.contact?.socialHandle ??
        saved?.contact?.socialHandle ??
        '',
    },
  };

  // Extract roommate preferences (handling nested `preferences` or flat legacy structure)
  const rawPrefs = saved?.preferences ?? saved?.roommatePreferences ?? saved;

  const preferences: RoommatePreferences = {
    isSeekingRoommate:
      typeof rawPrefs?.isSeekingRoommate === 'boolean'
        ? rawPrefs.isSeekingRoommate
        : DEFAULT_ROOMMATE_PREFERENCES.isSeekingRoommate,
    cleanliness:
      rawPrefs?.cleanliness ?? DEFAULT_ROOMMATE_PREFERENCES.cleanliness,
    sleepSchedule:
      rawPrefs?.sleepSchedule ?? DEFAULT_ROOMMATE_PREFERENCES.sleepSchedule,
    studyHabit:
      rawPrefs?.studyHabit ?? DEFAULT_ROOMMATE_PREFERENCES.studyHabit,
    socialHabit:
      rawPrefs?.socialHabit ?? DEFAULT_ROOMMATE_PREFERENCES.socialHabit,
    smoking:
      rawPrefs?.smoking ?? DEFAULT_ROOMMATE_PREFERENCES.smoking,
    overnightGuests:
      rawPrefs?.overnightGuests ?? DEFAULT_ROOMMATE_PREFERENCES.overnightGuests,
    petPolicy:
      rawPrefs?.petPolicy ?? DEFAULT_ROOMMATE_PREFERENCES.petPolicy,
    budgetMax:
      typeof rawPrefs?.budgetMax === 'number'
        ? rawPrefs.budgetMax
        : parseInt(rawPrefs?.budgetMax, 10) || DEFAULT_ROOMMATE_PREFERENCES.budgetMax,
    moveInTerm:
      rawPrefs?.moveInTerm ?? DEFAULT_ROOMMATE_PREFERENCES.moveInTerm,
    preferredAreas: Array.isArray(rawPrefs?.preferredAreas)
      ? rawPrefs.preferredAreas
      : [...DEFAULT_ROOMMATE_PREFERENCES.preferredAreas],
    amenities: Array.isArray(rawPrefs?.amenities)
      ? rawPrefs.amenities
      : [...DEFAULT_ROOMMATE_PREFERENCES.amenities],
  };

  return {
    base,
    preferences,
    get roommatePreferences() {
      return this.preferences;
    },
  };
}

/**
 * Persists the user profile to local storage and dispatches a cross-component event.
 */
export function saveUserProfile(profile: UserProfile): void {
  if (typeof localStorage === 'undefined') return;

  const payload = {
    base: profile.base,
    preferences: profile.preferences,
    updatedAt: new Date().toISOString(),
  };

  try {
    localStorage.setItem(USER_PROFILE_STORAGE_KEY, JSON.stringify(payload));
  } catch (err) {
    console.error('[UniVerse Profile] Failed to save profile to localStorage:', err);
  }

  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('universe_profile_saved', { detail: payload })
    );
    window.dispatchEvent(
      new CustomEvent('profileUpdated', { detail: payload })
    );
  }
}

/**
 * Utility to map UI Cleanliness to database string keys
 */
export function mapCleanlinessToDb(val: CleanlinessPreference | string): string {
  switch (val) {
    case 'Neat & Organized':
    case 'neat':
      return 'neat';
    case 'Moderate':
    case 'moderate':
      return 'moderate';
    case 'Relaxed':
    case 'relaxed':
      return 'relaxed';
    default:
      return 'moderate';
  }
}

/**
 * Utility to map UI Sleep Schedule to database string keys
 */
export function mapSleepScheduleToDb(val: SleepSchedulePreference | string): string {
  switch (val) {
    case 'Early Bird':
    case 'early_bird':
      return 'early_bird';
    case 'Night Owl':
    case 'night_owl':
      return 'night_owl';
    case 'Flexible':
    case 'flexible':
      return 'flexible';
    default:
      return 'flexible';
  }
}
