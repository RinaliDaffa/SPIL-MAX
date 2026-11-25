import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Check } from 'lucide-react';
import { MODULES } from '@/data/catalog';
import { learningStore, useLearningStore } from '@/services/learningStore';

/**
 * Riwayat Pembelajaran (`/riwayat`) — LARA Learning History & Completed Episodes.
 */
export default function HistoryPage() {
  const navigate = useNavigate();
  const { watchedEpisodes, progress } = useLearningStore();

  const entries = useMemo(() => {
    const watchedSet = new Set(watchedEpisodes);
    const list: {
      key: string;
      moduleSlug: string;
      moduleTitle: string;
      episodeId: string;
      episodeTitle: string;
      levelLabel: string;
      still: string;
      durationText: string;
      completed: boolean;
      pct: number;
    }[] = [];

    for (const m of MODULES) {
      for (const ep of m.episodes) {
        const key = learningStore.keyOf(m.id, ep.id);
        const completed = watchedSet.has(key);
        const p = progress[key];
        if (!completed && !p) continue;
        const pct = completed
          ? 100
          : p && p.duration > 0
            ? Math.min(100, Math.round((p.currentTime / p.duration) * 100))
            : 0;
        list.push({
          key,
          moduleSlug: m.slug,
          moduleTitle: m.title,
          episodeId: ep.id,
          episodeTitle: ep.title,
          levelLabel: ep.levelLabel,
          still: ep.still || m.backdrop,
          durationText: ep.durationText,
          completed,
          pct,
        });
      }
    }
    return list;
  }, [watchedEpisodes, progress]);

  return (
    <div className="min-h-screen px-5 md:px-8 tv:px-14 pt-20 md:pt-24 tv:pt-32 pb-14 max-w-[1100px] tv:max-w-[1500px] mx-auto">
      <div className="mb-6">
        <p className="p-label mb-2">REKAM JEJAK LARA</p>
        <div className="flex items-baseline gap-3">
          <h1 className="p-display text-[28px] md:text-[40px] tv:text-[52px]">
            Riwayat Pembelajaran
          </h1>
          <span className="text-[13px] tv:text-[16px] p-faint">{entries.length} video</span>
        </div>
      </div>

      {entries.length > 0 ? (
        <div data-row>
          {entries.map((item) => (
            <button
              key={item.key}
              type="button"
              data-card
              onClick={() => navigate(`/tonton/${item.moduleSlug}/${item.episodeId}`)}
              className="w-full flex items-center gap-4 py-3.5 p-hair text-left group/h focus:outline-none rounded-xl px-1 -mx-1"
            >
              <div className="p-card w-[136px] sm:w-[172px] tv:w-[220px] aspect-video shrink-0">
                <img src={item.still} alt={item.episodeTitle} loading="lazy" decoding="async" />
                <span className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/h:opacity-100 transition-opacity bg-black/30">
                  <Play size={16} fill="white" />
                </span>
                <span className="absolute bottom-0 inset-x-0 h-[3px] bg-white/25">
                  <span className="block h-full bg-white" style={{ width: `${item.pct}%` }} />
                </span>
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-[14.5px] md:text-[15.5px] tv:text-[18px] font-semibold text-white truncate">
                    {item.moduleTitle}
                  </p>
                  {item.completed && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/12 text-[10.5px] font-semibold text-white/85 shrink-0">
                      <Check size={11} strokeWidth={3} /> Selesai
                    </span>
                  )}
                </div>
                <p className="text-[13px] tv:text-[15px] p-dim truncate mt-0.5">
                  {item.levelLabel} — {item.episodeTitle}
                </p>
                <p className="text-[11.5px] tv:text-[13.5px] p-faint mt-1">
                  {item.durationText}  ·  Progres {item.pct}%
                </p>
              </div>
            </button>
          ))}
        </div>
      ) : (
        <div className="py-24 text-center">
          <p className="text-[15px] p-dim mb-6">Belum ada riwayat tontonan modul.</p>
          <button type="button" onClick={() => navigate('/')} className="p-btn p-btn-ghost">
            Mulai Belajar Sekarang
          </button>
        </div>
      )}
    </div>
  );
}
