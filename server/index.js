import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { OAuth2Client } from 'google-auth-library';
import jwt from 'jsonwebtoken';
import { createUserDB, findOrCreateGoogleUser, getUserWithProfile } from '../src/database/userDB.ts';
import {
  createForumDB,
  createReview,
  getReviewsByTarget,
  getReviewSummary,
  updateReview,
  deleteReview,
  createPostedCoursePlan,
  getPostedCoursePlans,
  getPostedCoursePlanById,
  deletePostedCoursePlan,
  createRoommatePost,
  queryRoommatePosts,
  getRoommatePostById,
  updateRoommatePost,
  deleteRoommatePost,
  addCommentToPost,
  deleteComment,
} from '../src/database/forumDB.ts';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;
const JWT_SECRET = process.env.JWT_SECRET || 'universe_dev_jwt_secret_key_2026';
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '811059952520-7468aljdk728mcksjlqr0jhtq4c8588p.apps.googleusercontent.com';

const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);

app.use(cors());
app.use(express.json());

// In-memory fallback cache when PostgreSQL is not running locally
const inMemoryUsers = new Map();
let nextUserId = 100;

// Try initializing DB connection if configured
let db = null;
try {
  if (process.env.USER_DATABASE_URL) {
    db = createUserDB(process.env.USER_DATABASE_URL);
  }
} catch (err) {
  console.warn('[UniVerse Server] Notice: Could not initialize database pool, using in-memory store fallback:', err.message);
}

// Forum DB connection
let forumDb = null;
try {
  if (process.env.FORUM_DATABASE_URL) {
    forumDb = createForumDB(process.env.FORUM_DATABASE_URL);
  }
} catch (err) {
  console.warn('[UniVerse Server] Notice: Could not initialize forum database pool, using in-memory fallback:', err.message);
}

// In-memory forum fallback stores
let inMemoryReviews = [];
let inMemoryReviewIdSeq = 1;
let inMemoryCoursePlans = [];
let inMemoryCoursePlanIdSeq = 1;
let inMemoryRoommatePosts = [];
let inMemoryRoommatePostIdSeq = 1;
let inMemoryComments = [];
let inMemoryCommentIdSeq = 1;

const VALID_TARGET_TYPES = ['map_tack', 'course', 'major', 'minor', 'course_plan'];

/**
 * Health check endpoint
 */
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'UniVerse Auth Server', timestamp: new Date().toISOString() });
});

/**
 * Validates whether an email belongs to authorized UNC Charlotte campus domains
 */
function isCampusEmail(email) {
  if (!email || typeof email !== 'string') return false;
  const normalized = email.toLowerCase().trim();
  return normalized.endsWith('@charlotte.edu') || normalized.endsWith('@uncc.edu');
}

/**
 * POST /api/auth/google
 * Receives the Google OIDC ID token ('credential') from Google Identity Services,
 * verifies its cryptographic signature & claims with Google, validates campus domain,
 * provisions or links the student in the database, and returns a signed session token.
 */
