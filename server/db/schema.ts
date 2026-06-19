/**
 * Drizzle schema for the math-atlas backend.
 *
 * The `user` / `session` / `account` / `verification` tables match better-auth's
 * expected Drizzle schema (see better-auth docs) and are managed by the auth
 * library. The remaining tables are app-owned; some are created now but only
 * exercised in later phases (see the backend plan):
 *   - maps, map_sources ........ Phase 2 (persist & sync edits)
 *   - user_progress ............ Phase 3 (accounts + progress)
 *   - map_collaborators ........ Phase 4 (collaborative editing)
 */
import { boolean, integer, jsonb, pgEnum, pgTable, primaryKey, text, timestamp, unique } from "drizzle-orm/pg-core";

// ---------------------------------------------------------------------------
// better-auth tables
// ---------------------------------------------------------------------------

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified")
    .$defaultFn(() => false)
    .notNull(),
  image: text("image"),
  createdAt: timestamp("created_at")
    .$defaultFn(() => new Date())
    .notNull(),
  updatedAt: timestamp("updated_at")
    .$defaultFn(() => new Date())
    .notNull(),
});

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
});

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
});

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").$defaultFn(() => new Date()),
  updatedAt: timestamp("updated_at").$defaultFn(() => new Date()),
});

// ---------------------------------------------------------------------------
// app tables
// ---------------------------------------------------------------------------

export const visibilityEnum = pgEnum("map_visibility", ["private", "unlisted", "public"]);
export const collaboratorRoleEnum = pgEnum("collaborator_role", ["owner", "editor", "viewer"]);

/** A user-owned map (a fork of a shipped map, or a new one). */
export const maps = pgTable(
  "maps",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    ownerId: text("owner_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    /** Stable slug used in URLs / as the loader key (e.g. "topology"). */
    slug: text("slug").notNull(),
    title: text("title").notNull(),
    visibility: visibilityEnum("visibility").notNull().default("private"),
    createdAt: timestamp("created_at")
      .$defaultFn(() => new Date())
      .notNull(),
    updatedAt: timestamp("updated_at")
      .$defaultFn(() => new Date())
      .notNull(),
  },
  // One map per (owner, slug) — a user's working copy of a given shipped map.
  (t) => [unique("maps_owner_slug_unique").on(t.ownerId, t.slug)],
);

/** The edited SourceGraph for a map (validated + built by the server on save). */
export const mapSources = pgTable("map_sources", {
  mapId: text("map_id")
    .primaryKey()
    .references(() => maps.id, { onDelete: "cascade" }),
  source: jsonb("source").notNull(),
  /** Artifact `version` of the shipped map this was branched from. */
  baseVersion: integer("base_version").notNull().default(0),
  updatedAt: timestamp("updated_at")
    .$defaultFn(() => new Date())
    .notNull(),
});

/** Who may access a map, and at what role. Phase 4. */
export const mapCollaborators = pgTable(
  "map_collaborators",
  {
    mapId: text("map_id")
      .notNull()
      .references(() => maps.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    role: collaboratorRoleEnum("role").notNull().default("viewer"),
  },
  (t) => [primaryKey({ columns: [t.mapId, t.userId] })],
);

/** Per-user learning progress on a node. Phase 3. */
export const userProgress = pgTable(
  "user_progress",
  {
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    /** Map key (shipped slug or a `maps.id`); not FK'd so shipped maps work too. */
    mapId: text("map_id").notNull(),
    nodeId: text("node_id").notNull(),
    status: text("status").notNull(),
    updatedAt: timestamp("updated_at")
      .$defaultFn(() => new Date())
      .notNull(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.mapId, t.nodeId] })],
);
