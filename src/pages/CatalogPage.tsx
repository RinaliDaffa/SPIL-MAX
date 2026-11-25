import React, { useMemo, useState } from 'react';
import FilterBar, { EMPTY_FILTERS, type CatalogFilters } from '@/components/FilterBar';
import GridPure from '@/components/GridPure';
import { MODULES } from '@/data/catalog';
import { learningStore, useLearningStore } from '@/services/learningStore';

interface CatalogPageProps {
  mode: 'all' | 'mandatory' | 'external';
}

/**
 * SPIL MAX Filterable Catalog Page (`/kompetensi`, `/wajib`, `/eksternal`).
 */
export default function CatalogPage({ mode }: CatalogPageProps) {
  const [filters, setFilters] = useState<CatalogFilters>(EMPTY_FILTERS);
  const { watchedEpisodes } = useLearningStore();

  const baseModules = useMemo(() => {
    if (mode === 'mandatory') return MODULES.filter((m) => m.mandatoryFromSuperior);
    if (mode === 'external') return MODULES.filter((m) => m.kind === 'Eksternal');
    return MODULES;
  }, [mode]);

  const { watchedModuleIds, moduleProgressMap } = useMemo(() => {
    const watchedSet = new Set(watchedEpisodes);
    const modWatched = new Set<string>();
    const modProg: Record<string, number> = {};
    for (const m of MODULES) {
      const done = m.episodes.filter((e) =>
        watchedSet.has(learningStore.keyOf(m.id, e.id))
      ).length;
      if (done === m.episodes.length && m.episodes.length > 0) modWatched.add(m.id);
      else if (done > 0) modProg[m.id] = Math.round((done / m.episodes.length) * 100);
    }
    return { watchedModuleIds: modWatched, moduleProgressMap: modProg };
  }, [watchedEpisodes]);

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
    all: {
      eyebrow: 'KAMUS KOMPETENSI SPIL',
      title: 'Katalog Kompetensi & Modul',
      desc: 'Seluruh modul pembelajaran video berjenjang (Level 1–4) untuk Core, Managerial, dan Operasional SPIL.',
    },
    mandatory: {
      eyebrow: 'INISIATIF LARA & PENUGASAN ATASAN',
      title: 'Modul Wajib & Dari Atasan',
      desc: 'Daftar modul prioritas yang ditugaskan langsung oleh atasan maupun standar wajib keselamatan & administrasi.',
    },
    external: {
      eyebrow: 'SPIL MAX · EDU STREAM Q2',
      title: 'Kurasi Pembelajaran Eksternal',
      desc: 'Sumber belajar eksternal pilihan seputar keberlanjutan maritim global, analitik data, dan kecerdasan buatan.',
    },
  }[mode];

  return (
    <div className="min-h-screen pt-20 md:pt-24 tv:pt-32 pb-14 max-w-[1600px] tv:max-w-[2200px] mx-auto">
      <div className="px-5 md:px-8 tv:px-14 mb-6">
        <p className="p-label mb-2">{headerCopy.eyebrow}</p>
        <div className="flex flex-wrap items-baseline gap-3">
          <h1 className="p-display text-[28px] sm:text-[34px] md:text-[42px] tv:text-[54px]">
            {headerCopy.title}
          </h1>
          <span className="text-[13px] tv:text-[16px] p-faint">{filtered.length} modul</span>
        </div>
        <p className="text-[13.5px] md:text-[15px] tv:text-[17px] p-dim max-w-2xl mt-2">
          {headerCopy.desc}
        </p>
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
            variant={mode === 'external' ? 'wide' : 'poster'}
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
