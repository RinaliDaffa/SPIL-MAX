import React, { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import CardPure from './CardPure';
import type { LearningModule } from '@/types/learning';

export const slugify = (s: string) =>
  (s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

interface RowPureProps {
  title: string;
  items: LearningModule[];
  variant?: 'poster' | 'wide';
  accent?: 'green' | 'red';
  seeAllPath?: string;
  watchedModuleIds?: Set<string>;
  moduleProgressMap?: Record<string, number>;
  showTitles?: boolean;
  seeAll?: boolean;
  renderCard?: (item: LearningModule, index: number) => React.ReactNode;
}

/**
 * Apple TV+ Horizontal Masked Rail — Clean White Section Heading Only
 * (No grey subtitle underneath) + Subtle SPIL Jewel Accent Bar.
 */
export default function RowPure({
  title,
  items = [],
  variant = 'poster',
  accent = 'green',
  seeAllPath,
  watchedModuleIds,
  moduleProgressMap,
  showTitles = true,
  seeAll = true,
  renderCard,
}: RowPureProps) {
  const rail = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  if (!items.length) return null;

  const scrollByPage = (dir: number) => {
    const el = rail.current;
    if (!el) return;
    const marge = parseFloat(getComputedStyle(el).scrollPaddingLeft) || 0;
    const cards = Array.from(el.children) as HTMLElement[];
    if (!cards.length) return;

    let targetCard: HTMLElement | undefined;
    if (dir > 0) {
      const rightEdge = el.scrollLeft + el.clientWidth - marge;
      targetCard =
        cards.find((c) => c.offsetLeft + c.offsetWidth > rightEdge + 1) || cards[cards.length - 1];
      if (targetCard.offsetLeft - marge <= el.scrollLeft + 1) {
        targetCard = cards[cards.indexOf(targetCard) + 1] || targetCard;
      }
    } else {
      const targetX = el.scrollLeft - (el.clientWidth - 2 * marge);
      targetCard = cards.find((c) => c.offsetLeft - marge >= targetX - 1) || cards[0];
    }
    el.scrollTo({ left: Math.max(0, targetCard.offsetLeft - marge), behavior: 'smooth' });
  };

  const openCollection = () => {
    if (seeAllPath) {
      navigate(seeAllPath);
    } else {
      navigate(`/koleksi/${slugify(title)}`, { state: { title, itemIds: items.map((i) => i.id) } });
    }
  };

  return (
    <section data-row className="group/row relative mb-10 md:mb-14 tv:mb-16">
      <div className="px-5 md:px-8 tv:px-14 mb-3.5 md:mb-4">
        {seeAll ? (
          <button
            type="button"
            data-tv-focus
            onClick={openCollection}
            className="group/h inline-flex items-center gap-2.5 text-left"
          >
            <span className={accent === 'red' ? 'spil-bar-red' : 'spil-bar-green'} />
            <h2 className="p-title text-[18px] md:text-[22px] tv:text-[28px] text-white">{title}</h2>
            <span className="text-[13px] tv:text-[15px] text-white/35 md:text-white/0 group-hover/h:text-white/65 transition-colors">
              Lihat Semua ›
            </span>
          </button>
        ) : (
          <div className="inline-flex items-center gap-2.5">
            <span className={accent === 'red' ? 'spil-bar-red' : 'spil-bar-green'} />
            <h2 className="p-title text-[18px] md:text-[22px] tv:text-[28px] text-white">{title}</h2>
          </div>
        )}
      </div>

      <div ref={rail} className="p-rail p-marge gap-3.5 md:gap-4 tv:gap-6 px-5 md:px-8 tv:px-14 pb-1.5">
        {items.map((it, k) =>
          renderCard ? (
            renderCard(it, k)
          ) : (
            <CardPure
              key={it.id}
              item={it}
              variant={variant}
              showTitle={showTitles}
              watched={watchedModuleIds?.has(it.id)}
              progress={moduleProgressMap?.[it.id] || 0}
            />
          )
        )}
      </div>

      <button
        type="button"
        onClick={() => scrollByPage(-1)}
        aria-label="Sebelumnya"
        className="hidden md:flex absolute left-2 tv:left-4 top-1/2 -translate-y-1/2 w-10 h-10 tv:w-12 tv:h-12 rounded-full bg-black/65 border border-white/10 backdrop-blur-md items-center justify-center text-white/85 opacity-0 group-hover/row:opacity-100 transition-opacity hover:bg-black/85"
      >
        <ChevronLeft size={20} />
      </button>
      <button
        type="button"
        onClick={() => scrollByPage(1)}
        aria-label="Selanjutnya"
        className="hidden md:flex absolute right-2 tv:right-4 top-1/2 -translate-y-1/2 w-10 h-10 tv:w-12 tv:h-12 rounded-full bg-black/65 border border-white/10 backdrop-blur-md items-center justify-center text-white/85 opacity-0 group-hover/row:opacity-100 transition-opacity hover:bg-black/85"
      >
        <ChevronRight size={20} />
      </button>
    </section>
  );
}
