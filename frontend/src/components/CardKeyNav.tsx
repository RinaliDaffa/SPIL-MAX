import { useEffect } from 'react';

/**
 * Spatial Keyboard & Smart TV Remote D-Pad Navigation (tvOS / Android TV / WebOS / Tizen).
 * Adapted from NovaStream ShellV2 CardKeyNav (MIT) and extended to navigate seamlessly
 * between horizontal rails ([data-row] -> [data-card]), hero actions ([data-tv-focus]),
 * and top navigation items.
 */
export default function CardKeyNav() {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // Ignore when typing in an input/textarea or inside the video player
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable ||
          target.closest('.rv-root'))
      ) {
        return;
      }

      const ae = document.activeElement as HTMLElement | null;
      const isArrow = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key);

      // If nothing is focused yet on a Smart TV / keyboard press, focus first interactive hero/card
      if (isArrow && (!ae || ae === document.body)) {
        const first = document.querySelector<HTMLElement>('[data-tv-focus], [data-card]');
        if (first) {
          e.preventDefault();
          first.focus();
        }
        return;
      }

      if (!ae) return;

      if ((e.key === 'Enter' || e.key === ' ') && ae.hasAttribute('data-card')) {
        e.preventDefault();
        ae.click();
        return;
      }

      if (!isArrow) return;

      // Inside a [data-row] rail
      const row = ae.closest('[data-row]');
      if (row && ae.hasAttribute('data-card')) {
        e.preventDefault();
        const cards = Array.from(row.querySelectorAll<HTMLElement>('[data-card]'));
        const idx = cards.indexOf(ae);

        if (e.key === 'ArrowRight') {
          const next = cards[Math.min(idx + 1, cards.length - 1)];
          next?.focus();
          next?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
        } else if (e.key === 'ArrowLeft') {
          const prev = cards[Math.max(idx - 1, 0)];
          prev?.focus();
          prev?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
        } else {
          const rows = Array.from(document.querySelectorAll<HTMLElement>('[data-row]'));
          const rowIdx = rows.indexOf(row as HTMLElement);
          const nextRowIdx = rowIdx + (e.key === 'ArrowDown' ? 1 : -1);

          if (nextRowIdx < 0) {
            const heroBtn = document.querySelector<HTMLElement>('[data-tv-hero-primary]') ||
              document.querySelector<HTMLElement>('header [data-tv-focus]');
            heroBtn?.focus();
            window.scrollTo({ top: 0, behavior: 'smooth' });
          } else if (rows[nextRowIdx]) {
            const nextCards = Array.from(rows[nextRowIdx].querySelectorAll<HTMLElement>('[data-card]'));
            const pick = nextCards[Math.min(idx, Math.max(0, nextCards.length - 1))];
            pick?.focus();
            pick?.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
          }
        }
        return;
      }

      // Moving down from Hero CTA or Nav into the first rail
      if (e.key === 'ArrowDown' && ae.hasAttribute('data-tv-focus')) {
        const firstCard = document.querySelector<HTMLElement>('[data-row] [data-card]');
        if (firstCard) {
          e.preventDefault();
          firstCard.focus();
          firstCard.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
        }
      }
    };

    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return null;
}
