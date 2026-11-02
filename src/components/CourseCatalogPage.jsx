import { useState, useMemo } from 'react';
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

/**
 * CourseCatalogPage Component
 *
 * Provides a skeleton layout for the UNC Charlotte Course Catalog and Degree Requirements.
 *
 * Backend Integration Plan:
 * ------------------------------------------------------------
 * 1. Data Source:
 *    - In this skeleton, data is loaded from `src/data/mockCourseData.js`, which strictly
 *      mirrors `UniVerse/src/database/courseDB.ts` and `UniVerse/docs/ERD.md`.
 *    - To integrate with live PostgreSQL:
 *      * Replace static arrays with asynchronous fetch/React Query calls to backend endpoints:
 *        e.g., `GET /api/courses?department=ITSC&level=2000`
 *      * Backend implementation can invoke Kysely query builders in `courseDB.ts`:
 *        `db.selectFrom('courses').selectAll().where('alpha_code', '=', dept).execute()`
 * 2. Prerequisite Resolution:
 *    - Graph resolution of prerequisites can be computed on the server using recursive CTE
 *      queries on the `prerequisites` table or evaluated client-side via `mockPrerequisites`.
 * 3. User Bookmarks:
 *    - Saved courses can be synced with user bookmark tables or saved plan endpoints.
 */
