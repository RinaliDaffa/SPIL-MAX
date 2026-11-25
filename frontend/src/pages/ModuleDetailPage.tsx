import React, { useMemo, useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import {
  Play,
  ChevronLeft,
  Plus,
  Check,
  RotateCcw,
  CheckCheck,
} from 'lucide-react';
import PickerPure from '@/components/PickerPure';
import SynopsisPure from '@/components/SynopsisPure';
import RowPure from '@/components/RowPure';
import { learningStore, useLearningStore } from '@/services/learningStore';

/**
 * SPIL MAX Course / Competency Detail Page — Adapted from NovaStream DetailsPure (MIT).
 * Displays Apple TV+ full-bleed hero, Level filter picker, clean iOS/tvOS vertical
 * episode rows with progress bars & learning takeaways, instructors, and related modules.
 */
export default function ModuleDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { modules, progress, watchedEpisodes, myList } = useLearningStore();

  const [levelFilter, setLevelFilter] = useState<string>('all');
  const [synopsisOpen, setSynopsisOpen] = useState(false);

  const module = useMemo(
    () => modules.find((m) => m.slug === slug || m.id === slug),
    [modules, slug]
  );

  useEffect(() => {
    window.scrollTo(0, 0);
    setLevelFilter('all');
    setSynopsisOpen(false);
  }, [slug]);

  if (!module) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center gap-3 px-6 text-center">
        <p className="p-title text-xl">Modul tidak ditemukan</p>
        <button
          type="button"
          onClick={() => navigate('/')}
          className="p-btn p-btn-ghost mt-2"
        >
          Kembali ke Beranda
        </button>
      </div>
    );
  }

  const watchedSet = new Set(watchedEpisodes);
  const inMyList = myList.includes(module.id);

  const allCompleted = module.episodes.every((ep) =>
    watchedSet.has(learningStore.keyOf(module.id, ep.id))
  );

  // Determine best resume episode (in-progress, else first unwatched, else Level 1)
  const resumeInfo = (() => {
    for (const ep of module.episodes) {
      const key = learningStore.keyOf(module.id, ep.id);
      const p = progress[key];
      if (p && p.currentTime > 1 && p.duration > 0 && p.currentTime / p.duration < 0.9) {
        return {
          episode: ep,
          pct: Math.round((p.currentTime / p.duration) * 100),
          isResume: true,
        };
      }
    }
    const firstUnwatched = module.episodes.find(
      (ep) => !watchedSet.has(learningStore.keyOf(module.id, ep.id))
    );
    return {
      episode: firstUnwatched || module.episodes[0],
      pct: 0,
      isResume: false,
    };
  })();

  const visibleEpisodes =
    levelFilter === 'all'
      ? module.episodes
      : module.episodes.filter((ep) => String(ep.levelNumber) === levelFilter);

  const relatedModules = modules.filter(
    (m) => m.id !== module.id && (m.kind === module.kind || m.mandatoryFromSuperior)
  ).slice(0, 8);

  const meta = [
    module.kind,
    `${module.episodes.length} Level Video`,
    module.totalDurationText,
    module.division,
    String(module.year),
  ]
    .filter(Boolean)
    .join('  ·  ');

  return (
    <div className="overflow-x-hidden pb-10 md:pb-20">
      {/* ── Hero Backdrop ── */}
      <div className="relative w-full h-[74vh] sm:h-[78vh] md:h-[85vh]">
        <picture>
          <source media="(max-width: 639px)" srcSet={module.poster || module.backdrop} />
          <img
            src={module.backdrop || module.poster}
            alt={module.title}
            decoding="async"
            className="absolute inset-0 w-full h-full object-cover"
          />
        </picture>

        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'linear-gradient(to top, #000000 0%, rgba(0,0,0,0.92) 26%, rgba(0,0,0,0.25) 66%, rgba(0,0,0,0.45) 100%)',
          }}
        />

        <button
          type="button"
          data-tv-focus
          onClick={() => navigate(-1)}
          aria-label="Kembali"
          className="absolute top-[66px] md:top-[76px] tv:top-[96px] left-4 md:left-8 tv:left-14 z-30 w-9 h-9 tv:w-11 tv:h-11 rounded-full bg-black/50 border border-white/10 backdrop-blur-md flex items-center justify-center text-white/85 hover:text-white active:scale-95 transition-all"
        >
          <ChevronLeft size={19} />
        </button>

        <div className="absolute inset-x-0 bottom-0 px-5 md:px-8 tv:px-14 pb-8 md:pb-12 max-w-[1600px] tv:max-w-[2200px] mx-auto">
          <div className="p-in max-w-2xl tv:max-w-4xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.1] border border-white/15 backdrop-blur-md text-[11px] tv:text-[13px] font-semibold tracking-[0.08em] uppercase text-white/90 mb-3.5">
              <span>{module.competency}</span>
              {module.badge && (
                <>
                  <span className="text-white/35">·</span>
                  <span>{module.badge}</span>
                </>
              )}
            </div>

            <h1 className="p-display text-[30px] sm:text-[40px] md:text-[54px] tv:text-[70px] mb-3.5">
              {module.title}
            </h1>

            <p className="text-[12.5px] md:text-[13.5px] tv:text-[16px] font-medium p-dim mb-4">
              {meta}
            </p>

            {/* Summary truncated to 3 lines with accessible "selengkapnya" trigger outside clamp */}
            <div className="max-w-xl tv:max-w-3xl mb-6">
              <p
                onClick={() => setSynopsisOpen(true)}
                className="text-[13.5px] md:text-[15px] tv:text-[17.5px] text-white/80 leading-relaxed line-clamp-3 cursor-pointer"
              >
                {module.summary}
              </p>
              <button
                type="button"
                onClick={() => setSynopsisOpen(true)}
                className="mt-1 text-[13px] tv:text-[15px] font-medium text-white/55 hover:text-white transition-colors"
              >
                Selengkapnya &amp; Capaian Kompetensi ›
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 md:gap-3">
              <button
                type="button"
                data-tv-focus
                data-tv-hero-primary
                onClick={() => navigate(`/tonton/${module.slug}/${resumeInfo.episode.id}`)}
                className="p-btn relative overflow-hidden"
              >
                {resumeInfo.isResume ? (
                  <RotateCcw size={16} />
                ) : (
                  <Play size={16} fill="currentColor" />
                )}
                <span>
                  {resumeInfo.isResume
                    ? `Lanjutkan Level ${resumeInfo.episode.levelNumber}`
                    : `Putar Level ${resumeInfo.episode.levelNumber}`}
                </span>
                {resumeInfo.isResume && (
                  <span
                    className="absolute bottom-0 left-0 h-[3px] bg-black/35"
                    style={{ width: `${Math.min(resumeInfo.pct, 100)}%` }}
                  />
                )}
              </button>

              <button
                type="button"
                data-tv-focus
                onClick={() => learningStore.toggleMyList(module.id)}
                aria-label={inMyList ? 'Hapus dari Daftar Saya' : 'Tambah ke Daftar Saya'}
                className={`p-btn p-btn-ghost ${inMyList ? '!bg-white/25' : ''}`}
              >
                {inMyList ? <Check size={16} strokeWidth={2.6} /> : <Plus size={17} strokeWidth={2.4} />}
                <span>{inMyList ? 'Tersimpan di Daftar Saya' : 'Daftar Saya'}</span>
              </button>

              <button
                type="button"
                data-tv-focus
                disabled={allCompleted}
                onClick={() =>
                  learningStore.markModuleEpisodesWatched(
                    module.id,
                    module.episodes.map((e) => e.id)
                  )
                }
                title="Tandai seluruh level selesai"
                className="p-icon-btn disabled:opacity-45"
              >
                <CheckCheck size={18} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Level & Episode List (Apple TV Vertical Shelf) ── */}
      <section
        id="level-list"
        data-row
        className="max-w-[1080px] tv:max-w-[1440px] mx-auto px-5 md:px-8 tv:px-14 pt-10 md:pt-14"
      >
        <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
          <div>
            <h2 className="p-title text-[20px] md:text-[24px] tv:text-[30px]">
              Kurikulum Level Video
            </h2>
            <p className="text-[12.5px] tv:text-[14.5px] p-faint mt-0.5">
              Klik salah satu level untuk memutar dengan subtitle &amp; transkrip interaktif
            </p>
          </div>

          {module.episodes.length > 1 && (
            <PickerPure
              title="Pilih Level Kompetensi"
              label="Semua Level"
              value={levelFilter}
              onPick={setLevelFilter}
              options={[
                { value: 'all', label: `Semua Level (${module.episodes.length})` },
                ...module.episodes.map((ep) => ({
                  value: String(ep.levelNumber),
                  label: ep.levelLabel,
                })),
              ]}
            />
          )}
        </div>

        <div>
          {visibleEpisodes.map((ep) => {
            const key = learningStore.keyOf(module.id, ep.id);
            const isWatched = watchedSet.has(key);
            const p = progress[key];
            const pct =
              p && p.duration > 0 ? Math.min(100, Math.round((p.currentTime / p.duration) * 100)) : 0;

            return (
              <button
                key={ep.id}
                type="button"
                data-card
                onClick={() => navigate(`/tonton/${module.slug}/${ep.id}`)}
                className="w-full flex flex-col sm:flex-row sm:items-center gap-3.5 md:gap-5 py-4 p-hair text-left group/ep focus:outline-none rounded-xl px-1 -mx-1"
              >
                <div className="p-card w-full sm:w-[168px] md:w-[210px] tv:w-[270px] aspect-video shrink-0">
                  <img
                    src={ep.still || module.backdrop}
                    alt={ep.title}
                    loading="lazy"
                    decoding="async"
                  />
                  <span className="absolute top-2 left-2 px-2 py-[2px] rounded bg-black/65 backdrop-blur-md text-[10px] font-semibold text-white/90">
                    {ep.levelLabel}
                  </span>
                  <span className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/ep:opacity-100 group-focus-visible/ep:opacity-100 transition-opacity bg-black/30">
                    <span className="w-10 h-10 rounded-full bg-black/55 backdrop-blur-md border border-white/20 flex items-center justify-center text-white">
                      <Play size={16} fill="currentColor" className="ml-0.5" />
                    </span>
                  </span>
                  {!isWatched && pct > 0 && (
                    <span className="absolute bottom-0 inset-x-0 h-[3px] bg-white/25">
                      <span className="block h-full bg-white" style={{ width: `${pct}%` }} />
                    </span>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-[15px] md:text-[16px] tv:text-[19px] font-semibold text-white truncate">
                      Level {ep.levelNumber} — {ep.title}
                    </p>
                    {isWatched && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/12 text-[10.5px] font-semibold text-white/85 shrink-0">
                        <Check size={11} strokeWidth={3} /> Selesai
                      </span>
                    )}
                  </div>
                  <p className="text-[12px] tv:text-[14px] p-faint mt-0.5">
                    {ep.durationText}  ·  Subtitle ID / EN  ·  4 Bab Materi
                  </p>
                  <p className="text-[13px] md:text-[13.5px] tv:text-[15.5px] p-dim leading-relaxed line-clamp-2 mt-1.5">
                    {ep.description}
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        {/* ── Learning Objectives & Curators Card ── */}
        <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2 p-5 rounded-2xl bg-white/[0.04] border border-white/[0.08]">
            <p className="p-label mb-3">Capaian Pembelajaran Kompetensi</p>
            <ul className="space-y-2 text-[13.5px] tv:text-[15.5px] text-white/80">
              {module.objectives.map((obj, idx) => (
                <li key={idx} className="flex items-start gap-2.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-white/60 mt-2 shrink-0" />
                  <span>{obj}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="p-5 rounded-2xl bg-white/[0.04] border border-white/[0.08]">
            <p className="p-label mb-3">Kurator &amp; Divisi Pengampu</p>
            <div className="space-y-3">
              {module.instructors.map((inst, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-[13px] font-semibold text-white/85 shrink-0">
                    {inst.name.charAt(0)}
                  </span>
                  <div className="min-w-0">
                    <p className="text-[13.5px] tv:text-[15px] font-medium text-white truncate">
                      {inst.name}
                    </p>
                    <p className="text-[11.5px] tv:text-[13px] p-faint truncate">{inst.role}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Related Modules ── */}
      {relatedModules.length > 0 && (
        <div className="pt-12 md:pt-16 max-w-[1600px] tv:max-w-[2200px] mx-auto">
          <RowPure
            title="Modul Terkait Selanjutnya"
            items={relatedModules}
            variant="wide"
            seeAll={false}
          />
        </div>
      )}

      <AnimatePresence>
        {synopsisOpen && (
          <SynopsisPure
            title={module.title}
            text={module.summary}
            meta={meta}
            objectives={module.objectives}
            onClose={() => setSynopsisOpen(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
