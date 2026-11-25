import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronLeft, FileText, X, CheckCircle2, RotateCcw } from 'lucide-react';
import { createPlayer, definePlugin } from '@/vendor/react-video/core';
import { VideoPlayer, defaultPlugins } from '@/vendor/react-video/player';
import { Button } from '@/vendor/react-video/react/primitives/button';
import { playlist, type PlaylistItem } from '@/vendor/react-video/plugins/playlist';
import { episodes } from '@/vendor/react-video/plugins/episodes';
import { info } from '@/vendor/react-video/plugins/info';
import { skip } from '@/vendor/react-video/plugins/skip';
import { chapters } from '@/vendor/react-video/plugins/chapters';
import { captions } from '@/vendor/react-video/plugins/captions';
import { transcript, Transcript } from '@/vendor/react-video/plugins/transcript';
import { i18n } from '@/vendor/react-video/plugins/i18n';
import { id as idStrings } from '@/vendor/react-video/plugins/i18n/id';
import { airplay } from '@/vendor/react-video/plugins/airplay';
import { shortcuts } from '@/vendor/react-video/plugins/shortcuts';
import { hls } from '@/vendor/react-video/plugins/hls';
import type { LearningModule } from '@/types/learning';
import { learningStore } from '@/services/learningStore';

