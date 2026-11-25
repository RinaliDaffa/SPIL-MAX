import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, extname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import express, { type Request, type Response } from 'express';
import cors from 'cors';
import {
  db,
  DB_PATH,
  DEFAULT_EMPLOYEE,
  ensureEmployee,
  getAllModules,
  getEmployeeState,
  seedDemoEmployeeState,
} from './db.js';
import type { EmployeeContext } from './types.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT || 4000);
const UPLOAD_DIR = process.env.UPLOAD_DIR || resolve(__dirname, '..', 'storage', 'uploads');

mkdirSync(UPLOAD_DIR, { recursive: true });

const app = express();

app.use(
  cors({
    origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : true,
    credentials: true,
  })
);
app.use(express.json({ limit: '10mb' }));

// Serve uploaded MP4 / JPG / VTT files with byte-range (HTTP 206) support for instant video seeking
app.use(
  '/uploads',
  express.static(UPLOAD_DIR, {
    acceptRanges: true,
    maxAge: '7d',
  })
);

function slugify(input: string): string {
  return (input || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * Resolves employee identity from SPIL SSO / Reverse Proxy headers or falls back
 * to the default demo employee in development.
 */
function resolveEmployee(req: Request): EmployeeContext {
  const employeeId = String(req.header('x-employee-id') || DEFAULT_EMPLOYEE.employeeId).trim();
  const name = String(req.header('x-employee-name') || DEFAULT_EMPLOYEE.name).trim();
  const division = String(req.header('x-employee-division') || DEFAULT_EMPLOYEE.division).trim();
  const emp: EmployeeContext = {
    ...DEFAULT_EMPLOYEE,
    employeeId,
    name,
    division,
  };
  ensureEmployee(emp);
  return emp;
}

// ── 1. Health & Readiness Probe (IT DevOps / Docker / K8s) ──────────────────
app.get('/api/health', (_req: Request, res: Response) => {
  const modCount = (db.prepare('SELECT COUNT(*) as c FROM modules').get() as { c: number }).c;
  const epCount = (db.prepare('SELECT COUNT(*) as c FROM episodes').get() as { c: number }).c;
  res.json({
    status: 'ok',
    service: 'spil-max-backend',
    version: '1.0.0',
    database: 'connected',
    dbPath: DB_PATH,
    modules: modCount,
    episodes: epCount,
    uptimeSeconds: Math.round(process.uptime()),
    timestamp: new Date().toISOString(),
  });
});

// ── 2. Employee Profile & Unified Sync State ────────────────────────────────
app.get('/api/me', (req: Request, res: Response) => {
  const emp = resolveEmployee(req);
  res.json(emp);
});

app.get('/api/state', (req: Request, res: Response) => {
  const emp = resolveEmployee(req);
  const state = getEmployeeState(emp.employeeId);
  res.json({
    employee: emp,
    ...state,
  });
});

// ── 3. Catalog & Dynamic Module / Episode CRUD (Studio Kurator) ─────────────
app.get('/api/catalog', (_req: Request, res: Response) => {
  res.json({ modules: getAllModules() });
});

app.get('/api/modules/:slugOrId', (req: Request, res: Response) => {
  const all = getAllModules();
  const found = all.find((m) => m.slug === req.params.slugOrId || m.id === req.params.slugOrId);
  if (!found) {
    res.status(404).json({ error: 'Modul tidak ditemukan' });
    return;
  }
  res.json(found);
});

app.post('/api/modules', (req: Request, res: Response) => {
  const body = req.body || {};
  const title = String(body.title || '').trim();
  const competency = String(body.competency || title).trim();
  const kind = String(body.kind || 'Core').trim();
  const summary = String(body.summary || '').trim();
  const division = String(body.division || 'All Divisions').trim();

  if (!title || !summary) {
    res.status(400).json({ error: 'Judul modul dan ringkasan wajib diisi.' });
    return;
  }

  const baseSlug = slugify(body.slug || title) || `modul-${Date.now()}`;
  const existingSlug = db.prepare('SELECT id FROM modules WHERE slug = ?').get(baseSlug);
  const finalSlug = existingSlug ? `${baseSlug}-${Date.now().toString(36)}` : baseSlug;
  const id = String(body.id || finalSlug);
  const now = Date.now();

  const poster = String(body.poster || '/art/port-management-poster.jpg').trim();
  const backdrop = String(body.backdrop || '/art/port-management-wide.jpg').trim();
  const objectives = Array.isArray(body.objectives)
    ? body.objectives.map(String).filter(Boolean)
    : [];
  const instructors = Array.isArray(body.instructors) && body.instructors.length > 0
    ? body.instructors
    : [{ name: 'Tim Learning SPIL', role: division }];

  db.prepare(`
    INSERT INTO modules (
      id, slug, title, competency, kind, year, badge, mandatory_from_superior,
      top_rank, featured_in_hero, hero_tagline, summary, objectives_json,
      poster, backdrop, total_duration_text, division, instructors_json,
      sort_order, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    finalSlug,
    title,
    competency,
    kind,
    Number(body.year || new Date().getFullYear()),
    body.badge ? String(body.badge).trim() : 'BARU',
    body.mandatoryFromSuperior ? 1 : 0,
    body.topRank != null ? Number(body.topRank) : null,
    body.featuredInHero ? 1 : 0,
    body.heroTagline ? String(body.heroTagline).trim() : summary.slice(0, 140),
    summary,
    JSON.stringify(objectives),
    poster,
    backdrop,
    String(body.totalDurationText || '12 mnt'),
    division,
    JSON.stringify(instructors),
    0, // appear prominently
    now,
    now
  );

  // Optional initial episode if provided in payload
  if (body.initialEpisode && body.initialEpisode.title) {
    const ep = body.initialEpisode;
    const epId = `${id}-l${Number(ep.levelNumber || 1)}-${Date.now().toString(36)}`;
    const videoUrl = String(ep.videoUrl || '/media/spil-demo-720.mp4').trim();
    const isHls = videoUrl.endsWith('.m3u8');
    const renditions = ep.renditions || [
      {
        src: videoUrl,
        type: isHls ? 'application/x-mpegURL' : 'video/mp4',
        label: isHls ? 'Auto HLS' : 'HD',
        height: 720,
      },
    ];
    const captions = ep.captions || [
      { src: '/vtt/core.id.vtt', language: 'id', label: 'Bahasa Indonesia', default: true },
      { src: '/vtt/core.en.vtt', language: 'en', label: 'English' },
    ];

    db.prepare(`
      INSERT INTO episodes (
        id, module_id, level_number, level_label, title, description,
        duration_seconds, duration_text, still, renditions_json, captions_json,
        chapters_vtt, intro_end_seconds, credits_start_seconds, key_takeaways_json,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      epId,
      id,
      Number(ep.levelNumber || 1),
      String(ep.levelLabel || `Level ${Number(ep.levelNumber || 1)} · Dasar`),
      String(ep.title).trim(),
      String(ep.description || summary).trim(),
      Number(ep.durationSeconds || 30),
      String(ep.durationText || '12 mnt'),
      String(ep.still || backdrop),
      JSON.stringify(renditions),
      JSON.stringify(captions),
      String(ep.chaptersVtt || '/vtt/core-chapters.vtt'),
      ep.introEndSeconds != null ? Number(ep.introEndSeconds) : 5,
      ep.creditsStartSeconds != null ? Number(ep.creditsStartSeconds) : null,
      JSON.stringify(Array.isArray(ep.keyTakeaways) ? ep.keyTakeaways : []),
      now,
      now
    );
  }

  const created = getAllModules().find((m) => m.id === id);
  res.status(201).json({ module: created });
});

app.post('/api/modules/:moduleId/episodes', (req: Request, res: Response) => {
  const { moduleId } = req.params;
  const mod = db.prepare('SELECT id, backdrop FROM modules WHERE id = ? OR slug = ?').get(moduleId, moduleId) as
    | { id: string; backdrop: string }
    | undefined;
  if (!mod) {
    res.status(404).json({ error: 'Modul induk tidak ditemukan.' });
    return;
  }

  const body = req.body || {};
  const title = String(body.title || '').trim();
  if (!title) {
    res.status(400).json({ error: 'Judul video level wajib diisi.' });
    return;
  }

  const levelNumber = Number(body.levelNumber || 1);
  const levelLabel = String(body.levelLabel || `Level ${levelNumber}`).trim();
  const videoUrl = String(body.videoUrl || '/media/spil-demo-720.mp4').trim();
  const isHls = videoUrl.endsWith('.m3u8');

  const renditions = Array.isArray(body.renditions) && body.renditions.length > 0
    ? body.renditions
    : [
        {
          src: videoUrl,
          type: isHls ? 'application/x-mpegURL' : 'video/mp4',
          label: isHls ? 'Adaptive HLS' : '720p HD',
          height: 720,
        },
      ];

  const subtitleIdUrl = String(body.subtitleIdUrl || '/vtt/core.id.vtt').trim();
  const captions = Array.isArray(body.captions) && body.captions.length > 0
    ? body.captions
    : [{ src: subtitleIdUrl, language: 'id', label: 'Bahasa Indonesia', default: true }];

  const epId = String(body.id || `${mod.id}-l${levelNumber}-${Date.now().toString(36)}`);
  const now = Date.now();

  db.prepare(`
    INSERT INTO episodes (
      id, module_id, level_number, level_label, title, description,
      duration_seconds, duration_text, still, renditions_json, captions_json,
      chapters_vtt, intro_end_seconds, credits_start_seconds, key_takeaways_json,
      created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    epId,
    mod.id,
    levelNumber,
    levelLabel,
    title,
    String(body.description || '').trim(),
    Number(body.durationSeconds || 30),
    String(body.durationText || '12 mnt').trim(),
    String(body.still || mod.backdrop).trim(),
    JSON.stringify(renditions),
    JSON.stringify(captions),
    String(body.chaptersVtt || '/vtt/core-chapters.vtt').trim(),
    body.introEndSeconds != null ? Number(body.introEndSeconds) : 5,
    body.creditsStartSeconds != null ? Number(body.creditsStartSeconds) : null,
    JSON.stringify(Array.isArray(body.keyTakeaways) ? body.keyTakeaways.filter(Boolean) : []),
    now,
    now
  );

  // Recalculate total episode count duration label on parent module
  const eps = db
    .prepare('SELECT duration_text FROM episodes WHERE module_id = ?')
    .all(mod.id) as { duration_text: string }[];
  const totalMins = eps.reduce((acc, e) => acc + (parseInt(e.duration_text, 10) || 12), 0);
  db.prepare('UPDATE modules SET total_duration_text = ?, updated_at = ? WHERE id = ?').run(
    `${totalMins} mnt`,
    now,
    mod.id
  );

  const updatedModule = getAllModules().find((m) => m.id === mod.id);
  res.status(201).json({ module: updatedModule, episodeId: epId });
});

app.delete('/api/modules/:moduleId', (req: Request, res: Response) => {
  const { moduleId } = req.params;
  db.prepare('DELETE FROM modules WHERE id = ? OR slug = ?').run(moduleId, moduleId);
  res.json({ ok: true });
});

app.delete('/api/episodes/:episodeId', (req: Request, res: Response) => {
  const { episodeId } = req.params;
  db.prepare('DELETE FROM episodes WHERE id = ?').run(episodeId);
  res.json({ ok: true });
});

// ── 4. Continue Where I Left Off & Completion Sync ──────────────────────────
const handleSaveProgress = (req: Request, res: Response) => {
  const emp = resolveEmployee(req);
  const body = req.body || {};
  const moduleId = String(body.moduleId || '').trim();
  const moduleSlug = String(body.moduleSlug || moduleId).trim();
  const episodeId = String(body.episodeId || '').trim();
  const currentTime = Number(body.currentTime || 0);
  const duration = Number(body.duration || 0);

  if (!moduleId || !episodeId || !Number.isFinite(duration) || duration <= 0) {
    res.status(400).json({ error: 'Parameter progres tidak valid.' });
    return;
  }

  // Ensure referenced module & episode exist before foreign-key insert
  const exists = db
    .prepare('SELECT id FROM episodes WHERE id = ? AND module_id = ?')
    .get(episodeId, moduleId);
  if (!exists) {
    res.status(404).json({ error: 'Episode tidak terdaftar di database.' });
    return;
  }

  const now = Date.now();
  db.prepare(`
    INSERT INTO playback_progress
      (employee_id, module_id, module_slug, episode_id, position_seconds, duration_seconds, hidden_from_continue, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, 0, ?)
    ON CONFLICT(employee_id, module_id, episode_id) DO UPDATE SET
      position_seconds = excluded.position_seconds,
      duration_seconds = excluded.duration_seconds,
      hidden_from_continue = 0,
      updated_at = excluded.updated_at
  `).run(emp.employeeId, moduleId, moduleSlug, episodeId, currentTime, duration, now);

  if (currentTime / duration >= 0.9) {
    db.prepare(`
      INSERT OR IGNORE INTO episode_completions (employee_id, module_id, episode_id, completed_at)
      VALUES (?, ?, ?, ?)
    `).run(emp.employeeId, moduleId, episodeId, now);
  }

  res.json({ ok: true, updatedAt: now });
};

app.put('/api/progress', handleSaveProgress);
app.post('/api/progress', handleSaveProgress);

app.post('/api/progress/dismiss', (req: Request, res: Response) => {
  const emp = resolveEmployee(req);
  const { moduleId, episodeId } = req.body || {};
  db.prepare(`
    UPDATE playback_progress
    SET hidden_from_continue = 1, updated_at = ?
    WHERE employee_id = ? AND module_id = ? AND episode_id = ?
  `).run(Date.now(), emp.employeeId, String(moduleId || ''), String(episodeId || ''));
  res.json({ ok: true });
});

app.post('/api/watched', (req: Request, res: Response) => {
  const emp = resolveEmployee(req);
  const { moduleId, episodeIds } = req.body || {};
  const ids: string[] = Array.isArray(episodeIds) ? episodeIds.map(String) : [];
  const now = Date.now();
  const ins = db.prepare(`
    INSERT OR IGNORE INTO episode_completions (employee_id, module_id, episode_id, completed_at)
    VALUES (?, ?, ?, ?)
  `);
  for (const epId of ids) {
    ins.run(emp.employeeId, String(moduleId || ''), epId, now);
  }
  res.json({ ok: true });
});

app.post('/api/mylist/toggle', (req: Request, res: Response) => {
  const emp = resolveEmployee(req);
  const moduleId = String(req.body?.moduleId || '').trim();
  if (!moduleId) {
    res.status(400).json({ error: 'moduleId wajib diisi.' });
    return;
  }
  const existing = db
    .prepare('SELECT 1 FROM employee_watchlist WHERE employee_id = ? AND module_id = ?')
    .get(emp.employeeId, moduleId);

  if (existing) {
    db.prepare('DELETE FROM employee_watchlist WHERE employee_id = ? AND module_id = ?').run(
      emp.employeeId,
      moduleId
    );
    res.json({ inMyList: false });
  } else {
    db.prepare(
      'INSERT INTO employee_watchlist (employee_id, module_id, added_at) VALUES (?, ?, ?)'
    ).run(emp.employeeId, moduleId, Date.now());
    res.json({ inMyList: true });
  }
});

app.post('/api/reset-demo', (req: Request, res: Response) => {
  const emp = resolveEmployee(req);
  seedDemoEmployeeState(emp.employeeId);
  res.json({ ok: true, ...getEmployeeState(emp.employeeId) });
});

// ── 5. Media File Upload (.mp4, .jpg, .png, .webp, .vtt) ────────────────────
const ALLOWED_EXT = new Set(['.mp4', '.m4v', '.webm', '.jpg', '.jpeg', '.png', '.webp', '.vtt']);

app.post(
  '/api/upload',
  express.raw({ type: '*/*', limit: '500mb' }),
  (req: Request, res: Response) => {
    const rawName = decodeURIComponent(String(req.header('x-filename') || 'upload.bin'));
    const ext = extname(rawName).toLowerCase();
    if (!ALLOWED_EXT.has(ext)) {
      res.status(400).json({
        error: `Format berkas ${ext || 'ini'} tidak diizinkan. Gunakan MP4, WEBM, JPG, PNG, WEBP, atau VTT.`,
      });
      return;
    }
    const buf = req.body as Buffer;
    if (!Buffer.isBuffer(buf) || buf.length === 0) {
      res.status(400).json({ error: 'Berkas kosong.' });
      return;
    }

    const base = slugify(rawName.slice(0, rawName.length - ext.length)) || 'media';
    const fileName = `${Date.now()}-${base}${ext}`;
    const targetPath = join(UPLOAD_DIR, fileName);
    writeFileSync(targetPath, buf);

    res.status(201).json({
      url: `/uploads/${fileName}`,
      fileName,
      sizeBytes: buf.length,
    });
  }
);

// ── 6. LARA Reporting Endpoint (JSON & CSV Export for HC / IT Integration) ──
app.get('/api/lara/report', (req: Request, res: Response) => {
  const emp = resolveEmployee(req);
  const modules = getAllModules();
  const state = getEmployeeState(emp.employeeId);
  const watchedSet = new Set(state.watchedEpisodes);

  const rows = modules.flatMap((m) =>
    m.episodes.map((ep) => {
      const key = `${m.id}:${ep.id}`;
      const prog = state.progress[key];
      const completed = watchedSet.has(key);
      const pct = completed
        ? 100
        : prog && prog.duration > 0
          ? Math.min(99, Math.round((prog.currentTime / prog.duration) * 100))
          : 0;
      return {
        employeeId: emp.employeeId,
        employeeName: emp.name,
        division: emp.division,
        moduleId: m.id,
        moduleTitle: m.title,
        competency: m.competency,
        kind: m.kind,
        mandatory: Boolean(m.mandatoryFromSuperior),
        levelNumber: ep.levelNumber,
        episodeId: ep.id,
        episodeTitle: ep.title,
        durationText: ep.durationText,
        progressPercent: pct,
        status: completed ? 'COMPLETED' : pct > 0 ? 'IN_PROGRESS' : 'NOT_STARTED',
        lastPositionSeconds: prog ? Math.round(prog.currentTime) : 0,
      };
    })
  );

  if (req.query.format === 'csv') {
    const header = [
      'employee_id',
      'employee_name',
      'division',
      'module_id',
      'competency',
      'kind',
      'mandatory',
      'level',
      'episode_title',
      'progress_percent',
      'status',
      'last_position_sec',
    ].join(',');
    const csvLines = rows.map((r) =>
      [
        r.employeeId,
        `"${r.employeeName.replace(/"/g, '""')}"`,
        `"${r.division.replace(/"/g, '""')}"`,
        r.moduleId,
        `"${r.competency.replace(/"/g, '""')}"`,
        r.kind,
        r.mandatory,
        r.levelNumber,
        `"${r.episodeTitle.replace(/"/g, '""')}"`,
        r.progressPercent,
        r.status,
        r.lastPositionSeconds,
      ].join(',')
    );
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="spil-max-lara-report.csv"');
    res.send([header, ...csvLines].join('\n'));
    return;
  }

  res.json({
    generatedAt: new Date().toISOString(),
    employee: emp,
    summary: {
      totalModules: modules.length,
      totalEpisodes: rows.length,
      completedEpisodes: rows.filter((r) => r.status === 'COMPLETED').length,
      inProgressEpisodes: rows.filter((r) => r.status === 'IN_PROGRESS').length,
    },
    records: rows,
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`[spil-max-backend] listening on http://0.0.0.0:${PORT}`);
});
