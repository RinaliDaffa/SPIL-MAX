import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, X } from 'lucide-react';
import HeroPure from '@/components/HeroPure';
import RowPure from '@/components/RowPure';
import CardPure from '@/components/CardPure';
import { MODULES, getHeroModules, getTop10Modules } from '@/data/catalog';
import { learningStore, useLearningStore } from '@/services/learningStore';

/**
 * SPIL MAX Home Page — Adapted from NovaStream HomePure (MIT).
 * Combines Apple TV+ full-bleed showcase hero, Continue Learning ("Lanjutkan Belajar"),
 * Mandatory / Superior Assigned ("Dari Atasan & Wajib"), Top 10 SPIL Modules,
 * Kamus Kompetensi SPIL rails, and External Curated E-Learning.
 */
export default function HomePage() {
  const navigate = useNavigate();
  const { progress, watchedEpisodes } = useLearningStore();

  const heroModules = useMemo(() => getHeroModules(), []);
  const top10 = useMemo(() => getTop10Modules(), []);

  // Compute module-level completion & progress maps
  const { watchedModuleIds, moduleProgressMap, continueItems } = useMemo(() => {
    const watchedSet = new Set(watchedEpisodes);
    const modWatched = new Set<string>();
    const modProg: Record<string, number> = {};

    for (const m of MODULES) {
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
        const mod = MODULES.find((m) => m.id === entry.moduleId);
        const ep = mod?.episodes.find((e) => e.id === entry.episodeId);
        if (!mod || !ep) return null;
        const pct = Math.min(100, Math.round((entry.currentTime / entry.duration) * 100));
        // Scale remaining display minutes proportionally to actual training duration
        const parsedMins = parseInt(ep.durationText, 10) || 12;
        const minsLeft = Math.max(1, Math.round(parsedMins * (1 - entry.currentTime / entry.duration)));
        return { mod, ep, pct, minsLeft };
      })
      .filter((x): x is NonNullable<typeof x> => Boolean(x));

    return {
      watchedModuleIds: modWatched,
      moduleProgressMap: modProg,
      continueItems: cwList,
    };
  }, [progress, watchedEpisodes]);

  const fromSuperior = useMemo(() => MODULES.filter((m) => m.mandatoryFromSuperior), []);
  const coreModules = useMemo(() => MODULES.filter((m) => m.kind === 'Core'), []);
  const operationalModules = useMemo(
    () => MODULES.filter((m) => m.kind === 'Operasional & K3'),
    []
  );
  const managerialModules = useMemo(
    () => MODULES.filter((m) => m.kind === 'Managerial' || m.id === 'sizing-up-people'),
    []
  );
  const externalModules = useMemo(() => MODULES.filter((m) => m.kind === 'Eksternal'), []);

  return (
    <div className="pb-6 md:pb-16">
      <HeroPure modules={heroModules} />

      <div className="relative -mt-4 md:-mt-6 z-10">
        {/* ── 1. Lanjutkan Belajar (Continue Your Learning — Matches Mockup Image 2) ── */}
        {continueItems.length > 0 && (
          <section data-row className="mb-10 md:mb-14 tv:mb-16">
            <div className="px-5 md:px-8 tv:px-14 mb-3.5 md:mb-4">
              <h2 className="p-title text-[18px] md:text-[22px] tv:text-[28px]">
                Lanjutkan Belajar
              </h2>
            </div>

            <div className="p-rail p-marge gap-3.5 md:gap-4 tv:gap-6 px-5 md:px-8 tv:px-14 pb-1.5">
              {continueItems.map(({ mod, ep, pct, minsLeft }) => (
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

                    <span className="absolute top-2.5 left-2.5 px-2 py-[3px] rounded-md bg-black/60 backdrop-blur-md border border-white/10 text-[9.5px] tv:text-[11px] font-semibold tracking-[0.06em] uppercase text-white/90">
                      Level {ep.levelNumber}
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
                      <span className="w-11 h-11 tv:w-14 tv:h-14 rounded-full bg-black/50 backdrop-blur-md border border-white/15 flex items-center justify-center text-white">
                        <Play size={16} fill="currentColor" className="ml-0.5" />
                      </span>
                    </span>

                    <span className="absolute bottom-0 inset-x-0 h-[3px] bg-white/25">
                      <span className="block h-full bg-white" style={{ width: `${pct}%` }} />
                    </span>
                  </div>

                  <div className="mt-2 px-0.5">
                    <p className="text-[13px] tv:text-[15.5px] font-medium text-white/90 truncate">
                      {mod.title}
                    </p>
                    <p className="text-[11.5px] tv:text-[13.5px] p-faint mt-0.5 truncate">
                      {ep.title}  ·  {minsLeft} mnt tersisa
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── 2. Dari Atasan & Wajib (From Superior — Matches Mockup Image 2) ── */}
        <RowPure
          title="Dari Atasan &amp; Modul Wajib"
          subtitle="Penugasan kompetensi prioritas &amp; kepatuhan LARA Q1"
          items={fromSuperior}
          variant="wide"
          watchedModuleIds={watchedModuleIds}
          moduleProgressMap={moduleProgressMap}
        />

        {/* ── 3. Top 10 Modul Terpopuler di SPIL (Apple TV+ Outlined Rank Numbers) ── */}
        <section data-row className="mb-10 md:mb-14 tv:mb-16">
          <div className="px-5 md:px-8 tv:px-14 mb-3.5 md:mb-4">
            <h2 className="p-title text-[18px] md:text-[22px] tv:text-[28px]">
              Top 10 Modul Terpopuler di SPIL
            </h2>
            <p className="text-[12px] md:text-[13px] tv:text-[15px] p-faint mt-1">
              Rekomendasi teratas minggu ini di seluruh cabang &amp; armada
            </p>
          </div>

          <div className="p-rail p-marge gap-3.5 md:gap-5 tv:gap-7 px-5 md:px-8 tv:px-14 pt-2 pb-4 items-end">
            {top10.map((it, k) => (
              <div key={it.id} className="relative shrink-0">
                <CardPure
                  item={it}
                  width="w-[126px] sm:w-[146px] md:w-[168px] tv:w-[220px]"
                  showTitle={false}
                  watched={watchedModuleIds.has(it.id)}
                  progress={moduleProgressMap[it.id] || 0}
                />
                <span aria-hidden="true" className="top10-num-sur select-none pointer-events-none">
                  {k + 1}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* ── 4. Kamus Kompetensi Inti (Core Competency SPIL) ── */}
        <RowPure
          title="Core Competency SPIL"
          subtitle="1 kompetensi = 4 level video berjenjang dari Kamus Kompetensi SPIL"
          items={coreModules}
          variant="poster"
          watchedModuleIds={watchedModuleIds}
          moduleProgressMap={moduleProgressMap}
        />

        {/* ── 5. Kepelabuhanan, Depo & K3 ── */}
        <RowPure
          title="Kepelabuhanan, Depo &amp; Keselamatan K3"
          subtitle="Standar operasi terminal peti kemas, yard optimization, dan HSSE"
          items={operationalModules}
          variant="wide"
          watchedModuleIds={watchedModuleIds}
          moduleProgressMap={moduleProgressMap}
        />

        {/* ── 6. Leadership & Managerial ── */}
        <RowPure
          title="Leadership &amp; Managerial"
          subtitle="Pengembangan pemimpin tim, psychological safety, dan disiplin eksekusi"
          items={managerialModules}
          variant="poster"
          watchedModuleIds={watchedModuleIds}
          moduleProgressMap={moduleProgressMap}
        />

        {/* ── 7. SPIL MAX · Kurasi Eksternal (Q2 External E-Learning Feature) ── */}
        <RowPure
          title="SPIL MAX · Kurasi Eksternal"
          subtitle="Wawasan global dekarbonisasi maritim, AI, dan transformasi rantai pasok"
          items={externalModules}
          variant="wide"
          watchedModuleIds={watchedModuleIds}
          moduleProgressMap={moduleProgressMap}
        />

        {/* ── Minimal Apple TV+ Footer ── */}
        <footer className="px-5 md:px-8 tv:px-14 pt-8 pb-4 border-t border-white/[0.08] mt-8 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-[12px] tv:text-[14px] p-faint">
          <div>
            <span className="text-white/75 font-semibold">SPIL MAX</span> · E-Learning Hub &amp; Edu Stream · PT Salam Pacific Indonesia Lines
          </div>
          <div>Vision · Understanding · Clarity · Agility (VUCA)</div>
        </footer>
      </div>
    </div>
  );
}
