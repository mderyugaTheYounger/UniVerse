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
 * Roommate Preferences table schema
 * Represents living habit preferences set by a student for roommate matching.
 * Enforces a one-to-one (optional) relationship with a user (USER ||--o| ROOMMATE_PREFERENCE in ERD).
 */
export interface RoommatePreferenceTable {
  /** Unique roommate preference record identifier */
  preference_id: Generated<number>;
  /** User identifier association (unique: one preference profile per user) */
  user_id: number;
  /** Maximum monthly rent budget in USD */
  budget_max: number | null;
  /** Sleep schedule preference (e.g. 'early_bird', 'night_owl', 'flexible') */
  sleep_schedule: string | null;
  /** Cleanliness preference (e.g. 'neat', 'moderate', 'relaxed') */
  cleanliness: string | null;
  /** Whether living with pets is acceptable */
  pets_ok: Generated<boolean>;
  /** Whether living with smoking/smokers is acceptable */
  smoking_ok: Generated<boolean>;
  /** Timestamp when the preference record was created */
  created_at: Generated<Date>;
  /** Timestamp when the preference record was last updated */
  updated_at: Generated<Date>;
}

// ============================================================================
// Database Interface
// ============================================================================

/**
 * Database schema definition for Roommate entities using Kysely.
 * Supports both plural and singular table names for convenience and ERD alignment.
 */
export interface RoommateDatabase {
  // Plural table names (standard SQL convention)
  roommate_preferences: RoommatePreferenceTable;

  // Singular names (matching ERD entities; created as views)
  roommate_preference: RoommatePreferenceTable;
}

/** Convenience aliases for RoommateDatabase */
export type Database = RoommateDatabase;
export type DB = RoommateDatabase;

// ============================================================================
// Selectable / Insertable / Updateable Row Types
// ============================================================================

export type RoommatePreference = Selectable<RoommatePreferenceTable>;
export type NewRoommatePreference = Insertable<RoommatePreferenceTable>;
export type RoommatePreferenceUpdate = Updateable<RoommatePreferenceTable>;

/** Filter and search options for the roommate finder feature */
export interface RoommateFilterOptions {
  /** Exclude a specific user from the results (e.g. the searching user) */
  excludeUserId?: number;
  /** Minimum monthly budget filter */
  minBudget?: number;
  /** Maximum monthly budget filter */
  maxBudget?: number;
  /** Filter by sleep schedule (e.g. 'early_bird', 'night_owl', 'flexible') */
  sleepSchedule?: string;
  /** Filter by cleanliness preference (e.g. 'neat', 'moderate', 'relaxed') */
  cleanliness?: string;
  /** Filter by pet friendliness */
  petsOk?: boolean;
  /** Filter by smoking friendliness */
  smokingOk?: boolean;
  /** Maximum number of records to return */
  limit?: number;
  /** Pagination offset */
  offset?: number;
}

// ============================================================================
// Schema Migration & DDL Functions for PostgreSQL
// ============================================================================

/**
 * Migration up: creates PostgreSQL tables, constraints, indexes, and views for Roommate domain.
 */
export async function up(db: Kysely<any>): Promise<void> {
  // 1. Roommate preferences table
  await db.schema
    .createTable('roommate_preferences')
    .ifNotExists()
    .addColumn('preference_id', 'serial', (col) => col.primaryKey())
    .addColumn('user_id', 'integer', (col) => col.notNull())
    .addColumn('budget_max', 'integer')
    .addColumn('sleep_schedule', 'varchar(50)')
    .addColumn('cleanliness', 'varchar(50)')
    .addColumn('pets_ok', 'boolean', (col) => col.defaultTo(false).notNull())
    .addColumn('smoking_ok', 'boolean', (col) => col.defaultTo(false).notNull())
    .addColumn('created_at', 'timestamptz', (col) =>
      col.defaultTo(sql`CURRENT_TIMESTAMP`).notNull()
    )
    .addColumn('updated_at', 'timestamptz', (col) =>
      col.defaultTo(sql`CURRENT_TIMESTAMP`).notNull()
    )
    .addCheckConstraint(
      'chk_roommate_pref_valid_budget',
      sql`budget_max IS NULL OR budget_max >= 0`
    )
    .execute();

  // Unique constraint for 1-to-1 relationship between User and Roommate Preference (USER ||--o| ROOMMATE_PREFERENCE)
  await db.schema
    .createIndex('idx_roommate_preferences_user_unique')
    .ifNotExists()
    .on('roommate_preferences')
    .column('user_id')
    .unique()
    .execute();

  // Index on budget_max for range queries
  await db.schema
    .createIndex('idx_roommate_preferences_budget_max')
    .ifNotExists()
    .on('roommate_preferences')
    .column('budget_max')
    .execute();

  // Views for compatibility with singular ERD entity name (ROOMMATE_PREFERENCE)
  await db.schema
    .createView('roommate_preference')
    .orReplace()
    .as(db.selectFrom('roommate_preferences').selectAll())
    .execute();
}

