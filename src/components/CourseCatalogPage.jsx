import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import './CourseCatalogPage.css';
import {
  mockDepartments,
  mockCourses,
  mockMajors,
  mockMinors,
  getPrerequisiteCourses,
  getUnlockedCourses,
  getCoursesForMajor,
  getCoursesForMinor,
} from '../data/mockCourseData';

// ============================================================================
// Skeleton API Layer
// Replace the mock implementations below with real fetch/React Query calls
// once the CourseDB API is available.
//
// Expected endpoints (align with courseDB.ts / coursePlanDB.ts schema):
//   GET  /api/departments                               → Department[]
//   GET  /api/courses?department=&level=&credits=&q=    → Course[]  (paginated)
//   GET  /api/courses/:course_id/prerequisites          → Course[]
//   GET  /api/majors                                    → Major[]
//   GET  /api/majors/:major_id/courses                  → Course[]
//   GET  /api/minors                                    → Minor[]
//   GET  /api/minors/:minor_id/courses                  → Course[]
//   GET  /api/plan?user_id=                             → CoursePlanEntry[]
//   POST /api/plan                                      → CoursePlanEntry   (save entry)
//   PUT  /api/plan/:entry_id                            → CoursePlanEntry   (move entry)
//   DELETE /api/plan/:entry_id                          → { success: true }
// ============================================================================

/** @typedef {{ alpha_code: string, department_name: string }} Department */
/** @typedef {{ course_id: string, alpha_code: string, numeric_code: string, title: string, description: string|null, credit_hours: number }} Course */

/**
 * Fetches departments from the CourseDB API.
 * @returns {Promise<Department[]>}
 */
async function apiFetchDepartments() {
  // TODO: replace with real API call:
  // const res = await fetch('/api/departments');
  // if (!res.ok) throw new Error('Failed to fetch departments');
  // return res.json();
  return new Promise((resolve) => setTimeout(() => resolve(mockDepartments), 400));
}

/**
 * Fetches courses from the CourseDB API, applying server-side filters.
 * Mirrors: db.selectFrom('courses').where(...) in courseDB.ts
 *
 * @param {{ department?: string, level?: string, credits?: string, q?: string }} params
 * @returns {Promise<Course[]>}
 */
async function apiFetchCourses(params = {}) {
  // TODO: replace with real API call:
  // const url = new URL('/api/courses', window.location.origin);
  // Object.entries(params).forEach(([k, v]) => v && url.searchParams.set(k, v));
  // const res = await fetch(url);
  // if (!res.ok) throw new Error('Failed to fetch courses');
  // return res.json();
  return new Promise((resolve) =>
    setTimeout(() => {
      let results = [...mockCourses];
      if (params.department && params.department !== 'ALL') {
        results = results.filter((c) => c.alpha_code === params.department);
      }
      if (params.level && params.level !== 'ALL') {
        results = results.filter((c) => c.numeric_code.charAt(0) === params.level.charAt(0));
      }
      if (params.credits && params.credits !== 'ALL') {
        results = results.filter((c) => c.credit_hours === parseInt(params.credits, 10));
      }
      if (params.q && params.q.trim() !== '') {
        const q = params.q.toLowerCase();
        results = results.filter((c) => {
          const code = `${c.alpha_code} ${c.numeric_code}`.toLowerCase();
          return (
            code.includes(q) ||
            c.title.toLowerCase().includes(q) ||
            (c.description || '').toLowerCase().includes(q)
          );
        });
      }
      resolve(results);
    }, 350)
  );
}

/**
 * Fetches prerequisite courses for a given course_id.
 * Mirrors: prerequisites table join in courseDB.ts
 *
 * @param {string} courseId
 * @returns {Promise<Course[]>}
 */
async function apiFetchPrerequisites(courseId) {
  // TODO: replace with real API call:
  // const res = await fetch(`/api/courses/${courseId}/prerequisites`);
  // return res.json();
  return new Promise((resolve) =>
    setTimeout(() => resolve(getPrerequisiteCourses(courseId)), 200)
  );
}

/**
 * Fetches majors with their required courses from the CourseDB API.
 * Mirrors: major_requirements join in courseDB.ts
 * @returns {Promise<Array<{ major: object, courses: Course[] }>>}
 */
async function apiFetchMajorsWithCourses() {
  // TODO: replace with real API call:
  // const majors = await fetch('/api/majors').then(r => r.json());
  // const withCourses = await Promise.all(majors.map(async (m) => ({
  //   major: m,
  //   courses: await fetch(`/api/majors/${m.major_id}/courses`).then(r => r.json()),
  // })));
  // return withCourses;
  return new Promise((resolve) =>
    setTimeout(
      () =>
        resolve(
          mockMajors.map((m) => ({ major: m, courses: getCoursesForMajor(m.major_id) }))
        ),
      450
    )
  );
}

/**
 * Fetches minors with their required courses from the CourseDB API.
 * @returns {Promise<Array<{ minor: object, courses: Course[] }>>}
 */
async function apiFetchMinorsWithCourses() {
  // TODO: replace with real API call:
  // const minors = await fetch('/api/minors').then(r => r.json());
  // const withCourses = await Promise.all(minors.map(async (m) => ({
  //   minor: m,
  //   courses: await fetch(`/api/minors/${m.minor_id}/courses`).then(r => r.json()),
  // })));
  // return withCourses;
  return new Promise((resolve) =>
    setTimeout(
      () =>
        resolve(
          mockMinors.map((m) => ({ minor: m, courses: getCoursesForMinor(m.minor_id) }))
        ),
      450
    )
  );
}

