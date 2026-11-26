import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import GridPure from '@/components/GridPure';
import { learningStore, useLearningStore } from '@/services/learningStore';

/**
 * Daftar Saya (`/daftar-saya`) — Clean White Title without grey subtitle clutter.
 */
export default function MyListPage() {
  const navigate = useNavigate();
  const { modules, myList, watchedEpisodes } = useLearningStore();

  const items = useMemo(
    () => myList.map((id) => modules.find((m) => m.id === id)).filter((m): m is NonNullable<typeof m> => Boolean(m)),
    [modules, myList]
  );

  const watchedModuleIds = useMemo(() => {
    const watchedSet = new Set(watchedEpisodes);
    const out = new Set<string>();
    for (const m of modules) {
      if (
        m.episodes.length > 0 &&
        m.episodes.every((e) => watchedSet.has(learningStore.keyOf(m.id, e.id)))
      ) {
        out.add(m.id);
      }
    }
    return out;
  }, [modules, watchedEpisodes]);

  return (
    <div className="min-h-screen px-5 md:px-8 tv:px-14 pt-20 md:pt-24 tv:pt-32 pb-14 max-w-[1600px] tv:max-w-[2200px] mx-auto">
      <div className="inline-flex items-center gap-3 mb-6">
        <span className="spil-bar-green !h-7" />
        <h1 className="p-display text-[28px] md:text-[40px] tv:text-[52px] text-white">Daftar Saya</h1>
      </div>

      {items.length > 0 ? (
        <GridPure items={items} watchedModuleIds={watchedModuleIds} />
      ) : (
        <div className="py-24 text-center">
          <p className="text-[15.5px] p-dim mb-6">Daftar Saya masih kosong.</p>
          <button type="button" onClick={() => navigate('/core')} className="p-btn p-btn-ghost">
            Jelajahi Kompetensi
          </button>
        </div>
      )}
    </div>
  );
}
