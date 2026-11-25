import {
  type Generated,
  type Selectable,
  type Insertable,
  type Updateable,
  Kysely,
  PostgresDialect,
  sql,
} from 'kysely';
import type { Migration } from 'kysely/migration';
import { Pool, type PoolConfig } from 'pg';

// ============================================================================
// Types
// ============================================================================

export type ReviewTargetType = 'map_tack' | 'course' | 'major' | 'minor' | 'course_plan';
export type HousingStatus = 'have_place' | 'need_place' | 'flexible';
export type SleepSchedule = 'early_bird' | 'night_owl' | 'flexible';
export type CleanlinessLevel = 'neat' | 'moderate' | 'relaxed';
export type PostStatus = 'open' | 'closed';

// ============================================================================
// Table Schema Interfaces
// ============================================================================

/**
 * Reviews table schema.
 * A single polymorphic review table covering all reviewable targets:
 *   map_tack (tack_id), course (course_id UUID), major (major_id UUID),
 *   minor (minor_id UUID), course_plan (plan_id integer stored as string).
 * One review per user per target enforced by unique index.
 */
export interface ReviewTable {
  review_id: Generated<number>;
  /** References users.user_id in user-db */
  user_id: number;
  target_type: ReviewTargetType;
  /** Stores the PK of the target as a string (cast integers/UUIDs uniformly) */
  target_id: string;
  rating: number;
  title: string | null;
  comment: string;
  created_at: Generated<Date>;
  updated_at: Generated<Date>;
}

/**
 * User-published course plans table schema.
 * Users can share their semester-by-semester course plan for the community
 * to view and review. plan_data stores the plan as a JSONB array:
 * [{ year: number, semester: 'fall'|'spring'|'summer', courses: uuid[] }]
 */
export interface PostedCoursePlanTable {
  plan_id: Generated<number>;
  /** References users.user_id in user-db */
  user_id: number;
  title: string;
  description: string | null;
  /** References majors.major_id in course-db (nullable) */
  major_id: string | null;
  plan_data: unknown;
  is_public: Generated<boolean>;
  created_at: Generated<Date>;
  updated_at: Generated<Date>;
}

/**
 * Roommate-finder forum posts table schema.
 * Unlike the existing roommate_preferences (passive matching),
 * these are active listings authored and posted by users seeking roommates.
 */
export interface RoommatePostTable {
  post_id: Generated<number>;
  /** References users.user_id in user-db */
  user_id: number;
  title: string;
  description: string;
  budget_max: number | null;
  housing_status: HousingStatus | null;
  location_preference: string | null;
  move_in_term: string | null;
  sleep_schedule: SleepSchedule | null;
  cleanliness: CleanlinessLevel | null;
  pets_ok: Generated<boolean>;
  smoking_ok: Generated<boolean>;
  contact_info: string | null;
  status: Generated<PostStatus>;
  created_at: Generated<Date>;
  updated_at: Generated<Date>;
}

/**
 * Roommate post comments table schema.
 * Supports nested threading via self-referential parent_comment_id.
 */
export interface RoommatePostCommentTable {
  comment_id: Generated<number>;
  post_id: number;
  /** References users.user_id in user-db */
  user_id: number;
  parent_comment_id: number | null;
  content: string;
  created_at: Generated<Date>;
}

// ============================================================================
// Database Interface
// ============================================================================

export interface ForumDatabase {
  reviews: ReviewTable;
  posted_course_plans: PostedCoursePlanTable;
  roommate_posts: RoommatePostTable;
  roommate_post_comments: RoommatePostCommentTable;
}

export type Database = ForumDatabase;
export type DB = ForumDatabase;

// ============================================================================
// Selectable / Insertable / Updateable Row Types
// ============================================================================

export type Review = Selectable<ReviewTable>;
export type NewReview = Insertable<ReviewTable>;
export type ReviewUpdate = Updateable<ReviewTable>;

export type PostedCoursePlan = Selectable<PostedCoursePlanTable>;
export type NewPostedCoursePlan = Insertable<PostedCoursePlanTable>;
export type PostedCoursePlanUpdate = Updateable<PostedCoursePlanTable>;

export type RoommatePost = Selectable<RoommatePostTable>;
export type NewRoommatePost = Insertable<RoommatePostTable>;
export type RoommatePostUpdate = Updateable<RoommatePostTable>;