/**
 * Migration down: drops views and tables in reverse dependency order.
 */
export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropView('roommate_preference').ifExists().execute();
  await db.schema.dropTable('roommate_preferences').ifExists().cascade().execute();
}

/** Alias functions for schema creation and teardown */
export const createRoommateSchema = up;
export const dropRoommateSchema = down;

/** Kysely Migration object export */
export const roommateMigration: Migration = {
  up,
  down,
};

// ============================================================================
// Kysely Postgres Client Helper
// ============================================================================

/**
 * Creates and configures a Kysely instance connected to PostgreSQL for RoommateDatabase.
 *
 * @param config - PostgreSQL PoolConfig, connection string URI, or existing pg.Pool instance.
 *                 Defaults to ROOMMATE_DATABASE_URL environment variable if omitted.
 * @returns Fully typed Kysely<RoommateDatabase> instance
 *
 * @example
 * ```ts
 * const db = createRoommateDB({
 *   connectionString: process.env.ROOMMATE_DATABASE_URL,
 * });
 *
 * const prefs = await db.selectFrom('roommate_preferences').selectAll().execute();
 * ```
 */
export function createRoommateDB(config?: PoolConfig | string | Pool): Kysely<RoommateDatabase> {
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
        process.env.ROOMMATE_DATABASE_URL ||
        'postgres://app_user:change-me@localhost:5435/roommate_db',
    });
  }

  return new Kysely<RoommateDatabase>({
    dialect: new PostgresDialect({
      pool,
    }),
  });
}

// ============================================================================
// Query Helper Functions
// ============================================================================

/**
 * Retrieves roommate preferences for a specific user.
 *
 * @param db - Kysely RoommateDatabase instance
 * @param userId - Target user identifier
 * @returns RoommatePreference record or undefined if not set
 */
export async function getRoommatePreferenceByUserId(
  db: Kysely<RoommateDatabase>,
  userId: number
): Promise<RoommatePreference | undefined> {
  return await db
    .selectFrom('roommate_preferences')
    .selectAll()
    .where('user_id', '=', userId)
    .executeTakeFirst();
}

/**
 * Retrieves roommate preferences by preference record ID.
 *
 * @param db - Kysely RoommateDatabase instance
 * @param preferenceId - Primary key preference identifier
 * @returns RoommatePreference record or undefined if not found
 */
export async function getRoommatePreferenceById(
  db: Kysely<RoommateDatabase>,
  preferenceId: number
): Promise<RoommatePreference | undefined> {
  return await db
    .selectFrom('roommate_preferences')
    .selectAll()
    .where('preference_id', '=', preferenceId)
    .executeTakeFirst();
}

/**
 * Inserts or updates (upserts) roommate preferences for a user.
 * If preferences for the user already exist, updates the fields and bumps updated_at.
 *
 * @param db - Kysely RoommateDatabase instance
 * @param preference - New preference values
 * @returns The persisted RoommatePreference row
 */