app.post('/api/auth/google', async (req, res) => {
  const { credential } = req.body;

  if (!credential) {
    return res.status(400).json({ error: 'Missing credential (ID token) in request body.' });
  }

  try {
    // 1. Cryptographically verify the Google ID token
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload) {
      return res.status(401).json({ error: 'Invalid Google token payload.' });
    }

    const {
      sub: googleId,
      email,
      name: displayName,
      picture: avatarUrl,
      email_verified: emailVerified,
    } = payload;

    const normalizedEmail = (email || '').toLowerCase().trim();

    // 2. Strict Campus Domain Enforcement
    if (!emailVerified) {
      return res.status(403).json({ error: 'Google account email is not verified.' });
    }

    if (!isCampusEmail(normalizedEmail)) {
      return res.status(403).json({
        error: 'Access restricted: Only verified UNC Charlotte student emails (@charlotte.edu or @uncc.edu) are permitted.',
        email: normalizedEmail,
      });
    }

    // 3. User Resolution / Database Upsert
    let userRecord = null;

    if (db) {
      try {
        userRecord = await findOrCreateGoogleUser(db, {
          googleId,
          email: normalizedEmail,
          displayName: displayName || normalizedEmail.split('@')[0],
          avatarUrl: avatarUrl || null,
        });
      } catch (dbErr) {
        console.warn('[UniVerse Server] Postgres lookup failed, falling back to in-memory store:', dbErr.message);
      }
    }

    // In-memory fallback if database is not reachable
    if (!userRecord) {
      let existing = Array.from(inMemoryUsers.values()).find(
        (u) => u.google_id === googleId || u.email === normalizedEmail
      );

      if (existing) {
        existing.google_id = googleId;
        existing.avatar_url = avatarUrl || existing.avatar_url;
        existing.display_name = existing.display_name || displayName;
        userRecord = existing;
      } else {
        userRecord = {
          user_id: nextUserId++,
          university_id: 1,
          email: normalizedEmail,
          display_name: displayName || normalizedEmail.split('@')[0],
          avatar_url: avatarUrl || null,
          google_id: googleId,
          auth_provider: 'google',
          created_at: new Date().toISOString(),
          profile: {
            bio: null,
            interests: null,
            graduation_year: null,
          },
        };
        inMemoryUsers.set(userRecord.user_id, userRecord);
      }
    }

    // 4. Issue session JWT
    const token = jwt.sign(
      {
        userId: userRecord.user_id,
        email: userRecord.email,
        displayName: userRecord.display_name,
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.status(200).json({
      success: true,
      user: {
        user_id: userRecord.user_id,
        id: userRecord.user_id,
        email: userRecord.email,
        display_name: userRecord.display_name,
        fullName: userRecord.display_name,
        avatar_url: userRecord.avatar_url,
        university_id: userRecord.university_id,
        profile: userRecord.profile || null,
      },
      token,
    });
  } catch (err) {
    console.error('[UniVerse Server] Error verifying Google OAuth token:', err);
    return res.status(401).json({
      error: 'Google authentication failed: ' + (err.message || 'Token verification error'),
    });
  }
});

/**
 * Middleware: Verify Bearer JWT
 */
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'No authorization token provided.' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token.' });
    }
    req.user = user;
    next();
  });
}

/**
 * GET /api/auth/me
 * Restores session from stored JWT
 */
app.get('/api/auth/me', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;

    if (db) {
      try {
        const user = await getUserWithProfile(db, userId);
        if (user) {
          return res.json({
            user: {
              ...user,
              id: user.user_id,
              fullName: user.display_name,
            },
          });
        }
      } catch (err) {
        console.warn('[UniVerse Server] DB read failed for me endpoint:', err.message);
      }
    }

    const inMem = inMemoryUsers.get(userId);
    if (inMem) {
      return res.json({
        user: {
          ...inMem,
          id: inMem.user_id,
          fullName: inMem.display_name,
        },
      });
    }

    return res.json({
      user: {
        user_id: req.user.userId,
        id: req.user.userId,
        email: req.user.email,
        display_name: req.user.displayName,
        fullName: req.user.displayName,
      },
    });
  } catch (err) {
    console.error('[UniVerse Server] /me retrieval failed:', err);
    return res.status(500).json({ error: 'Failed to retrieve authenticated user.' });
  }
});

// ============================================================================
// FORUM ROUTES
// ============================================================================

