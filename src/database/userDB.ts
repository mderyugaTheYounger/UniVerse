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
 * Universities table schema
 * Represents the institutions that students belong to. Users are linked to a
 * university through their verified email domain.
 */
export interface UniversityTable {
  /** Unique university identifier */
  university_id: Generated<number>;
  /** Official university name */
  name: string;
  /** University email domain (e.g. 'uncc.edu') */
  email_domain: string;
  /** City where the campus is located */
  city: string;
  /** State where the campus is located */
  state: string;
}

/**
 * Users table schema
 * Represents a platform account (login credentials). Never store a plain-text
 * password: `password_hash` must hold a bcrypt/argon2 hash.
 */
export interface UserTable {
  /** Unique user identifier */
  user_id: Generated<number>;
  /** University foreign key association */
  university_id: number;
  /** Login email address (unique) */
  email: string;
  /** Salted password hash (bcrypt/argon2), never the raw password */
  password_hash: string;
  /** Name shown to other users */
  display_name: string;
  /** Account creation timestamp */
  created_at: Generated<Date>;
}

/**
 * Profile table schema
 * Optional public details about a user. Enforces a one-to-one relationship
 * with the user (||--|| in ERD).
 */
export interface ProfileTable {
  /** Unique profile identifier */
  profile_id: Generated<number>;
  /** Foreign key to the owning user (unique: one profile per user) */
  user_id: number;
  /** Short biography */
  bio: string | null;
  /** Free-text list of interests */
  interests: string | null;
  /** Expected graduation year */
  graduation_year: number | null;
}

// ============================================================================
// Database Interface
// ============================================================================

/**
 * Database schema definition for User entities using Kysely.
 * Supports both plural and singular table names for convenience and ERD alignment.
 */
export interface UserDatabase {
  // Plural table names (standard SQL convention)
  universities: UniversityTable;
  users: UserTable;
  profiles: ProfileTable;

  // Singular names (matching ERD entities; created as views)
  university: UniversityTable;
  profile: ProfileTable;
}

/** Convenience aliases for UserDatabase */
export type Database = UserDatabase;
export type DB = UserDatabase;

// ============================================================================
// Selectable / Insertable / Updateable Row Types
// ============================================================================

export type University = Selectable<UniversityTable>;
export type NewUniversity = Insertable<UniversityTable>;
export type UniversityUpdate = Updateable<UniversityTable>;

export type User = Selectable<UserTable>;
export type NewUser = Insertable<UserTable>;
export type UserUpdate = Updateable<UserTable>;

export type Profile = Selectable<ProfileTable>;
export type NewProfile = Insertable<ProfileTable>;
export type ProfileUpdate = Updateable<ProfileTable>;

/** A user without the password hash: safe to return from API responses */
export type PublicUser = Omit<User, 'password_hash'>;

/** Joined User with optional Profile details */
export interface UserWithProfile extends PublicUser {
  profile?: Profile | null;
}

// ============================================================================
// Schema Migration & DDL Functions for PostgreSQL
// ============================================================================

/**
 * Migration up: creates PostgreSQL tables, constraints, indexes, and views for the User domain.
 */
export async function up(db: Kysely<any>): Promise<void> {
  // 1. Universities table
  await db.schema
    .createTable('universities')
    .ifNotExists()
    .addColumn('university_id', 'serial', (col) => col.primaryKey())
    .addColumn('name', 'varchar(255)', (col) => col.notNull())
    .addColumn('email_domain', 'varchar(255)', (col) => col.notNull().unique())
    .addColumn('city', 'varchar(100)', (col) => col.notNull())
    .addColumn('state', 'varchar(50)', (col) => col.notNull())
    .execute();

  // 2. Users table
  await db.schema
    .createTable('users')
    .ifNotExists()
    .addColumn('user_id', 'serial', (col) => col.primaryKey())
    .addColumn('university_id', 'integer', (col) =>
      col
        .references('universities.university_id')
        .onDelete('restrict')
        .onUpdate('cascade')
        .notNull()
    )
    .addColumn('email', 'varchar(255)', (col) => col.notNull().unique())
    .addColumn('password_hash', 'text', (col) => col.notNull())
    .addColumn('display_name', 'varchar(100)', (col) => col.notNull())
    .addColumn('created_at', 'timestamptz', (col) =>
      col.defaultTo(sql`CURRENT_TIMESTAMP`).notNull()
    )
    .execute();

  // Index on users.university_id
  await db.schema
    .createIndex('idx_users_university_id')
    .ifNotExists()
    .on('users')
    .column('university_id')
    .execute();

  // 3. Profiles table
  await db.schema
    .createTable('profiles')
    .ifNotExists()
    .addColumn('profile_id', 'serial', (col) => col.primaryKey())
    .addColumn('user_id', 'integer', (col) =>
      col.references('users.user_id').onDelete('cascade').onUpdate('cascade').notNull()
    )
    .addColumn('bio', 'text')
    .addColumn('interests', 'text')
    .addColumn('graduation_year', 'integer')
    .addCheckConstraint(
      'chk_profile_valid_graduation_year',
      sql`graduation_year IS NULL OR (graduation_year >= 1900 AND graduation_year <= 2200)`
    )
    .execute();

  // Unique constraint for 1-to-1 relationship between User and Profile (||--||)
  await db.schema
    .createIndex('idx_profiles_user_unique')
    .ifNotExists()
    .on('profiles')
    .column('user_id')
    .unique()
    .execute();

  // Views for compatibility with singular ERD entity names.
  // (No view for `user`: it is a reserved word in PostgreSQL.)
  await db.schema
    .createView('university')
    .orReplace()
    .as(db.selectFrom('universities').selectAll())
    .execute();

  await db.schema
    .createView('profile')
    .orReplace()
    .as(db.selectFrom('profiles').selectAll())
    .execute();
}

