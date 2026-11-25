import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { DatabaseSync } from 'node:sqlite';
import { MODULES as SEED_MODULES } from './seedData.js';
import type {
  EmployeeContext,
  EpisodeProgress,
  LearningEpisode,
  LearningModule,
} from './types.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const defaultDbPath = resolve(__dirname, '..', 'storage', 'spil-max.sqlite');
export const DB_PATH = process.env.DATABASE_PATH || defaultDbPath;

mkdirSync(dirname(DB_PATH), { recursive: true });

export const db = new DatabaseSync(DB_PATH);
db.exec('PRAGMA journal_mode = WAL;');
db.exec('PRAGMA foreign_keys = ON;');

db.exec(`
  CREATE TABLE IF NOT EXISTS employees (
    employee_id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    role TEXT NOT NULL,
    division TEXT NOT NULL,
    location TEXT NOT NULL,
    annual_target_hours INTEGER NOT NULL DEFAULT 150,
    base_completed_hours REAL NOT NULL DEFAULT 120
  );

  CREATE TABLE IF NOT EXISTS modules (
    id TEXT PRIMARY KEY,
    slug TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    competency TEXT NOT NULL,
    kind TEXT NOT NULL,
    year INTEGER NOT NULL DEFAULT 2026,
    badge TEXT,
    mandatory_from_superior INTEGER NOT NULL DEFAULT 0,
    top_rank INTEGER,
    featured_in_hero INTEGER NOT NULL DEFAULT 0,
    hero_tagline TEXT,
    summary TEXT NOT NULL,
    objectives_json TEXT NOT NULL DEFAULT '[]',
    poster TEXT NOT NULL,
    backdrop TEXT NOT NULL,
    total_duration_text TEXT NOT NULL,
    division TEXT NOT NULL,
    instructors_json TEXT NOT NULL DEFAULT '[]',
    sort_order INTEGER NOT NULL DEFAULT 100,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS episodes (
    id TEXT PRIMARY KEY,
    module_id TEXT NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
    level_number INTEGER NOT NULL DEFAULT 1,
    level_label TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    duration_seconds INTEGER NOT NULL DEFAULT 30,
    duration_text TEXT NOT NULL,
    still TEXT NOT NULL,
    renditions_json TEXT NOT NULL DEFAULT '[]',
    captions_json TEXT NOT NULL DEFAULT '[]',
    chapters_vtt TEXT NOT NULL DEFAULT '',
    intro_end_seconds INTEGER,
    credits_start_seconds INTEGER,
    key_takeaways_json TEXT NOT NULL DEFAULT '[]',
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_episodes_module ON episodes(module_id, level_number);

  CREATE TABLE IF NOT EXISTS playback_progress (
    employee_id TEXT NOT NULL,
    module_id TEXT NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
    module_slug TEXT NOT NULL,
    episode_id TEXT NOT NULL REFERENCES episodes(id) ON DELETE CASCADE,
    position_seconds REAL NOT NULL DEFAULT 0,
    duration_seconds REAL NOT NULL DEFAULT 0,
    hidden_from_continue INTEGER NOT NULL DEFAULT 0,
    updated_at INTEGER NOT NULL,
    PRIMARY KEY (employee_id, module_id, episode_id)
  );

  CREATE TABLE IF NOT EXISTS episode_completions (
    employee_id TEXT NOT NULL,
    module_id TEXT NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
    episode_id TEXT NOT NULL REFERENCES episodes(id) ON DELETE CASCADE,
    completed_at INTEGER NOT NULL,
    PRIMARY KEY (employee_id, module_id, episode_id)
  );

  CREATE TABLE IF NOT EXISTS employee_watchlist (
    employee_id TEXT NOT NULL,
    module_id TEXT NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
    added_at INTEGER NOT NULL,
    PRIMARY KEY (employee_id, module_id)
  );
`);

export const DEFAULT_EMPLOYEE: EmployeeContext = {
  employeeId: 'SPIL-EMP-001',
  name: 'Tri Dewi Rasnani',
  role: 'Operations & People Development',
  division: 'Fleet & Terminal Operations',
  location: 'Surabaya · Tanjung Perak',
  annualTargetHours: 150,
  baseCompletedHours: 120,
};

