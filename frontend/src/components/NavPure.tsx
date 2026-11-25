import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Search,
  Home,
  Layers,
  Award,
  Globe2,
  Bookmark,
  Clock,
  Tv,
  RotateCcw,
  CheckCircle2,
  Sparkles,
  PlusCircle,
} from 'lucide-react';
import { learningStore, useLearningStore } from '@/services/learningStore';
import SearchPure from './SearchPure';

const NAV_ITEMS = [
  { id: 'home', label: 'Beranda', mobileLabel: 'Beranda', path: '/', icon: Home },
  { id: 'kompetensi', label: 'Kompetensi', mobileLabel: 'Kompetensi', path: '/kompetensi', icon: Layers },
  { id: 'wajib', label: 'Wajib & Atasan', mobileLabel: 'Wajib', path: '/wajib', icon: Award },
  { id: 'eksternal', label: 'Eksternal', mobileLabel: 'Eksternal', path: '/eksternal', icon: Globe2 },
  { id: 'mylist', label: 'Daftar Saya', mobileLabel: 'Daftar Saya', path: '/daftar-saya', icon: Bookmark },
] as const;

interface MenuRowProps {
  icon: React.ElementType;
  children: React.ReactNode;
  onClick: () => void;
  badge?: string;
}

function MenuRow({ icon: Icon, children, onClick, badge }: MenuRowProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-[13.5px] font-medium text-white/90 hover:bg-white/[0.08] transition-colors"
    >
      <Icon size={16} className="opacity-65 shrink-0" />
      <span className="flex-1 text-left truncate">{children}</span>
      {badge && <span className="text-[11px] text-white/45 font-normal">{badge}</span>}
    </button>
  );
}

/**
 * Apple TV+ Liquid Glass Navigation — Adapted from NovaStream NavPure (MIT)
 * and integrated with SPIL MAX employee learning profile card (from Rafael's mockup).
 * - Desktop / Laptop / Smart TV: Floating top Liquid Glass capsule with spring lens.
 * - Mobile (<768px): Floating bottom Liquid Glass tab bar with safe-area padding.
 */