export async function upsertRoommatePreference(
  db: Kysely<RoommateDatabase>,
  preference: NewRoommatePreference
): Promise<RoommatePreference> {
  return await db
    .insertInto('roommate_preferences')
    .values(preference)
    .onConflict((oc) =>
      oc.column('user_id').doUpdateSet((eb) => ({
        budget_max: preference.budget_max !== undefined ? preference.budget_max : eb.ref('excluded.budget_max'),
        sleep_schedule: preference.sleep_schedule !== undefined ? preference.sleep_schedule : eb.ref('excluded.sleep_schedule'),
        cleanliness: preference.cleanliness !== undefined ? preference.cleanliness : eb.ref('excluded.cleanliness'),
        pets_ok: preference.pets_ok !== undefined ? preference.pets_ok : eb.ref('excluded.pets_ok'),
        smoking_ok: preference.smoking_ok !== undefined ? preference.smoking_ok : eb.ref('excluded.smoking_ok'),
        updated_at: sql`CURRENT_TIMESTAMP`,
      }))
    )
    .returningAll()
    .executeTakeFirstOrThrow();
}

/**
 * Updates an existing roommate preference record by user ID.
 * Automatically updates `updated_at` to the current timestamp.
 *
 * @param db - Kysely RoommateDatabase instance
 * @param userId - Target user identifier
 * @param update - Fields to update
 * @returns The updated RoommatePreference row, or undefined if no record found
 */
export async function updateRoommatePreference(
  db: Kysely<RoommateDatabase>,
  userId: number,
  update: RoommatePreferenceUpdate
): Promise<RoommatePreference | undefined> {
  return await db
    .updateTable('roommate_preferences')
    .set({
      ...update,
      updated_at: sql`CURRENT_TIMESTAMP`,
    })
    .where('user_id', '=', userId)
    .returningAll()
    .executeTakeFirst();
}

/**
 * Deletes a user's roommate preference profile.
 *
 * @param db - Kysely RoommateDatabase instance
 * @param userId - Target user identifier
 * @returns True if a record was deleted, false otherwise
 */
export async function deleteRoommatePreference(
  db: Kysely<RoommateDatabase>,
  userId: number
): Promise<boolean> {
  const result = await db
    .deleteFrom('roommate_preferences')
    .where('user_id', '=', userId)
    .executeTakeFirst();

  return (result.numDeletedRows ?? 0n) > 0n;
}

/**
 * Searches and filters roommate candidates based on living habits and budget.
 *
 * @param db - Kysely RoommateDatabase instance
 * @param filters - Search criteria (budget range, sleep habits, cleanliness, pets, smoking)
 * @returns Array of matching RoommatePreference records sorted by latest update
 */
export async function findRoommateMatches(
  db: Kysely<RoommateDatabase>,
  filters: RoommateFilterOptions = {}
): Promise<RoommatePreference[]> {
  let query = db.selectFrom('roommate_preferences').selectAll();

  if (filters.excludeUserId !== undefined) {
    query = query.where('user_id', '!=', filters.excludeUserId);
  }

  if (filters.minBudget !== undefined) {
    query = query.where((eb) =>
      eb.or([
        eb('budget_max', '>=', filters.minBudget!),
        eb('budget_max', 'is', null),
      ])
    );
  }

  if (filters.maxBudget !== undefined) {
    query = query.where((eb) =>
      eb.or([
        eb('budget_max', '<=', filters.maxBudget!),
        eb('budget_max', 'is', null),
      ])
    );
  }

  if (filters.sleepSchedule !== undefined) {
    query = query.where('sleep_schedule', '=', filters.sleepSchedule);
  }

  if (filters.cleanliness !== undefined) {
    query = query.where('cleanliness', '=', filters.cleanliness);
  }

  if (filters.petsOk !== undefined) {
    query = query.where('pets_ok', '=', filters.petsOk);
  }

  if (filters.smokingOk !== undefined) {
    query = query.where('smoking_ok', '=', filters.smokingOk);
  }

  query = query.orderBy('updated_at', 'desc');

  if (filters.limit !== undefined) {
    query = query.limit(filters.limit);
  }

  if (filters.offset !== undefined) {
    query = query.offset(filters.offset);
  }

  return await query.execute();
}