export type RoommatePostComment = Selectable<RoommatePostCommentTable>;
export type NewRoommatePostComment = Insertable<RoommatePostCommentTable>;

// ============================================================================
// Schema Migration & DDL
// ============================================================================

export async function up(db: Kysely<any>): Promise<void> {
  // 1. Reviews (polymorphic: one table for all target types)
  await db.schema
    .createTable('reviews')
    .ifNotExists()
    .addColumn('review_id', 'serial', (col) => col.primaryKey())
    .addColumn('user_id', 'integer', (col) => col.notNull())
    .addColumn('target_type', 'varchar(20)', (col) => col.notNull())
    .addColumn('target_id', 'varchar(64)', (col) => col.notNull())
    .addColumn('rating', 'smallint', (col) => col.notNull())
    .addColumn('title', 'varchar(150)')
    .addColumn('comment', 'text', (col) => col.notNull())
    .addColumn('created_at', 'timestamptz', (col) =>
      col.defaultTo(sql`CURRENT_TIMESTAMP`).notNull()
    )
    .addColumn('updated_at', 'timestamptz', (col) =>
      col.defaultTo(sql`CURRENT_TIMESTAMP`).notNull()
    )
    .addCheckConstraint(
      'chk_reviews_target_type',
      sql`target_type IN ('map_tack', 'course', 'major', 'minor', 'course_plan')`
    )
    .addCheckConstraint('chk_reviews_rating', sql`rating BETWEEN 1 AND 5`)
    .execute();

  await db.schema
    .createIndex('idx_reviews_target')
    .ifNotExists()
    .on('reviews')
    .columns(['target_type', 'target_id'])
    .execute();

  await db.schema
    .createIndex('idx_reviews_user')
    .ifNotExists()
    .on('reviews')
    .column('user_id')
    .execute();

  // Enforce one review per user per target
  await db.schema
    .createIndex('uq_user_target_review')
    .ifNotExists()
    .on('reviews')
    .columns(['user_id', 'target_type', 'target_id'])
    .unique()
    .execute();

  // 2. Posted course plans
  await db.schema
    .createTable('posted_course_plans')
    .ifNotExists()
    .addColumn('plan_id', 'serial', (col) => col.primaryKey())
    .addColumn('user_id', 'integer', (col) => col.notNull())
    .addColumn('title', 'varchar(150)', (col) => col.notNull())
    .addColumn('description', 'text')
    .addColumn('major_id', 'varchar(64)')
    .addColumn('plan_data', 'jsonb', (col) => col.notNull())
    .addColumn('is_public', 'boolean', (col) => col.defaultTo(true).notNull())
    .addColumn('created_at', 'timestamptz', (col) =>
      col.defaultTo(sql`CURRENT_TIMESTAMP`).notNull()
    )
    .addColumn('updated_at', 'timestamptz', (col) =>
      col.defaultTo(sql`CURRENT_TIMESTAMP`).notNull()
    )
    .execute();

  await db.schema
    .createIndex('idx_course_plans_user')
    .ifNotExists()
    .on('posted_course_plans')
    .column('user_id')
    .execute();

  await db.schema
    .createIndex('idx_course_plans_major')
    .ifNotExists()
    .on('posted_course_plans')
    .column('major_id')
    .execute();

  // 3. Roommate forum posts
  await db.schema
    .createTable('roommate_posts')
    .ifNotExists()
    .addColumn('post_id', 'serial', (col) => col.primaryKey())
    .addColumn('user_id', 'integer', (col) => col.notNull())
    .addColumn('title', 'varchar(200)', (col) => col.notNull())
    .addColumn('description', 'text', (col) => col.notNull())
    .addColumn('budget_max', 'integer')
    .addColumn('housing_status', 'varchar(30)')
    .addColumn('location_preference', 'varchar(150)')
    .addColumn('move_in_term', 'varchar(50)')
    .addColumn('sleep_schedule', 'varchar(20)')
    .addColumn('cleanliness', 'varchar(20)')
    .addColumn('pets_ok', 'boolean', (col) => col.defaultTo(false).notNull())
    .addColumn('smoking_ok', 'boolean', (col) => col.defaultTo(false).notNull())
    .addColumn('contact_info', 'varchar(150)')
    .addColumn('status', 'varchar(20)', (col) => col.defaultTo('open').notNull())
    .addColumn('created_at', 'timestamptz', (col) =>
      col.defaultTo(sql`CURRENT_TIMESTAMP`).notNull()
    )
    .addColumn('updated_at', 'timestamptz', (col) =>
      col.defaultTo(sql`CURRENT_TIMESTAMP`).notNull()
    )
    .addCheckConstraint(
      'chk_roommate_posts_housing_status',
      sql`housing_status IS NULL OR housing_status IN ('have_place', 'need_place', 'flexible')`
    )
    .addCheckConstraint(
      'chk_roommate_posts_sleep_schedule',
      sql`sleep_schedule IS NULL OR sleep_schedule IN ('early_bird', 'night_owl', 'flexible')`
    )
    .addCheckConstraint(
      'chk_roommate_posts_cleanliness',
      sql`cleanliness IS NULL OR cleanliness IN ('neat', 'moderate', 'relaxed')`
    )
    .addCheckConstraint(
      'chk_roommate_posts_status',
      sql`status IN ('open', 'closed')`
    )
    .addCheckConstraint(
      'chk_roommate_posts_budget',
      sql`budget_max IS NULL OR budget_max >= 0`
    )
    .execute();

  await db.schema
    .createIndex('idx_roommate_posts_status')
    .ifNotExists()
    .on('roommate_posts')
    .column('status')
    .execute();

  await db.schema
    .createIndex('idx_roommate_posts_budget')
    .ifNotExists()
    .on('roommate_posts')
    .column('budget_max')
    .execute();

  await db.schema
    .createIndex('idx_roommate_posts_user')
    .ifNotExists()
    .on('roommate_posts')
    .column('user_id')
    .execute();

  // 4. Roommate post comments (threaded)
  await db.schema
    .createTable('roommate_post_comments')
    .ifNotExists()
    .addColumn('comment_id', 'serial', (col) => col.primaryKey())
    .addColumn('post_id', 'integer', (col) =>
      col
        .references('roommate_posts.post_id')
        .onDelete('cascade')
        .onUpdate('cascade')
        .notNull()
    )
    .addColumn('user_id', 'integer', (col) => col.notNull())
    .addColumn('parent_comment_id', 'integer', (col) =>
      col.references('roommate_post_comments.comment_id').onDelete('cascade')
    )
    .addColumn('content', 'text', (col) => col.notNull())
    .addColumn('created_at', 'timestamptz', (col) =>
      col.defaultTo(sql`CURRENT_TIMESTAMP`).notNull()
    )
    .execute();

  await db.schema
    .createIndex('idx_roommate_comments_post')
    .ifNotExists()
    .on('roommate_post_comments')
    .column('post_id')
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable('roommate_post_comments').ifExists().cascade().execute();
  await db.schema.dropTable('roommate_posts').ifExists().cascade().execute();
  await db.schema.dropTable('posted_course_plans').ifExists().cascade().execute();
  await db.schema.dropTable('reviews').ifExists().cascade().execute();
}

