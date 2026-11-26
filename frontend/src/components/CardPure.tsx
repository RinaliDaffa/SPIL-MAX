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
  rankNumber?: number;
  onClick?: () => void;
}

/**
 * Apple TV+ "Pure" Media Card — Clean White Title Only (Zero Grey Subtitle Clutter)
 * with Subtle SPIL Emerald & Crimson Jewel Micro-Accents.
 */
export default function CardPure({
  item,
  variant = 'poster',
  width,
  watched = false,
  progress = 0,
  showTitle = true,
  rankNumber,
  onClick,
}: CardPureProps) {
  const navigate = useNavigate();
  if (!item) return null;

  const art = variant === 'wide' ? item.backdrop || item.poster : item.poster || item.backdrop;
  const go = onClick || (() => navigate(`/modul/${item.slug}`));

  const defaultWidth =
    variant === 'wide'
      ? 'w-[244px] sm:w-[276px] md:w-[320px] tv:w-[400px]'
      : 'w-[132px] sm:w-[152px] md:w-[176px] tv:w-[228px]';

  const w = width || defaultWidth;
  const isMandatory = Boolean(item.mandatoryFromSuperior);

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

        {/* Subtle gradient scrim for visual depth */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              variant === 'wide'
                ? 'linear-gradient(to top, rgba(0,0,0,0.62) 0%, rgba(0,0,0,0.06) 48%, rgba(0,0,0,0.22) 100%)'
                : 'linear-gradient(to top, rgba(0,0,0,0.42) 0%, transparent 40%, rgba(0,0,0,0.18) 100%)',
          }}
        />

        {/* Top-left smoked Apple glass pill with SPIL Red (Mandatory) or SPIL Green jewel dot */}
        {item.badge && (
          <span className="absolute top-2.5 left-2.5 inline-flex items-center gap-1.5 px-2 py-[3px] rounded-md bg-black/65 backdrop-blur-md border border-white/12 text-[9.5px] tv:text-[11px] font-semibold tracking-[0.06em] uppercase text-white/92">
            <span
              className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                isMandatory ? 'bg-[#d02030]' : 'bg-[#22c55e]'
              }`}
            />
            <span>{item.badge}</span>
          </span>
        )}

        {/* Watched state: refined SPIL Emerald check circle */}
        {watched && (
          <span
            aria-label="Selesai dipelajari"
            className="absolute top-2.5 right-2.5 w-[22px] h-[22px] tv:w-[26px] tv:h-[26px] rounded-full bg-[#16a34a] shadow-[0_2px_8px_rgba(0,0,0,0.6)] flex items-center justify-center text-white"
          >
            <Check size={13} strokeWidth={3.2} />
          </span>
        )}

        {/* Optional Apple TV+ Outlined Rank Number inside card corner (never collides with title below) */}
        {rankNumber != null && (
          <span
            aria-hidden="true"
            className={`top10-num-sur select-none pointer-events-none ${
              rankNumber <= 3 ? 'is-podium' : ''
            }`}
          >
            {rankNumber}
          </span>
        )}

        {/* SPIL Emerald Progress bar */}
        {progress > 0 && progress < 99 && (
          <span className="absolute bottom-0 inset-x-0 h-[3px] bg-white/20">
            <span
              className="block h-full spil-progress-fill"
              style={{ width: `${Math.min(100, progress)}%` }}
            />
          </span>
        )}

        {/* Center frosted play lens on hover / TV focus */}
        {variant === 'wide' && (
          <span className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/card:opacity-100 group-focus-visible/card:opacity-100 transition-opacity pointer-events-none">
            <span className="w-11 h-11 tv:w-14 tv:h-14 rounded-full bg-black/55 backdrop-blur-md border border-white/20 flex items-center justify-center text-white">
              <Play size={16} fill="currentColor" className="ml-0.5" />
            </span>
          </span>
        )}
      </div>

      {showTitle && (
        <div className="mt-2.5 px-0.5">
          <p className="text-[13px] md:text-[13.5px] tv:text-[16px] font-medium text-white/92 truncate">
            {item.title}
          </p>
        </div>
      )}
    </button>
  );
}
