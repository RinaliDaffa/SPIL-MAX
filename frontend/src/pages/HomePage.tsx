import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, X } from 'lucide-react';
import HeroPure from '@/components/HeroPure';
import RowPure from '@/components/RowPure';
import CardPure from '@/components/CardPure';
import { learningStore, useLearningStore } from '@/services/learningStore';

/**
 * SPIL MAX Home Page (Beranda)
 * Unified Apple TV+ Streaming Experience:
 * 1. Hero Rekomendasi Video
 * 2. Lanjutkan Belajar
 * 3. Modul Wajib
 * 4. Top 10 Most Watched
 * 5. Core Competency
 * 6. Technical Competency
 * 7. Managerial Competency
 * 8. Learn More
 */
export default function HomePage() {
  const navigate = useNavigate();
  const { modules, progress, watchedEpisodes } = useLearningStore();

  const heroModules = useMemo(() => modules.filter((m) => m.featuredInHero), [modules]);
  const top10 = useMemo(
    () =>
      [...modules]
        .filter((m) => m.topRank != null)
        .sort((a, b) => (a.topRank || 99) - (b.topRank || 99))
        .slice(0, 10),
    [modules]
  );

  const { watchedModuleIds, moduleProgressMap, continueItems } = useMemo(() => {
    const watchedSet = new Set(watchedEpisodes);
    const modWatched = new Set<string>();
    const modProg: Record<string, number> = {};

    for (const m of modules) {
      const doneCount = m.episodes.filter((e) =>
        watchedSet.has(learningStore.keyOf(m.id, e.id))
      ).length;
      if (doneCount === m.episodes.length && m.episodes.length > 0) {
        modWatched.add(m.id);
      } else if (doneCount > 0) {
        modProg[m.id] = Math.round((doneCount / m.episodes.length) * 100);
      }
    }

    const cwList = Object.values(progress)
      .filter((entry) => {
        if (entry.hiddenFromContinue) return false;
        if (entry.duration <= 0) return false;
        const pct = entry.currentTime / entry.duration;
        return pct > 0.03 && pct < 0.92;
      })
      .sort((a, b) => b.updatedAt - a.updatedAt)
      .map((entry) => {
        const mod = modules.find((m) => m.id === entry.moduleId);
        const ep = mod?.episodes.find((e) => e.id === entry.episodeId);
        if (!mod || !ep) return null;
        const pct = Math.min(100, Math.round((entry.currentTime / entry.duration) * 100));
        const parsedMins = parseInt(ep.durationText, 10) || 17;
        const minsLeft = Math.max(1, Math.round(parsedMins * (1 - entry.currentTime / entry.duration)));
        return { mod, ep, pct, minsLeft };
      })
      .filter((x): x is NonNullable<typeof x> => Boolean(x));

    return {
      watchedModuleIds: modWatched,
      moduleProgressMap: modProg,
      continueItems: cwList,
    };
  }, [modules, progress, watchedEpisodes]);

  const mandatoryModules = useMemo(() => modules.filter((m) => m.mandatoryFromSuperior), [modules]);
  const coreModules = useMemo(() => modules.filter((m) => m.kind === 'Core'), [modules]);
  const technicalModules = useMemo(() => modules.filter((m) => m.kind === 'Technical'), [modules]);
  const managerialModules = useMemo(() => modules.filter((m) => m.kind === 'Managerial'), [modules]);
  const learnMoreModules = useMemo(() => modules.filter((m) => m.kind === 'Learn More'), [modules]);

  return (
    <div className="pb-6 md:pb-16">
      {/* ── Rekomendasi Video (Showcase Hero) ── */}
      <HeroPure modules={heroModules} />

      <div className="relative -mt-4 md:-mt-6 z-10">
        {/* ── 1. Lanjutkan Belajar ── */}
        {continueItems.length > 0 && (
          <section data-row className="mb-10 md:mb-14 tv:mb-16">
            <div className="px-5 md:px-8 tv:px-14 mb-3.5 md:mb-4">
              <div className="inline-flex items-center gap-2.5">
                <span className="spil-bar-green" />
                <h2 className="p-title text-[18px] md:text-[22px] tv:text-[28px] text-white">
                  Lanjutkan Belajar
                </h2>
              </div>
            </div>

            <div className="p-rail p-marge gap-3.5 md:gap-4 tv:gap-6 px-5 md:px-8 tv:px-14 pb-1.5">
              {continueItems.map(({ mod, ep, pct, minsLeft }) => {
                const badgeText =
                  mod.kind === 'Learn More'
                    ? `Bagian ${ep.levelNumber} · Sisa ${minsLeft} Menit`
                    : `Level ${ep.levelNumber} · Sisa ${minsLeft} Menit`;
                return (
                  <div
                    key={`${mod.id}:${ep.id}`}
                    data-card
                    tabIndex={0}
                    role="button"
                    onClick={() => navigate(`/tonton/${mod.slug}/${ep.id}`)}
                    className="p-card-hit shrink-0 w-[252px] sm:w-[284px] md:w-[330px] tv:w-[410px] cursor-pointer group/cw text-left focus:outline-none"
                  >
                    <div className="p-card aspect-video">
                      <img src={ep.still || mod.backdrop} alt={ep.title} loading="lazy" decoding="async" />
                      <div
                        className="absolute inset-0 pointer-events-none"
                        style={{
                          background:
                            'linear-gradient(to top, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0.08) 50%, rgba(0,0,0,0.28) 100%)',
                        }}
                      />

                      <span className="absolute top-2.5 left-2.5 inline-flex items-center gap-1.5 px-2 py-[3px] rounded-md bg-black/65 backdrop-blur-md border border-white/12 text-[9.5px] tv:text-[11px] font-semibold tracking-[0.05em] uppercase text-white/92">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#22c55e]" />
                        <span>{badgeText}</span>
                      </span>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          learningStore.hideFromContinueWatching(mod.id, ep.id);
                        }}
                        title="Sembunyikan dari Lanjutkan Belajar"
                        aria-label="Sembunyikan dari Lanjutkan Belajar"
                        className="absolute top-2.5 right-2.5 z-10 w-7 h-7 rounded-full bg-black/60 backdrop-blur-md flex items-center justify-center text-white/75 hover:text-white hover:bg-black/80 transition-colors active:scale-90"
                      >
                        <X size={14} strokeWidth={2.5} />
                      </button>

                      <span className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/cw:opacity-100 group-focus-visible/cw:opacity-100 transition-opacity pointer-events-none">
                        <span className="w-11 h-11 tv:w-14 tv:h-14 rounded-full bg-black/55 backdrop-blur-md border border-white/20 flex items-center justify-center text-white">
                          <Play size={16} fill="currentColor" className="ml-0.5" />
                        </span>
                      </span>

                      <span className="absolute bottom-0 inset-x-0 h-[3px] bg-white/20">
                        <span className="block h-full spil-progress-fill" style={{ width: `${pct}%` }} />
                      </span>
                    </div>

                    <div className="mt-2.5 px-0.5">
                      <p className="text-[13px] md:text-[13.5px] tv:text-[16px] font-medium text-white/92 truncate">
                        {mod.title}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* ── 2. Modul Wajib ── */}
        <RowPure
          title="Modul Wajib"
          accent="red"
          seeAllPath="/wajib"
          items={mandatoryModules}
          variant="wide"
          watchedModuleIds={watchedModuleIds}
          moduleProgressMap={moduleProgressMap}
        />

        {/* ── 3. Top 10 Most Watched ── */}
        <RowPure
          title="Top 10 Most Watched"
          accent="red"
          seeAll={false}
          items={top10}
          variant="wide"
          watchedModuleIds={watchedModuleIds}
          moduleProgressMap={moduleProgressMap}
          renderCard={(it, k) => (
            <CardPure
              key={it.id}
              item={it}
              variant="wide"
              width="w-[244px] sm:w-[276px] md:w-[320px] tv:w-[400px]"
              rankNumber={k + 1}
              showTitle={true}
              watched={watchedModuleIds.has(it.id)}
              progress={moduleProgressMap[it.id] || 0}
            />
          )}
        />

        {/* ── 4. Core Competency ── */}
        <RowPure
          title="Core Competency"
          accent="green"
          seeAllPath="/core"
          items={coreModules}
          variant="poster"
          watchedModuleIds={watchedModuleIds}
          moduleProgressMap={moduleProgressMap}
        />

        {/* ── 5. Technical Competency ── */}
        <RowPure
          title="Technical Competency"
          accent="green"
          seeAllPath="/technical"
          items={technicalModules}
          variant="wide"
          watchedModuleIds={watchedModuleIds}
          moduleProgressMap={moduleProgressMap}
        />

        {/* ── 6. Managerial Competency ── */}
        <RowPure
          title="Managerial Competency"
          accent="green"
          seeAllPath="/managerial"
          items={managerialModules}
          variant="poster"
          watchedModuleIds={watchedModuleIds}
          moduleProgressMap={moduleProgressMap}
        />

        {/* ── 7. Learn More (Identical Apple TV+ Module Rail for L&D Topics) ── */}
        <RowPure
          title="Learn More"
          accent="green"
          seeAllPath="/learn-more"
          items={learnMoreModules}
          variant="wide"
          watchedModuleIds={watchedModuleIds}
          moduleProgressMap={moduleProgressMap}
        />

        {/* ── Minimal Apple TV+ Footer ── */}
        <footer className="px-5 md:px-8 tv:px-14 pt-8 pb-4 border-t border-white/[0.08] mt-8 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-[12px] tv:text-[14px] p-faint">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#d02030]" />
            <span className="text-white/80 font-semibold">SPIL MAX</span>
            <span>· PT Salam Pacific Indonesia Lines</span>
          </div>
          <div>Vision · Understanding · Clarity · Agility (VUCA)</div>
        </footer>
      </div>
    </div>
  );
}
