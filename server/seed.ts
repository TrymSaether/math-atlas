/**
 * Seed the database with the built-in maps as public/system maps.
 *
 * The authored `src/data/maps/*.source.json` files are the seed input (they stay
 * in the repo as the source of record); this replaces the old build-maps step
 * that bundled `*.json` artifacts into the client. Each source is validated with
 * the same SourceGraphSchema + buildArtifact gate, then upserted as a map owned
 * by the fixed `system` user with `visibility: "public"`. Idempotent.
 *
 * Run with: npm run db:seed
 */
import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { and, eq } from "drizzle-orm";
import { db } from "./db/client";
import { maps, mapSources, user } from "./db/schema";
import { SourceGraphSchema } from "../src/data/sourceSchema";
import { buildArtifact } from "../src/data/buildArtifact";

const SYSTEM_USER_ID = "system";
const MAPS_DIR = fileURLToPath(new URL("../src/data/maps", import.meta.url));

// Curated catalog titles for the built-in maps (the source `label` is verbose).
const CURATED_TITLES: Record<string, string> = {
  topology: "Topology",
  fourier_analysis: "Fourier Analysis",
  functional_analysis: "Functional Analysis",
};

async function ensureSystemUser() {
  await db
    .insert(user)
    .values({
      id: SYSTEM_USER_ID,
      name: "Math Atlas",
      email: "system@math-atlas.local",
      emailVerified: true,
    })
    .onConflictDoNothing({ target: user.id });
}

async function upsertSystemMap(slug: string, title: string, source: unknown, version: number) {
  await db.transaction(async (tx) => {
    const [existing] = await tx
      .select({ id: maps.id })
      .from(maps)
      .where(and(eq(maps.ownerId, SYSTEM_USER_ID), eq(maps.slug, slug)))
      .limit(1);

    const now = new Date();
    if (existing) {
      await tx
        .update(maps)
        .set({ title, visibility: "public", updatedAt: now })
        .where(eq(maps.id, existing.id));
      await tx
        .update(mapSources)
        .set({ source, baseVersion: version, updatedAt: now })
        .where(eq(mapSources.mapId, existing.id));
    } else {
      const [created] = await tx
        .insert(maps)
        .values({ ownerId: SYSTEM_USER_ID, slug, title, visibility: "public" })
        .returning({ id: maps.id });
      await tx.insert(mapSources).values({
        mapId: created.id,
        source,
        baseVersion: version,
        updatedAt: now,
      });
    }
  });
}

async function main() {
  await ensureSystemUser();

  const files = readdirSync(MAPS_DIR).filter((f) => f.endsWith(".source.json"));
  if (files.length === 0) throw new Error(`No *.source.json files in ${MAPS_DIR}`);

  for (const file of files) {
    const raw: unknown = JSON.parse(readFileSync(`${MAPS_DIR}/${file}`, "utf8"));
    const parsed = SourceGraphSchema.safeParse(raw);
    if (!parsed.success) {
      throw new Error(`${file}: invalid source — ${parsed.error.issues[0]?.message}`);
    }
    buildArtifact(parsed.data); // throws on integrity failure
    // Slug = filename (e.g. "fourier_analysis"), matching the historical MapId so
    // persisted state and links keep working — not the source's internal id.
    const slug = file.replace(/\.source\.json$/, "");
    const title = CURATED_TITLES[slug] ?? parsed.data.label;
    await upsertSystemMap(slug, title, parsed.data, parsed.data.version);
    console.log(`seeded public map: ${slug} (v${parsed.data.version})`);
  }

  console.log(`done — ${files.length} map(s) seeded as system/public.`);
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
