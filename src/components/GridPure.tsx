import React from 'react';
import CardPure from './CardPure';
import type { LearningModule } from '@/types/learning';

interface GridPureProps {
  items: LearningModule[];
  watchedModuleIds?: Set<string>;
  moduleProgressMap?: Record<string, number>;
  variant?: 'poster' | 'wide';
  onPick?: (item: LearningModule) => void;
}

/**
 * Responsive Fluid Grid — Adapted from NovaStream GridPure (MIT).
 * Scales cleanly from 2/3 cols on HP -> 4 cols on Tablet -> 6 cols on Laptop -> 7/8 cols on Smart TV.
 */
export default function GridPure({
  items = [],
  watchedModuleIds,
  moduleProgressMap,
  variant = 'poster',
  onPick,
}: GridPureProps) {
  if (!items.length) return null;

  const gridCols =
    variant === 'wide'
      ? 'grid-cols-1 xs:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 tv:grid-cols-5'
      : 'grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 tv:grid-cols-7';

  return (
    <div data-row className={`grid ${gridCols} gap-3.5 md:gap-4 tv:gap-6`}>
      {items.map((it) => (
        <CardPure
          key={it.id}
          item={it}
          variant={variant}
          width="w-full"
          watched={watchedModuleIds?.has(it.id)}
          progress={moduleProgressMap?.[it.id] || 0}
          onClick={onPick ? () => onPick(it) : undefined}
        />
      ))}
    </div>
  );
}