export const createForumSchema = up;
export const dropForumSchema = down;

export const forumMigration: Migration = { up, down };

// ============================================================================
// Kysely Postgres Client Helper
// ============================================================================

/**
 * Creates a Kysely instance connected to the forum PostgreSQL database.
 * @param config - Connection string URI, PoolConfig object, or existing Pool.
 * @returns Fully typed Kysely<ForumDatabase> instance.
 */
export function createForumDB(config?: PoolConfig | string | Pool): Kysely<ForumDatabase> {
  let pool: Pool;
  if (config instanceof Pool) {
    pool = config;
  } else if (typeof config === 'string') {
    pool = new Pool({ connectionString: config });
  } else if (config) {
    pool = new Pool(config);
  } else {
    pool = new Pool({
      connectionString:
        process.env.FORUM_DATABASE_URL ||
        'postgres://app_user:change-me@localhost:5437/forum_db',
    });
  }

  return new Kysely<ForumDatabase>({
    dialect: new PostgresDialect({ pool }),
  });
}

// ============================================================================
// Query Helpers – Reviews
// ============================================================================

export interface ReviewSummary {
  target_type: ReviewTargetType;
  target_id: string;
  avg_rating: number;
  count: number;
}

/** Create a new review. Throws on duplicate (user already reviewed this target). */
export async function createReview(
  db: Kysely<ForumDatabase>,
  review: NewReview
): Promise<Review> {
  return await db
    .insertInto('reviews')
    .values(review)
    .returningAll()
    .executeTakeFirstOrThrow();
}

