import React, { useEffect, useRef, useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { Search, X } from 'lucide-react';
import CardPure from './CardPure';
import { learningStore, useLearningStore } from '@/services/learningStore';

const norm = (s: string) =>
  (s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

interface SearchPureProps {
  onClose: () => void;
}

/**
 * Apple TV+ Fullscreen Instant Blurred Search — Adapted from NovaStream SearchPure (MIT).
 * Searches across module titles, competency names, divisions, summaries, and episode titles.
 */
export default function SearchPure({ onClose }: SearchPureProps) {
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');
  const { modules, recentSearches } = useLearningStore();

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

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

  const results = useMemo(() => {
    const q = norm(query.trim());
    if (!q) return [];
    const tokens = q.split(/\s+/).filter(Boolean);
    return modules.filter((m) => {
      const haystack = norm(
        [
          m.title,
          m.competency,
          m.kind,
          m.division,
          m.badge || '',
          m.summary,
          ...m.episodes.map((e) => `${e.title} ${e.description}`),
        ].join(' ')
      );
      return tokens.every((tok) => haystack.includes(tok));
    });
  }, [query, modules]);

  const quickCategories = useMemo(
    () => [
      'Core',
      'Operasional & K3',
      'Managerial',
      'Eksternal',
      'Port Management',
      'Safety K3',
      'Leadership',
      'LARA',
    ],
    []
  );

  const openModule = (slug: string, title: string) => {
    learningStore.addRecentSearch(title);
    onClose();
    navigate(`/modul/${slug}`);
  };

  return createPortal(
    <div className="nova-pure fixed inset-0 z-[125] flex flex-col bg-black/92 backdrop-blur-2xl">
      <div className="shrink-0 px-4 md:px-8 pt-4 md:pt-6">
        <div className="max-w-[960px] tv:max-w-[1300px] mx-auto flex items-center gap-3">
          <div className="flex-1 flex items-center gap-2.5 h-11 tv:h-14 px-4 rounded-xl bg-white/[0.09] border border-white/10">
            <Search size={17} className="text-white/45 shrink-0" />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Cari modul, kompetensi, level training, atau divisi…"
              className="flex-1 bg-transparent text-[15px] tv:text-[18px] text-white outline-none placeholder:text-white/35"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                aria-label="Hapus pencarian"
                className="text-white/45 hover:text-white transition-colors"
              >
                <X size={16} />
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-[15px] tv:text-[17px] font-medium text-white/75 hover:text-white transition-colors px-1"
          >
            Batal
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar px-4 md:px-8 py-6">
        <div className="max-w-[960px] tv:max-w-[1300px] mx-auto">
          {!query.trim() ? (
            <>
              {recentSearches.length > 0 && (
                <section className="mb-8">
                  <p className="p-label mb-3">Pencarian Terakhir</p>
                  <div className="flex flex-wrap gap-2">
                    {recentSearches.map((term) => (
                      <button
                        key={term}
                        type="button"
                        onClick={() => setQuery(term)}
                        className="h-9 tv:h-11 px-4 rounded-full bg-white/[0.08] border border-white/10 text-[13px] tv:text-[15px] font-medium text-white/85 hover:bg-white/[0.15] transition-colors"
                      >
                        {term}
                      </button>
                    ))}
                  </div>
                </section>
              )}

              <section className="mb-8">
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    navigate('/kompetensi');
                  }}
                  className="w-full flex items-center justify-between px-4 h-12 tv:h-14 rounded-xl bg-white/[0.06] border border-white/10 hover:bg-white/[0.11] transition-colors"
                >
                  <span className="text-[14px] tv:text-[16px] font-medium">
                    Jelajahi Seluruh Kamus Kompetensi SPIL — Filter per Jenis &amp; Divisi
                  </span>
                  <span className="text-white/45">›</span>
                </button>
              </section>

              <section>
                <p className="p-label mb-3">Topik &amp; Kompetensi Populer</p>
                <div className="flex flex-wrap gap-2">
                  {quickCategories.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setQuery(cat)}
                      className="h-9 tv:h-11 px-4 rounded-full bg-white/[0.08] border border-white/10 text-[13px] tv:text-[15px] font-medium text-white/85 hover:bg-white/[0.15] transition-colors"
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </section>
            </>
          ) : results.length === 0 ? (
            <p className="text-center text-[14.5px] p-faint mt-16">
              Tidak ditemukan modul untuk &ldquo;{query}&rdquo;.
            </p>
          ) : (
            <>
              <p className="p-label mb-3.5">{results.length} modul ditemukan</p>
              <div
                data-row
                className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 md:grid-cols-5 tv:grid-cols-6 gap-3.5 md:gap-4"
              >
                {results.map((item) => (
                  <CardPure
                    key={item.id}
                    item={item}
                    width="w-full"
                    onClick={() => openModule(item.slug, item.title)}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
