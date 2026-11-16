import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import {
  mockDepartments,
  mockCourses,
  mockMajors,
  mockMinors,
  getPrerequisiteCourses,
  getCoursesForMajor,
  getCoursesForMinor,
} from './src/data/mockCourseData.js';

let inMemoryPlanEntries = [];

function courseApiPlugin() {
  return {
    name: 'course-api-plugin',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (
          !req.url ||
          !req.url.startsWith('/api/') ||
          req.url.startsWith('/api/auth') ||
          req.url.startsWith('/api/health')
        ) {
          return next();
        }

        const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
        const pathname = url.pathname;
        const method = req.method;

        const sendJson = (status, data) => {
          res.statusCode = status;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(data));
        };

        const readJsonBody = () => {
          return new Promise((resolve, reject) => {
            let body = '';
            req.on('data', (chunk) => {
              body += chunk;
            });
            req.on('end', () => {
              try {
                resolve(body ? JSON.parse(body) : {});
              } catch (e) {
                reject(e);
              }
            });
            req.on('error', reject);
          });
        };

        try {
          // GET /api/departments
          if (method === 'GET' && pathname === '/api/departments') {
            return sendJson(200, mockDepartments);
          }

          // GET /api/courses
          if (method === 'GET' && pathname === '/api/courses') {
            const department = url.searchParams.get('department');
            const level = url.searchParams.get('level');
            const credits = url.searchParams.get('credits');
            const q = url.searchParams.get('q');

            let results = [...mockCourses];
            if (department && department !== 'ALL') {
              results = results.filter((c) => c.alpha_code === department);
            }
            if (level && level !== 'ALL') {
              results = results.filter((c) => c.numeric_code.charAt(0) === level.charAt(0));
            }
            if (credits && credits !== 'ALL') {
              results = results.filter((c) => c.credit_hours === parseInt(credits, 10));
            }
            if (q && q.trim() !== '') {
              const term = q.toLowerCase();
              results = results.filter((c) => {
                const code = `${c.alpha_code} ${c.numeric_code}`.toLowerCase();
                return (
                  code.includes(term) ||
                  c.title.toLowerCase().includes(term) ||
                  (c.description || '').toLowerCase().includes(term)
                );
              });
            }
            return sendJson(200, results);
          }

          // GET /api/courses/:course_id/prerequisites
          const prereqMatch = pathname.match(/^\/api\/courses\/([^/]+)\/prerequisites$/);
          if (method === 'GET' && prereqMatch) {
            const courseId = decodeURIComponent(prereqMatch[1]);
            const prereqs = getPrerequisiteCourses(courseId);
            return sendJson(200, prereqs);
          }

          // GET /api/majors/:major_id/courses
          const majorCoursesMatch = pathname.match(/^\/api\/majors\/([^/]+)\/courses$/);
          if (method === 'GET' && majorCoursesMatch) {
            const majorId = decodeURIComponent(majorCoursesMatch[1]);
            const courses = getCoursesForMajor(majorId);
            return sendJson(200, courses);
          }

          // GET /api/majors
          if (method === 'GET' && pathname === '/api/majors') {
            return sendJson(200, mockMajors);
          }

          // GET /api/minors/:minor_id/courses
          const minorCoursesMatch = pathname.match(/^\/api\/minors\/([^/]+)\/courses$/);
          if (method === 'GET' && minorCoursesMatch) {
            const minorId = decodeURIComponent(minorCoursesMatch[1]);
            const courses = getCoursesForMinor(minorId);
            return sendJson(200, courses);
          }

          // GET /api/minors
          if (method === 'GET' && pathname === '/api/minors') {
            return sendJson(200, mockMinors);
          }

          // GET /api/plan?user_id=
          if (method === 'GET' && pathname === '/api/plan') {
            const userId = url.searchParams.get('user_id');
            const entries = userId && userId !== 'undefined' && userId !== 'null'
              ? inMemoryPlanEntries.filter((e) => String(e.user_id) === String(userId))
              : inMemoryPlanEntries;
            return sendJson(200, entries);
          }

          // POST /api/plan
          if (method === 'POST' && pathname === '/api/plan') {
            const body = await readJsonBody();
            const newEntry = {
              entry_id: Date.now(),
              user_id: Number(body.user_id) || 1,
              course_id: body.course_id,
              plan_year: Number(body.plan_year) || 0,
              plan_semester: body.plan_semester || 'unassigned',
              notes: body.notes || null,
              created_at: new Date().toISOString(),
            };
            const existingIndex = inMemoryPlanEntries.findIndex(
              (e) => String(e.user_id) === String(newEntry.user_id) && e.course_id === newEntry.course_id
            );
            if (existingIndex !== -1) {
              return sendJson(200, inMemoryPlanEntries[existingIndex]);
            }
            inMemoryPlanEntries.push(newEntry);
            return sendJson(201, newEntry);
          }

          // PUT /api/plan/:entry_id
          const planEntryMatch = pathname.match(/^\/api\/plan\/([^/]+)$/);
          if (method === 'PUT' && planEntryMatch) {
            const entryId = decodeURIComponent(planEntryMatch[1]);
            const body = await readJsonBody();
            const index = inMemoryPlanEntries.findIndex((e) => String(e.entry_id) === String(entryId));
            if (index === -1) {
              const fallback = {
                entry_id: Number(entryId) || entryId,
                user_id: Number(body.user_id) || 1,
                course_id: body.course_id || '',
                plan_year: body.plan_year !== undefined ? Number(body.plan_year) : 0,
                plan_semester: body.plan_semester || 'unassigned',
                notes: body.notes || null,
                created_at: new Date().toISOString(),
              };
              inMemoryPlanEntries.push(fallback);
              return sendJson(200, fallback);
            }
            inMemoryPlanEntries[index] = {
              ...inMemoryPlanEntries[index],
              ...(body.plan_year !== undefined ? { plan_year: Number(body.plan_year) } : {}),
              ...(body.plan_semester !== undefined ? { plan_semester: body.plan_semester } : {}),
              ...(body.notes !== undefined ? { notes: body.notes } : {}),
            };
            return sendJson(200, inMemoryPlanEntries[index]);
          }

          // DELETE /api/plan/:entry_id
          if (method === 'DELETE' && planEntryMatch) {
            const entryId = decodeURIComponent(planEntryMatch[1]);
            inMemoryPlanEntries = inMemoryPlanEntries.filter((e) => String(e.entry_id) !== String(entryId));
            return sendJson(200, { success: true });
          }

          return sendJson(404, { error: `Not found: ${method} ${pathname}` });
        } catch (err) {
          return sendJson(500, { error: err.message || 'Internal Server Error' });
        }
      });
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), courseApiPlugin()],
  server: {
    proxy: {
      '/api/auth': {
        target: 'http://localhost:5001',
        changeOrigin: true,
      },
      '/api/health': {
        target: 'http://localhost:5001',
        changeOrigin: true,
      },
    },
  },
});