export default function NavPure() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const { modules, employee, watchedEpisodes, myList } = useLearningStore();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Global Cmd+K / Ctrl+K shortcut + Escape to close profile menu
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      } else if (e.key === 'Escape' && menuOpen) {
        setMenuOpen(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [menuOpen]);

  const activeItem =
    NAV_ITEMS.find((i) => (i.path === '/' ? pathname === '/' : pathname.startsWith(i.path)))?.id || null;

  const totalEpisodes = modules.reduce((acc, m) => acc + m.episodes.length, 0);
  const completedCount = watchedEpisodes.length;
  const totalHours = employee.baseCompletedHours + Math.round(completedCount * 0.5);
  const hoursPct = Math.min(100, Math.round((totalHours / employee.annualTargetHours) * 100));

  const initials = employee.name
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('');

  return (
    <>
      {/* ── Top Header (Desktop Capsule + Brand + Actions) ── */}
      <header
        className={`fixed top-0 inset-x-0 z-50 pointer-events-none transition-all duration-300 ${
          scrolled
            ? 'bg-gradient-to-b from-black/75 via-black/35 to-transparent'
            : 'bg-gradient-to-b from-black/45 to-transparent'
        }`}
      >
        <div className="max-w-[1600px] tv:max-w-[2200px] mx-auto h-14 md:h-[62px] tv:h-[78px] px-4 md:px-8 tv:px-14 flex items-center justify-between [&>*]:pointer-events-auto">
          {/* SPIL MAX Brand */}
          <button
            type="button"
            data-tv-focus
            onClick={() => navigate('/')}
            className="flex items-center gap-2.5 shrink-0 rounded-full pr-2 py-1 focus:outline-none"
          >
            <span className="h-7 px-2 rounded-lg bg-white/95 flex items-center justify-center shadow-sm">
              <img
                src="/brand/spil-logo.png"
                alt="SPIL"
                className="h-[18px] tv:h-[22px] w-auto object-contain"
              />
            </span>
            <span className="flex items-baseline gap-1">
              <span className="text-[16px] md:text-[17px] tv:text-[21px] font-bold tracking-[-0.03em] text-white">
                SPIL
              </span>
              <span className="text-[16px] md:text-[17px] tv:text-[21px] font-light tracking-[-0.02em] text-white/65">
                MAX
              </span>
            </span>
          </button>

          {/* Desktop / Laptop / Smart TV Centered Liquid Glass Capsule (1024px+ so zero tablet header overlap) */}
          <nav aria-label="Navigasi Utama" className="hidden lg:block absolute left-1/2 -translate-x-1/2">
            <div className="p-glass rounded-full p-1 tv:p-1.5 flex items-center">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const on = activeItem === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    data-tv-focus
                    onClick={() => navigate(item.path)}
                    className={`relative px-3.5 lg:px-4 tv:px-6 h-9 tv:h-11 rounded-full flex items-center gap-2 text-[13px] tv:text-[15.5px] font-medium transition-colors ${
                      on ? 'text-white' : 'text-white/60 hover:text-white/90'
                    }`}
                  >
                    {on && (
                      <motion.span
                        layoutId="spil-pure-tab-desk"
                        className="absolute inset-0 rounded-full p-lens"
                        transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                      />
                    )}
                    <span className="relative z-10 flex items-center gap-2 whitespace-nowrap">
                      <Icon size={15} strokeWidth={on ? 2.2 : 1.75} />
                      <span>{item.label}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          </nav>

          {/* Search & Employee Profile Trigger */}
          <div className="flex items-center gap-1.5 tv:gap-2.5">
            <button
              type="button"
              data-tv-focus
              onClick={() => setSearchOpen(true)}
              aria-label="Cari modul atau kompetensi"
              title="Cari modul (⌘K)"
              className="w-9 h-9 tv:w-11 tv:h-11 rounded-full flex items-center justify-center text-white/75 hover:text-white hover:bg-white/[0.1] transition-colors"
            >
              <Search size={17} />
            </button>

            <button
              type="button"
              data-tv-focus
              onClick={() => setMenuOpen((o) => !o)}
              aria-label="Profil Pembelajaran Karyawan"
              className="flex items-center gap-2 p-1 pr-1 sm:pr-2.5 rounded-full bg-white/[0.08] hover:bg-white/[0.14] border border-white/10 backdrop-blur-md transition-colors"
            >
              <span className="w-7 h-7 tv:w-9 tv:h-9 rounded-full bg-gradient-to-br from-[#dc2626] to-[#991b1b] text-white text-[11.5px] tv:text-[13px] font-bold flex items-center justify-center shadow-inner">
                {initials}
              </span>
              <span className="hidden sm:inline text-[12.5px] tv:text-[14.5px] font-medium text-white/85 max-w-[110px] truncate">
                {employee.name.split(' ')[0]}
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* ── Mobile & Portrait Tablet Floating Liquid Glass Bottom Tab Bar (<1024px) ── */}
      <nav
        aria-label="Navigasi Bawah"
        className="lg:hidden fixed bottom-0 inset-x-0 z-50 px-3 pb-[calc(12px+env(safe-area-inset-bottom))] pointer-events-none"
      >
        <div className="p-glass pointer-events-auto rounded-full p-1 sm:p-1.5 flex items-center mx-auto max-w-[430px] sm:max-w-[540px]">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const on = activeItem === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => navigate(item.path)}
                className={`relative flex-1 flex flex-col items-center gap-[3px] py-2 rounded-full transition-colors ${
                  on ? 'text-white' : 'text-white/55'
                }`}
              >
                {on && (
                  <motion.span
                    layoutId="spil-pure-tab-mob"
                    className="absolute inset-0 rounded-full p-lens"
                    transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                  />
                )}
                <span className="relative z-10 flex flex-col items-center gap-[3px]">
                  <Icon size={18} strokeWidth={on ? 2.2 : 1.75} />
                  <span className="sm:hidden text-[9.5px] font-medium tracking-[-0.01em] whitespace-nowrap">
                    {item.mobileLabel}
                  </span>
                  <span className="hidden sm:inline text-[11px] font-medium tracking-[-0.01em] whitespace-nowrap">
                    {item.label}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* ── Instant Fullscreen Search Overlay ── */}
      {searchOpen && <SearchPure onClose={() => setSearchOpen(false)} />}

      {/* ── Employee Learning Profile & LARA Summary Popover (Matches Mockup Image 2) ── */}
      <AnimatePresence>
        {menuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMenuOpen(false)}
              className="fixed inset-0 z-[90] bg-black/45"
            />
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.97 }}
              transition={{ duration: 0.22, ease: [0.32, 0.72, 0, 1] }}
              className="fixed top-14 md:top-16 tv:top-20 right-3 md:right-8 tv:right-14 z-[95] w-[304px] tv:w-[360px] rounded-2xl overflow-hidden bg-[#141416]/95 backdrop-blur-2xl border border-white/10 shadow-2xl"
            >
              {/* Employee Header + Learning Hours Progress (LARA Integration Preview) */}
              <div className="p-4 border-b border-white/[0.08]">
                <div className="flex items-center gap-3">
                  <span className="w-11 h-11 rounded-full bg-gradient-to-br from-[#dc2626] to-[#991b1b] text-white text-[14px] font-bold flex items-center justify-center shrink-0">
                    {initials}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[14.5px] font-semibold text-white truncate">{employee.name}</p>
                    <p className="text-[11.5px] text-white/50 truncate">{employee.division}</p>
                    <p className="text-[11px] text-white/35 truncate">{employee.location}</p>
                  </div>
                </div>

                {/* Hours & Completed Modules bar (inspired by 120h / 15 in SPIL E-Learn mockup) */}
                <div className="mt-3.5 pt-3 border-t border-white/[0.07]">
                  <div className="flex items-baseline justify-between mb-1.5">
                    <span className="text-[12px] text-white/60">Jam Belajar LARA</span>
                    <span className="text-[13px] font-semibold tabular-nums text-white">
                      {totalHours}j <span className="text-white/40 font-normal">/ {employee.annualTargetHours}j</span>
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full bg-white/12 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-white transition-all duration-500"
                      style={{ width: `${hoursPct}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between mt-2 text-[11px] text-white/45">
                    <span>{completedCount} dari {totalEpisodes} video selesai</span>
                    <span>{modules.length} Kompetensi</span>
                  </div>
                </div>
              </div>

              <div className="p-1.5">
                <MenuRow
                  icon={PlusCircle}
                  badge="CMS"
                  onClick={() => {
                    setMenuOpen(false);
                    navigate('/studio');
                  }}
                >
                  Studio Kurator (Tambah Modul/Video)
                </MenuRow>
                <MenuRow
                  icon={Clock}
                  badge={`${completedCount} selesai`}
                  onClick={() => {
                    setMenuOpen(false);
                    navigate('/riwayat');
                  }}
                >
                  Riwayat Pembelajaran
                </MenuRow>

                <MenuRow
                  icon={Bookmark}
                  badge={`${myList.length}`}
                  onClick={() => {
                    setMenuOpen(false);
                    navigate('/daftar-saya');
                  }}
                >
                  Daftar Saya
                </MenuRow>

                <MenuRow
                  icon={Sparkles}
                  onClick={() => {
                    setMenuOpen(false);
                    navigate('/kompetensi');
                  }}
                >
                  Kamus Kompetensi SPIL
                </MenuRow>

                <MenuRow
                  icon={CheckCircle2}
                  onClick={() => {
                    setMenuOpen(false);
                    navigate('/wajib');
                  }}
                >
                  Penugasan Atasan (LARA)
                </MenuRow>

                <div className="my-1.5 mx-3.5 border-t border-white/[0.08]" />

                <div className="px-3.5 py-2 flex items-start gap-2.5 text-[11.5px] text-white/50">
                  <Tv size={15} className="shrink-0 mt-0.5 text-white/60" />
                  <span>
                    Navigasi Smart TV aktif: gunakan tombol panah remote/keyboard &amp; Enter untuk berpindah kartu.
                  </span>
                </div>

                <div className="my-1 mx-3.5 border-t border-white/[0.08]" />

                <MenuRow
                  icon={RotateCcw}
                  onClick={() => {
                    learningStore.resetDemoState();
                    setMenuOpen(false);
                  }}
                >
                  Reset Progres Prototipe
                </MenuRow>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
