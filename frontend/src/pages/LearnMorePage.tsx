import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Plus, Check, RotateCcw, Upload } from 'lucide-react';
import { learningStore, useLearningStore } from '@/services/learningStore';

/**
 * Learn More (`/learn-more`) — Dedicated Apple TV+ Collection Showcase
 * for Koleksi Video Pak Faris (multi-video series + studio upload extensible).
 */
export default function LearnMorePage() {
  const navigate = useNavigate();
  const { modules, progress, watchedEpisodes, myList } = useLearningStore();

  const learnMoreModules = useMemo(
    () => modules.filter((m) => m.kind === 'Learn More'),
    [modules]
  );

  const primaryCollection = learnMoreModules[0] || modules.find((m) => m.id === 'learn-more-pak-faris');

  const allCollectionVideos = useMemo(
    () =>
      learnMoreModules.flatMap((mod) =>
        mod.episodes.map((ep, idx) => ({
          mod,
          ep,
          seq: idx + 1,
        }))
      ),
    [learnMoreModules]
  );

  if (!primaryCollection) return null;

  const watchedSet = new Set(watchedEpisodes);
  const inMyList = myList.includes(primaryCollection.id);

  // Best resume video across Pak Faris collection
  const resumeTarget = (() => {
    for (const item of allCollectionVideos) {
      const key = learningStore.keyOf(item.mod.id, item.ep.id);
      const p = progress[key];
      if (p && p.currentTime > 1 && p.duration > 0 && p.currentTime / p.duration < 0.9) {
        return { ...item, isResume: true };
      }
    }
    const firstUnwatched = allCollectionVideos.find(
      (item) => !watchedSet.has(learningStore.keyOf(item.mod.id, item.ep.id))
    );
    return {
      ...(firstUnwatched || allCollectionVideos[0]),
      isResume: false,
    };
  })();

  const meta = `${allCollectionVideos.length} Video  ·  ${primaryCollection.totalDurationText}  ·  ${primaryCollection.year}`;

  return (
    <div className="overflow-x-hidden pb-14 md:pb-20">
      {/* ── Apple TV+ Collection Hero Banner ── */}
      <section className="relative w-full h-[68vh] sm:h-[72vh] md:h-[78vh]">
        <picture>
          <source
            media="(max-width: 639px)"
            srcSet={primaryCollection.poster || primaryCollection.backdrop}
          />
          <img
            src={primaryCollection.backdrop || primaryCollection.poster}
            alt={primaryCollection.title}
            decoding="async"
            className="absolute inset-0 w-full h-full object-cover"
          />
        </picture>

        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'linear-gradient(to top, #000000 0%, rgba(0,0,0,0.92) 28%, rgba(0,0,0,0.28) 66%, rgba(0,0,0,0.48) 100%)',
          }}
        />

        <div className="absolute inset-x-0 bottom-0 px-5 md:px-8 tv:px-14 pb-8 md:pb-12 max-w-[1600px] tv:max-w-[2200px] mx-auto">
          <div className="p-in max-w-2xl tv:max-w-4xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-black/55 border border-white/15 backdrop-blur-md text-[11px] tv:text-[13px] font-semibold tracking-[0.08em] uppercase text-white/92 mb-3.5">
              <span className="w-2 h-2 rounded-full bg-[#22c55e]" />
              <span>Learn More · Seri Eksekutif</span>
            </div>

            <h1 className="p-display text-[30px] sm:text-[42px] md:text-[54px] tv:text-[70px] text-white mb-3">
              {primaryCollection.title}
            </h1>

            <p className="text-[13px] md:text-[14.5px] tv:text-[17px] font-medium p-dim mb-4">
              {meta}
            </p>

            <p className="text-[13.5px] md:text-[15px] tv:text-[17.5px] text-white/80 leading-relaxed max-w-xl tv:max-w-3xl mb-6 line-clamp-3">
              {primaryCollection.summary}
            </p>

            <div className="flex flex-wrap items-center gap-2.5 md:gap-3">
              {resumeTarget?.ep && (
                <button
                  type="button"
                  data-tv-focus
                  data-tv-hero-primary
                  onClick={() =>
                    navigate(`/tonton/${resumeTarget.mod.slug}/${resumeTarget.ep.id}`)
                  }
                  className="p-btn"
                >
                  {resumeTarget.isResume ? (
                    <RotateCcw size={16} />
                  ) : (
                    <Play size={16} fill="currentColor" />
                  )}
                  <span>
                    {resumeTarget.isResume
                      ? `Lanjutkan Video ${resumeTarget.seq}`
                      : `Putar Video ${resumeTarget.seq}`}
                  </span>
                </button>
              )}

              <button
                type="button"
                data-tv-focus
                onClick={() => learningStore.toggleMyList(primaryCollection.id)}
                className={`p-btn p-btn-ghost ${inMyList ? '!bg-white/22' : ''}`}
              >
                {inMyList ? <Check size={16} strokeWidth={2.6} /> : <Plus size={17} strokeWidth={2.4} />}
                <span>{inMyList ? 'Tersimpan di Daftar Saya' : 'Daftar Saya'}</span>
              </button>

              <button
                type="button"
                data-tv-focus
                onClick={() => navigate('/studio')}
                className="p-btn p-btn-ghost"
              >
                <Upload size={15} />
                <span>Tambah Video Koleksi</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── Collection Grid of All Pak Faris Videos ── */}
      <section
        data-row
        className="max-w-[1600px] tv:max-w-[2200px] mx-auto px-5 md:px-8 tv:px-14 pt-8 md:pt-12"
      >
        <div className="inline-flex items-center gap-2.5 mb-6">
          <span className="spil-bar-green" />
          <h2 className="p-title text-[20px] md:text-[24px] tv:text-[30px] text-white">
            Daftar Video Pak Faris
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 md:gap-6">
          {allCollectionVideos.map(({ mod, ep, seq }) => {
            const key = learningStore.keyOf(mod.id, ep.id);
            const isWatched = watchedSet.has(key);
            const p = progress[key];
            const pct =
              !isWatched && p && p.duration > 0
                ? Math.min(100, Math.round((p.currentTime / p.duration) * 100))
                : 0;

            return (
              <button
                key={key}
                type="button"
                data-card
                onClick={() => navigate(`/tonton/${mod.slug}/${ep.id}`)}
                className="p-card-hit group/v text-left focus:outline-none flex flex-col"
              >
                <div className="p-card aspect-video w-full">
                  <img
                    src={ep.still || mod.backdrop}
                    alt={ep.title}
                    loading="lazy"
                    decoding="async"
                  />
                  <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                      background:
                        'linear-gradient(to top, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0.08) 50%, rgba(0,0,0,0.25) 100%)',
                    }}
                  />

                  <span className="absolute top-2.5 left-2.5 inline-flex items-center gap-1.5 px-2 py-[3px] rounded-md bg-black/65 backdrop-blur-md border border-white/12 text-[9.5px] tv:text-[11px] font-semibold tracking-[0.06em] uppercase text-white/92">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#22c55e]" />
                    <span>Video {seq} · {ep.durationText}</span>
                  </span>

                  {isWatched && (
                    <span
                      aria-label="Selesai ditonton"
                      className="absolute top-2.5 right-2.5 w-[22px] h-[22px] rounded-full bg-[#16a34a] shadow-[0_2px_8px_rgba(0,0,0,0.6)] flex items-center justify-center text-white"
                    >
                      <Check size={13} strokeWidth={3.2} />
                    </span>
                  )}

                  {pct > 0 && pct < 99 && (
                    <span className="absolute bottom-0 inset-x-0 h-[3px] bg-white/20">
                      <span className="block h-full spil-progress-fill" style={{ width: `${pct}%` }} />
                    </span>
                  )}

                  <span className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/v:opacity-100 group-focus-visible/v:opacity-100 transition-opacity pointer-events-none">
                    <span className="w-12 h-12 rounded-full bg-black/55 backdrop-blur-md border border-white/20 flex items-center justify-center text-white">
                      <Play size={17} fill="currentColor" className="ml-0.5" />
                    </span>
                  </span>
                </div>

                <div className="mt-2.5 px-0.5">
                  <p className="text-[14px] md:text-[15px] tv:text-[17.5px] font-medium text-white/92 truncate">
                    {ep.title}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
}