/** Paginated list of reviews for a specific target. */
export async function getReviewsByTarget(
  db: Kysely<ForumDatabase>,
  targetType: ReviewTargetType,
  targetId: string,
  limit = 20,
  offset = 0
): Promise<{ reviews: Review[]; total: number }> {
  const baseQuery = db
    .selectFrom('reviews')
    .where('target_type', '=', targetType)
    .where('target_id', '=', targetId);

  const reviews = await baseQuery
    .selectAll()
    .orderBy('created_at', 'desc')
    .limit(limit)
    .offset(offset)
    .execute();

  const countResult = await baseQuery
    .select(db.fn.countAll<number>().as('count'))
    .executeTakeFirstOrThrow();

  return { reviews, total: Number(countResult.count) };
}

/** Aggregate rating summary for a target. */
export async function getReviewSummary(
  db: Kysely<ForumDatabase>,
  targetType: ReviewTargetType,
  targetId: string
): Promise<ReviewSummary> {
  const result = await db
    .selectFrom('reviews')
    .where('target_type', '=', targetType)
    .where('target_id', '=', targetId)
    .select([
      db.fn.avg<number>('rating').as('avg_rating'),
      db.fn.countAll<number>().as('count'),
    ])
    .executeTakeFirstOrThrow();

  return {
    target_type: targetType,
    target_id: targetId,
    avg_rating: result.avg_rating ? Number(Number(result.avg_rating).toFixed(2)) : 0,
    count: Number(result.count),
  };
}

/** Update a review. Caller must verify ownership before calling. */
export async function updateReview(
  db: Kysely<ForumDatabase>,
  reviewId: number,
  update: ReviewUpdate
): Promise<Review | undefined> {
  return await db
    .updateTable('reviews')
    .set({ ...update, updated_at: new Date() })
    .where('review_id', '=', reviewId)
    .returningAll()
    .executeTakeFirst();
}

/** Delete a review. Caller must verify ownership before calling. */
export async function deleteReview(
  db: Kysely<ForumDatabase>,
  reviewId: number
): Promise<number | undefined> {
  const result = await db
    .deleteFrom('reviews')
    .where('review_id', '=', reviewId)
    .returning('review_id')
    .executeTakeFirst();
  return result?.review_id;
}

// ============================================================================
// Query Helpers – Posted Course Plans
// ============================================================================

/** Publish a course plan to the community forum. */
export async function createPostedCoursePlan(
  db: Kysely<ForumDatabase>,
  plan: NewPostedCoursePlan
): Promise<PostedCoursePlan> {
  return await db
    .insertInto('posted_course_plans')
    .values(plan)
    .returningAll()
    .executeTakeFirstOrThrow();
}

/** Paginated list of public course plans, optionally filtered by major. */
export async function getPostedCoursePlans(
  db: Kysely<ForumDatabase>,
  majorId?: string,
  limit = 20,
  offset = 0
): Promise<{ plans: PostedCoursePlan[]; total: number }> {
  let baseQuery = db
    .selectFrom('posted_course_plans')
    .where('is_public', '=', true);

  if (majorId) {
    baseQuery = baseQuery.where('major_id', '=', majorId);
  }

  const plans = await baseQuery
    .selectAll()
    .orderBy('created_at', 'desc')
    .limit(limit)
    .offset(offset)
    .execute();

  const countResult = await baseQuery
    .select(db.fn.countAll<number>().as('count'))
    .executeTakeFirstOrThrow();

  return { plans, total: Number(countResult.count) };
}

/** Get a single posted course plan by ID. */
export async function getPostedCoursePlanById(
  db: Kysely<ForumDatabase>,
  planId: number
): Promise<PostedCoursePlan | undefined> {
  return await db
    .selectFrom('posted_course_plans')
    .selectAll()
    .where('plan_id', '=', planId)
    .executeTakeFirst();
}

/** Delete a posted course plan. Cascades review deletion via target_id references. */
export async function deletePostedCoursePlan(
  db: Kysely<ForumDatabase>,
  planId: number
): Promise<number | undefined> {
  const result = await db
    .deleteFrom('posted_course_plans')
    .where('plan_id', '=', planId)
    .returning('plan_id')
    .executeTakeFirst();
  return result?.plan_id;
}

