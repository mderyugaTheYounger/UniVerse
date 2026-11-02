//comment change to the github account issue. previously was using a different account and now using the correct one.
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
 * Represents institutions associated with housing, food places, and students.
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
 * Housing table schema
 * Represents student housing, dorms, or off-campus apartments.
 */
export interface HousingTable {
  /** Unique housing identifier */
  housing_id: Generated<number>;
  /** University foreign key association */
  university_id: number | null;
  /** Name of the housing facility / complex */
  name: string;
  /** Physical street address */
  address: string;
  /** Estimated or base monthly rent in USD */
  monthly_rent: number | null;
  /** Safety / crime index score */
  crime_score: number | null;
  /** Noise level score */
  noise_score: number | null;
}

/**
 * Food Places table schema
 * Represents dining halls, restaurants, and cafes near or on campus.
 */
export interface FoodPlaceTable {
  /** Unique food place identifier */
  food_place_id: Generated<number>;
  /** University foreign key association */
  university_id: number | null;
  /** Name of the eatery */
  name: string;
  /** Cuisine or eatery category (e.g. 'Dining Hall', 'Cafe', 'Fast Food') */
  type: string;
  /** Street address */
  address: string;
}

/**
 * Map Tack table schema
 * Represents geographical map pins associated with either a Housing location or Food Place.
 * Enforces a one-to-one relationship with the pinned entity (|o--o| in ERD).
 */
export interface MapTackTable {
  /** Unique map pin identifier */
  tack_id: Generated<number>;
  /** Foreign key to Housing (nullable if pinning a food place) */
  housing_id: number | null;
  /** Foreign key to Food Place (nullable if pinning housing) */
  food_place_id: number | null;
  /** Latitude coordinate (-90 to 90) */
  latitude: number;
  /** Longitude coordinate (-180 to 180) */
  longitude: number;
}

// ============================================================================
// Database Interface
// ============================================================================

/**
 * Database schema definition for Map Tack entities using Kysely.
 * Supports both plural and singular table names for convenience and ERD alignment.
 */
export interface MapTackDatabase {
  // Plural table names (standard SQL convention)
  universities: UniversityTable;
  housing: HousingTable;
  housings: HousingTable;
  food_places: FoodPlaceTable;
  map_tacks: MapTackTable;

  // Singular table names (matching ERD entities)
  university: UniversityTable;
  food_place: FoodPlaceTable;
  map_tack: MapTackTable;
}

/** Convenience aliases for MapTackDatabase */
export type Database = MapTackDatabase;
export type DB = MapTackDatabase;

// ============================================================================
// Selectable / Insertable / Updateable Row Types
// ============================================================================

export type University = Selectable<UniversityTable>;
export type NewUniversity = Insertable<UniversityTable>;
export type UniversityUpdate = Updateable<UniversityTable>;

export type Housing = Selectable<HousingTable>;
export type NewHousing = Insertable<HousingTable>;
export type HousingUpdate = Updateable<HousingTable>;

export type FoodPlace = Selectable<FoodPlaceTable>;
export type NewFoodPlace = Insertable<FoodPlaceTable>;
export type FoodPlaceUpdate = Updateable<FoodPlaceTable>;

export type MapTack = Selectable<MapTackTable>;
export type NewMapTack = Insertable<MapTackTable>;
export type MapTackUpdate = Updateable<MapTackTable>;

/** Joined Map Tack with optional Housing and FoodPlace entity details */
export interface MapTackWithDetails extends MapTack {
  housing?: Housing | null;
  food_place?: FoodPlace | null;
}

// ============================================================================
// Schema Migration & DDL Functions for PostgreSQL
// ============================================================================

/**
 * Migration up: creates PostgreSQL tables, constraints, indexes, and views for Map Tack domain.
 */
