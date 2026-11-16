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
// Table Schema Interfaces (as described in UniVerse/docs/ERD.md)
// ============================================================================

/**
 * Course Plan Entries table schema
 * Represents individual courses saved by a user in their course plan.
 * Each entry maps a course to a specific semester/year slot in the user's plan.
 */
export interface CoursePlanEntryTable {
  /** Unique course plan entry identifier */
  entry_id: Generated<number>;
  /** User identifier (references users.user_id) */
  user_id: number;
  /** Course UUID (references courses.course_id) */
  course_id: string;
  /** Academic year number for this course slot (e.g. 1, 2, 3, 4) */
  plan_year: number;
  /** Semester within the academic year (e.g. 'fall', 'spring', 'summer') */
  plan_semester: string;
  /** Optional user notes about this course entry */
  notes: string | null;
  /** Timestamp when the entry was created */
  created_at: Generated<Date>;
}

// ============================================================================
// Database Interface
// ============================================================================

/**
 * Database schema definition for Course Plan entities using Kysely.
 * Supports both plural and singular table names for convenience and ERD alignment.
 */
export interface CoursePlanDatabase {
  // Plural table names (standard SQL convention)
  course_plan_entries: CoursePlanEntryTable;

  // Singular names (matching ERD entities; created as views)
  course_plan_entry: CoursePlanEntryTable;
}

/** Convenience aliases for CoursePlanDatabase */
export type Database = CoursePlanDatabase;
export type DB = CoursePlanDatabase;

// ============================================================================
// Selectable / Insertable / Updateable Row Types
// ============================================================================

export type CoursePlanEntry = Selectable<CoursePlanEntryTable>;
export type NewCoursePlanEntry = Insertable<CoursePlanEntryTable>;
export type CoursePlanEntryUpdate = Updateable<CoursePlanEntryTable>;

// ============================================================================
// Schema Migration & DDL Functions for PostgreSQL
// ============================================================================

/**
 * Migration up: creates PostgreSQL tables, constraints, indexes, and views for Course Plan domain.
 */
export async function up(db: Kysely<any>): Promise<void> {
  // 1. Course plan entries table
  await db.schema
    .createTable('course_plan_entries')
    .ifNotExists()
    .addColumn('entry_id', 'serial', (col) => col.primaryKey())
    .addColumn('user_id', 'integer', (col) => col.notNull())
    .addColumn('course_id', 'uuid', (col) => col.notNull())
    .addColumn('plan_year', 'integer', (col) => col.notNull())
    .addColumn('plan_semester', 'varchar(20)', (col) => col.notNull())
    .addColumn('notes', 'text')
    .addColumn('created_at', 'timestamptz', (col) =>
      col.defaultTo(sql`CURRENT_TIMESTAMP`).notNull()
    )
    .addCheckConstraint('chk_course_plan_valid_year', sql`plan_year >= 1`)
    .addCheckConstraint(
      'chk_course_plan_valid_semester',
      sql`plan_semester IN ('fall', 'spring', 'summer')`
    )
    .execute();

  // Index on user_id for per-user plan lookups
  await db.schema
    .createIndex('idx_course_plan_entries_user_id')
    .ifNotExists()
    .on('course_plan_entries')
    .column('user_id')
    .execute();

  // Index on course_id for reverse lookups
  await db.schema
    .createIndex('idx_course_plan_entries_course_id')
    .ifNotExists()
    .on('course_plan_entries')
    .column('course_id')
    .execute();

  // Unique constraint: a user may only place a given course once per semester slot
  await db.schema
    .createIndex('idx_course_plan_entries_unique_slot')
    .ifNotExists()
    .on('course_plan_entries')
    .columns(['user_id', 'course_id', 'plan_year', 'plan_semester'])
    .unique()
    .execute();

  // View for compatibility with singular ERD entity name
  await db.schema
    .createView('course_plan_entry')
    .orReplace()
    .as(db.selectFrom('course_plan_entries').selectAll())
    .execute();
}