// ---------------------------------------------------------------------------
// Reviews  –  POST /api/reviews  |  GET /api/reviews
// ---------------------------------------------------------------------------
app.post('/api/reviews', authenticateToken, async (req, res) => {
  const { target_type, target_id, rating, title, comment } = req.body;
  if (!target_type || !target_id || !rating || !comment) {
    return res.status(400).json({ error: 'target_type, target_id, rating, and comment are required.' });
  }
  if (!VALID_TARGET_TYPES.includes(target_type)) {
    return res.status(400).json({ error: `target_type must be one of: ${VALID_TARGET_TYPES.join(', ')}` });
  }
  if (typeof rating !== 'number' || rating < 1 || rating > 5) {
    return res.status(400).json({ error: 'rating must be an integer between 1 and 5.' });
  }

  const payload = {
    user_id: req.user.userId,
    target_type,
    target_id: String(target_id),
    rating,
    title: title || null,
    comment,
  };

  if (forumDb) {
    try {
      const review = await createReview(forumDb, payload);
      return res.status(201).json({ success: true, review });
    } catch (err) {
      if (err.message?.includes('uq_user_target_review') || err.code === '23505') {
        return res.status(409).json({ error: 'You have already reviewed this item.' });
      }
      console.warn('[UniVerse Forum] createReview DB error, using in-memory fallback:', err.message);
    }
  }

  // In-memory fallback
  const dup = inMemoryReviews.find(
    (r) => r.user_id === payload.user_id && r.target_type === payload.target_type && r.target_id === payload.target_id
  );
  if (dup) return res.status(409).json({ error: 'You have already reviewed this item.' });
  const now = new Date().toISOString();
  const review = { ...payload, review_id: inMemoryReviewIdSeq++, created_at: now, updated_at: now };
  inMemoryReviews.push(review);
  return res.status(201).json({ success: true, review });
});

app.get('/api/reviews', async (req, res) => {
  const { target_type, target_id, limit = '20', offset = '0' } = req.query;
  if (!target_type || !target_id) {
    return res.status(400).json({ error: 'target_type and target_id query params are required.' });
  }

  if (forumDb) {
    try {
      const result = await getReviewsByTarget(forumDb, target_type, String(target_id), Number(limit), Number(offset));
      return res.json(result);
    } catch (err) {
      console.warn('[UniVerse Forum] getReviewsByTarget DB error, using in-memory fallback:', err.message);
    }
  }

  const filtered = inMemoryReviews.filter(
    (r) => r.target_type === target_type && r.target_id === String(target_id)
  );
  const page = filtered.slice(Number(offset), Number(offset) + Number(limit));
  return res.json({ reviews: page, total: filtered.length });
});

app.get('/api/reviews/summary', async (req, res) => {
  const { target_type, target_id } = req.query;
  if (!target_type || !target_id) {
    return res.status(400).json({ error: 'target_type and target_id query params are required.' });
  }

  if (forumDb) {
    try {
      const summary = await getReviewSummary(forumDb, target_type, String(target_id));
      return res.json(summary);
    } catch (err) {
      console.warn('[UniVerse Forum] getReviewSummary DB error, using in-memory fallback:', err.message);
    }
  }

  const filtered = inMemoryReviews.filter(
    (r) => r.target_type === target_type && r.target_id === String(target_id)
  );
  const avg = filtered.length ? filtered.reduce((s, r) => s + r.rating, 0) / filtered.length : 0;
  return res.json({ target_type, target_id, avg_rating: Number(avg.toFixed(2)), count: filtered.length });
});

app.put('/api/reviews/:id', authenticateToken, async (req, res) => {
  const reviewId = Number(req.params.id);
  const { rating, title, comment } = req.body;

  if (forumDb) {
    try {
      const existing = await forumDb.selectFrom('reviews').selectAll().where('review_id', '=', reviewId).executeTakeFirst();
      if (!existing) return res.status(404).json({ error: 'Review not found.' });
      if (existing.user_id !== req.user.userId) return res.status(403).json({ error: 'Not authorized.' });
      const update = {};
      if (rating !== undefined) update.rating = rating;
      if (title !== undefined) update.title = title;
      if (comment !== undefined) update.comment = comment;
      const review = await updateReview(forumDb, reviewId, update);
      return res.json({ success: true, review });
    } catch (err) {
      console.warn('[UniVerse Forum] updateReview DB error:', err.message);
      return res.status(500).json({ error: 'Failed to update review.' });
    }
  }

  const idx = inMemoryReviews.findIndex((r) => r.review_id === reviewId);
  if (idx === -1) return res.status(404).json({ error: 'Review not found.' });
  if (inMemoryReviews[idx].user_id !== req.user.userId) return res.status(403).json({ error: 'Not authorized.' });
  if (rating !== undefined) inMemoryReviews[idx].rating = rating;
  if (title !== undefined) inMemoryReviews[idx].title = title;
  if (comment !== undefined) inMemoryReviews[idx].comment = comment;
  inMemoryReviews[idx].updated_at = new Date().toISOString();
  return res.json({ success: true, review: inMemoryReviews[idx] });
});