export default function CourseCatalogPage({
  currentUser,
  onNavigateToLanding,
  onNavigateToRoommates,
  onNavigateToProfile,
  onNavigateToSignIn,
  onLogout,
}) {
  // Navigation & View state
  const [activeTab, setActiveTab] = useState('courses'); // 'courses' | 'majors' | 'minors' | 'prereqs'
  const [selectedCourseModal, setSelectedCourseModal] = useState(null);
  const [selectedPrereqCourseId, setSelectedPrereqCourseId] = useState('c-105'); // Default to ITSC 3155
  const [bookmarkedCourses, setBookmarkedCourses] = useState(new Set(['c-104', 'c-105']));

  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState('ALL');
  const [selectedLevel, setSelectedLevel] = useState('ALL');
  const [selectedCredits, setSelectedCredits] = useState('ALL');

  // Filtered courses computation
  const filteredCourses = useMemo(() => {
    return mockCourses.filter((course) => {
      // Department filter
      if (selectedDept !== 'ALL' && course.alpha_code !== selectedDept) {
        return false;
      }

      // Course level filter (1000, 2000, 3000, 4000)
      if (selectedLevel !== 'ALL') {
        const firstDigit = course.numeric_code.charAt(0);
        if (firstDigit !== selectedLevel.charAt(0)) {
          return false;
        }
      }

      // Credit hours filter
      if (selectedCredits !== 'ALL') {
        if (course.credit_hours !== parseInt(selectedCredits, 10)) {
          return false;
        }
      }

      // Search query (code, title, description)
      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase();
        const fullCode = `${course.alpha_code} ${course.numeric_code}`.toLowerCase();
        const matchCode = fullCode.includes(q);
        const matchTitle = course.title.toLowerCase().includes(q);
        const matchDesc = (course.description || '').toLowerCase().includes(q);
        if (!matchCode && !matchTitle && !matchDesc) {
          return false;
        }
      }

      return true;
    });
  }, [searchQuery, selectedDept, selectedLevel, selectedCredits]);

  // Handle bookmarking
  const toggleBookmark = (courseId) => {
    setBookmarkedCourses((prev) => {
      const next = new Set(prev);
      if (next.has(courseId)) {
        next.delete(courseId);
      } else {
        next.add(courseId);
      }
      return next;
    });
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedDept('ALL');
    setSelectedLevel('ALL');
    setSelectedCredits('ALL');
  };

  // Resolve target course for prerequisite tree
  const targetPrereqCourse = useMemo(() => {
    return mockCourses.find((c) => c.course_id === selectedPrereqCourseId) || mockCourses[0];
  }, [selectedPrereqCourseId]);

  const directPrereqs = useMemo(() => {
    return getPrerequisiteCourses(targetPrereqCourse.course_id);
  }, [targetPrereqCourse]);

  const coursesUnlocked = useMemo(() => {
    return getUnlockedCourses(targetPrereqCourse.course_id);
  }, [targetPrereqCourse]);

  return (
    <div className="catalog-page">
      {/* Top Navigation Header matching UniVerse layout */}
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
          <button
            type="button"
            className="catalog-back-btn"
            onClick={onNavigateToLanding}
          >
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
          <button
            type="button"
            className="catalog-nav-link"
            onClick={onNavigateToRoommates}
          >
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
                <button
                  type="button"
                  className="catalog-back-btn"
                  onClick={onLogout}
                >
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

      {/* Hero / Title Banner */}
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

      {/* Tabs Bar (Course Catalog Services) */}
      <nav className="catalog-tabs-bar" aria-label="Course Catalog Views">
        <div className="catalog-tabs-inner">
          <button
            type="button"
            className={`catalog-tab-btn ${activeTab === 'courses' ? 'active' : ''}`}
            onClick={() => setActiveTab('courses')}
          >
            All Courses ({mockCourses.length})
          </button>
          <button
            type="button"
            className={`catalog-tab-btn ${activeTab === 'majors' ? 'active' : ''}`}
            onClick={() => setActiveTab('majors')}
          >
            Majors &amp; Degree Requirements ({mockMajors.length})
          </button>
          <button
            type="button"
            className={`catalog-tab-btn ${activeTab === 'minors' ? 'active' : ''}`}
            onClick={() => setActiveTab('minors')}
          >
            Minors ({mockMinors.length})
          </button>
          <button
            type="button"
            className={`catalog-tab-btn ${activeTab === 'prereqs' ? 'active' : ''}`}
            onClick={() => setActiveTab('prereqs')}
          >
            Prerequisite Tree Explorer
          </button>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="catalog-content">
        {/* Backend Integration Architecture Note */}
        <aside className="catalog-integration-banner" aria-label="Developer Architecture Note">
          <strong>Architecture Planning:</strong> This skeleton connects to mock schemas modeled after{' '}
          <code>UniVerse/src/database/courseDB.ts</code> (entities: <code>departments</code>,{' '}
          <code>courses</code>, <code>majors</code>, <code>minors</code>, <code>prerequisites</code>,{' '}
          <code>major_requirements</code>). Backend endpoints can hydrate these components via Kysely SQL queries.
        </aside>

        {/* VIEW 1: ALL COURSES */}
        {activeTab === 'courses' && (
          <section aria-label="Course Search and List">
            {/* Filter controls */}
            <div className="catalog-filter-card">
              <h2>Filter &amp; Search Courses</h2>
              <div className="catalog-filters-grid">
                <div className="catalog-field">
                  <label htmlFor="course-search-input">Search Keywords or Course Code</label>
                  <input
                    id="course-search-input"
                    type="text"
                    placeholder="e.g. ITSC 2175, Algorithms, Database"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>

                <div className="catalog-field">
                  <label htmlFor="dept-select">Department</label>
                  <select
                    id="dept-select"
                    value={selectedDept}
                    onChange={(e) => setSelectedDept(e.target.value)}
                  >
                    <option value="ALL">All Departments</option>
                    {mockDepartments.map((dept) => (
                      <option key={dept.alpha_code} value={dept.alpha_code}>
                        {dept.alpha_code} &ndash; {dept.department_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="catalog-field">
                  <label htmlFor="level-select">Course Level</label>
                  <select
                    id="level-select"
                    value={selectedLevel}
                    onChange={(e) => setSelectedLevel(e.target.value)}
                  >
                    <option value="ALL">All Levels</option>
                    <option value="1000">1000 Level (Introductory)</option>
                    <option value="2000">2000 Level (Intermediate)</option>
                    <option value="3000">3000 Level (Advanced)</option>
                    <option value="4000">4000 Level (Senior / Capstone)</option>
                  </select>
                </div>

                <button
                  type="button"
                  className="catalog-reset-btn"
                  onClick={handleResetFilters}
                >
                  Reset Filters
                </button>
              </div>

              <div className="catalog-results-status">
                <span>
                  Showing <strong>{filteredCourses.length}</strong> of{' '}
                  <strong>{mockCourses.length}</strong> catalog offerings
                </span>
                <span>
                  Bookmarked: <strong>{bookmarkedCourses.size}</strong> courses
                </span>
              </div>
            </div>

            {/* Courses Grid */}
            {filteredCourses.length === 0 ? (
              <div
                style={{
                  textAlign: 'center',
                  padding: '40px',
                  backgroundColor: 'var(--white)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '4px',
                }}
              >
                <h3>No courses found matching your criteria.</h3>
                <p style={{ color: 'var(--text-muted)' }}>
                  Try adjusting your search terms or clearing the active department filter.
                </p>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={handleResetFilters}
                  style={{ marginTop: '12px' }}
                >
                  Clear Filters
                </button>
              </div>
            ) : (
              <div className="catalog-grid">
                {filteredCourses.map((course) => {
                  const prereqs = getPrerequisiteCourses(course.course_id);
                  const isBookmarked = bookmarkedCourses.has(course.course_id);

                  return (
                    <article key={course.course_id} className="course-card">
                      <div>
                        <div className="course-card-top">
                          <span className="course-code-badge">
                            {course.alpha_code} {course.numeric_code}
                          </span>
                          <span className="course-credits-badge">
                            {course.credit_hours} Credit Hours
                          </span>
                        </div>

                        <div className="course-card-dept">
                          {course.alpha_code} &bull; Dept. Code
                        </div>

                        <h3>{course.title}</h3>

                        <p className="course-card-description">{course.description}</p>

                        <div className="course-meta-section">
                          <div className="course-meta-label">Prerequisites:</div>
                          <div className="course-tag-group">
                            {prereqs.length > 0 ? (
                              prereqs.map((pr) => (
                                <span key={pr.course_id} className="course-prereq-tag">
                                  {pr.alpha_code} {pr.numeric_code}
                                </span>
                              ))
                            ) : (
                              <span className="course-none-tag">None (Open to all eligible undergraduates)</span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="course-card-actions">
                        <button
                          type="button"
                          className="btn-secondary"
                          onClick={() => setSelectedCourseModal(course)}
                        >
                          View Details
                        </button>
                        <button
                          type="button"
                          className={isBookmarked ? 'btn-secondary' : 'btn-primary'}
                          onClick={() => toggleBookmark(course.course_id)}
                        >
                          {isBookmarked ? '[Saved]' : 'Save Course'}
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {/* VIEW 2: MAJORS & DEGREE REQUIREMENTS */}
        {activeTab === 'majors' && (
          <section aria-label="Majors and Degree Requirements">
            <p style={{ color: 'var(--text-secondary)', marginBottom: '20px' }}>
              Academic major specifications defined in the UniVerse schema. Select a degree to inspect
              all prerequisite chains and required credit totals.
            </p>

            {mockMajors.map((major) => {
              const reqCourses = getCoursesForMajor(major.major_id);
              const totalCredits = reqCourses.reduce((sum, c) => sum + c.credit_hours, 0);

              return (
                <article key={major.major_id} className="major-card">
                  <div className="major-card-header">
                    <div className="major-title-block">
                      <h3>{major.title}</h3>
                      <div className="major-subtitle">
                        Academic Department: {major.alpha_code} &bull; Degree Designation: {major.type}
                      </div>
                    </div>
                    <span className="degree-type-badge">{major.type} Degree</span>
                  </div>

                  <p className="major-desc">{major.description}</p>

                  <h4 style={{ color: 'var(--niner-green)', marginBottom: '8px' }}>
                    Required Core Courses ({reqCourses.length} Courses &bull; {totalCredits} Total Credit Hours)
                  </h4>

                  <div className="requirements-table-wrap">
                    <table className="catalog-table">
                      <thead>
                        <tr>
                          <th>Course Code</th>
                          <th>Course Title</th>
                          <th>Credits</th>
                          <th>Required Prerequisites</th>
                          <th>Status Planning</th>
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
            })}
          </section>
        )}

        {/* VIEW 3: MINORS */}
        {activeTab === 'minors' && (
          <section aria-label="Academic Minors">
            <p style={{ color: 'var(--text-secondary)', marginBottom: '20px' }}>
              Academic minor curriculum requirements. Designed for complementary domain study.
            </p>

            <div className="catalog-grid">
              {mockMinors.map((minor) => {
                const reqCourses = getCoursesForMinor(minor.minor_id);
                const totalCredits = reqCourses.reduce((sum, c) => sum + c.credit_hours, 0);

                return (
                  <article key={minor.minor_id} className="course-card">
                    <div>
                      <div className="course-card-top">
                        <span className="course-code-badge">{minor.alpha_code}</span>
                        <span className="course-credits-badge">{totalCredits} Total Credits</span>
                      </div>
                      <div className="course-card-dept">Academic Minor</div>
                      <h3>{minor.title} Minor</h3>
                      <p className="course-card-description">{minor.description}</p>

                      <div className="course-meta-section">
                        <div className="course-meta-label">
                          Required Courses ({reqCourses.length}):
                        </div>
                        <ul style={{ paddingLeft: '20px', margin: '6px 0', fontSize: '13px' }}>
                          {reqCourses.map((rc) => (
                            <li key={rc.course_id} style={{ marginBottom: '4px' }}>
                              <strong>
                                {rc.alpha_code} {rc.numeric_code}:
                              </strong>{' '}
                              {rc.title} ({rc.credit_hours} cr)
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        )}

        {/* VIEW 4: PREREQUISITE TREE EXPLORER */}
        {activeTab === 'prereqs' && (
          <section aria-label="Prerequisite Tree Explorer">
            <div className="prereq-explorer-box">
              <div className="prereq-selector-bar">
                <label htmlFor="prereq-target-select" style={{ fontWeight: 600, fontSize: '14px' }}>
                  Select Target Course to Inspect Prerequisites:
                </label>
                <select
                  id="prereq-target-select"
                  value={selectedPrereqCourseId}
                  onChange={(e) => setSelectedPrereqCourseId(e.target.value)}
                  style={{
                    padding: '8px 12px',
                    fontFamily: 'var(--sans)',
                    fontSize: '14px',
                    borderRadius: '3px',
                    border: '1px solid var(--border-color)',
                  }}
                >
                  {mockCourses.map((c) => (
                    <option key={c.course_id} value={c.course_id}>
                      {c.alpha_code} {c.numeric_code} &ndash; {c.title}
                    </option>
                  ))}
                </select>
              </div>

              <div className="prereq-flow-tree">
                {/* Direct Prerequisites Tier */}
                <div className="prereq-tier">
                  <div className="prereq-tier-header">
                    <span>Direct Prerequisites Required</span>
                    <span>Requirement Count: {directPrereqs.length}</span>
                  </div>
                  {directPrereqs.length === 0 ? (
                    <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
                      This course has no formal prerequisite courses. Students may register directly.
                    </p>
                  ) : (
                    <div className="prereq-tier-courses">
                      {directPrereqs.map((pr) => (
                        <div key={pr.course_id} className="prereq-course-pill">
                          <strong>
                            {pr.alpha_code} {pr.numeric_code}
                          </strong>
                          <span>{pr.title}</span>
                          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                            {pr.credit_hours} Credits &bull; Complete with C or better
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="prereq-arrow-down">&darr;</div>

                {/* Target Selected Course */}
                <div
                  className="prereq-tier"
                  style={{
                    backgroundColor: 'var(--white)',
                    borderColor: 'var(--niner-green)',
                    borderWidth: '2px',
                  }}
                >
                  <div className="prereq-tier-header" style={{ color: 'var(--niner-green)' }}>
                    <span>Target Enrolled Course</span>
                    <span>Selected</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <span className="course-code-badge" style={{ fontSize: '15px' }}>
                      {targetPrereqCourse.alpha_code} {targetPrereqCourse.numeric_code}
                    </span>
                    <div>
                      <h3 style={{ margin: 0, fontSize: '18px' }}>{targetPrereqCourse.title}</h3>
                      <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '4px 0 0' }}>
                        {targetPrereqCourse.description}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="prereq-arrow-down">&darr;</div>

                {/* Unlocked Subsequent Courses Tier */}
                <div className="prereq-tier">
                  <div className="prereq-tier-header">
                    <span>Advanced Courses Unlocked by Passing This Course</span>
                    <span>Follow-up Count: {coursesUnlocked.length}</span>
                  </div>
                  {coursesUnlocked.length === 0 ? (
                    <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
                      No subsequent courses in the current catalog explicitly list this course as a prerequisite.
                    </p>
                  ) : (
                    <div className="prereq-tier-courses">
                      {coursesUnlocked.map((uc) => (
                        <div key={uc.course_id} className="prereq-course-pill">
                          <strong>
                            {uc.alpha_code} {uc.numeric_code}
                          </strong>
                          <span>{uc.title}</span>
                          <span style={{ fontSize: '11px', color: 'var(--niner-gold)' }}>
                            Requires {targetPrereqCourse.alpha_code} {targetPrereqCourse.numeric_code}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>
        )}
      </main>

      {/* Course Detail Modal */}
      {selectedCourseModal && (
        <div
          className="catalog-modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-course-title"
          onClick={() => setSelectedCourseModal(null)}
        >
          <div className="catalog-modal" onClick={(e) => e.stopPropagation()}>
            <div className="catalog-modal-header">
              <div>
                <span className="course-code-badge">
                  {selectedCourseModal.alpha_code} {selectedCourseModal.numeric_code}
                </span>
                <h3 id="modal-course-title" style={{ marginTop: '8px' }}>
                  {selectedCourseModal.title}
                </h3>
              </div>
              <button
                type="button"
                className="catalog-modal-close-btn"
                onClick={() => setSelectedCourseModal(null)}
                aria-label="Close modal"
              >
                &times;
              </button>
            </div>

            <p style={{ fontSize: '14px', lineHeight: '1.6', color: 'var(--text-secondary)' }}>
              {selectedCourseModal.description}
            </p>

            <div style={{ margin: '16px 0', borderTop: '1px solid var(--border-color)', paddingTop: '12px' }}>
              <p>
                <strong>Credit Hours:</strong> {selectedCourseModal.credit_hours}
              </p>
              <p>
                <strong>Academic Department:</strong> {selectedCourseModal.alpha_code}
              </p>
              <p>
                <strong>Prerequisites:</strong>
              </p>
              <div className="course-tag-group">
                {getPrerequisiteCourses(selectedCourseModal.course_id).length > 0 ? (
                  getPrerequisiteCourses(selectedCourseModal.course_id).map((p) => (
                    <span key={p.course_id} className="course-prereq-tag">
                      {p.alpha_code} {p.numeric_code}: {p.title}
                    </span>
                  ))
                ) : (
                  <span className="course-none-tag">None</span>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '20px' }}>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => {
                  setSelectedPrereqCourseId(selectedCourseModal.course_id);
                  setActiveTab('prereqs');
                  setSelectedCourseModal(null);
                }}
              >
                Inspect in Prerequisite Tree
              </button>
              <button
                type="button"
                className="btn-primary"
                onClick={() => {
                  toggleBookmark(selectedCourseModal.course_id);
                  setSelectedCourseModal(null);
                }}
              >
                {bookmarkedCourses.has(selectedCourseModal.course_id)
                  ? 'Remove from Saved'
                  : 'Bookmark Course'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer matching standard landing layout */}
      <footer>
        <p>&copy; 2026 UniVerse. Academic course data aligned with UNC Charlotte requirements.</p>
      </footer>
    </div>
  );
}