/**
 * Migration down: drops views and tables in reverse dependency order.
 */
export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropView('course_plan_entry').ifExists().execute();
  await db.schema.dropTable('course_plan_entries').ifExists().cascade().execute();
}

/** Alias functions for schema creation and teardown */
export const createCoursePlanSchema = up;
export const dropCoursePlanSchema = down;

/** Kysely Migration object export */
export const coursePlanMigration: Migration = {
  up,
  down,
};

// ============================================================================
// Kysely Postgres Client Helper
// ============================================================================

/**
 * Creates and configures a Kysely instance connected to PostgreSQL for CoursePlanDatabase.
 *
 * @param config - PostgreSQL PoolConfig, connection string URI, or existing pg.Pool instance
 * @returns Fully typed Kysely<CoursePlanDatabase> instance
 *
 * @example
 * ```ts
 * const db = createCoursePlanDB({
 *   connectionString: process.env.COURSE_PLAN_DATABASE_URL,
 * });
 *
 * const entries = await db.selectFrom('course_plan_entries').selectAll().execute();
 * ```
 */
export function createCoursePlanDB(config?: PoolConfig | string | Pool): Kysely<CoursePlanDatabase> {
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
        process.env.COURSE_PLAN_DATABASE_URL ||
        'postgres://app_user:change-me@localhost:5435/course_plan_db',
    });
  }

  return new Kysely<CoursePlanDatabase>({
    dialect: new PostgresDialect({
      pool,
    }),
  });
}

// ============================================================================
// Query Helper Functions
// ============================================================================

/**
 * Retrieves saved course plan entries for a specific user, ordered by academic year and entry ID.
 *
 * @param db - Kysely CoursePlanDatabase instance
 * @param userId - Target user identifier
 * @returns Array of CoursePlanEntry records
 */
export async function getPlanEntriesByUserId(
  db: Kysely<CoursePlanDatabase>,
  userId: number
): Promise<CoursePlanEntry[]> {
  return await db
    .selectFrom('course_plan_entries')
    .selectAll()
    .where('user_id', '=', userId)
    .orderBy('plan_year', 'asc')
    .orderBy('entry_id', 'asc')
    .execute();
}

/**
 * Inserts a new course plan entry for a user.
 *
 * @param db - Kysely CoursePlanDatabase instance
 * @param entry - New course plan entry values
 * @returns The persisted CoursePlanEntry row
 */
export async function createPlanEntry(
  db: Kysely<CoursePlanDatabase>,
  entry: NewCoursePlanEntry
): Promise<CoursePlanEntry> {
  return await db
    .insertInto('course_plan_entries')
    .values(entry)
    .returningAll()
    .executeTakeFirstOrThrow();
}

/**
 * Updates an existing course plan entry by entry ID (e.g. moving year/semester or editing notes).
 *
 * @param db - Kysely CoursePlanDatabase instance
 * @param entryId - Target entry ID
 * @param update - Fields to update
 * @returns The updated CoursePlanEntry row or undefined if not found
 */
export async function updatePlanEntry(
  db: Kysely<CoursePlanDatabase>,
  entryId: number,
  update: CoursePlanEntryUpdate
): Promise<CoursePlanEntry | undefined> {
  return await db
    .updateTable('course_plan_entries')
    .set(update)
    .where('entry_id', '=', entryId)
    .returningAll()
    .executeTakeFirst();
}

/**
 * Deletes a course plan entry by entry ID.
 *
 * @param db - Kysely CoursePlanDatabase instance
 * @param entryId - Target entry ID
 * @returns True if a record was deleted, false otherwise
 */
export async function deletePlanEntry(
  db: Kysely<CoursePlanDatabase>,
  entryId: number
): Promise<boolean> {
  const result = await db
    .deleteFrom('course_plan_entries')
    .where('entry_id', '=', entryId)
    .executeTakeFirst();
  return Number(result.numDeletedRows) > 0;
}