app.delete('/api/reviews/:id', authenticateToken, async (req, res) => {
  const reviewId = Number(req.params.id);

  if (forumDb) {
    try {
      const existing = await forumDb.selectFrom('reviews').selectAll().where('review_id', '=', reviewId).executeTakeFirst();
      if (!existing) return res.status(404).json({ error: 'Review not found.' });
      if (existing.user_id !== req.user.userId) return res.status(403).json({ error: 'Not authorized.' });
      await deleteReview(forumDb, reviewId);
      return res.json({ success: true, deleted_id: reviewId });
    } catch (err) {
      console.warn('[UniVerse Forum] deleteReview DB error:', err.message);
      return res.status(500).json({ error: 'Failed to delete review.' });
    }
  }

  const idx = inMemoryReviews.findIndex((r) => r.review_id === reviewId);
  if (idx === -1) return res.status(404).json({ error: 'Review not found.' });
  if (inMemoryReviews[idx].user_id !== req.user.userId) return res.status(403).json({ error: 'Not authorized.' });
  inMemoryReviews.splice(idx, 1);
  return res.json({ success: true, deleted_id: reviewId });
});

// ---------------------------------------------------------------------------
// Posted Course Plans  –  POST /api/course-plans/posts  |  GET /api/course-plans/posts
// ---------------------------------------------------------------------------
app.post('/api/course-plans/posts', authenticateToken, async (req, res) => {
  const { title, description, major_id, plan_data } = req.body;
  if (!title || !plan_data) {
    return res.status(400).json({ error: 'title and plan_data are required.' });
  }

  const payload = {
    user_id: req.user.userId,
    title,
    description: description || null,
    major_id: major_id || null,
    plan_data,
    is_public: true,
  };

  if (forumDb) {
    try {
      const plan = await createPostedCoursePlan(forumDb, payload);
      return res.status(201).json({ success: true, plan });
    } catch (err) {
      console.warn('[UniVerse Forum] createPostedCoursePlan DB error, using in-memory fallback:', err.message);
    }
  }

  const now = new Date().toISOString();
  const plan = { ...payload, plan_id: inMemoryCoursePlanIdSeq++, created_at: now, updated_at: now };
  inMemoryCoursePlans.push(plan);
  return res.status(201).json({ success: true, plan });
});

app.get('/api/course-plans/posts', async (req, res) => {
  const { major_id, limit = '20', offset = '0' } = req.query;

  if (forumDb) {
    try {
      const result = await getPostedCoursePlans(forumDb, major_id || undefined, Number(limit), Number(offset));
      // Attach review summaries
      const plans = await Promise.all(
        result.plans.map(async (plan) => {
          const summary = await getReviewSummary(forumDb, 'course_plan', String(plan.plan_id));
          return { ...plan, avg_rating: summary.avg_rating, review_count: summary.count };
        })
      );
      return res.json({ plans, total: result.total });
    } catch (err) {
      console.warn('[UniVerse Forum] getPostedCoursePlans DB error, using in-memory fallback:', err.message);
    }
  }

  let filtered = inMemoryCoursePlans.filter((p) => p.is_public);
  if (major_id) filtered = filtered.filter((p) => p.major_id === major_id);
  const page = filtered.slice(Number(offset), Number(offset) + Number(limit));
  const withSummaries = page.map((plan) => {
    const planReviews = inMemoryReviews.filter(
      (r) => r.target_type === 'course_plan' && r.target_id === String(plan.plan_id)
    );
    const avg = planReviews.length ? planReviews.reduce((s, r) => s + r.rating, 0) / planReviews.length : 0;
    return { ...plan, avg_rating: Number(avg.toFixed(2)), review_count: planReviews.length };
  });
  return res.json({ plans: withSummaries, total: filtered.length });
});