function formatClock(sec: number): string {
  const total = Math.max(0, Math.floor(sec));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

interface AppleTvPlayerProps {
  module: LearningModule;
  initialEpisodeId: string;
  onBack: () => void;
  onEpisodeChange?: (episodeId: string) => void;
}

/**
 * SPIL MAX Apple TV / tvOS Liquid Glass Video Player.
 * Includes zero-flicker "Continue Where I Left Off" (via load gate startTime +
 * backend/localStorage sync on play, pause, episode switch, and tab close).
 */
export default function AppleTvPlayer({
  module,
  initialEpisodeId,
  onBack,
  onEpisodeChange,
}: AppleTvPlayerProps) {
  const [transcriptOpen, setTranscriptOpen] = useState(false);
  const [resumedBanner, setResumedBanner] = useState<{ seconds: number; epTitle: string } | null>(
    null
  );
  const bannerTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const startIndex = useMemo(() => {
    const idx = module.episodes.findIndex((e) => e.id === initialEpisodeId);
    return idx >= 0 ? idx : 0;
  }, [module, initialEpisodeId]);

  const [activeIndex, setActiveIndex] = useState(startIndex);
  const currentEpisode = module.episodes[activeIndex] || module.episodes[0];

  useEffect(() => {
    return () => {
      if (bannerTimerRef.current) clearTimeout(bannerTimerRef.current);
    };
  }, []);

  const showResumeBanner = (seconds: number, epTitle: string) => {
    if (bannerTimerRef.current) clearTimeout(bannerTimerRef.current);
    setResumedBanner({ seconds, epTitle });
    bannerTimerRef.current = setTimeout(() => {
      setResumedBanner(null);
    }, 5000);
  };

  const player = useMemo(() => {
    const queueItems: PlaylistItem[] = module.episodes.map((ep) => ({
      src: { renditions: ep.renditions },
      title: ep.title,
      eyebrow: `${module.title} · ${ep.levelLabel}`,
      description: ep.description,
      poster: ep.still || module.backdrop,
      thumbnail: ep.still || module.backdrop,
      duration: ep.durationSeconds,
      season: module.episodes.length > 1 ? `Kurikulum ${module.title}` : undefined,
    }));

    let lastObservedIndex = startIndex;

    const flushCurrentPosition = (
      ctx: { clock: { time: () => number }; media: () => { duration: number } },
      keepalive = false
    ) => {
      const ep = module.episodes[lastObservedIndex];
      const { duration } = ctx.media();
      const time = ctx.clock.time();
      if (!ep || !Number.isFinite(duration) || duration <= 0 || time < 1) return;
      learningStore.savePlaybackProgress(
        {
          moduleId: module.id,
          moduleSlug: module.slug,
          episodeId: ep.id,
          currentTime: time,
          duration,
        },
        { keepalive }
      );
    };

    const BackControl = () => (
      <Button
        data-part="spil-back"
        aria-label="Kembali ke Detail Modul"
        onClick={() => onBack()}
        style={{
          width: 'auto',
          paddingInline: '12px',
          gap: '4px',
          display: 'inline-flex',
          alignItems: 'center',
        }}
      >
        <ChevronLeft size={18} strokeWidth={2.4} />
        <span className="hidden sm:inline text-[13px] font-medium pr-1">Kembali</span>
      </Button>
    );

    const TranscriptControl = () => (
      <Button
        data-part="spil-transcript-btn"
        aria-label="Transkrip Materi"
        onClick={() => setTranscriptOpen((prev) => !prev)}
      >
        <FileText size={18} strokeWidth={2} />
      </Button>
    );

    const spilTelemetry = definePlugin('spil-telemetry', () => ({
      after: ['playlist'],
      setup(context, scope) {
        // Track playlist index switches (Episodes shelf or Up Next auto-advance)
        scope.add(
          context.player.subscribe(() => {
            const qState = context.player.plugin(playlist).state();
            if (qState.index !== lastObservedIndex) {
              lastObservedIndex = qState.index;
              const ep = module.episodes[qState.index];
              if (ep) {
                setActiveIndex(qState.index);
                onEpisodeChange?.(ep.id);
              }
            }
          })
        );

        // Save position every 2 seconds while playing
        scope.add(
          context.clock.bind(
            () => {
              if (!context.media().paused) {
                flushCurrentPosition(context, false);
              }
            },
            () => 2
          )
        );

        // Save immediately on pause or video end
        context.watch(
          scope,
          ({ paused, ended }) => paused || ended,
          () => flushCurrentPosition(context, false)
        );

        // Save via sendBeacon / keepalive when closing tab or switching apps on mobile
        if (typeof window !== 'undefined') {
          scope.on(window, 'pagehide', () => flushCurrentPosition(context, true));
        }
      },
      gates: {
        // Zero-flicker "Continue Where I Left Off": inject saved startTime before first frame!
        load(request, next) {
          if (request.startTime !== undefined) return next(request);
          const ep = module.episodes[lastObservedIndex] || module.episodes[0];
          if (!ep) return next(request);

          const saved =
            learningStore.getSnapshot().progress[learningStore.keyOf(module.id, ep.id)];
          if (
            saved &&
            saved.currentTime >= 2 &&
            saved.duration > 0 &&
            saved.currentTime / saved.duration < 0.92
          ) {
            showResumeBanner(saved.currentTime, ep.title);
            return next({ ...request, startTime: saved.currentTime });
          }
          return next(request);
        },
      },
      slots: {
        'top-start': BackControl,
        'controls-end': TranscriptControl,
      },
    }));

    const baseDefaults = defaultPlugins().filter((p) => p.name !== 'captions');

    return createPlayer({
      load: 'eager',
      plugins: [
        i18n({ locale: 'id', strings: idStrings }),
        hls(),
        playlist({
          items: queueItems,
          start: startIndex,
          countdown: 6,
        }),
        episodes({
          progress: (_, idx) => {
            const ep = module.episodes[idx];
            if (!ep) return null;
            const snap = learningStore.getSnapshot();
            const key = learningStore.keyOf(module.id, ep.id);
            if (snap.watchedEpisodes.includes(key)) return 1;
            const p = snap.progress[key];
            if (p && p.duration > 0) return Math.min(1, p.currentTime / p.duration);
            return null;
          },
        }),
        info({
          eyebrow: `${module.kind} · ${module.division}`,
          title: module.title,
          artwork: module.poster,
          facts: [
            String(module.year),
            `${module.episodes.length} Level`,
            module.totalDurationText,
            'SPIL MAX HD',
          ],
          description: module.summary,
          credits: [
            {
              role: 'Pemateri & Kurator',
              names: module.instructors.map((i) => `${i.name} (${i.role})`),
            },
            {
              role: 'Kompetensi SPIL',
              names: module.competency,
            },
          ],
        }),
        skip({
          segments: () => {
            const ep = module.episodes[lastObservedIndex] || module.episodes[0];
            if (!ep) return [];
            const segs = [];
            if (ep.introEndSeconds) {
              segs.push({ kind: 'intro' as const, start: 0.5, end: ep.introEndSeconds });
            }
            if (ep.creditsStartSeconds) {
              segs.push({
                kind: 'credits' as const,
                start: ep.creditsStartSeconds,
                end: ep.durationSeconds,
              });
            }
            return segs;
          },
        }),
        captions({
          tracks: currentEpisode?.captions || [],
          language: null,
        }),
        chapters({
          src: () => {
            const ep = module.episodes[lastObservedIndex] || module.episodes[0];
            return ep?.chaptersVtt || null;
          },
        }),
        transcript({ language: 'id' }),
        airplay(),
        shortcuts(),
        spilTelemetry(),
        ...baseDefaults,
      ],
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [module.id]);

  return (
    <div className="fixed inset-0 z-[100] bg-black flex flex-col lg:flex-row overflow-hidden">
      {/* Main Apple TV Cinema Viewport */}
      <div className="spil-player-stage relative flex-1 min-w-0 min-h-0 flex items-center justify-center bg-black">
        <VideoPlayer
          player={player}
          poster={currentEpisode?.still || module.backdrop}
          media={{ playsInline: true, autoPlay: true }}
        />

        {/* Apple TV Liquid Glass "Continue Where I Left Off" Toast */}
        {resumedBanner && (
          <div className="absolute top-16 sm:top-5 left-1/2 -translate-x-1/2 z-[60] flex items-center gap-2.5 pl-4 pr-2 py-1.5 rounded-full bg-[#16161a]/85 backdrop-blur-2xl border border-white/15 shadow-2xl text-[12.5px] text-white/90">
            <span>
              Melanjutkan dari <strong className="font-semibold tabular-nums">{formatClock(resumedBanner.seconds)}</strong>
            </span>
            <button
              type="button"
              onClick={() => {
                player.commands.seek(0);
                setResumedBanner(null);
              }}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/12 hover:bg-white/20 text-[11.5px] font-semibold text-white transition-colors"
            >
              <RotateCcw size={12} /> Ulang dari awal
            </button>
          </div>
        )}
      </div>

      {/* Synchronized Interactive Learning Transcript Panel */}
      {transcriptOpen && currentEpisode && (
        <aside className="w-full lg:w-[360px] tv:w-[440px] h-[42vh] lg:h-full shrink-0 bg-[#0d0d10]/96 backdrop-blur-2xl border-t lg:border-t-0 lg:border-l border-white/10 flex flex-col z-[105]">
          <div className="px-4 py-3.5 border-b border-white/10 flex items-center justify-between shrink-0">
            <div className="min-w-0">
              <p className="p-label">Transkrip &amp; Poin Materi</p>
              <p className="text-[14px] tv:text-[16px] font-semibold text-white truncate mt-0.5">
                {currentEpisode.levelLabel} — {currentEpisode.title}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setTranscriptOpen(false)}
              aria-label="Tutup Transkrip"
              className="w-8 h-8 rounded-full flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X size={17} />
            </button>
          </div>

          <div
            className="flex-1 min-h-0 overflow-y-auto px-3 py-3 text-white"
            style={{ ['--rv-transcript-height' as string]: '100%' }}
          >
            <Transcript player={player} />

            {currentEpisode.keyTakeaways.length > 0 && (
              <div className="mt-5 pt-4 px-2 border-t border-white/10">
                <p className="p-label mb-2.5">Intisari Level {currentEpisode.levelNumber}</p>
                <ul className="space-y-2">
                  {currentEpisode.keyTakeaways.map((pt, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-2 text-[12.5px] tv:text-[14px] text-white/75"
                    >
                      <CheckCircle2 size={14} className="shrink-0 mt-0.5 text-white/55" />
                      <span>{pt}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </aside>
      )}
    </div>
  );
}