export function ensureEmployee(emp: EmployeeContext) {
  db.prepare(`
    INSERT INTO employees (employee_id, name, role, division, location, annual_target_hours, base_completed_hours)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(employee_id) DO NOTHING
  `).run(
    emp.employeeId,
    emp.name,
    emp.role,
    emp.division,
    emp.location,
    emp.annualTargetHours,
    emp.baseCompletedHours
  );
}

export function seedInitialCatalogIfEmpty() {
  ensureEmployee(DEFAULT_EMPLOYEE);
  const row = db.prepare('SELECT COUNT(*) as cnt FROM modules').get() as { cnt: number };
  if (row.cnt > 0) return;

  const now = Date.now();
  const insertMod = db.prepare(`
    INSERT INTO modules (
      id, slug, title, competency, kind, year, badge, mandatory_from_superior,
      top_rank, featured_in_hero, hero_tagline, summary, objectives_json,
      poster, backdrop, total_duration_text, division, instructors_json,
      sort_order, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertEp = db.prepare(`
    INSERT INTO episodes (
      id, module_id, level_number, level_label, title, description,
      duration_seconds, duration_text, still, renditions_json, captions_json,
      chapters_vtt, intro_end_seconds, credits_start_seconds, key_takeaways_json,
      created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  SEED_MODULES.forEach((mod, idx) => {
    insertMod.run(
      mod.id,
      mod.slug,
      mod.title,
      mod.competency,
      mod.kind,
      mod.year,
      mod.badge ?? null,
      mod.mandatoryFromSuperior ? 1 : 0,
      mod.topRank ?? null,
      mod.featuredInHero ? 1 : 0,
      mod.heroTagline ?? null,
      mod.summary,
      JSON.stringify(mod.objectives || []),
      mod.poster,
      mod.backdrop,
      mod.totalDurationText,
      mod.division,
      JSON.stringify(mod.instructors || []),
      idx + 1,
      now,
      now
    );

    for (const ep of mod.episodes) {
      insertEp.run(
        ep.id,
        mod.id,
        ep.levelNumber,
        ep.levelLabel,
        ep.title,
        ep.description,
        ep.durationSeconds,
        ep.durationText,
        ep.still,
        JSON.stringify(ep.renditions || []),
        JSON.stringify(ep.captions || []),
        ep.chaptersVtt || '',
        ep.introEndSeconds ?? null,
        ep.creditsStartSeconds ?? null,
        JSON.stringify(ep.keyTakeaways || []),
        now,
        now
      );
    }
  });

  seedDemoEmployeeState(DEFAULT_EMPLOYEE.employeeId);
}

export function seedDemoEmployeeState(employeeId: string) {
  db.prepare('DELETE FROM playback_progress WHERE employee_id = ?').run(employeeId);
  db.prepare('DELETE FROM episode_completions WHERE employee_id = ?').run(employeeId);
  db.prepare('DELETE FROM employee_watchlist WHERE employee_id = ?').run(employeeId);

  const now = Date.now();
  const insProg = db.prepare(`
    INSERT OR REPLACE INTO playback_progress
      (employee_id, module_id, module_slug, episode_id, position_seconds, duration_seconds, hidden_from_continue, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, 0, ?)
  `);
  insProg.run(employeeId, 'port-management', 'port-management', 'pm-l2', 16.5, 30, now - 1000 * 60 * 35);
  insProg.run(employeeId, 'service-excellence', 'service-excellence-complaint-handling', 'se-l1', 11.2, 30, now - 1000 * 60 * 140);
  insProg.run(employeeId, 'interpersonal-agility', 'interpersonal-agility', 'ia-l3', 21.0, 30, now - 1000 * 60 * 320);

  const insComp = db.prepare(`
    INSERT OR IGNORE INTO episode_completions (employee_id, module_id, episode_id, completed_at)
    VALUES (?, ?, ?, ?)
  `);
  for (const [mId, eId] of [
    ['port-management', 'pm-l1'],
    ['interpersonal-agility', 'ia-l1'],
    ['interpersonal-agility', 'ia-l2'],
    ['k3-safety', 'k3-l1'],
  ]) {
    insComp.run(employeeId, mId, eId, now);
  }

  const insList = db.prepare(`
    INSERT OR IGNORE INTO employee_watchlist (employee_id, module_id, added_at)
    VALUES (?, ?, ?)
  `);
  ['k3-safety', 'sizing-up-people', 'administration-lara'].forEach((mId, i) => {
    insList.run(employeeId, mId, now - i * 1000);
  });
}

function parseJsonSafe<T>(raw: unknown, fallback: T): T {
  if (typeof raw !== 'string' || !raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function getAllModules(): LearningModule[] {
  const modRows = db
    .prepare('SELECT * FROM modules ORDER BY sort_order ASC, created_at DESC')
    .all() as Record<string, unknown>[];
  const epRows = db
    .prepare('SELECT * FROM episodes ORDER BY level_number ASC, created_at ASC')
    .all() as Record<string, unknown>[];

  const epByMod = new Map<string, LearningEpisode[]>();
  for (const r of epRows) {
    const modId = String(r.module_id);
    const ep: LearningEpisode = {
      id: String(r.id),
      moduleId: modId,
      levelNumber: Number(r.level_number),
      levelLabel: String(r.level_label),
      title: String(r.title),
      description: String(r.description),
      durationSeconds: Number(r.duration_seconds),
      durationText: String(r.duration_text),
      still: String(r.still),
      renditions: parseJsonSafe(r.renditions_json, []),
      captions: parseJsonSafe(r.captions_json, []),
      chaptersVtt: String(r.chapters_vtt || ''),
      introEndSeconds: r.intro_end_seconds != null ? Number(r.intro_end_seconds) : undefined,
      creditsStartSeconds: r.credits_start_seconds != null ? Number(r.credits_start_seconds) : undefined,
      keyTakeaways: parseJsonSafe(r.key_takeaways_json, []),
    };
    const arr = epByMod.get(modId) || [];
    arr.push(ep);
    epByMod.set(modId, arr);
  }

  return modRows.map((m) => {
    const id = String(m.id);
    return {
      id,
      slug: String(m.slug),
      title: String(m.title),
      competency: String(m.competency),
      kind: String(m.kind) as LearningModule['kind'],
      year: Number(m.year),
      badge: m.badge ? String(m.badge) : undefined,
      mandatoryFromSuperior: Boolean(m.mandatory_from_superior),
      topRank: m.top_rank != null ? Number(m.top_rank) : undefined,
      featuredInHero: Boolean(m.featured_in_hero),
      heroTagline: m.hero_tagline ? String(m.hero_tagline) : undefined,
      summary: String(m.summary),
      objectives: parseJsonSafe(m.objectives_json, []),
      poster: String(m.poster),
      backdrop: String(m.backdrop),
      totalDurationText: String(m.total_duration_text),
      division: String(m.division),
      instructors: parseJsonSafe(m.instructors_json, []),
      episodes: epByMod.get(id) || [],
    };
  });
}

export function getEmployeeState(employeeId: string): {
  progress: Record<string, EpisodeProgress>;
  watchedEpisodes: string[];
  myList: string[];
} {
  const progRows = db
    .prepare('SELECT * FROM playback_progress WHERE employee_id = ?')
    .all(employeeId) as Record<string, unknown>[];

  const progress: Record<string, EpisodeProgress> = {};
  for (const r of progRows) {
    const mId = String(r.module_id);
    const eId = String(r.episode_id);
    progress[`${mId}:${eId}`] = {
      moduleId: mId,
      moduleSlug: String(r.module_slug),
      episodeId: eId,
      currentTime: Number(r.position_seconds),
      duration: Number(r.duration_seconds),
      updatedAt: Number(r.updated_at),
      hiddenFromContinue: Boolean(r.hidden_from_continue),
    };
  }

  const compRows = db
    .prepare('SELECT module_id, episode_id FROM episode_completions WHERE employee_id = ?')
    .all(employeeId) as { module_id: string; episode_id: string }[];
  const watchedEpisodes = compRows.map((c) => `${c.module_id}:${c.episode_id}`);

  const listRows = db
    .prepare('SELECT module_id FROM employee_watchlist WHERE employee_id = ? ORDER BY added_at DESC')
    .all(employeeId) as { module_id: string }[];
  const myList = listRows.map((l) => l.module_id);

  return { progress, watchedEpisodes, myList };
}

seedInitialCatalogIfEmpty();