app.get('/api/course-plans/posts/:id', async (req, res) => {
  const planId = Number(req.params.id);

  if (forumDb) {
    try {
      const plan = await getPostedCoursePlanById(forumDb, planId);
      if (!plan) return res.status(404).json({ error: 'Course plan not found.' });
      const { reviews } = await getReviewsByTarget(forumDb, 'course_plan', String(planId));
      return res.json({ plan, reviews });
    } catch (err) {
      console.warn('[UniVerse Forum] getPostedCoursePlanById DB error, using in-memory fallback:', err.message);
    }
  }

  const plan = inMemoryCoursePlans.find((p) => p.plan_id === planId);
  if (!plan) return res.status(404).json({ error: 'Course plan not found.' });
  const reviews = inMemoryReviews.filter(
    (r) => r.target_type === 'course_plan' && r.target_id === String(planId)
  );
  return res.json({ plan, reviews });
});

app.delete('/api/course-plans/posts/:id', authenticateToken, async (req, res) => {
  const planId = Number(req.params.id);

  if (forumDb) {
    try {
      const plan = await getPostedCoursePlanById(forumDb, planId);
      if (!plan) return res.status(404).json({ error: 'Course plan not found.' });
      if (plan.user_id !== req.user.userId) return res.status(403).json({ error: 'Not authorized.' });
      await deletePostedCoursePlan(forumDb, planId);
      return res.json({ success: true, deleted_id: planId });
    } catch (err) {
      console.warn('[UniVerse Forum] deletePostedCoursePlan DB error:', err.message);
      return res.status(500).json({ error: 'Failed to delete course plan.' });
    }
  }

  const idx = inMemoryCoursePlans.findIndex((p) => p.plan_id === planId);
  if (idx === -1) return res.status(404).json({ error: 'Course plan not found.' });
  if (inMemoryCoursePlans[idx].user_id !== req.user.userId) return res.status(403).json({ error: 'Not authorized.' });
  inMemoryCoursePlans.splice(idx, 1);
  return res.json({ success: true, deleted_id: planId });
});

// ---------------------------------------------------------------------------
// Roommate Forum  –  POST /api/forum/roommates  |  GET /api/forum/roommates
// ---------------------------------------------------------------------------
app.post('/api/forum/roommates', authenticateToken, async (req, res) => {
  const { title, description, budget_max, housing_status, location_preference, move_in_term,
    sleep_schedule, cleanliness, pets_ok, smoking_ok, contact_info } = req.body;

  if (!title || !description) {
    return res.status(400).json({ error: 'title and description are required.' });
  }

  const payload = {
    user_id: req.user.userId,
    title,
    description,
    budget_max: budget_max ?? null,
    housing_status: housing_status ?? null,
    location_preference: location_preference ?? null,
    move_in_term: move_in_term ?? null,
    sleep_schedule: sleep_schedule ?? null,
    cleanliness: cleanliness ?? null,
    pets_ok: pets_ok ?? false,
    smoking_ok: smoking_ok ?? false,
    contact_info: contact_info ?? null,
    status: 'open',
  };

  if (forumDb) {
    try {
      const post = await createRoommatePost(forumDb, payload);
      return res.status(201).json({ success: true, post });
    } catch (err) {
      console.warn('[UniVerse Forum] createRoommatePost DB error, using in-memory fallback:', err.message);
    }
  }

  const now = new Date().toISOString();
  const post = { ...payload, post_id: inMemoryRoommatePostIdSeq++, created_at: now, updated_at: now };
  inMemoryRoommatePosts.push(post);
  return res.status(201).json({ success: true, post });
});

