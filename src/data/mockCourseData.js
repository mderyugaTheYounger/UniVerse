/**
 * Mock Course Database and Schema Definitions
 *
 * Designed to mirror the relational database schema implemented in:
 * UniVerse/src/database/courseDB.ts and described in UniVerse/docs/ERD.md
 *
 * Tables mirrored:
 * - departments (alpha_code PK, department_name)
 * - courses (course_id PK, alpha_code FK, numeric_code, title, description, credit_hours)
 * - majors (major_id PK, alpha_code FK, title, description, type: 'BS' | 'BA' | 'other')
 * - minors (minor_id PK, alpha_code FK, title, description)
 * - major_requirements (major_id FK, course_id FK)
 * - minor_requirements (minor_id FK, course_id FK)
 * - prerequisites (course_id FK, required_course_id FK)
 *
 * Future Backend Integration:
 * When wiring up the live API:
 * 1. Replace the static arrays with calls to the backend endpoints (e.g. GET /api/courses)
 *    or directly via Kysely query helpers from courseDB.ts:
 *      const courses = await db.selectFrom('courses').selectAll().execute();
 * 2. Prerequisite verification can be evaluated recursively using the prerequisites table.
 */

export const mockDepartments = [
  { alpha_code: 'ITSC', department_name: 'Computer Science' },
  { alpha_code: 'ITIS', department_name: 'Software and Information Systems' },
  { alpha_code: 'ITCS', department_name: 'Computer Science Advanced & AI' },
  { alpha_code: 'MATH', department_name: 'Mathematics and Statistics' },
  { alpha_code: 'STAT', department_name: 'Statistics' },
  { alpha_code: 'ENGR', department_name: 'Engineering Systems' },
];

export const mockCourses = [
  {
    course_id: 'c-101',
    alpha_code: 'ITSC',
    numeric_code: '1212',
    title: 'Introduction to Computer Science I',
    description: 'Introduction to algorithmic problem solving, procedural programming constructs, conditional execution, iterative loops, functions, and elementary data collections.',
    credit_hours: 3,
  },
  {
    course_id: 'c-102',
    alpha_code: 'ITSC',
    numeric_code: '1213',
    title: 'Introduction to Computer Science II',
    description: 'Object-oriented programming, classes and objects, inheritance, polymorphism, abstract classes, interfaces, recursion, and exception handling.',
    credit_hours: 4,
  },
  {
    course_id: 'c-103',
    alpha_code: 'ITSC',
    numeric_code: '2175',
    title: 'Logic and Algorithms',
    description: 'Discrete mathematical structures for computer science: propositional and predicate logic, proof techniques, set theory, induction, relations, functions, and graph basics.',
    credit_hours: 3,
  },
  {
    course_id: 'c-104',
    alpha_code: 'ITSC',
    numeric_code: '2214',
    title: 'Data Structures and Algorithms',
    description: 'Design, analysis, and asymptotic bounds of fundamental structures: linked lists, stacks, queues, trees, binary search trees, balanced trees, heaps, hash tables, and graphs.',
    credit_hours: 3,
  },
  {
    course_id: 'c-105',
    alpha_code: 'ITSC',
    numeric_code: '3155',
    title: 'Software Engineering',
    description: 'Principles and practices of software system development: agile methodologies, software requirements analysis, UML design, testing strategies, and team version control.',
    credit_hours: 3,
  },
  {
    course_id: 'c-106',
    alpha_code: 'ITSC',
    numeric_code: '3181',
    title: 'Introduction to Computer Architecture',
    description: 'Hardware/software interface, instruction set architectures (MIPS/RISC-V), processor pipeline design, cache memory hierarchies, and I/O subsystems.',
    credit_hours: 3,
  },
  {
    course_id: 'c-107',
    alpha_code: 'ITIS',
    numeric_code: '2300',
    title: 'Web-Based Application Development',
    description: 'Modern front-end and full-stack engineering: responsive semantic HTML, CSS layout systems, state management, asynchronous REST APIs, and client-side security.',
    credit_hours: 3,
  },
  {
    course_id: 'c-108',
    alpha_code: 'ITIS',
    numeric_code: '3310',
    title: 'Database Design and Implementation',
    description: 'Relational data modeling, ER diagrams, relational algebra, SQL querying, schema normalization, indexing, transaction processing, and concurrency control.',
    credit_hours: 3,
  },
  {
    course_id: 'c-109',
    alpha_code: 'ITIS',
    numeric_code: '3200',
    title: 'Information Security and Privacy',
    description: 'Security fundamentals, cryptographic building blocks, symmetric/asymmetric encryption, access controls, network intrusion detection, and privacy compliance laws.',
    credit_hours: 3,
  },
  {
    course_id: 'c-110',
    alpha_code: 'MATH',
    numeric_code: '1241',
    title: 'Calculus I',
    description: 'Functions, limits, continuity, differential calculus, product and chain rules, implicit differentiation, optimization problems, and the fundamental theorem of calculus.',
    credit_hours: 3,
  },
  {
    course_id: 'c-111',
    alpha_code: 'MATH',
    numeric_code: '1242',
    title: 'Calculus II',
    description: 'Techniques of integration, applications of definite integrals to geometry and physics, indeterminate forms, sequences, infinite series, and power series expansions.',
    credit_hours: 3,
  },
  {
    course_id: 'c-112',
    alpha_code: 'STAT',
    numeric_code: '2122',
    title: 'Introduction to Statistics with Calculus',
    description: 'Descriptive statistics, probability spaces, random variables, normal and binomial distributions, sampling distributions, hypothesis testing, and regression analysis.',
    credit_hours: 3,
  },
  {
    course_id: 'c-113',
    alpha_code: 'ITCS',
    numeric_code: '3160',
    title: 'Database Systems Architecture',
    description: 'Advanced storage engine internals, B+ tree indexing, query parsing and execution planning, transaction isolation levels, and distributed database replication.',
    credit_hours: 3,
  },
  {
    course_id: 'c-114',
    alpha_code: 'ITCS',
    numeric_code: '4152',
    title: 'Computer Vision',
    description: 'Digital image processing fundamentals, edge detection, feature extraction, convolutional neural networks, optical flow, and 3D scene reconstruction.',
    credit_hours: 3,
  },
];