export async function up(db: Kysely<any>): Promise<void> {
  // 1. Universities table (if not already created)
  await db.schema
    .createTable('universities')
    .ifNotExists()
    .addColumn('university_id', 'serial', (col) => col.primaryKey())
    .addColumn('name', 'varchar(255)', (col) => col.notNull())
    .addColumn('email_domain', 'varchar(255)', (col) => col.notNull())
    .addColumn('city', 'varchar(100)', (col) => col.notNull())
    .addColumn('state', 'varchar(50)', (col) => col.notNull())
    .execute();

  // 2. Housing table
  await db.schema
    .createTable('housing')
    .ifNotExists()
    .addColumn('housing_id', 'serial', (col) => col.primaryKey())
    .addColumn('university_id', 'integer', (col) =>
      col.references('universities.university_id').onDelete('set null').onUpdate('cascade')
    )
    .addColumn('name', 'varchar(255)', (col) => col.notNull())
    .addColumn('address', 'varchar(255)', (col) => col.notNull())
    .addColumn('monthly_rent', 'integer')
    .addColumn('crime_score', 'real')
    .addColumn('noise_score', 'real')
    .execute();

  // Index on housing.university_id
  await db.schema
    .createIndex('idx_housing_university_id')
    .ifNotExists()
    .on('housing')
    .column('university_id')
    .execute();

  // 3. Food Places table
  await db.schema
    .createTable('food_places')
    .ifNotExists()
    .addColumn('food_place_id', 'serial', (col) => col.primaryKey())
    .addColumn('university_id', 'integer', (col) =>
      col.references('universities.university_id').onDelete('set null').onUpdate('cascade')
    )
    .addColumn('name', 'varchar(255)', (col) => col.notNull())
    .addColumn('type', 'varchar(100)', (col) => col.notNull())
    .addColumn('address', 'varchar(255)', (col) => col.notNull())
    .execute();

  // Index on food_places.university_id
  await db.schema
    .createIndex('idx_food_places_university_id')
    .ifNotExists()
    .on('food_places')
    .column('university_id')
    .execute();

  // 4. Map Tacks table
  await db.schema
    .createTable('map_tacks')
    .ifNotExists()
    .addColumn('tack_id', 'serial', (col) => col.primaryKey())
    .addColumn('housing_id', 'integer', (col) =>
      col.references('housing.housing_id').onDelete('cascade').onUpdate('cascade')
    )
    .addColumn('food_place_id', 'integer', (col) =>
      col.references('food_places.food_place_id').onDelete('cascade').onUpdate('cascade')
    )
    .addColumn('latitude', 'double precision', (col) => col.notNull())
    .addColumn('longitude', 'double precision', (col) => col.notNull())
    .addCheckConstraint(
      'chk_map_tack_single_target',
      sql`NOT (housing_id IS NOT NULL AND food_place_id IS NOT NULL)`
    )
    .addCheckConstraint(
      'chk_map_tack_valid_latitude',
      sql`latitude >= -90.0 AND latitude <= 90.0`
    )
    .addCheckConstraint(
      'chk_map_tack_valid_longitude',
      sql`longitude >= -180.0 AND longitude <= 180.0`
    )
    .execute();

  // Unique constraint for 1-to-1 relationship between Housing and Map Tack (|o--o|)
  await db.schema
    .createIndex('idx_map_tacks_housing_unique')
    .ifNotExists()
    .on('map_tacks')
    .column('housing_id')
    .unique()
    .execute();

  // Unique constraint for 1-to-1 relationship between Food Place and Map Tack (|o--o|)
  await db.schema
    .createIndex('idx_map_tacks_food_place_unique')
    .ifNotExists()
    .on('map_tacks')
    .column('food_place_id')
    .unique()
    .execute();

  // Spatial coordinates index
  await db.schema
    .createIndex('idx_map_tacks_coordinates')
    .ifNotExists()
    .on('map_tacks')
    .columns(['latitude', 'longitude'])
    .execute();

  // Views for compatibility with singular table names and plural alias
  await db.schema
    .createView('university')
    .orReplace()
    .as(db.selectFrom('universities').selectAll())
    .execute();

  await db.schema
    .createView('housings')
    .orReplace()
    .as(db.selectFrom('housing').selectAll())
    .execute();

  await db.schema
    .createView('food_place')
    .orReplace()
    .as(db.selectFrom('food_places').selectAll())
    .execute();

  await db.schema
    .createView('map_tack')
    .orReplace()
    .as(db.selectFrom('map_tacks').selectAll())
    .execute();
}


