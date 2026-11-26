import React, { useMemo, useState, useEffect } from 'react';
import FilterBar, { EMPTY_FILTERS, type CatalogFilters } from '@/components/FilterBar';
import GridPure from '@/components/GridPure';
import { learningStore, useLearningStore } from '@/services/learningStore';

interface CatalogPageProps {
  mode: 'all' | 'core' | 'technical' | 'managerial' | 'learn-more' | 'mandatory';
}

/**
 * SPIL MAX Filterable Catalog Page (`/core`, `/technical`, `/managerial`, `/learn-more`, `/wajib`, `/kompetensi`).
 * Unified Apple TV+ catalog layout across all competency & L&D categories.
 */
export default function CatalogPage({ mode }: CatalogPageProps) {
  const [filters, setFilters] = useState<CatalogFilters>(EMPTY_FILTERS);
  const { modules, watchedEpisodes } = useLearningStore();

  useEffect(() => {
    setFilters(EMPTY_FILTERS);
  }, [mode]);

  const baseModules = useMemo(() => {
    if (mode === 'core') return modules.filter((m) => m.kind === 'Core');
    if (mode === 'technical') return modules.filter((m) => m.kind === 'Technical');
    if (mode === 'managerial') return modules.filter((m) => m.kind === 'Managerial');
    if (mode === 'learn-more') return modules.filter((m) => m.kind === 'Learn More');
    if (mode === 'mandatory') return modules.filter((m) => m.mandatoryFromSuperior);
    return modules;
  }, [mode, modules]);

  const { watchedModuleIds, moduleProgressMap } = useMemo(() => {
    const watchedSet = new Set(watchedEpisodes);
    const modWatched = new Set<string>();
    const modProg: Record<string, number> = {};
    for (const m of modules) {
      const done = m.episodes.filter((e) =>
        watchedSet.has(learningStore.keyOf(m.id, e.id))
      ).length;
      if (done === m.episodes.length && m.episodes.length > 0) modWatched.add(m.id);
      else if (done > 0) modProg[m.id] = Math.round((done / m.episodes.length) * 100);
    }
    return { watchedModuleIds: modWatched, moduleProgressMap: modProg };
  }, [modules, watchedEpisodes]);

  const kinds = useMemo(() => {
    const map = new Map<string, number>();
    for (const m of baseModules) map.set(m.kind, (map.get(m.kind) || 0) + 1);
    return Array.from(map.entries()).map(([value, count]) => ({ value, label: value, count }));
  }, [baseModules]);

  const divisions = useMemo(() => {
    const map = new Map<string, number>();
    for (const m of baseModules) map.set(m.division, (map.get(m.division) || 0) + 1);
    return Array.from(map.entries()).map(([value, count]) => ({ value, label: value, count }));
  }, [baseModules]);

  const filtered = useMemo(() => {
    let list = [...baseModules];
    if (filters.kind) list = list.filter((m) => m.kind === filters.kind);
    if (filters.division) list = list.filter((m) => m.division === filters.division);
    if (filters.unwatchedOnly) list = list.filter((m) => !watchedModuleIds.has(m.id));

    if (filters.sort === 'popular') {
      list.sort((a, b) => (a.topRank || 99) - (b.topRank || 99));
    } else if (filters.sort === 'levels') {
      list.sort((a, b) => b.episodes.length - a.episodes.length);
    } else if (filters.sort === 'az') {
      list.sort((a, b) => a.title.localeCompare(b.title));
    }
    return list;
  }, [baseModules, filters, watchedModuleIds]);

  const headerCopy = {
    all: { title: 'Semua Materi Pembelajaran', accent: 'green' as const },
    core: { title: 'Core Competency', accent: 'green' as const },
    technical: { title: 'Technical Competency', accent: 'green' as const },
    managerial: { title: 'Managerial Competency', accent: 'green' as const },
    'learn-more': { title: 'Learn More', accent: 'green' as const },
    mandatory: { title: 'Modul Wajib', accent: 'red' as const },
  }[mode];

  return (
    <div className="min-h-screen pt-20 md:pt-24 tv:pt-32 pb-14 max-w-[1600px] tv:max-w-[2200px] mx-auto">
      <div className="px-5 md:px-8 tv:px-14 mb-6">
        <div className="inline-flex items-center gap-3">
          <span
            className={
              headerCopy.accent === 'red'
                ? 'spil-bar-red !h-7'
                : 'spil-bar-green !h-7'
            }
          />
          <h1 className="p-display text-[28px] sm:text-[34px] md:text-[42px] tv:text-[54px] text-white">
            {headerCopy.title}
          </h1>
        </div>
      </div>

      {mode === 'all' && (
        <FilterBar
          kinds={kinds}
          divisions={divisions}
          value={filters}
          onChange={setFilters}
          onReset={() => setFilters(EMPTY_FILTERS)}
          count={filtered.length}
        />
      )}

      <div className="px-5 md:px-8 tv:px-14">
        {filtered.length > 0 ? (
          <GridPure
            items={filtered}
            variant={mode === 'technical' || mode === 'mandatory' || mode === 'learn-more' ? 'wide' : 'poster'}
            watchedModuleIds={watchedModuleIds}
            moduleProgressMap={moduleProgressMap}
          />
        ) : (
          <div className="py-20 text-center">
            <p className="text-[15px] p-dim mb-4">Tidak ada modul yang sesuai dengan filter ini.</p>
            <button
              type="button"
              onClick={() => setFilters(EMPTY_FILTERS)}
              className="p-btn p-btn-ghost"
            >
              Reset Filter
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
