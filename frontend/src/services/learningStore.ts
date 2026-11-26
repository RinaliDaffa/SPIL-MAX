import { useSyncExternalStore } from 'react';
import { MODULES as SEED_MODULES } from '@/data/catalog';
import type {
  CompetencyKind,
  EmployeeProfile,
  EpisodeProgress,
  LearningModule,
} from '@/types/learning';

const MODULES_KEY = 'spil_max_modules_cache_v3';
const PROGRESS_KEY = 'spil_max_progress_v2';
const WATCHED_KEY = 'spil_max_watched_v2';
const MYLIST_KEY = 'spil_max_mylist_v2';
const RECENT_SEARCH_KEY = 'spil_max_recent_search_v2';

export const DEFAULT_EMPLOYEE: EmployeeProfile = {
  employeeId: 'SPIL-EMP-001',
  name: 'Tri Dewi Rasnani',
  role: 'Operations & People Development',
  division: 'Fleet & Terminal Operations',
  location: 'Surabaya · Tanjung Perak',
  annualTargetHours: 150,
  baseCompletedHours: 120,
};

export interface StoreSnapshot {
  modules: LearningModule[];
  employee: EmployeeProfile;
  progress: Record<string, EpisodeProgress>;
  watchedEpisodes: string[];
  myList: string[];
  recentSearches: string[];
  backendConnected: boolean;
}

const DEFAULT_PROGRESS: Record<string, EpisodeProgress> = {
  'port-management:pm-l2': {
    moduleId: 'port-management',
    moduleSlug: 'port-management',
    episodeId: 'pm-l2',
    currentTime: 16.5,
    duration: 30,
    updatedAt: Date.now() - 1000 * 60 * 35,
  },
  'service-excellence:se-l1': {
    moduleId: 'service-excellence',
    moduleSlug: 'service-excellence-complaint-handling',
    episodeId: 'se-l1',
    currentTime: 11.2,
    duration: 30,
    updatedAt: Date.now() - 1000 * 60 * 140,
  },
  'interpersonal-agility:ia-l3': {
    moduleId: 'interpersonal-agility',
    moduleSlug: 'interpersonal-agility',
    episodeId: 'ia-l3',
    currentTime: 21.0,
    duration: 30,
    updatedAt: Date.now() - 1000 * 60 * 320,
  },
};

const DEFAULT_WATCHED = [
  'port-management:pm-l1',
  'interpersonal-agility:ia-l1',
  'interpersonal-agility:ia-l2',
  'k3-safety:k3-l1',
];
const DEFAULT_MYLIST = ['k3-safety', 'sizing-up-people', 'administration-lara'];

const API_BASE = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');
const apiUrl = (path: string) => `${API_BASE}${path}`;

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJson<T>(key: string, value: T) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore storage quota errors in private mode
  }
}

let state: StoreSnapshot = {
  modules: readJson<LearningModule[]>(MODULES_KEY, SEED_MODULES),
  employee: DEFAULT_EMPLOYEE,
  progress: readJson<Record<string, EpisodeProgress>>(PROGRESS_KEY, DEFAULT_PROGRESS),
  watchedEpisodes: readJson<string[]>(WATCHED_KEY, DEFAULT_WATCHED),
  myList: readJson<string[]>(MYLIST_KEY, DEFAULT_MYLIST),
  recentSearches: readJson<string[]>(RECENT_SEARCH_KEY, [
    'K3 Pelabuhan',
    'Leadership',
    'Port Management',
    'LARA',
  ]),
  backendConnected: false,
};

const listeners = new Set<() => void>();
function emit() {
  for (const listener of listeners) listener();
}

let hydratedOnce = false;

export interface CreateModuleInput {
  title: string;
  competency: string;
  kind: CompetencyKind;
  division: string;
  badge?: string;
  mandatoryFromSuperior?: boolean;
  featuredInHero?: boolean;
  summary: string;
  objectives: string[];
  poster: string;
  backdrop: string;
  initialEpisode?: {
    levelNumber: number;
    levelLabel: string;
    title: string;
    description: string;
    durationText: string;
    durationSeconds: number;
    videoUrl: string;
    subtitleIdUrl?: string;
    keyTakeaways?: string[];
  };
}