// ============================================================================
// Query Helpers – Roommate Forum Posts
// ============================================================================

export interface RoommatePostFilterOptions {
  status?: PostStatus;
  maxBudget?: number;
  sleepSchedule?: SleepSchedule;
  cleanliness?: CleanlinessLevel;
  petsOk?: boolean;
  smokingOk?: boolean;
  limit?: number;
  offset?: number;
}

/** Create a new roommate forum post. */
export async function createRoommatePost(
  db: Kysely<ForumDatabase>,
  post: NewRoommatePost
): Promise<RoommatePost> {
  return await db
    .insertInto('roommate_posts')
    .values(post)
    .returningAll()
    .executeTakeFirstOrThrow();
}

/** Paginated, filtered list of roommate posts. */
export async function queryRoommatePosts(
  db: Kysely<ForumDatabase>,
  filters: RoommatePostFilterOptions = {}
): Promise<{ posts: RoommatePost[]; total: number }> {
  const { status = 'open', maxBudget, sleepSchedule, cleanliness, petsOk, smokingOk, limit = 20, offset = 0 } = filters;

  let baseQuery = db.selectFrom('roommate_posts').where('status', '=', status);

  if (maxBudget !== undefined) {
    baseQuery = baseQuery.where((eb) =>
      eb.or([
        eb('budget_max', 'is', null),
        eb('budget_max', '<=', maxBudget),
      ])
    );
  }
  if (sleepSchedule) baseQuery = baseQuery.where('sleep_schedule', '=', sleepSchedule);
  if (cleanliness) baseQuery = baseQuery.where('cleanliness', '=', cleanliness);
  if (petsOk !== undefined) baseQuery = baseQuery.where('pets_ok', '=', petsOk);
  if (smokingOk !== undefined) baseQuery = baseQuery.where('smoking_ok', '=', smokingOk);

  const posts = await baseQuery
    .selectAll()
    .orderBy('created_at', 'desc')
    .limit(limit)
    .offset(offset)
    .execute();

  const countResult = await baseQuery
    .select(db.fn.countAll<number>().as('count'))
    .executeTakeFirstOrThrow();

  return { posts, total: Number(countResult.count) };
}

/** Get a single roommate post with its comments. */
export async function getRoommatePostById(
  db: Kysely<ForumDatabase>,
  postId: number
): Promise<{ post: RoommatePost; comments: RoommatePostComment[] } | undefined> {
  const post = await db
    .selectFrom('roommate_posts')
    .selectAll()
    .where('post_id', '=', postId)
    .executeTakeFirst();

  if (!post) return undefined;

  const comments = await db
    .selectFrom('roommate_post_comments')
    .selectAll()
    .where('post_id', '=', postId)
    .orderBy('created_at', 'asc')
    .execute();

  return { post, comments };
}

/** Update a roommate post (e.g. status, description). Caller must verify ownership. */
export async function updateRoommatePost(
  db: Kysely<ForumDatabase>,
  postId: number,
  update: RoommatePostUpdate
): Promise<RoommatePost | undefined> {
  return await db
    .updateTable('roommate_posts')
    .set({ ...update, updated_at: new Date() })
    .where('post_id', '=', postId)
    .returningAll()
    .executeTakeFirst();
}

/** Delete a roommate post (cascades to comments). Caller must verify ownership. */
export async function deleteRoommatePost(
  db: Kysely<ForumDatabase>,
  postId: number
): Promise<number | undefined> {
  const result = await db
    .deleteFrom('roommate_posts')
    .where('post_id', '=', postId)
    .returning('post_id')
    .executeTakeFirst();
  return result?.post_id;
}

/** Add a comment (or reply) to a roommate post. */
export async function addCommentToPost(
  db: Kysely<ForumDatabase>,
  comment: NewRoommatePostComment
): Promise<RoommatePostComment> {
  return await db
    .insertInto('roommate_post_comments')
    .values(comment)
    .returningAll()
    .executeTakeFirstOrThrow();
}

/** Delete a comment. Cascades to child replies. Caller must verify ownership. */
export async function deleteComment(
  db: Kysely<ForumDatabase>,
  commentId: number
): Promise<number | undefined> {
  const result = await db
    .deleteFrom('roommate_post_comments')
    .where('comment_id', '=', commentId)
    .returning('comment_id')
    .executeTakeFirst();
  return result?.comment_id;
}