/**
 * Migration down: drops views and tables in reverse dependency order.
 */
export async function down(db: Kysely<any>): Promise<void> {
  // Drop views first
  await db.schema.dropView('profile').ifExists().execute();
  await db.schema.dropView('university').ifExists().execute();

  // Drop tables in reverse topological order (foreign keys cascade)
  await db.schema.dropTable('profiles').ifExists().cascade().execute();
  await db.schema.dropTable('users').ifExists().cascade().execute();
  await db.schema.dropTable('universities').ifExists().cascade().execute();
}

/** Alias functions for schema creation and teardown */
export const createUserSchema = up;
export const dropUserSchema = down;

/** Kysely Migration object export */
export const userMigration: Migration = {
  up,
  down,
};

// ============================================================================
// Kysely Postgres Client Helper
// ============================================================================

/**
 * Creates and configures a Kysely instance connected to PostgreSQL for UserDatabase.
 *
 * @param config - PostgreSQL PoolConfig, connection string URI, or existing pg.Pool instance
 * @returns Fully typed Kysely<UserDatabase> instance
 *
 * @example
 * ```ts
 * const db = createUserDB({
 *   connectionString: process.env.USER_DATABASE_URL,
 * });
 *
 * const users = await db.selectFrom('users').select(['user_id', 'email']).execute();
 * ```
 */
export function createUserDB(config?: PoolConfig | string | Pool): Kysely<UserDatabase> {
  let pool: Pool;
  if (config instanceof Pool) {
    pool = config;
  } else if (typeof config === 'string') {
    pool = new Pool({ connectionString: config });
  } else {
    pool = new Pool(config);
  }

  return new Kysely<UserDatabase>({
    dialect: new PostgresDialect({
      pool,
    }),
  });
}

// ============================================================================
// Query Helper Functions
// ============================================================================

/**
 * Retrieves a user by email, including the password hash.
 * Intended for login checks only: never return this row to the client.
 */
export async function getUserByEmail(
  db: Kysely<UserDatabase>,
  email: string
): Promise<User | undefined> {
  return await db
    .selectFrom('users')
    .selectAll()
    .where('email', '=', email.toLowerCase())
    .executeTakeFirst();
}

/**
 * Retrieves a user by user ID along with their profile (without the password hash).
 */
export async function getUserWithProfile(
  db: Kysely<UserDatabase>,
  userId: number
): Promise<UserWithProfile | undefined> {
  const user = await db
    .selectFrom('users')
    .select(['user_id', 'university_id', 'email', 'display_name', 'created_at'])
    .where('user_id', '=', userId)
    .executeTakeFirst();

  if (!user) {
    return undefined;
  }

  const profile =
    (await db
      .selectFrom('profiles')
      .selectAll()
      .where('user_id', '=', user.user_id)
      .executeTakeFirst()) ?? null;

  return {
    ...user,
    profile,
  };
}

/**
 * Creates a user and an empty profile in a single transaction, so a user is
 * never left without its profile row. The email is stored lower-cased.
 * `user.password_hash` must already be hashed (bcrypt/argon2).
 */
export async function createUserWithProfile(
  db: Kysely<UserDatabase>,
  user: NewUser,
  profile: Omit<NewProfile, 'user_id'> = {
    bio: null,
    interests: null,
    graduation_year: null,
  }
): Promise<UserWithProfile> {
  return await db.transaction().execute(async (trx) => {
    const created = await trx
      .insertInto('users')
      .values({ ...user, email: user.email.toLowerCase() })
      .returning(['user_id', 'university_id', 'email', 'display_name', 'created_at'])
      .executeTakeFirstOrThrow();

    const createdProfile = await trx
      .insertInto('profiles')
      .values({ ...profile, user_id: created.user_id })
      .returningAll()
      .executeTakeFirstOrThrow();

    return { ...created, profile: createdProfile };
  });
}