/**
 * Fetches saved course plan entries for the current user.
 * Mirrors: course_plan_entries table in coursePlanDB.ts
 *
 * @param {number} userId
 * @returns {Promise<import('../database/coursePlanDB').CoursePlanEntry[]>}
 */
async function apiFetchPlan(userId) {
  // TODO: replace with real API call:
  // const res = await fetch(`/api/plan?user_id=${userId}`);
  // if (!res.ok) throw new Error('Failed to load plan');
  // return res.json();
  return new Promise((resolve) => setTimeout(() => resolve([]), 300));
}

/**
 * Saves a course plan entry (adds course to a semester slot or the unassigned bucket).
 * Mirrors: INSERT INTO course_plan_entries in coursePlanDB.ts
 *
 * @param {{ user_id: number, course_id: string, plan_year: number, plan_semester: string, notes?: string|null }} entry
 * @returns {Promise<import('../database/coursePlanDB').CoursePlanEntry>}
 */
async function apiSavePlanEntry(entry) {
  // TODO: replace with real API call:
  // const res = await fetch('/api/plan', {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify(entry),
  // });
  // if (!res.ok) throw new Error('Failed to save plan entry');
  // return res.json();
  return new Promise((resolve) =>
    setTimeout(
      () => resolve({ ...entry, entry_id: Date.now(), created_at: new Date().toISOString() }),
      250
    )
  );
}

/**
 * Moves a course plan entry to a different year/semester slot (or back to unassigned).
 * Mirrors: UPDATE course_plan_entries SET plan_year, plan_semester in coursePlanDB.ts
 *
 * @param {number} entryId
 * @param {{ plan_year: number, plan_semester: string }} update
 * @returns {Promise<import('../database/coursePlanDB').CoursePlanEntry>}
 */
async function apiMovePlanEntry(entryId, update) {
  // TODO: replace with real API call:
  // const res = await fetch(`/api/plan/${entryId}`, {
  //   method: 'PUT',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify(update),
  // });
  // if (!res.ok) throw new Error('Failed to move plan entry');
  // return res.json();
  return new Promise((resolve) =>
    setTimeout(() => resolve({ entry_id: entryId, ...update }), 200)
  );
}

/**
 * Removes a course plan entry entirely.
 * Mirrors: DELETE FROM course_plan_entries in coursePlanDB.ts
 *
 * @param {number} entryId
 * @returns {Promise<void>}
 */
async function apiDeletePlanEntry(entryId) {
  // TODO: replace with real API call:
  // const res = await fetch(`/api/plan/${entryId}`, { method: 'DELETE' });
  // if (!res.ok) throw new Error('Failed to delete plan entry');
  return new Promise((resolve) => setTimeout(resolve, 150));
}

// ============================================================================
// Custom hook: debounce
// ============================================================================
function useDebounce(value, delay) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

// ============================================================================
// Sub-component: SkeletonRows — loading placeholder rows
// ============================================================================
function SkeletonRows({ count = 6 }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="course-list-row course-list-row--skeleton" aria-hidden="true">
          <div className="skeleton-cell skeleton-code" />
          <div className="skeleton-cell skeleton-title" />
          <div className="skeleton-cell skeleton-dept" />
          <div className="skeleton-cell skeleton-credits" />
          <div className="skeleton-cell skeleton-prereq" />
        </div>
      ))}
    </>
  );
}

