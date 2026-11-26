import React, { useMemo } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import GridPure from '@/components/GridPure';
import { learningStore, useLearningStore } from '@/services/learningStore';

interface CollectionState {
  title?: string;
  itemIds?: string[];
}

export default function CollectionPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const state = (location.state as CollectionState | null) || null;
  const { modules, watchedEpisodes } = useLearningStore();

  const items = useMemo(() => {
    if (state?.itemIds?.length) {
      return state.itemIds
        .map((id) => modules.find((m) => m.id === id))
        .filter((m): m is NonNullable<typeof m> => Boolean(m));
    }
    return modules;
  }, [modules, state, slug]);

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

  const title = state?.title || 'Koleksi Modul SPIL MAX';

  return (
    <div className="min-h-screen pt-20 md:pt-24 tv:pt-32 pb-14 max-w-[1600px] tv:max-w-[2200px] mx-auto px-5 md:px-8 tv:px-14">
      <div className="mb-6 flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate(-1)}
          aria-label="Kembali"
          className="w-9 h-9 -ml-1 rounded-full flex items-center justify-center text-white/75 hover:text-white hover:bg-white/[0.08] transition-colors"
        >
          <ChevronLeft size={20} />
        </button>
        <h1 className="p-display text-[26px] md:text-[38px] tv:text-[48px] text-white">{title}</h1>
      </div>

      <GridPure items={items} watchedModuleIds={watchedModuleIds} />
    </div>
  );
}
