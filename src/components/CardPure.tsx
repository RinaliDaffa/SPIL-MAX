import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Play } from 'lucide-react';
import type { LearningModule } from '@/types/learning';

interface CardPureProps {
  item: LearningModule;
  variant?: 'poster' | 'wide';
  width?: string;
  watched?: boolean;
  progress?: number; // 0..100
  showTitle?: boolean;
  subtitleOverride?: string;
  onClick?: () => void;
}

/**
 * Apple TV+ "Pure" Media Card — Adapted from NovaStream CardPure (MIT).
 * Supports 2:3 vertical posters and 16:9 widescreen learning cards across
 * HP, Tablet, Laptop/PC, and Smart TV 4K viewports.
 */
export default function CardPure({
  item,
  variant = 'poster',
  width,
  watched = false,
  progress = 0,
  showTitle = true,
  subtitleOverride,
  onClick,
}: CardPureProps) {
  const navigate = useNavigate();
  if (!item) return null;

  const art = variant === 'wide' ? item.backdrop || item.poster : item.poster || item.backdrop;
  const go = onClick || (() => navigate(`/modul/${item.slug}`));

  const defaultWidth =
    variant === 'wide'
      ? 'w-[244px] sm:w-[276px] md:w-[320px] tv:w-[400px]'
      : 'w-[126px] sm:w-[148px] md:w-[172px] tv:w-[224px]';

  const w = width || defaultWidth;
  const levelCount = item.episodes.length;

  return (
    <button
      type="button"
      data-card
      onClick={go}
      title={item.title}
      className={`p-card-hit group/card shrink-0 ${w} text-left focus:outline-none`}
    >
      <div className={`p-card ${variant === 'wide' ? 'aspect-video' : 'aspect-[2/3]'}`}>
        <img src={art} alt={item.title} loading="lazy" decoding="async" />

        {/* Subtle gradient scrim at bottom of wide cards for readability */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              variant === 'wide'
                ? 'linear-gradient(to top, rgba(0,0,0,0.68) 0%, rgba(0,0,0,0.08) 45%, rgba(0,0,0,0.22) 100%)'
                : 'linear-gradient(to top, rgba(0,0,0,0.45) 0%, transparent 40%, rgba(0,0,0,0.18) 100%)',
          }}
        />

        {/* Top-left Apple TV subtle pill badge */}
        {item.badge && (
          <span className="absolute top-2.5 left-2.5 px-2 py-[3px] rounded-md bg-black/60 backdrop-blur-md border border-white/10 text-[9.5px] tv:text-[11px] font-semibold tracking-[0.07em] uppercase text-white/90">
            {item.badge}
          </span>
        )}

        {/* Watched state: crisp black check on white circle */}
        {watched && (
          <span
            aria-label="Selesai dipelajari"
            className="absolute top-2.5 right-2.5 w-[22px] h-[22px] tv:w-[26px] tv:h-[26px] rounded-full bg-white/95 shadow-[0_2px_6px_rgba(0,0,0,0.5)] flex items-center justify-center text-black"
          >
            <Check size={13} strokeWidth={3.2} />
          </span>
        )}

        {/* Bottom-left micro metadata inside wide cards */}
        {variant === 'wide' && (
          <span className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between text-[11px] tv:text-[13px] font-medium text-white/85 pointer-events-none">
            <span className="truncate">{item.kind}</span>
            <span className="shrink-0 text-white/65">
              {levelCount > 1 ? `${levelCount} Level` : item.totalDurationText}
            </span>
          </span>
        )}

        {/* Progress bar */}
        {progress > 0 && progress < 99 && (
          <span className="absolute bottom-0 inset-x-0 h-[3px] bg-white/25">
            <span className="block h-full bg-white" style={{ width: `${Math.min(100, progress)}%` }} />
          </span>
        )}

        {/* Center frosted play lens on hover / TV focus */}
        {variant === 'wide' && (
          <span className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/card:opacity-100 group-focus-visible/card:opacity-100 transition-opacity pointer-events-none">
            <span className="w-11 h-11 tv:w-14 tv:h-14 rounded-full bg-black/50 backdrop-blur-md border border-white/15 flex items-center justify-center text-white">
              <Play size={16} fill="currentColor" className="ml-0.5" />
            </span>
          </span>
        )}
      </div>

      {showTitle && (
        <div className="mt-2 px-0.5">
          <p className="text-[12.5px] md:text-[13px] tv:text-[15.5px] font-medium text-white/85 truncate">
            {item.title}
          </p>
          <p className="text-[11px] tv:text-[13px] p-faint truncate mt-0.5">
            {subtitleOverride || `${item.kind} · ${levelCount > 1 ? `${levelCount} Level` : item.totalDurationText}`}
          </p>
        </div>
      )}
    </button>
  );
}
