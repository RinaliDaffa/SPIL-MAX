import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Plus, Check } from 'lucide-react';
import type { LearningModule } from '@/types/learning';
import { learningStore, useLearningStore } from '@/services/learningStore';

const SLIDE_DURATION = 5500;

interface HeroPureProps {
  modules: LearningModule[];
}

/**
 * Apple TV+ Full-Bleed Showcase Hero — Adapted from NovaStream HeroPure (MIT).
 * Crossfade artwork, horizontal touch-swipe on mobile/tablet, animated 5.5s
 * progress bars, primary white pill CTA, frosted secondary CTA, and My List toggle.
 */
export default function HeroPure({ modules = [] }: HeroPureProps) {
  const navigate = useNavigate();
  const { myList, progress } = useLearningStore();
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (modules.length <= 1 || paused) return undefined;
    const timer = setTimeout(() => {
      setIndex((prev) => (prev + 1) % modules.length);
    }, SLIDE_DURATION);
    return () => clearTimeout(timer);
  }, [modules.length, index, paused]);

  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const swipedRecently = useRef(false);

  const onTouchStart = (e: React.TouchEvent) => {
    const t = e.touches[0];
    touchStart.current = { x: t.clientX, y: t.clientY };
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    const start = touchStart.current;
    touchStart.current = null;
    if (!start || modules.length <= 1) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - start.x;
    const dy = t.clientY - start.y;
    if (Math.abs(dx) < 45 || Math.abs(dx) < Math.abs(dy) * 1.3) return;
    swipedRecently.current = true;
    setTimeout(() => {
      swipedRecently.current = false;
    }, 400);
    setIndex((prev) => (dx < 0 ? (prev + 1) % modules.length : (prev - 1 + modules.length) % modules.length));
  };

  if (!modules.length) return null;
  const current = modules[index % modules.length];
  const inMyList = myList.includes(current.id);

  // Find active resume episode if user already started this module
  const resumeEpisode = current.episodes.find((ep) => {
    const p = progress[learningStore.keyOf(current.id, ep.id)];
    return p && p.currentTime > 1 && p.currentTime / p.duration < 0.9;
  });
  const targetEpisode = resumeEpisode || current.episodes[0];

  const meta = [
    current.kind,
    current.episodes.length > 1 ? `${current.episodes.length} Level` : 'Modul Spesial',
    current.totalDurationText,
    current.division,
  ]
    .filter(Boolean)
    .join('  ·  ');

  return (
    <section
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onClick={() => {
        if (!swipedRecently.current) navigate(`/modul/${current.slug}`);
      }}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      style={{ touchAction: 'pan-y' }}
      className="relative w-full h-[80vh] sm:h-[84vh] md:h-[90vh] tv:h-[92vh] overflow-hidden cursor-pointer select-none"
    >
      <AnimatePresence>
        <motion.div
          key={current.id}
          initial={{ opacity: 0, scale: 1.02 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.2, ease: 'easeInOut' }}
          className="absolute inset-0"
        >
          <picture>
            <source media="(max-width: 639px)" srcSet={current.poster || current.backdrop} />
            <img
              src={current.backdrop || current.poster}
              alt={current.title}
              decoding="async"
              className="absolute inset-0 w-full h-full object-cover object-center"
            />
          </picture>
        </motion.div>
      </AnimatePresence>

      {/* Pure Apple TV+ vignette fade to pure black */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'linear-gradient(to top, #000000 0%, rgba(0,0,0,0.88) 22%, rgba(0,0,0,0.22) 62%, rgba(0,0,0,0.42) 100%)',
        }}
      />

      <div className="absolute inset-x-0 bottom-0 pb-24 sm:pb-28 lg:pb-24 tv:pb-28 px-5 md:px-10 tv:px-16 flex flex-col items-center text-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={`hero-copy-${current.id}`}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.55, ease: [0.32, 0.72, 0, 1] }}
            className="flex flex-col items-center max-w-2xl tv:max-w-4xl"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.1] border border-white/15 backdrop-blur-md text-[11px] tv:text-[13px] font-semibold tracking-[0.09em] uppercase text-white/90 mb-3.5">
              <span>SPIL MAX</span>
              {current.badge && (
                <>
                  <span className="text-white/35">·</span>
                  <span>{current.badge}</span>
                </>
              )}
            </div>

            <h1 className="p-display text-[32px] sm:text-[42px] md:text-[58px] tv:text-[76px] mb-3.5 md:mb-4">
              {current.title}
            </h1>

            <p className="text-[12px] sm:text-[13px] tv:text-[16px] font-medium tracking-[0.01em] p-dim mb-3">
              {meta}
            </p>

            {current.heroTagline && (
              <p className="hidden sm:block text-[14px] md:text-[15.5px] tv:text-[19px] text-white/75 max-w-xl tv:max-w-2xl leading-relaxed mb-6 line-clamp-2">
                {current.heroTagline}
              </p>
            )}

            <div className="flex flex-wrap items-center justify-center gap-2.5 md:gap-3 mt-2 sm:mt-0">
              <button
                type="button"
                data-tv-focus
                data-tv-hero-primary
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/tonton/${current.slug}/${targetEpisode.id}`);
                }}
                className="p-btn"
              >
                <Play size={16} fill="currentColor" />
                {resumeEpisode ? `Lanjutkan Level ${resumeEpisode.levelNumber}` : 'Mulai Belajar'}
              </button>

              <button
                type="button"
                data-tv-focus
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/modul/${current.slug}`);
                }}
                className="p-btn p-btn-ghost"
              >
                Detail Modul
              </button>

              <button
                type="button"
                data-tv-focus
                onClick={(e) => {
                  e.stopPropagation();
                  learningStore.toggleMyList(current.id);
                }}
                aria-label={inMyList ? 'Hapus dari Daftar Saya' : 'Tambah ke Daftar Saya'}
                title={inMyList ? 'Tersimpan di Daftar Saya' : 'Tambah ke Daftar Saya'}
                className={`p-icon-btn ${inMyList ? '!bg-white !text-black' : ''}`}
              >
                {inMyList ? <Check size={18} strokeWidth={2.6} /> : <Plus size={19} strokeWidth={2.4} />}
              </button>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Segmented Apple TV+ indicator pills */}
      {modules.length > 1 && (
        <div className="absolute bottom-[64px] sm:bottom-[72px] lg:bottom-9 inset-x-0 flex justify-center gap-1.5">
          {modules.map((m, k) => {
            const active = k === index % modules.length;
            return (
              <button
                key={m.id}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIndex(k);
                }}
                aria-label={`Slide ${k + 1}: ${m.title}`}
                className={`relative h-[3px] tv:h-[4px] rounded-full overflow-hidden transition-all duration-500 ${
                  active ? 'w-7 tv:w-9 bg-white/30' : 'w-[5px] tv:w-[6px] bg-white/35 hover:bg-white/65'
                }`}
              >
                {active && !paused && (
                  <motion.span
                    key={`progress-${index}`}
                    className="absolute inset-y-0 left-0 bg-white rounded-full"
                    initial={{ width: '0%' }}
                    animate={{ width: '100%' }}
                    transition={{ duration: SLIDE_DURATION / 1000, ease: 'linear' }}
                  />
                )}
                {active && paused && <span className="absolute inset-0 bg-white rounded-full" />}
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
}