app.get('/api/forum/roommates', async (req, res) => {
  const { maxBudget, sleepSchedule, cleanliness, petsOk, smokingOk, status = 'open', limit = '20', offset = '0' } = req.query;
  const filters = {
    status,
    limit: Number(limit),
    offset: Number(offset),
    ...(maxBudget !== undefined && { maxBudget: Number(maxBudget) }),
    ...(sleepSchedule && { sleepSchedule }),
    ...(cleanliness && { cleanliness }),
    ...(petsOk !== undefined && { petsOk: petsOk === 'true' }),
    ...(smokingOk !== undefined && { smokingOk: smokingOk === 'true' }),
  };

  if (forumDb) {
    try {
      const result = await queryRoommatePosts(forumDb, filters);
      return res.json(result);
    } catch (err) {
      console.warn('[UniVerse Forum] queryRoommatePosts DB error, using in-memory fallback:', err.message);
    }
  }

  let filtered = inMemoryRoommatePosts.filter((p) => p.status === status);
  if (filters.maxBudget !== undefined) filtered = filtered.filter((p) => p.budget_max == null || p.budget_max <= filters.maxBudget);
  if (filters.sleepSchedule) filtered = filtered.filter((p) => p.sleep_schedule === filters.sleepSchedule);
  if (filters.cleanliness) filtered = filtered.filter((p) => p.cleanliness === filters.cleanliness);
  if (filters.petsOk !== undefined) filtered = filtered.filter((p) => p.pets_ok === filters.petsOk);
  if (filters.smokingOk !== undefined) filtered = filtered.filter((p) => p.smoking_ok === filters.smokingOk);
  const page = filtered.slice(Number(offset), Number(offset) + Number(limit));
  return res.json({ posts: page, total: filtered.length });
});

app.get('/api/forum/roommates/:id', async (req, res) => {
  const postId = Number(req.params.id);

  if (forumDb) {
    try {
      const result = await getRoommatePostById(forumDb, postId);
      if (!result) return res.status(404).json({ error: 'Post not found.' });
      return res.json(result);
    } catch (err) {
      console.warn('[UniVerse Forum] getRoommatePostById DB error, using in-memory fallback:', err.message);
    }
  }

  const post = inMemoryRoommatePosts.find((p) => p.post_id === postId);
  if (!post) return res.status(404).json({ error: 'Post not found.' });
  const comments = inMemoryComments.filter((c) => c.post_id === postId);
  return res.json({ post, comments });
});

app.put('/api/forum/roommates/:id', authenticateToken, async (req, res) => {
  const postId = Number(req.params.id);
  const allowedFields = ['title', 'description', 'budget_max', 'housing_status', 'location_preference',
    'move_in_term', 'sleep_schedule', 'cleanliness', 'pets_ok', 'smoking_ok', 'contact_info', 'status'];
  const update = {};
  for (const field of allowedFields) {
    if (req.body[field] !== undefined) update[field] = req.body[field];
  }

  if (forumDb) {
    try {
      const existing = await forumDb.selectFrom('roommate_posts').selectAll().where('post_id', '=', postId).executeTakeFirst();
      if (!existing) return res.status(404).json({ error: 'Post not found.' });
      if (existing.user_id !== req.user.userId) return res.status(403).json({ error: 'Not authorized.' });
      const post = await updateRoommatePost(forumDb, postId, update);
      return res.json({ success: true, post });
    } catch (err) {
      console.warn('[UniVerse Forum] updateRoommatePost DB error:', err.message);
      return res.status(500).json({ error: 'Failed to update post.' });
    }
  }

  const idx = inMemoryRoommatePosts.findIndex((p) => p.post_id === postId);
  if (idx === -1) return res.status(404).json({ error: 'Post not found.' });
  if (inMemoryRoommatePosts[idx].user_id !== req.user.userId) return res.status(403).json({ error: 'Not authorized.' });
  Object.assign(inMemoryRoommatePosts[idx], update, { updated_at: new Date().toISOString() });
  return res.json({ success: true, post: inMemoryRoommatePosts[idx] });
});