export const mockMajors = [
  {
    major_id: 'm-cs-bs',
    alpha_code: 'ITSC',
    title: 'Computer Science',
    type: 'BS',
    description: 'Prepares students for rigorous technical careers in software development, cloud systems, algorithm engineering, and graduate computing research.',
  },
  {
    major_id: 'm-cs-ba',
    alpha_code: 'ITSC',
    title: 'Computer Science',
    type: 'BA',
    description: 'Combines computational thinking and programming foundations with interdisciplinary flexibility for dual majors and applied computing roles.',
  },
  {
    major_id: 'm-ds-bs',
    alpha_code: 'ITSC',
    title: 'Data Science',
    type: 'BS',
    description: 'Focuses on statistical modeling, large-scale data engineering, machine learning pipelines, and computational intelligence.',
  },
];

export const mockMinors = [
  {
    minor_id: 'min-se',
    alpha_code: 'ITSC',
    title: 'Software Engineering',
    description: 'Concentrated coursework in software lifecycle management, system architecture, team engineering, and full-stack implementation.',
  },
  {
    minor_id: 'min-sec',
    alpha_code: 'ITIS',
    title: 'Cyber Security',
    description: 'Foundations of computer security, threat vulnerability analysis, network defense, and applied cryptography.',
  },
  {
    minor_id: 'min-math',
    alpha_code: 'MATH',
    title: 'Mathematics',
    description: 'Core analytical training in calculus, linear structures, discrete mathematical systems, and quantitative modeling.',
  },
];

/**
 * Prerequisite mappings (course_id requires required_course_id)
 * Matches table 'prerequisites' in courseDB.ts
 */
export const mockPrerequisites = [
  { course_id: 'c-102', required_course_id: 'c-101' }, // ITSC 1213 requires ITSC 1212
  { course_id: 'c-103', required_course_id: 'c-110' }, // ITSC 2175 requires MATH 1241
  { course_id: 'c-104', required_course_id: 'c-102' }, // ITSC 2214 requires ITSC 1213
  { course_id: 'c-104', required_course_id: 'c-103' }, // ITSC 2214 requires ITSC 2175
  { course_id: 'c-105', required_course_id: 'c-104' }, // ITSC 3155 requires ITSC 2214
  { course_id: 'c-106', required_course_id: 'c-104' }, // ITSC 3181 requires ITSC 2214
  { course_id: 'c-107', required_course_id: 'c-101' }, // ITIS 2300 requires ITSC 1212
  { course_id: 'c-108', required_course_id: 'c-102' }, // ITIS 3310 requires ITSC 1213
  { course_id: 'c-109', required_course_id: 'c-102' }, // ITIS 3200 requires ITSC 1213
  { course_id: 'c-111', required_course_id: 'c-110' }, // MATH 1242 requires MATH 1241
  { course_id: 'c-112', required_course_id: 'c-110' }, // STAT 2122 requires MATH 1241
  { course_id: 'c-113', required_course_id: 'c-108' }, // ITCS 3160 requires ITIS 3310
  { course_id: 'c-114', required_course_id: 'c-104' }, // ITCS 4152 requires ITSC 2214
  { course_id: 'c-114', required_course_id: 'c-111' }, // ITCS 4152 requires MATH 1242
];