export interface CreateEpisodeInput {
  moduleId: string;
  levelNumber: number;
  levelLabel: string;
  title: string;
  description: string;
  durationText: string;
  durationSeconds: number;
  videoUrl: string;
  still?: string;
  subtitleIdUrl?: string;
  keyTakeaways?: string[];
}

export const learningStore = {
  subscribe(listener: () => void) {
    listeners.add(listener);
    if (!hydratedOnce && typeof window !== 'undefined') {
      hydratedOnce = true;
      void learningStore.hydrateFromBackend();
    }
    return () => listeners.delete(listener);
  },

  getSnapshot(): StoreSnapshot {
    return state;
  },

  keyOf(moduleId: string, episodeId: string) {
    return `${moduleId}:${episodeId}`;
  },

  async hydrateFromBackend() {
    try {
      const [catRes, stateRes] = await Promise.all([
        fetch(apiUrl('/api/catalog')),
        fetch(apiUrl('/api/state')),
      ]);
      if (!catRes.ok || !stateRes.ok) return;
      const catJson = await catRes.json();
      const stateJson = await stateRes.json();

      if (Array.isArray(catJson.modules) && catJson.modules.length > 0) {
        writeJson(MODULES_KEY, catJson.modules);
      }
      if (stateJson.progress) writeJson(PROGRESS_KEY, stateJson.progress);
      if (stateJson.watchedEpisodes) writeJson(WATCHED_KEY, stateJson.watchedEpisodes);
      if (stateJson.myList) writeJson(MYLIST_KEY, stateJson.myList);

      state = {
        ...state,
        modules: Array.isArray(catJson.modules) && catJson.modules.length > 0 ? catJson.modules : state.modules,
        employee: stateJson.employee || state.employee,
        progress: stateJson.progress || state.progress,
        watchedEpisodes: stateJson.watchedEpisodes || state.watchedEpisodes,
        myList: stateJson.myList || state.myList,
        backendConnected: true,
      };
      emit();
    } catch {
      // Offline / static preview mode: continue seamlessly with localStorage
    }
  },

  savePlaybackProgress(
    entry: Omit<EpisodeProgress, 'updatedAt'>,
    options?: { keepalive?: boolean }
  ) {
    if (!Number.isFinite(entry.duration) || entry.duration <= 0) return;
    const key = learningStore.keyOf(entry.moduleId, entry.episodeId);
    const ratio = entry.currentTime / entry.duration;

    const nextProgress: Record<string, EpisodeProgress> = {
      ...state.progress,
      [key]: {
        ...entry,
        updatedAt: Date.now(),
        hiddenFromContinue: false,
      },
    };

    let nextWatched = state.watchedEpisodes;
    if (ratio >= 0.9 && !state.watchedEpisodes.includes(key)) {
      nextWatched = [...state.watchedEpisodes, key];
      writeJson(WATCHED_KEY, nextWatched);
    }

    state = {
      ...state,
      progress: nextProgress,
      watchedEpisodes: nextWatched,
    };
    writeJson(PROGRESS_KEY, nextProgress);
    emit();

    const payload = JSON.stringify(entry);
    if (options?.keepalive && typeof navigator !== 'undefined' && navigator.sendBeacon) {
      const blob = new Blob([payload], { type: 'application/json' });
      navigator.sendBeacon(apiUrl('/api/progress'), blob);
      return;
    }

    fetch(apiUrl('/api/progress'), {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: payload,
      keepalive: Boolean(options?.keepalive),
    }).catch(() => {});
  },

  markModuleEpisodesWatched(moduleId: string, episodeIds: string[]) {
    const set = new Set(state.watchedEpisodes);
    for (const epId of episodeIds) {
      set.add(learningStore.keyOf(moduleId, epId));
    }
    const nextWatched = Array.from(set);
    state = { ...state, watchedEpisodes: nextWatched };
    writeJson(WATCHED_KEY, nextWatched);
    emit();

    fetch(apiUrl('/api/watched'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ moduleId, episodeIds }),
    }).catch(() => {});
  },

  hideFromContinueWatching(moduleId: string, episodeId: string) {
    const key = learningStore.keyOf(moduleId, episodeId);
    const existing = state.progress[key];
    if (!existing) return;
    const nextProgress = {
      ...state.progress,
      [key]: { ...existing, hiddenFromContinue: true },
    };
    state = { ...state, progress: nextProgress };
    writeJson(PROGRESS_KEY, nextProgress);
    emit();

    fetch(apiUrl('/api/progress/dismiss'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ moduleId, episodeId }),
    }).catch(() => {});
  },

  toggleMyList(moduleId: string) {
    const exists = state.myList.includes(moduleId);
    const nextList = exists
      ? state.myList.filter((id) => id !== moduleId)
      : [moduleId, ...state.myList];
    state = { ...state, myList: nextList };
    writeJson(MYLIST_KEY, nextList);
    emit();

    fetch(apiUrl('/api/mylist/toggle'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ moduleId }),
    }).catch(() => {});

    return !exists;
  },

  async uploadMediaFile(file: File): Promise<string> {
    const res = await fetch(apiUrl('/api/upload'), {
      method: 'POST',
      headers: {
        'Content-Type': file.type || 'application/octet-stream',
        'X-Filename': encodeURIComponent(file.name),
      },
      body: file,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Gagal mengunggah berkas.' }));
      throw new Error(err.error || 'Gagal mengunggah berkas ke server.');
    }
    const data = await res.json();
    return data.url as string;
  },

  async createModule(input: CreateModuleInput): Promise<LearningModule> {
    if (state.backendConnected) {
      const res = await fetch(apiUrl('/api/modules'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Gagal menyimpan modul.' }));
        throw new Error(err.error || 'Gagal menyimpan modul.');
      }
      const { module } = await res.json();
      await learningStore.hydrateFromBackend();
      return module as LearningModule;
    }

    // Fallback local creation if running frontend-only static preview
    const slug = input.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    const id = `${slug}-${Date.now().toString(36)}`;
    const newMod: LearningModule = {
      id,
      slug,
      title: input.title,
      competency: input.competency || input.title,
      kind: input.kind,
      year: new Date().getFullYear(),
      badge: input.badge || 'BARU',
      mandatoryFromSuperior: input.mandatoryFromSuperior,
      featuredInHero: input.featuredInHero,
      heroTagline: input.summary.slice(0, 140),
      summary: input.summary,
      objectives: input.objectives,
      poster: input.poster,
      backdrop: input.backdrop,
      totalDurationText: input.initialEpisode?.durationText || '12 mnt',
      division: input.division,
      instructors: [{ name: 'Tim Learning SPIL', role: input.division }],
      episodes: input.initialEpisode
        ? [
            {
              id: `${id}-l${input.initialEpisode.levelNumber}`,
              levelNumber: input.initialEpisode.levelNumber,
              levelLabel: input.initialEpisode.levelLabel,
              title: input.initialEpisode.title,
              description: input.initialEpisode.description,
              durationSeconds: input.initialEpisode.durationSeconds,
              durationText: input.initialEpisode.durationText,
              still: input.backdrop,
              renditions: [
                {
                  src: input.initialEpisode.videoUrl,
                  type: input.initialEpisode.videoUrl.endsWith('.m3u8')
                    ? 'application/x-mpegURL'
                    : 'video/mp4',
                  label: 'HD',
                  height: 720,
                },
              ],
              captions: [
                {
                  src: input.initialEpisode.subtitleIdUrl || '/vtt/core.id.vtt',
                  language: 'id',
                  label: 'Bahasa Indonesia',
                  default: true,
                },
              ],
              chaptersVtt: '/vtt/core-chapters.vtt',
              introEndSeconds: 5,
              keyTakeaways: input.initialEpisode.keyTakeaways || [],
            },
          ]
        : [],
    };
    const nextModules = [newMod, ...state.modules];
    state = { ...state, modules: nextModules };
    writeJson(MODULES_KEY, nextModules);
    emit();
    return newMod;
  },

  async addEpisodeToModule(input: CreateEpisodeInput): Promise<string> {
    if (state.backendConnected) {
      const res = await fetch(apiUrl(`/api/modules/${encodeURIComponent(input.moduleId)}/episodes`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Gagal menambah video level.' }));
        throw new Error(err.error || 'Gagal menambah video level.');
      }
      const data = await res.json();
      await learningStore.hydrateFromBackend();
      return data.episodeId as string;
    }

    const epId = `${input.moduleId}-l${input.levelNumber}-${Date.now().toString(36)}`;
    const nextModules = state.modules.map((m) => {
      if (m.id !== input.moduleId) return m;
      return {
        ...m,
        episodes: [
          ...m.episodes,
          {
            id: epId,
            levelNumber: input.levelNumber,
            levelLabel: input.levelLabel,
            title: input.title,
            description: input.description,
            durationSeconds: input.durationSeconds,
            durationText: input.durationText,
            still: input.still || m.backdrop,
            renditions: [
              {
                src: input.videoUrl,
                type: input.videoUrl.endsWith('.m3u8')
                  ? ('application/x-mpegURL' as const)
                  : ('video/mp4' as const),
                label: 'HD',
                height: 720,
              },
            ],
            captions: [
              {
                src: input.subtitleIdUrl || '/vtt/core.id.vtt',
                language: 'id',
                label: 'Bahasa Indonesia',
                default: true,
              },
            ],
            chaptersVtt: '/vtt/core-chapters.vtt',
            introEndSeconds: 5,
            keyTakeaways: input.keyTakeaways || [],
          },
        ].sort((a, b) => a.levelNumber - b.levelNumber),
      };
    });
    state = { ...state, modules: nextModules };
    writeJson(MODULES_KEY, nextModules);
    emit();
    return epId;
  },

  async deleteModule(moduleId: string) {
    if (state.backendConnected) {
      await fetch(apiUrl(`/api/modules/${encodeURIComponent(moduleId)}`), { method: 'DELETE' });
      await learningStore.hydrateFromBackend();
      return;
    }
    const nextModules = state.modules.filter((m) => m.id !== moduleId);
    state = { ...state, modules: nextModules };
    writeJson(MODULES_KEY, nextModules);
    emit();
  },

  addRecentSearch(term: string) {
    const clean = term.trim();
    if (!clean) return;
    const next = [
      clean,
      ...state.recentSearches.filter((item) => item.toLowerCase() !== clean.toLowerCase()),
    ].slice(0, 6);
    state = { ...state, recentSearches: next };
    writeJson(RECENT_SEARCH_KEY, next);
    emit();
  },

  resetDemoState() {
    state = {
      ...state,
      progress: DEFAULT_PROGRESS,
      watchedEpisodes: DEFAULT_WATCHED,
      myList: DEFAULT_MYLIST,
      recentSearches: ['K3 Pelabuhan', 'Leadership', 'Port Management', 'LARA'],
    };
    writeJson(PROGRESS_KEY, state.progress);
    writeJson(WATCHED_KEY, state.watchedEpisodes);
    writeJson(MYLIST_KEY, state.myList);
    writeJson(RECENT_SEARCH_KEY, state.recentSearches);
    emit();

    fetch(apiUrl('/api/reset-demo'), { method: 'POST' })
      .then(() => learningStore.hydrateFromBackend())
      .catch(() => {});
  },
};

export function useLearningStore() {
  return useSyncExternalStore(
    learningStore.subscribe,
    learningStore.getSnapshot,
    learningStore.getSnapshot
  );
}