// ============================================================================
// Sub-component: CourseListRow — single expandable course row
// ============================================================================
function CourseListRow({ course, isInPlan, onAddToPlan }) {
  const [expanded, setExpanded] = useState(false);
  const [prereqs, setPrereqs] = useState(null); // null = not yet fetched
  const [loadingPrereqs, setLoadingPrereqs] = useState(false);
  const detailRef = useRef(null);

  const handleExpand = useCallback(async () => {
    const next = !expanded;
    setExpanded(next);
    if (next && prereqs === null) {
      setLoadingPrereqs(true);
      try {
        const data = await apiFetchPrerequisites(course.course_id);
        setPrereqs(data);
      } finally {
        setLoadingPrereqs(false);
      }
    }
  }, [expanded, prereqs, course.course_id]);

  return (
    <article className={`course-list-row ${expanded ? 'course-list-row--expanded' : ''}`}>
      {/* Collapsed summary row */}
      <button
        type="button"
        className="course-row-summary"
        onClick={handleExpand}
        aria-expanded={expanded}
        aria-controls={`course-detail-${course.course_id}`}
      >
        <span className="course-row-code">
          <span className="course-code-badge">
            {course.alpha_code} {course.numeric_code}
          </span>
        </span>
        <span className="course-row-title">{course.title}</span>
        <span className="course-row-dept">{course.alpha_code}</span>
        <span className="course-row-credits">{course.credit_hours} cr</span>
        <span className="course-row-chevron" aria-hidden="true">
          {expanded ? '▲' : '▼'}
        </span>
      </button>

      {/* Expanded detail panel */}
      {expanded && (
        <div
          id={`course-detail-${course.course_id}`}
          className="course-row-detail"
          ref={detailRef}
        >
          <p className="course-detail-desc">{course.description}</p>

          <div className="course-detail-meta">
            <div className="course-detail-meta-item">
              <span className="course-meta-label">Credit Hours</span>
              <span>{course.credit_hours}</span>
            </div>
            <div className="course-detail-meta-item">
              <span className="course-meta-label">Department</span>
              <span>{course.alpha_code}</span>
            </div>
            <div className="course-detail-meta-item">
              <span className="course-meta-label">Course Code</span>
              <span>{course.numeric_code}</span>
            </div>
          </div>

          <div className="course-detail-prereqs">
            <span className="course-meta-label">Prerequisites</span>
            {loadingPrereqs ? (
              <div className="prereq-loading">Loading prerequisites…</div>
            ) : prereqs === null ? null : prereqs.length === 0 ? (
              <span className="course-none-tag">None — open to all eligible undergraduates</span>
            ) : (
              <div className="course-tag-group">
                {prereqs.map((pr) => (
                  <span key={pr.course_id} className="course-prereq-tag">
                    {pr.alpha_code} {pr.numeric_code}: {pr.title}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="course-detail-actions">
            <button
              type="button"
              className={isInPlan ? 'btn-secondary btn--active' : 'btn-primary'}
              onClick={() => !isInPlan && onAddToPlan(course)}
              aria-disabled={isInPlan}
            >
              {isInPlan ? 'Added to Plan' : 'Add to Plan'}
            </button>
          </div>
        </div>
      )}
    </article>
  );
}

// ============================================================================
// Sub-component: CourseListHeader — sortable column header row
// ============================================================================
function CourseListHeader() {
  return (
    <div className="course-list-header" aria-hidden="true">
      <span className="course-row-code">Code</span>
      <span className="course-row-title">Title</span>
      <span className="course-row-dept">Dept</span>
      <span className="course-row-credits">Credits</span>
      <span className="course-row-chevron" />
    </div>
  );
}

// ============================================================================
// Main Page Component
// ============================================================================
export default function CourseCatalogPage({
  currentUser,
  onNavigateToLanding,
  onNavigateToRoommates,
  onNavigateToProfile,
  onNavigateToSignIn,
  onLogout,
}) {
  // ---- Tab state ----
  const [activeTab, setActiveTab] = useState('courses');

  // ---- Course filter state ----
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState('ALL');
  const [selectedLevel, setSelectedLevel] = useState('ALL');
  const [selectedCredits, setSelectedCredits] = useState('ALL');
  const debouncedQuery = useDebounce(searchQuery, 280);

  // ---- API data state ----
  const [departments, setDepartments] = useState([]);
  const [courses, setCourses] = useState([]);
  const [majorsData, setMajorsData] = useState([]);
  const [minorsData, setMinorsData] = useState([]);
  const [loadingDepts, setLoadingDepts] = useState(false);
  const [loadingCourses, setLoadingCourses] = useState(false);
  const [loadingMajors, setLoadingMajors] = useState(false);
  const [loadingMinors, setLoadingMinors] = useState(false);
  const [courseError, setCourseError] = useState(null);

  // ---- Saved Plan state ----
  // planEntries shape: { entry_id, course_id, plan_year, plan_semester, notes }
  // plan_year=0 / plan_semester='unassigned' represents the unassigned bucket.
  const [planEntries, setPlanEntries] = useState([]);
  const [planYears, setPlanYears] = useState(4);       // user can extend beyond 4
  const [planLoading, setPlanLoading] = useState(false);
  const [loginPromptCourse, setLoginPromptCourse] = useState(null); // course awaiting auth

  // Load departments once on mount
  useEffect(() => {
    setLoadingDepts(true);
    apiFetchDepartments()
      .then(setDepartments)
      .finally(() => setLoadingDepts(false));
  }, []);

  // Load courses whenever filters change (debounced query)
  useEffect(() => {
    if (activeTab !== 'courses') return;
    setLoadingCourses(true);
    setCourseError(null);
    apiFetchCourses({
      department: selectedDept,
      level: selectedLevel,
      credits: selectedCredits,
      q: debouncedQuery,
    })
      .then(setCourses)
      .catch((err) => setCourseError(err.message))
      .finally(() => setLoadingCourses(false));
  }, [activeTab, selectedDept, selectedLevel, selectedCredits, debouncedQuery]);

  // Load majors when that tab becomes active
  useEffect(() => {
    if (activeTab !== 'majors' || majorsData.length > 0) return;
    setLoadingMajors(true);
    apiFetchMajorsWithCourses()
      .then(setMajorsData)
      .finally(() => setLoadingMajors(false));
  }, [activeTab, majorsData.length]);

  // Load minors when that tab becomes active
  useEffect(() => {
    if (activeTab !== 'minors' || minorsData.length > 0) return;
    setLoadingMinors(true);
    apiFetchMinorsWithCourses()
      .then(setMinorsData)
      .finally(() => setLoadingMinors(false));
  }, [activeTab, minorsData.length]);

  // Load saved plan when that tab becomes active (requires login)
  useEffect(() => {
    if (activeTab !== 'plans' || !currentUser) return;
    setPlanLoading(true);
    apiFetchPlan(currentUser.user_id ?? currentUser.id)
      .then(setPlanEntries)
      .finally(() => setPlanLoading(false));
  }, [activeTab, currentUser]);

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedDept('ALL');
    setSelectedLevel('ALL');
    setSelectedCredits('ALL');
  };

  /**
   * Called from the course list "Add to Plan" button.
   * If not logged in, shows the login prompt; otherwise adds to unassigned bucket.
   */
  const handleAddToPlan = useCallback(
    (course) => {
      if (!currentUser) {
        setLoginPromptCourse(course);
        return;
      }
      // Check for duplicate
      if (planEntries.some((e) => e.course_id === course.course_id)) return;
      const optimistic = {
        entry_id: `tmp-${Date.now()}`,
        user_id: currentUser.user_id ?? currentUser.id,
        course_id: course.course_id,
        plan_year: 0,
        plan_semester: 'unassigned',
        notes: null,
        _course: course,  // local denormalized ref for display
      };
      setPlanEntries((prev) => [...prev, optimistic]);
      apiSavePlanEntry({
        user_id: optimistic.user_id,
        course_id: course.course_id,
        plan_year: 0,
        plan_semester: 'unassigned',
        notes: null,
      }).then((saved) => {
        setPlanEntries((prev) =>
          prev.map((e) => (e.entry_id === optimistic.entry_id ? { ...saved, _course: course } : e))
        );
      });
      // Switch to plans tab so user can see the result
      setActiveTab('plans');
    },
    [currentUser, planEntries]
  );

  /**
   * Move a plan entry to a different year/semester (or back to unassigned).
   */
  const handleMovePlanEntry = useCallback((entryId, plan_year, plan_semester) => {
    setPlanEntries((prev) =>
      prev.map((e) => (e.entry_id === entryId ? { ...e, plan_year, plan_semester } : e))
    );
    apiMovePlanEntry(entryId, { plan_year, plan_semester });
  }, []);

  /**
   * Remove a course from the plan entirely.
   */
  const handleRemovePlanEntry = useCallback((entryId) => {
    setPlanEntries((prev) => prev.filter((e) => e.entry_id !== entryId));
    apiDeletePlanEntry(entryId);
  }, []);

  // Credit hour options derived from loaded courses
  const creditOptions = useMemo(() => {
    const unique = [...new Set(mockCourses.map((c) => c.credit_hours))].sort((a, b) => a - b);
    return unique;
  }, []);

  const activeFiltersCount = [
    selectedDept !== 'ALL',
    selectedLevel !== 'ALL',
    selectedCredits !== 'ALL',
    searchQuery.trim() !== '',
  ].filter(Boolean).length;

  // Courses lookup map for plan display (merge API list + mock fallback)
  const courseMap = useMemo(() => {
    const map = {};
    mockCourses.forEach((c) => { map[c.course_id] = c; });
    courses.forEach((c) => { map[c.course_id] = c; });
    return map;
  }, [courses]);

  return (
    <div className="catalog-page">
      {/* ---- Top Navigation Header ---- */}
      <header className="catalog-header">
        <div className="catalog-header-left">
          <button
            type="button"
            className="catalog-header-brand"
            onClick={onNavigateToLanding}
            title="Go to UniVerse Home"
          >
            UniVerse
          </button>
          <button type="button" className="catalog-back-btn" onClick={onNavigateToLanding}>
            &larr; Back to Home
          </button>
        </div>

        <nav className="catalog-header-nav" aria-label="Catalog Navigation">
          <button
            type="button"
            className="catalog-nav-link active"
            onClick={() => setActiveTab('courses')}
          >
            Course Catalog
          </button>
          <button type="button" className="catalog-nav-link" onClick={onNavigateToRoommates}>
            Roommate Finder
          </button>
          {currentUser ? (
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <button
                type="button"
                className="catalog-header-profile-btn"
                onClick={onNavigateToProfile}
              >
                {currentUser.fullName || currentUser.email}
              </button>
              {onLogout && (
                <button type="button" className="catalog-back-btn" onClick={onLogout}>
                  Sign Out
                </button>
              )}
            </div>
          ) : (
            <button
              type="button"
              className="catalog-header-profile-btn"
              onClick={onNavigateToSignIn}
            >
              Sign In
            </button>
          )}
        </nav>
      </header>

      {/* ---- Hero Banner ---- */}
      <section className="catalog-banner">
        <div className="catalog-banner-inner">
          <span className="catalog-badge-institution">UNC Charlotte Academic Registry</span>
          <h1>Course Catalog &amp; Degree Pathways</h1>
          <p>
            Explore academic departments, course prerequisites, and official degree requirements
            modeled from the UniVerse course database. Plan ahead for upcoming semesters.
          </p>
        </div>
      </section>

      {/* ---- Tabs Bar ---- */}
      <nav className="catalog-tabs-bar" aria-label="Course Catalog Views">
        <div className="catalog-tabs-inner">
          <button
            type="button"
            className={`catalog-tab-btn ${activeTab === 'courses' ? 'active' : ''}`}
            onClick={() => setActiveTab('courses')}
          >
            All Courses
            {courses.length > 0 && (
              <span className="tab-count">{courses.length}</span>
            )}
          </button>
          <button
            type="button"
            className={`catalog-tab-btn ${activeTab === 'majors' ? 'active' : ''}`}
            onClick={() => setActiveTab('majors')}
          >
            Majors &amp; Requirements
            <span className="tab-count">{mockMajors.length}</span>
          </button>
          <button
            type="button"
            className={`catalog-tab-btn ${activeTab === 'minors' ? 'active' : ''}`}
            onClick={() => setActiveTab('minors')}
          >
            Minors
            <span className="tab-count">{mockMinors.length}</span>
          </button>
          <button
            type="button"
            className={`catalog-tab-btn ${activeTab === 'plans' ? 'active' : ''}`}
            onClick={() => setActiveTab('plans')}
          >
            Saved Plans
            {planEntries.length > 0 && (
              <span className="tab-count">{planEntries.length}</span>
            )}
          </button>
        </div>
      </nav>

      {/* ---- Main Content ---- */}
      <main className="catalog-content">
        {/* API integration note */}
        <aside className="catalog-integration-banner" aria-label="Developer Architecture Note">
          <strong>Architecture Planning:</strong> This skeleton calls stub API functions that
          mirror <code>courseDB.ts</code> entities: <code>departments</code>,{' '}
          <code>courses</code>, <code>majors</code>, <code>minors</code>,{' '}
          <code>prerequisites</code>, <code>major_requirements</code>. Replace stub functions
          at the top of this file with real <code>fetch</code> calls once the backend is live.
        </aside>

        {/* ================================================================
            VIEW 1: ALL COURSES — filterable, expandable list
            ================================================================ */}
        {activeTab === 'courses' && (
          <section aria-label="Course Search and List">
            {/* Search & filter bar */}
            <div className="catalog-filter-card">
              <div className="catalog-filter-row">
                {/* Full-text search */}
                <div className="catalog-search-wrap">
                  <label htmlFor="course-search-input" className="sr-only">
                    Search courses
                  </label>
                  <span className="search-icon" aria-hidden="true">&#128269;</span>
                  <input
                    id="course-search-input"
                    type="search"
                    className="catalog-search-input"
                    placeholder="Search by code, title, or keyword…"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    autoComplete="off"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      className="search-clear-btn"
                      onClick={() => setSearchQuery('')}
                      aria-label="Clear search"
                    >
                      &times;
                    </button>
                  )}
                </div>

                {/* Department filter */}
                <div className="catalog-field catalog-field--inline">
                  <label htmlFor="dept-select">Department</label>
                  <select
                    id="dept-select"
                    value={selectedDept}
                    onChange={(e) => setSelectedDept(e.target.value)}
                    disabled={loadingDepts}
                  >
                    <option value="ALL">All Departments</option>
                    {departments.map((dept) => (
                      <option key={dept.alpha_code} value={dept.alpha_code}>
                        {dept.alpha_code} &ndash; {dept.department_name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Level filter */}
                <div className="catalog-field catalog-field--inline">
                  <label htmlFor="level-select">Level</label>
                  <select
                    id="level-select"
                    value={selectedLevel}
                    onChange={(e) => setSelectedLevel(e.target.value)}
                  >
                    <option value="ALL">All Levels</option>
                    <option value="1000">1000 — Introductory</option>
                    <option value="2000">2000 — Intermediate</option>
                    <option value="3000">3000 — Advanced</option>
                    <option value="4000">4000 — Senior / Capstone</option>
                  </select>
                </div>

                {/* Credit hours filter */}
                <div className="catalog-field catalog-field--inline">
                  <label htmlFor="credits-select">Credits</label>
                  <select
                    id="credits-select"
                    value={selectedCredits}
                    onChange={(e) => setSelectedCredits(e.target.value)}
                  >
                    <option value="ALL">Any Credits</option>
                    {creditOptions.map((cr) => (
                      <option key={cr} value={String(cr)}>
                        {cr} Credit{cr !== 1 ? 's' : ''}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Reset */}
                {activeFiltersCount > 0 && (
                  <button type="button" className="catalog-reset-btn" onClick={handleResetFilters}>
                    Clear{activeFiltersCount > 0 ? ` (${activeFiltersCount})` : ''}
                  </button>
                )}
              </div>

              {/* Results status bar */}
              <div className="catalog-results-status">
                {loadingCourses ? (
                  <span className="status-loading">Fetching courses…</span>
                ) : courseError ? (
                  <span className="status-error">Error: {courseError}</span>
                ) : (
                  <span>
                    Showing <strong>{courses.length}</strong> course
                    {courses.length !== 1 ? 's' : ''}
                    {activeFiltersCount > 0 && ' matching current filters'}
                  </span>
                )}
                <span>
                  In plan: <strong>{planEntries.length}</strong>
                </span>
              </div>
            </div>

            {/* Course list */}
            <div className="course-list" role="list">
              {loadingCourses ? (
                <>
                  <CourseListHeader />
                  <SkeletonRows count={8} />
                </>
              ) : courseError ? (
                <div className="course-list-empty">
                  <p>Could not load courses. Please try again.</p>
                  <button
                    type="button"
                    className="btn-primary"
                    onClick={() => setSelectedDept(selectedDept)}
                  >
                    Retry
                  </button>
                </div>
              ) : courses.length === 0 ? (
                <div className="course-list-empty">
                  <p>No courses match your filters.</p>
                  <button type="button" className="btn-secondary" onClick={handleResetFilters}>
                    Clear Filters
                  </button>
                </div>
              ) : (
                <>
                  <CourseListHeader />
                  {courses.map((course) => (
                    <CourseListRow
                      key={course.course_id}
                      course={course}
                      isInPlan={planEntries.some((e) => e.course_id === course.course_id)}
                      onAddToPlan={handleAddToPlan}
                    />
                  ))}
                </>
              )}
            </div>
          </section>
        )}

        {/* ================================================================
            VIEW 2: MAJORS & DEGREE REQUIREMENTS
            ================================================================ */}
        {activeTab === 'majors' && (
          <section aria-label="Majors and Degree Requirements">
            <p style={{ color: 'var(--text-secondary)', marginBottom: '20px' }}>
              Academic major specifications defined in the UniVerse schema. Expand a degree to
              inspect all required courses, credit totals, and prerequisite chains.
            </p>

            {loadingMajors ? (
              <div className="course-list">
                <SkeletonRows count={4} />
              </div>
            ) : (
              majorsData.map(({ major, courses: reqCourses }) => {
                const totalCredits = reqCourses.reduce((sum, c) => sum + c.credit_hours, 0);
                return (
                  <article key={major.major_id} className="major-card">
                    <div className="major-card-header">
                      <div className="major-title-block">
                        <h3>{major.title}</h3>
                        <div className="major-subtitle">
                          Department: {major.alpha_code} &bull; Degree: {major.type}
                        </div>
                      </div>
                      <span className="degree-type-badge">{major.type} Degree</span>
                    </div>

                    <p className="major-desc">{major.description}</p>

                    <h4 style={{ color: 'var(--niner-green)', marginBottom: '8px' }}>
                      Required Core Courses ({reqCourses.length} courses &bull; {totalCredits}{' '}
                      credit hours)
                    </h4>

                    <div className="requirements-table-wrap">
                      <table className="catalog-table">
                        <thead>
                          <tr>
                            <th>Course Code</th>
                            <th>Title</th>
                            <th>Credits</th>
                            <th>Prerequisites</th>
                            <th>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {reqCourses.map((rc) => {
                            const prereqs = getPrerequisiteCourses(rc.course_id);
                            return (
                              <tr key={rc.course_id}>
                                <td>
                                  <strong>
                                    {rc.alpha_code} {rc.numeric_code}
                                  </strong>
                                </td>
                                <td>{rc.title}</td>
                                <td>{rc.credit_hours} hrs</td>
                                <td>
                                  {prereqs.length > 0 ? (
                                    prereqs.map((p) => (
                                      <span
                                        key={p.course_id}
                                        className="course-prereq-tag"
                                        style={{ marginRight: '4px' }}
                                      >
                                        {p.alpha_code} {p.numeric_code}
                                      </span>
                                    ))
                                  ) : (
                                    <span style={{ color: 'var(--text-muted)' }}>None</span>
                                  )}
                                </td>
                                <td>
                                  <span className="course-major-tag">Degree Core</span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </article>
                );
              })
            )}
          </section>
        )}

        {/* ================================================================
            VIEW 3: MINORS — expandable list
            ================================================================ */}
        {activeTab === 'minors' && (
          <section aria-label="Academic Minors">
            <p style={{ color: 'var(--text-secondary)', marginBottom: '20px' }}>
              Academic minor curriculum requirements. Designed for complementary domain study.
            </p>

            {loadingMinors ? (
              <div className="course-list">
                <SkeletonRows count={3} />
              </div>
            ) : (
              <div className="course-list">
                {minorsData.map(({ minor, courses: reqCourses }) => {
                  const totalCredits = reqCourses.reduce((sum, c) => sum + c.credit_hours, 0);
                  return (
                    <MinorRow
                      key={minor.minor_id}
                      minor={minor}
                      reqCourses={reqCourses}
                      totalCredits={totalCredits}
                    />
                  );
                })}
              </div>
            )}
          </section>
        )}

        {/* ================================================================
            VIEW 4: SAVED PLANS
            ================================================================ */}
        {activeTab === 'plans' && (
          <SavedPlansView
            currentUser={currentUser}
            planEntries={planEntries}
            planYears={planYears}
            setPlanYears={setPlanYears}
            planLoading={planLoading}
            courseMap={courseMap}
            onMove={handleMovePlanEntry}
            onRemove={handleRemovePlanEntry}
            onNavigateToSignIn={onNavigateToSignIn}
            loginPromptCourse={loginPromptCourse}
            onDismissLoginPrompt={() => setLoginPromptCourse(null)}
          />
        )}
      </main>

      {/* ---- Login Prompt Modal (triggered from course list when not signed in) ---- */}
      {loginPromptCourse && !currentUser && (
        <LoginPromptModal
          course={loginPromptCourse}
          onSignIn={() => { setLoginPromptCourse(null); onNavigateToSignIn?.(); }}
          onDismiss={() => setLoginPromptCourse(null)}
        />
      )}

      {/* ---- Footer ---- */}
      <footer>
        <p>&copy; 2026 UniVerse. Academic course data aligned with UNC Charlotte requirements.</p>
      </footer>
    </div>
  );
}

// ============================================================================
// Sub-component: MinorRow — expandable minor entry
// ============================================================================
function MinorRow({ minor, reqCourses, totalCredits }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <article className={`course-list-row ${expanded ? 'course-list-row--expanded' : ''}`}>
      <button
        type="button"
        className="course-row-summary"
        onClick={() => setExpanded((p) => !p)}
        aria-expanded={expanded}
        aria-controls={`minor-detail-${minor.minor_id}`}
      >
        <span className="course-row-code">
          <span className="course-code-badge">{minor.alpha_code}</span>
        </span>
        <span className="course-row-title">{minor.title} Minor</span>
        <span className="course-row-dept">{minor.alpha_code}</span>
        <span className="course-row-credits">{totalCredits} cr total</span>
        <span className="course-row-chevron" aria-hidden="true">
          {expanded ? '▲' : '▼'}
        </span>
      </button>

      {expanded && (
        <div id={`minor-detail-${minor.minor_id}`} className="course-row-detail">
          <p className="course-detail-desc">{minor.description}</p>
          <div className="course-meta-label" style={{ marginBottom: '8px' }}>
            Required Courses ({reqCourses.length}):
          </div>
          <ul className="minor-course-list">
            {reqCourses.map((rc) => (
              <li key={rc.course_id}>
                <span className="course-prereq-tag">
                  {rc.alpha_code} {rc.numeric_code}
                </span>
                <span className="minor-course-title">{rc.title}</span>
                <span className="course-credits-badge">{rc.credit_hours} cr</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </article>
  );
}


// ============================================================================
// Sub-component: LoginPromptModal
// Shown when a guest tries to add a course to their plan.
// ============================================================================
function LoginPromptModal({ course, onSignIn, onDismiss }) {
  return (
    <div
      className="catalog-modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="login-prompt-title"
      onClick={onDismiss}
    >
      <div className="catalog-modal" onClick={(e) => e.stopPropagation()}>
        <div className="catalog-modal-header">
          <div>
            <h3 id="login-prompt-title" style={{ margin: 0, fontSize: '18px' }}>
              Sign in to save courses
            </h3>
          </div>
          <button
            type="button"
            className="catalog-modal-close-btn"
            onClick={onDismiss}
            aria-label="Close"
          >
            &times;
          </button>
        </div>

        <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: '1.6', margin: '0 0 16px' }}>
          You need an account to save{' '}
          <strong>
            {course.alpha_code} {course.numeric_code}: {course.title}
          </strong>{' '}
          to your course plan. Sign in or create a free account to get started.
        </p>

        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
          <button type="button" className="btn-secondary" onClick={onDismiss}>
            Cancel
          </button>
          <button type="button" className="btn-primary" onClick={onSignIn}>
            Sign In / Create Account
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Sub-component: PlanCourseChip
// A draggable course chip shown inside plan semester slots or the unassigned bucket.
// ============================================================================
const SEMESTERS = ['fall', 'spring', 'summer'];

function PlanCourseChip({ entry, course, onMove, onRemove, planYears }) {
  const [showMover, setShowMover] = useState(false);

  if (!course) return null;

  return (
    <div className="plan-chip">
      <div className="plan-chip-info">
        <span className="course-code-badge plan-chip-badge">
          {course.alpha_code} {course.numeric_code}
        </span>
        <span className="plan-chip-title">{course.title}</span>
        <span className="plan-chip-cr">{course.credit_hours} cr</span>
      </div>
      <div className="plan-chip-actions">
        <button
          type="button"
          className="plan-chip-btn"
          title="Move to semester"
          onClick={() => setShowMover((p) => !p)}
          aria-expanded={showMover}
        >
          Move
        </button>
        <button
          type="button"
          className="plan-chip-btn plan-chip-btn--remove"
          title="Remove from plan"
          onClick={() => onRemove(entry.entry_id)}
          aria-label={`Remove ${course.alpha_code} ${course.numeric_code} from plan`}
        >
          &times;
        </button>
      </div>

      {showMover && (
        <div className="plan-chip-mover" role="menu">
          <div className="plan-chip-mover-label">Move to:</div>
          <button
            type="button"
            role="menuitem"
            className="plan-chip-mover-opt"
            onClick={() => { onMove(entry.entry_id, 0, 'unassigned'); setShowMover(false); }}
          >
            Unassigned
          </button>
          {Array.from({ length: planYears }, (_, yi) =>
            SEMESTERS.map((sem) => (
              <button
                key={`${yi + 1}-${sem}`}
                type="button"
                role="menuitem"
                className="plan-chip-mover-opt"
                onClick={() => { onMove(entry.entry_id, yi + 1, sem); setShowMover(false); }}
              >
                Year {yi + 1} &mdash; {sem.charAt(0).toUpperCase() + sem.slice(1)}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Sub-component: SavedPlansView
// The main Saved Plans tab content.
// ============================================================================
function SavedPlansView({
  currentUser,
  planEntries,
  planYears,
  setPlanYears,
  planLoading,
  courseMap,
  onMove,
  onRemove,
  onNavigateToSignIn,
  loginPromptCourse,
  onDismissLoginPrompt,
}) {
  // If not logged in, show a gate
  if (!currentUser) {
    return (
      <section aria-label="Saved Plans">
        <div className="plan-auth-gate">
          <div className="plan-auth-gate-inner">
            <h2>Sign in to access your course plan</h2>
            <p>
              Save courses, build a multi-year schedule, and track your degree progress — all in one
              place. Your plan is stored securely and synced with your UniVerse account.
            </p>
            <button type="button" className="btn-primary" onClick={onNavigateToSignIn}>
              Sign In / Create Account
            </button>
          </div>
        </div>
      </section>
    );
  }

  if (planLoading) {
    return (
      <section aria-label="Saved Plans">
        <div className="course-list">
          <SkeletonRows count={5} />
        </div>
      </section>
    );
  }

  const unassigned = planEntries.filter((e) => e.plan_year === 0 || e.plan_semester === 'unassigned');
  const scheduled  = planEntries.filter((e) => e.plan_year > 0 && e.plan_semester !== 'unassigned');

  const totalCredits = planEntries.reduce((sum, e) => {
    const c = e._course ?? courseMap[e.course_id];
    return sum + (c?.credit_hours ?? 0);
  }, 0);

  return (
    <section aria-label="Saved Plans">
      {/* Plan header / stats */}
      <div className="plan-header-bar">
        <div>
          <h2 className="plan-title">My Course Plan</h2>
          <p className="plan-subtitle">
            {planEntries.length} course{planEntries.length !== 1 ? 's' : ''} saved &bull;{' '}
            {totalCredits} total credit hours
          </p>
        </div>
        <div className="plan-header-controls">
          <label className="plan-years-label" htmlFor="plan-years-input">
            Years shown:
          </label>
          <input
            id="plan-years-input"
            type="number"
            className="plan-years-input"
            min={4}
            max={8}
            value={planYears}
            onChange={(e) => setPlanYears(Math.max(4, Math.min(8, Number(e.target.value))))}
          />
        </div>
      </div>

      {planEntries.length === 0 && (
        <div className="plan-empty-state">
          <p>Your plan is empty. Browse the <strong>All Courses</strong> tab and click <strong>Add to Plan</strong> on any course to get started.</p>
        </div>
      )}

      {/* ---- Unassigned Bucket ---- */}
      <div className="plan-section">
        <div className="plan-section-header">
          <h3 className="plan-section-title">Unassigned Courses</h3>
          <span className="plan-section-count">
            {unassigned.length} course{unassigned.length !== 1 ? 's' : ''}
          </span>
        </div>
        <p className="plan-section-desc">
          Courses saved to your plan but not yet placed in a semester. Use the{' '}
          <strong>Move</strong> button on each course to assign it to a year and semester.
        </p>
        <div className="plan-chip-list">
          {unassigned.length === 0 ? (
            <span className="plan-empty-bucket">No unassigned courses</span>
          ) : (
            unassigned.map((entry) => (
              <PlanCourseChip
                key={entry.entry_id}
                entry={entry}
                course={entry._course ?? courseMap[entry.course_id]}
                onMove={onMove}
                onRemove={onRemove}
                planYears={planYears}
              />
            ))
          )}
        </div>
      </div>

      {/* ---- Year / Semester Schedule Grid ---- */}
      <div className="plan-section">
        <div className="plan-section-header">
          <h3 className="plan-section-title">{planYears}-Year Schedule</h3>
          <span className="plan-section-count">
            {scheduled.length} course{scheduled.length !== 1 ? 's' : ''} placed
          </span>
        </div>

        <div className="plan-schedule-grid">
          {Array.from({ length: planYears }, (_, yi) => {
            const year = yi + 1;
            return (
              <div key={year} className="plan-year-col">
                <div className="plan-year-header">Year {year}</div>
                {SEMESTERS.map((sem) => {
                  const semEntries = scheduled.filter(
                    (e) => e.plan_year === year && e.plan_semester === sem
                  );
                  const semCredits = semEntries.reduce((s, e) => {
                    const c = e._course ?? courseMap[e.course_id];
                    return s + (c?.credit_hours ?? 0);
                  }, 0);
                  return (
                    <div key={sem} className="plan-semester-slot">
                      <div className="plan-semester-label">
                        <span>{sem.charAt(0).toUpperCase() + sem.slice(1)}</span>
                        {semCredits > 0 && (
                          <span className="plan-sem-credits">{semCredits} cr</span>
                        )}
                      </div>
                      <div className="plan-chip-list plan-chip-list--slot">
                        {semEntries.length === 0 ? (
                          <span className="plan-slot-empty">No courses</span>
                        ) : (
                          semEntries.map((entry) => (
                            <PlanCourseChip
                              key={entry.entry_id}
                              entry={entry}
                              course={entry._course ?? courseMap[entry.course_id]}
                              onMove={onMove}
                              onRemove={onRemove}
                              planYears={planYears}
                            />
                          ))
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>

      {/* ---- Prerequisite Chain Tree (placeholder — not yet implemented) ---- */}
      <div className="plan-section">
        <div className="plan-section-header">
          <h3 className="plan-section-title">Prerequisite Chain Tree</h3>
          <span className="plan-prereq-badge">Coming Soon</span>
        </div>
        <div className="plan-prereq-tree-placeholder">
          {/*
           * TODO: Implement the prerequisite chain visualizer.
           *
           * This area will render a dynamic directed-acyclic-graph (DAG) or layered
           * tree diagram showing every prerequisite chain for all courses currently
           * in the plan.
           *
           * Implementation notes:
           * - For each course in planEntries, recursively resolve its full prerequisite
           *   chain via GET /api/courses/:course_id/prerequisites (or the existing
           *   apiFetchPrerequisites stub).
           * - Merge all chains into a single dependency graph (nodes = courses, edges
           *   = prerequisite relationships).
           * - Render using an SVG-based layout (e.g. dagre-d3, react-flow, or a custom
           *   topological-sort layout).
           * - Highlight courses already in the plan vs. missing prerequisites.
           * - Clicking a node should expand its details or link to the course in the
           *   All Courses tab.
           *
           * Data shape already in place:
           *   prerequisites table: { course_id: string, required_course_id: string }
           *   apiFetchPrerequisites(courseId) → Course[]
           */}
          <div className="plan-prereq-tree-stub" aria-label="Prerequisite tree placeholder">
            <div className="plan-prereq-stub-header">
              Prerequisite Tree — not yet implemented
            </div>
            <p className="plan-prereq-stub-body">
              Once implemented, this panel will show a live dependency graph for every course in
              your plan — visualizing which courses must be completed first, and flagging any
              missing prerequisites.
            </p>
            {planEntries.length > 0 && (
              <div className="plan-prereq-stub-courses">
                <span className="course-meta-label">Courses in plan:</span>
                <div className="course-tag-group" style={{ marginTop: '6px' }}>
                  {planEntries.map((e) => {
                    const c = e._course ?? courseMap[e.course_id];
                    if (!c) return null;
                    return (
                      <span key={e.entry_id} className="course-prereq-tag">
                        {c.alpha_code} {c.numeric_code}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