/**
 * Migration down: drops views and tables in reverse dependency order.
 */
export async function down(db: Kysely<any>): Promise<void> {
  // Drop views first
  await db.schema.dropView('map_tack').ifExists().execute();
  await db.schema.dropView('food_place').ifExists().execute();
  await db.schema.dropView('housings').ifExists().execute();
  await db.schema.dropView('university').ifExists().execute();

  // Drop tables in reverse topological order (foreign keys cascade)
  await db.schema.dropTable('map_tacks').ifExists().cascade().execute();
  await db.schema.dropTable('food_places').ifExists().cascade().execute();
  await db.schema.dropTable('housing').ifExists().cascade().execute();
  await db.schema.dropTable('universities').ifExists().cascade().execute();
}

/** Alias functions for schema creation and teardown */
export const createMapTackSchema = up;
export const dropMapTackSchema = down;

/** Kysely Migration object export */
export const mapTackMigration: Migration = {
  up,
  down,
};

// ============================================================================
// Kysely Postgres Client Helper
// ============================================================================

/**
 * Creates and configures a Kysely instance connected to PostgreSQL for MapTackDatabase.
 *
 * @param config - PostgreSQL PoolConfig, connection string URI, or existing pg.Pool instance
 * @returns Fully typed Kysely<MapTackDatabase> instance
 *
 * @example
 * ```ts
 * const db = createMapTackDB({
 *   connectionString: process.env.DATABASE_URL,
 * });
 *
 * const tacks = await db.selectFrom('map_tacks').selectAll().execute();
 * ```
 */
export function createMapTackDB(config?: PoolConfig | string | Pool): Kysely<MapTackDatabase> {
  let pool: Pool;
  if (config instanceof Pool) {
    pool = config;
  } else if (typeof config === 'string') {
    pool = new Pool({ connectionString: config });
  } else {
    pool = new Pool(config);
  }

  return new Kysely<MapTackDatabase>({
    dialect: new PostgresDialect({
      pool,
    }),
  });
}

// ============================================================================
// Query Helper Functions
// ============================================================================

/**
 * Retrieves all map tacks with optional filtering by coordinates bounding box.
 */
export async function getMapTacksInBounds(
  db: Kysely<MapTackDatabase>,
  bounds: { minLat: number; maxLat: number; minLng: number; maxLng: number }
): Promise<MapTack[]> {
  return await db
    .selectFrom('map_tacks')
    .selectAll()
    .where('latitude', '>=', bounds.minLat)
    .where('latitude', '<=', bounds.maxLat)
    .where('longitude', '>=', bounds.minLng)
    .where('longitude', '<=', bounds.maxLng)
    .execute();
}

/**
 * Retrieves a map tack by tack ID along with its pinned entity (housing or food place).
 */
export async function getMapTackWithDetails(
  db: Kysely<MapTackDatabase>,
  tackId: number
): Promise<MapTackWithDetails | undefined> {
  const tack = await db
    .selectFrom('map_tacks')
    .selectAll()
    .where('tack_id', '=', tackId)
    .executeTakeFirst();

  if (!tack) {
    return undefined;
  }

  let housing: Housing | null = null;
  let foodPlace: FoodPlace | null = null;

  if (tack.housing_id !== null) {
    housing =
      (await db
        .selectFrom('housing')
        .selectAll()
        .where('housing_id', '=', tack.housing_id)
        .executeTakeFirst()) ?? null;
  }

  if (tack.food_place_id !== null) {
    foodPlace =
      (await db
        .selectFrom('food_places')
        .selectAll()
        .where('food_place_id', '=', tack.food_place_id)
        .executeTakeFirst()) ?? null;
  }

  return {
    ...tack,
    housing,
    food_place: foodPlace,
  };
}

