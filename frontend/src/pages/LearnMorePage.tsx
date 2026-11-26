import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Compass, Wrench, Briefcase, CheckCircle2, Upload } from 'lucide-react';
import { useLearningStore } from '@/services/learningStore';

/**
 * Learn More (`/learn-more`) — Dedicated Apple TV+ Showcase for Video Pak Faris
 * & Overview of SPIL MAX Competency Pillars (Core, Technical, Managerial).
 */
export default function LearnMorePage() {
  const navigate = useNavigate();
  const { modules } = useLearningStore();

  const farisModule = useMemo(
    () =>
      modules.find((m) => m.id === 'learn-more-pak-faris' || m.kind === 'Learn More') ||
      modules[0],
    [modules]
  );

  const coreCount = useMemo(() => modules.filter((m) => m.kind === 'Core').length, [modules]);
  const techCount = useMemo(() => modules.filter((m) => m.kind === 'Technical').length, [modules]);
  const mgrCount = useMemo(() => modules.filter((m) => m.kind === 'Managerial').length, [modules]);

  if (!farisModule) return null;
  const ep = farisModule.episodes[0];
  const meta = `1 Video  ·  ${farisModule.totalDurationText}  ·  ${farisModule.year}`;

  const pillars = [
    {
      title: 'Core Competency',
      count: `${coreCount} Modul · 4 Level Video`,
      icon: Compass,
      accent: 'bg-[#22c55e]',
      path: '/core',
    },
    {
      title: 'Technical Competency',
      count: `${techCount} Modul · 4 Level Video`,
      icon: Wrench,
      accent: 'bg-[#d02030]',
      path: '/technical',
    },
    {
      title: 'Managerial Competency',
      count: `${mgrCount} Modul · 3 Level Video`,
      icon: Briefcase,
      accent: 'bg-[#22c55e]',
      path: '/managerial',
    },
  ];

  return (
    <div className="min-h-screen pt-20 md:pt-24 tv:pt-32 pb-16 max-w-[1380px] tv:max-w-[1900px] mx-auto px-5 md:px-8 tv:px-14">
      {/* ── Featured Video Pak Faris Hero Card ── */}
      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-[#0b0b0e] shadow-2xl mb-10 md:mb-14">
        <div className="grid grid-cols-1 lg:grid-cols-12">
          {/* Interactive 16:9 Cinema Preview */}
          <button
            type="button"
            data-tv-focus
            onClick={() => navigate(`/tonton/${farisModule.slug}/${ep?.id || 'pak-faris-intro'}`)}
            className="relative lg:col-span-7 aspect-video lg:aspect-auto lg:min-h-[420px] overflow-hidden group text-left focus:outline-none"
          >
            <img
              src={farisModule.backdrop}
              alt={farisModule.title}
              className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500"
            />
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background:
                  'linear-gradient(to top, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0.18) 55%, rgba(0,0,0,0.35) 100%)',
              }}
            />

            {/* Center Apple Liquid Glass Play Trigger */}
            <span className="absolute inset-0 flex items-center justify-center">
              <span className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-black/55 backdrop-blur-xl border border-white/25 flex items-center justify-center text-white shadow-2xl group-hover:scale-105 group-hover:bg-[#16a34a] transition-all">
                <Play size={26} fill="currentColor" className="ml-1" />
              </span>
            </span>

            <span className="absolute bottom-4 left-4 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-black/65 backdrop-blur-md border border-white/12 text-[11px] font-semibold uppercase tracking-[0.07em] text-white/90">
              <span className="w-1.5 h-1.5 rounded-full bg-[#22c55e]" />
              <span>Klik untuk Memutar Layar Penuh</span>
            </span>
          </button>

          {/* Copy & Actions */}
          <div className="lg:col-span-5 p-6 sm:p-8 lg:p-10 flex flex-col justify-center">
            <div className="inline-flex items-center gap-2 self-start px-3 py-1 rounded-full bg-white/[0.08] border border-white/12 text-[11px] tv:text-[12.5px] font-semibold tracking-[0.08em] uppercase text-white/90 mb-4">
              <span className="w-2 h-2 rounded-full bg-[#d02030]" />
              <span>Learn More · Video Pak Faris</span>
            </div>

            <h1 className="p-display text-[26px] sm:text-[32px] md:text-[38px] tv:text-[48px] text-white mb-3">
              {farisModule.title}
            </h1>

            {/* Clicked detail metadata line */}
            <p className="text-[13px] md:text-[14px] tv:text-[16px] font-medium p-dim mb-5">
              {meta}
            </p>

            <p className="text-[13.5px] md:text-[14.5px] tv:text-[16.5px] text-white/80 leading-relaxed mb-6">
              {farisModule.summary}
            </p>

            <ul className="space-y-2 mb-7">
              {farisModule.objectives.map((pt, i) => (
                <li
                  key={i}
                  className="flex items-start gap-2.5 text-[12.5px] md:text-[13.5px] text-white/80"
                >
                  <CheckCircle2 size={15} className="shrink-0 mt-0.5 text-[#22c55e]" />
                  <span>{pt}</span>
                </li>
              ))}
            </ul>

            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                data-tv-focus
                onClick={() => navigate(`/tonton/${farisModule.slug}/${ep?.id || 'pak-faris-intro'}`)}
                className="p-btn"
              >
                <Play size={16} fill="currentColor" />
                <span>Putar Video Pak Faris</span>
              </button>

              <button
                type="button"
                data-tv-focus
                onClick={() => navigate('/studio')}
                className="p-btn p-btn-ghost"
              >
                <Upload size={15} />
                <span>Ganti Video di Studio</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Three SPIL Competency Pillars ── */}
      <div>
        <div className="inline-flex items-center gap-2.5 mb-4">
          <span className="spil-bar-green" />
          <h2 className="p-title text-[19px] md:text-[23px] tv:text-[28px] text-white">
            Tiga Pilar Kompetensi SPIL
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {pillars.map((p) => {
            const Icon = p.icon;
            return (
              <button
                key={p.title}
                type="button"
                data-card
                onClick={() => navigate(p.path)}
                className="p-6 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.09] text-left transition-all group"
              >
                <div className="flex items-center justify-between mb-4">
                  <span className="w-10 h-10 rounded-xl bg-white/[0.07] border border-white/10 flex items-center justify-center text-white">
                    <Icon size={19} />
                  </span>
                  <span className={`w-2 h-2 rounded-full ${p.accent}`} />
                </div>
                <p className="text-[17px] tv:text-[20px] font-semibold text-white mb-1 group-hover:text-white">
                  {p.title}
                </p>
                <p className="text-[12.5px] tv:text-[14px] p-dim">{p.count}</p>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