app.delete('/api/forum/roommates/:id', authenticateToken, async (req, res) => {
  const postId = Number(req.params.id);

  if (forumDb) {
    try {
      const existing = await forumDb.selectFrom('roommate_posts').selectAll().where('post_id', '=', postId).executeTakeFirst();
      if (!existing) return res.status(404).json({ error: 'Post not found.' });
      if (existing.user_id !== req.user.userId) return res.status(403).json({ error: 'Not authorized.' });
      await deleteRoommatePost(forumDb, postId);
      return res.json({ success: true, deleted_id: postId });
    } catch (err) {
      console.warn('[UniVerse Forum] deleteRoommatePost DB error:', err.message);
      return res.status(500).json({ error: 'Failed to delete post.' });
    }
  }

  const idx = inMemoryRoommatePosts.findIndex((p) => p.post_id === postId);
  if (idx === -1) return res.status(404).json({ error: 'Post not found.' });
  if (inMemoryRoommatePosts[idx].user_id !== req.user.userId) return res.status(403).json({ error: 'Not authorized.' });
  inMemoryRoommatePosts.splice(idx, 1);
  inMemoryComments = inMemoryComments.filter((c) => c.post_id !== postId);
  return res.json({ success: true, deleted_id: postId });
});

app.post('/api/forum/roommates/:id/comments', authenticateToken, async (req, res) => {
  const postId = Number(req.params.id);
  const { content, parent_comment_id } = req.body;
  if (!content) return res.status(400).json({ error: 'content is required.' });

  const payload = {
    post_id: postId,
    user_id: req.user.userId,
    content,
    parent_comment_id: parent_comment_id ?? null,
  };

  if (forumDb) {
    try {
      const postExists = await forumDb.selectFrom('roommate_posts').select('post_id').where('post_id', '=', postId).executeTakeFirst();
      if (!postExists) return res.status(404).json({ error: 'Post not found.' });
      const comment = await addCommentToPost(forumDb, payload);
      return res.status(201).json({ success: true, comment });
    } catch (err) {
      console.warn('[UniVerse Forum] addCommentToPost DB error, using in-memory fallback:', err.message);
    }
  }

  const postExists = inMemoryRoommatePosts.find((p) => p.post_id === postId);
  if (!postExists) return res.status(404).json({ error: 'Post not found.' });
  const now = new Date().toISOString();
  const comment = { ...payload, comment_id: inMemoryCommentIdSeq++, created_at: now };
  inMemoryComments.push(comment);
  return res.status(201).json({ success: true, comment });
});

app.delete('/api/forum/roommates/comments/:id', authenticateToken, async (req, res) => {
  const commentId = Number(req.params.id);

  if (forumDb) {
    try {
      const existing = await forumDb.selectFrom('roommate_post_comments').selectAll().where('comment_id', '=', commentId).executeTakeFirst();
      if (!existing) return res.status(404).json({ error: 'Comment not found.' });
      if (existing.user_id !== req.user.userId) return res.status(403).json({ error: 'Not authorized.' });
      await deleteComment(forumDb, commentId);
      return res.json({ success: true, deleted_id: commentId });
    } catch (err) {
      console.warn('[UniVerse Forum] deleteComment DB error:', err.message);
      return res.status(500).json({ error: 'Failed to delete comment.' });
    }
  }

  const idx = inMemoryComments.findIndex((c) => c.comment_id === commentId);
  if (idx === -1) return res.status(404).json({ error: 'Comment not found.' });
  if (inMemoryComments[idx].user_id !== req.user.userId) return res.status(403).json({ error: 'Not authorized.' });
  // Also remove child replies
  const idsToRemove = new Set([commentId]);
  let changed = true;
  while (changed) {
    changed = false;
    for (const c of inMemoryComments) {
      if (idsToRemove.has(c.parent_comment_id) && !idsToRemove.has(c.comment_id)) {
        idsToRemove.add(c.comment_id);
        changed = true;
      }
    }
  }
  inMemoryComments = inMemoryComments.filter((c) => !idsToRemove.has(c.comment_id));
  return res.json({ success: true, deleted_id: commentId });
});

app.listen(PORT, () => {
  console.log(`[UniVerse Server] Express backend running on http://localhost:${PORT}`);
  console.log(`[UniVerse Server] Google OAuth Client ID: ${GOOGLE_CLIENT_ID ? 'Loaded' : 'Not configured'}`);
});
