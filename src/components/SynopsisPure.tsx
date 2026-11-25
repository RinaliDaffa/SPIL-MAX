import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { X, CheckCircle2 } from 'lucide-react';

interface SynopsisPureProps {
  title: string;
  text: string;
  meta?: string;
  objectives?: string[];
  onClose: () => void;
}

/**
 * Apple TV+ Foreground Detail Sheet — Adapted from NovaStream SynopsisPure (MIT).
 * Rendered via portal to <body> so content-visibility on rails never traps fixed positioning.
 */
export default function SynopsisPure({ title, text, meta, objectives, onClose }: SynopsisPureProps) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  return createPortal(
    <div className="nova-pure">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        onClick={onClose}
        className="fixed inset-0 z-[140] bg-black/70 backdrop-blur-sm"
      />

      <div className="fixed inset-0 z-[141] flex items-end md:items-center justify-center p-0 md:p-6 pointer-events-none">
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-label={title}
          initial={{ opacity: 0, y: 24, scale: 0.985 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 24, scale: 0.985 }}
          transition={{ duration: 0.28, ease: [0.32, 0.72, 0, 1] }}
          className="pointer-events-auto w-full md:max-w-[640px] tv:max-w-[780px] max-h-[86vh] md:max-h-[78vh] flex flex-col rounded-t-[22px] md:rounded-[22px] bg-[#141416]/95 backdrop-blur-2xl border border-white/10 pb-[env(safe-area-inset-bottom)]"
        >
          <div className="md:hidden pt-2.5 pb-0.5 flex justify-center shrink-0">
            <span className="w-9 h-1 rounded-full bg-white/25" />
          </div>

          <div className="flex items-start gap-3 px-5 md:px-7 pt-4 md:pt-6 pb-3 shrink-0">
            <div className="flex-1 min-w-0">
              <h2 className="p-title text-[19px] md:text-[23px] tv:text-[28px] truncate">{title}</h2>
              {meta && <p className="text-[12px] tv:text-[14px] p-faint mt-1 truncate">{meta}</p>}
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Tutup"
              className="shrink-0 w-8 h-8 -mr-1 rounded-full flex items-center justify-center text-white/55 hover:text-white hover:bg-white/[0.08] transition-colors"
            >
              <X size={17} />
            </button>
          </div>

          <div className="px-5 md:px-7 pb-6 md:pb-7 overflow-y-auto no-scrollbar space-y-5">
            <p className="text-[14.5px] md:text-[15.5px] tv:text-[17.5px] text-white/80 leading-[1.65] whitespace-pre-line">
              {text}
            </p>

            {objectives && objectives.length > 0 && (
              <div className="pt-4 border-t border-white/10">
                <p className="p-label mb-3">Capaian Pembelajaran Kompetensi</p>
                <ul className="space-y-2.5">
                  {objectives.map((obj, idx) => (
                    <li key={idx} className="flex items-start gap-2.5 text-[13.5px] md:text-[14.5px] tv:text-[16px] text-white/80">
                      <CheckCircle2 size={16} className="text-white/60 shrink-0 mt-0.5" />
                      <span>{obj}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>,
    document.body
  );
}
