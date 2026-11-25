import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import GridPure from '@/components/GridPure';
import { MODULES } from '@/data/catalog';
import { learningStore, useLearningStore } from '@/services/learningStore';

/**
 * Daftar Saya (`/daftar-saya`) — Adapted from NovaStream FavoritesPure (MIT).
 */
export default function MyListPage() {
  const navigate = useNavigate();
  const { myList, watchedEpisodes } = useLearningStore();

  const items = useMemo(
    () => myList.map((id) => MODULES.find((m) => m.id === id)).filter((m): m is NonNullable<typeof m> => Boolean(m)),
    [myList]
  );

  const watchedModuleIds = useMemo(() => {
    const watchedSet = new Set(watchedEpisodes);
    const out = new Set<string>();
    for (const m of MODULES) {
      if (
        m.episodes.length > 0 &&
        m.episodes.every((e) => watchedSet.has(learningStore.keyOf(m.id, e.id)))
      ) {
        out.add(m.id);
      }
    }
    return out;
  }, [watchedEpisodes]);

  return (
    <div className="min-h-screen px-5 md:px-8 tv:px-14 pt-20 md:pt-24 tv:pt-32 pb-14 max-w-[1600px] tv:max-w-[2200px] mx-auto">
      <div className="flex items-baseline gap-3 mb-6">
        <h1 className="p-display text-[28px] md:text-[40px] tv:text-[52px]">Daftar Saya</h1>
        <span className="text-[13px] tv:text-[16px] p-faint">{items.length} modul</span>
      </div>

      {items.length > 0 ? (
        <GridPure items={items} watchedModuleIds={watchedModuleIds} />
      ) : (
        <div className="py-24 text-center">
          <p className="text-[15.5px] p-dim mb-1.5">Daftar Saya masih kosong.</p>
          <p className="text-[13px] p-faint mb-7">
            Tekan tombol &ldquo;+ Daftar Saya&rdquo; pada modul untuk menyimpannya di sini.
          </p>
          <button type="button" onClick={() => navigate('/kompetensi')} className="p-btn p-btn-ghost">
            Jelajahi Kompetensi
          </button>
        </div>
      )}
    </div>
  );
}
