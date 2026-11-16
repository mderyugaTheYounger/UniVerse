import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { OAuth2Client } from 'google-auth-library';
import jwt from 'jsonwebtoken';
import { createUserDB, findOrCreateGoogleUser, getUserWithProfile } from '../src/database/userDB.ts';

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

app.listen(PORT, () => {
  console.log(`[UniVerse Server] Express backend running on http://localhost:${PORT}`);
  console.log(`[UniVerse Server] Google OAuth Client ID: ${GOOGLE_CLIENT_ID ? 'Loaded' : 'Not configured'}`);
});