/**
 * Major requirements mappings (major_id -> course_id)
 * Matches table 'major_requirements' in courseDB.ts
 */
export const mockMajorRequirements = [
  // BS Computer Science
  { major_id: 'm-cs-bs', course_id: 'c-101' }, // ITSC 1212
  { major_id: 'm-cs-bs', course_id: 'c-102' }, // ITSC 1213
  { major_id: 'm-cs-bs', course_id: 'c-103' }, // ITSC 2175
  { major_id: 'm-cs-bs', course_id: 'c-104' }, // ITSC 2214
  { major_id: 'm-cs-bs', course_id: 'c-105' }, // ITSC 3155
  { major_id: 'm-cs-bs', course_id: 'c-106' }, // ITSC 3181
  { major_id: 'm-cs-bs', course_id: 'c-110' }, // MATH 1241
  { major_id: 'm-cs-bs', course_id: 'c-111' }, // MATH 1242
  { major_id: 'm-cs-bs', course_id: 'c-112' }, // STAT 2122

  // BA Computer Science
  { major_id: 'm-cs-ba', course_id: 'c-101' }, // ITSC 1212
  { major_id: 'm-cs-ba', course_id: 'c-102' }, // ITSC 1213
  { major_id: 'm-cs-ba', course_id: 'c-103' }, // ITSC 2175
  { major_id: 'm-cs-ba', course_id: 'c-104' }, // ITSC 2214
  { major_id: 'm-cs-ba', course_id: 'c-107' }, // ITIS 2300
  { major_id: 'm-cs-ba', course_id: 'c-110' }, // MATH 1241

  // BS Data Science
  { major_id: 'm-ds-bs', course_id: 'c-101' }, // ITSC 1212
  { major_id: 'm-ds-bs', course_id: 'c-102' }, // ITSC 1213
  { major_id: 'm-ds-bs', course_id: 'c-104' }, // ITSC 2214
  { major_id: 'm-ds-bs', course_id: 'c-108' }, // ITIS 3310
  { major_id: 'm-ds-bs', course_id: 'c-110' }, // MATH 1241
  { major_id: 'm-ds-bs', course_id: 'c-112' }, // STAT 2122
];

/**
 * Minor requirements mappings (minor_id -> course_id)
 * Matches table 'minor_requirements' in courseDB.ts
 */
export const mockMinorRequirements = [
  // Software Engineering Minor
  { minor_id: 'min-se', course_id: 'c-101' }, // ITSC 1212
  { minor_id: 'min-se', course_id: 'c-102' }, // ITSC 1213
  { minor_id: 'min-se', course_id: 'c-104' }, // ITSC 2214
  { minor_id: 'min-se', course_id: 'c-105' }, // ITSC 3155
  { minor_id: 'min-se', course_id: 'c-107' }, // ITIS 2300

  // Cyber Security Minor
  { minor_id: 'min-sec', course_id: 'c-101' }, // ITSC 1212
  { minor_id: 'min-sec', course_id: 'c-102' }, // ITSC 1213
  { minor_id: 'min-sec', course_id: 'c-108' }, // ITIS 3310
  { minor_id: 'min-sec', course_id: 'c-109' }, // ITIS 3200

  // Mathematics Minor
  { minor_id: 'min-math', course_id: 'c-103' }, // ITSC 2175
  { minor_id: 'min-math', course_id: 'c-110' }, // MATH 1241
  { minor_id: 'min-math', course_id: 'c-111' }, // MATH 1242
  { minor_id: 'min-math', course_id: 'c-112' }, // STAT 2122
];

/**
 * Helper to get all prerequisite courses for a given course_id
 */
export function getPrerequisiteCourses(courseId) {
  const reqIds = mockPrerequisites
    .filter((p) => p.course_id === courseId)
    .map((p) => p.required_course_id);
  return mockCourses.filter((c) => reqIds.includes(c.course_id));
}

/**
 * Helper to get all courses that require a given course_id as a prerequisite
 */
export function getUnlockedCourses(courseId) {
  const targetIds = mockPrerequisites
    .filter((p) => p.required_course_id === courseId)
    .map((p) => p.course_id);
  return mockCourses.filter((c) => targetIds.includes(c.course_id));
}

/**
 * Helper to get the courses required for a given major_id
 */
export function getCoursesForMajor(majorId) {
  const courseIds = mockMajorRequirements
    .filter((mr) => mr.major_id === majorId)
    .map((mr) => mr.course_id);
  return mockCourses.filter((c) => courseIds.includes(c.course_id));
}

/**
 * Helper to get the courses required for a given minor_id
 */
export function getCoursesForMinor(minorId) {
  const courseIds = mockMinorRequirements
    .filter((mr) => mr.minor_id === minorId)
    .map((mr) => mr.course_id);
  return mockCourses.filter((c) => courseIds.includes(c.course_id));
}

