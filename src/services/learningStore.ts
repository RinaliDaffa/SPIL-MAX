import { useSyncExternalStore } from 'react';
import type { EmployeeProfile, EpisodeProgress } from '@/types/learning';

const PROGRESS_KEY = 'spil_max_progress_v1';
const WATCHED_KEY = 'spil_max_watched_v1';
const MYLIST_KEY = 'spil_max_mylist_v1';
const RECENT_SEARCH_KEY = 'spil_max_recent_search_v1';

export const DEFAULT_EMPLOYEE: EmployeeProfile = {
  name: 'Tri Dewi Rasnani',
  role: 'Operations & People Development',
  division: 'Fleet & Terminal Operations',
  location: 'Surabaya · Tanjung Perak',
  annualTargetHours: 150,
  baseCompletedHours: 120,
};

interface StoreSnapshot {
  progress: Record<string, EpisodeProgress>;
  watchedEpisodes: string[];
  myList: string[];
  recentSearches: string[];
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

const DEFAULT_WATCHED = ['port-management:pm-l1', 'interpersonal-agility:ia-l1', 'interpersonal-agility:ia-l2', 'k3-safety:k3-l1'];
const DEFAULT_MYLIST = ['k3-safety', 'sizing-up-people', 'administration-lara'];

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
  progress: readJson<Record<string, EpisodeProgress>>(PROGRESS_KEY, DEFAULT_PROGRESS),
  watchedEpisodes: readJson<string[]>(WATCHED_KEY, DEFAULT_WATCHED),
  myList: readJson<string[]>(MYLIST_KEY, DEFAULT_MYLIST),
  recentSearches: readJson<string[]>(RECENT_SEARCH_KEY, ['K3 Pelabuhan', 'Leadership', 'Port Management', 'LARA']),
};

const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) listener();
}

export const learningStore = {
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },

  getSnapshot(): StoreSnapshot {
    return state;
  },

  keyOf(moduleId: string, episodeId: string) {
    return `${moduleId}:${episodeId}`;
  },

  savePlaybackProgress(entry: Omit<EpisodeProgress, 'updatedAt'>) {
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
  },

  markEpisodeWatched(moduleId: string, episodeId: string) {
    const key = learningStore.keyOf(moduleId, episodeId);
    if (state.watchedEpisodes.includes(key)) return;
    const nextWatched = [...state.watchedEpisodes, key];
    state = { ...state, watchedEpisodes: nextWatched };
    writeJson(WATCHED_KEY, nextWatched);
    emit();
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
  },

  toggleMyList(moduleId: string) {
    const exists = state.myList.includes(moduleId);
    const nextList = exists
      ? state.myList.filter((id) => id !== moduleId)
      : [moduleId, ...state.myList];
    state = { ...state, myList: nextList };
    writeJson(MYLIST_KEY, nextList);
    emit();
    return !exists;
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
  },
};

export function useLearningStore() {
  return useSyncExternalStore(
    learningStore.subscribe,
    learningStore.getSnapshot,
    learningStore.getSnapshot
  );
}
