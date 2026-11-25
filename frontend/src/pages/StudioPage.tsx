import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  Upload,
  Film,
  Layers,
  Download,
  CheckCircle2,
  Play,
  Trash2,
  Server,
} from 'lucide-react';
import { learningStore, useLearningStore } from '@/services/learningStore';
import type { CompetencyKind } from '@/types/learning';

const ART_PRESETS = [
  {
    label: 'Pelabuhan & Gantry Crane',
    poster: '/art/port-management-poster.jpg',
    backdrop: '/art/port-management-wide.jpg',
  },
  {
    label: 'Keselamatan Kerja (K3)',
    poster: '/art/k3-safety-poster.jpg',
    backdrop: '/art/k3-safety-wide.jpg',
  },
  {
    label: 'Container Yard & Depo',
    poster: '/art/yard-optimization-poster.jpg',
    backdrop: '/art/yard-optimization-wide.jpg',
  },
  {
    label: 'Leadership & Kolaborasi Tim',
    poster: '/art/interpersonal-agility-poster.jpg',
    backdrop: '/art/interpersonal-agility-wide.jpg',
  },
  {
    label: 'Digital, Data & LARA',
    poster: '/art/administration-lara-poster.jpg',
    backdrop: '/art/administration-lara-wide.jpg',
  },
  {
    label: 'Green Shipping & Armada',
    poster: '/art/green-maritime-ext-poster.jpg',
    backdrop: '/art/green-maritime-ext-wide.jpg',
  },
];

/**
 * SPIL MAX Studio Kurator (`/studio`)
 * Apple dark-glass CMS page for HC / Learning Curators to dynamically add
 * new Competency Modules, upload or link new Level Videos (.mp4 / .m3u8),
 * and export LARA compliance reports.
 */
export default function StudioPage() {
  const navigate = useNavigate();
  const { modules, backendConnected } = useLearningStore();

  const [tab, setTab] = useState<'episode' | 'module' | 'manage'>('episode');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  // ── Form 1: Add Video Level to Existing Module ────────────────────────────
  const [epModuleId, setEpModuleId] = useState(modules[0]?.id || 'k3-safety');
  const [epLevelNumber, setEpLevelNumber] = useState(1);
  const [epLevelLabel, setEpLevelLabel] = useState('Level 1 · Dasar');
  const [epTitle, setEpTitle] = useState('');
  const [epDurationText, setEpDurationText] = useState('12 mnt');
  const [epDescription, setEpDescription] = useState('');
  const [epVideoUrl, setEpVideoUrl] = useState('/media/spil-demo-720.mp4');
  const [epSubtitleUrl, setEpSubtitleUrl] = useState('/vtt/core.id.vtt');
  const [epTakeaways, setEpTakeaways] = useState('');
  const [uploadingVideo, setUploadingVideo] = useState(false);

  // ── Form 2: Create New Competency Module ──────────────────────────────────
  const [modTitle, setModTitle] = useState('');
  const [modCompetency, setModCompetency] = useState('');
  const [modKind, setModKind] = useState<CompetencyKind>('Core');
  const [modDivision, setModDivision] = useState('All Divisions · Core Competency');
  const [modBadge, setModBadge] = useState('BARU');
  const [modMandatory, setModMandatory] = useState(false);
  const [modHero, setModHero] = useState(true);
  const [modSummary, setModSummary] = useState('');
  const [modObjectives, setModObjectives] = useState('');
  const [modArtIdx, setModArtIdx] = useState(0);
  const [modCustomBackdrop, setModCustomBackdrop] = useState('');
  const [modCustomPoster, setModCustomPoster] = useState('');
  const [modFirstEpTitle, setModFirstEpTitle] = useState('');
  const [modFirstEpVideo, setModFirstEpVideo] = useState('/media/spil-demo-720.mp4');

  const handleFileUpload = async (
    file: File | undefined,
    onDone: (url: string) => void
  ) => {
    if (!file) return;
    setUploadingVideo(true);
    setNotice(null);
    try {
      const url = await learningStore.uploadMediaFile(file);
      onDone(url);
      setNotice({ type: 'ok', text: `Berkas berhasil diunggah: ${url}` });
    } catch (err) {
      setNotice({
        type: 'err',
        text: err instanceof Error ? err.message : 'Gagal mengunggah berkas.',
      });
    } finally {
      setUploadingVideo(false);
    }
  };

  const submitEpisode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!epTitle.trim()) return;
    setBusy(true);
    setNotice(null);
    try {
      const targetMod = modules.find((m) => m.id === epModuleId);
      const epId = await learningStore.addEpisodeToModule({
        moduleId: epModuleId,
        levelNumber: epLevelNumber,
        levelLabel: epLevelLabel.trim() || `Level ${epLevelNumber}`,
        title: epTitle.trim(),
        description: epDescription.trim() || `Materi pembelajaran ${epTitle.trim()}.`,
        durationText: epDurationText.trim() || '12 mnt',
        durationSeconds: 30,
        videoUrl: epVideoUrl.trim() || '/media/spil-demo-720.mp4',
        subtitleIdUrl: epSubtitleUrl.trim() || '/vtt/core.id.vtt',
        keyTakeaways: epTakeaways
          .split('\n')
          .map((s) => s.trim())
          .filter(Boolean),
      });
      setNotice({
        type: 'ok',
        text: `Video "${epTitle}" berhasil ditambahkan ke modul ${targetMod?.title || ''}.`,
      });
      setEpTitle('');
      setEpDescription('');
      setEpTakeaways('');
      if (targetMod) {
        setTimeout(() => navigate(`/tonton/${targetMod.slug}/${epId}`), 700);
      }
    } catch (err) {
      setNotice({
        type: 'err',
        text: err instanceof Error ? err.message : 'Gagal menyimpan video level.',
      });
    } finally {
      setBusy(false);
    }
  };

  const submitModule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modTitle.trim() || !modSummary.trim()) return;
    setBusy(true);
    setNotice(null);
    try {
      const preset = ART_PRESETS[modArtIdx] || ART_PRESETS[0];
      const created = await learningStore.createModule({
        title: modTitle.trim(),
        competency: modCompetency.trim() || modTitle.trim(),
        kind: modKind,
        division: modDivision.trim() || 'All Divisions',
        badge: modBadge.trim() || 'BARU',
        mandatoryFromSuperior: modMandatory,
        featuredInHero: modHero,
        summary: modSummary.trim(),
        objectives: modObjectives
          .split('\n')
          .map((s) => s.trim())
          .filter(Boolean),
        poster: modCustomPoster.trim() || preset.poster,
        backdrop: modCustomBackdrop.trim() || preset.backdrop,
        initialEpisode: modFirstEpTitle.trim()
          ? {
              levelNumber: 1,
              levelLabel: 'Level 1 · Dasar',
              title: modFirstEpTitle.trim(),
              description: modSummary.trim(),
              durationText: '12 mnt',
              durationSeconds: 30,
              videoUrl: modFirstEpVideo.trim() || '/media/spil-demo-720.mp4',
            }
          : undefined,
      });
      setNotice({
        type: 'ok',
        text: `Modul "${created.title}" berhasil dipublikasikan ke katalog SPIL MAX.`,
      });
      setTimeout(() => navigate(`/modul/${created.slug}`), 700);
    } catch (err) {
      setNotice({
        type: 'err',
        text: err instanceof Error ? err.message : 'Gagal membuat modul baru.',
      });
    } finally {
      setBusy(false);
    }
  };

  const inputCls =
    'w-full h-11 px-3.5 rounded-xl bg-white/[0.06] border border-white/10 text-[14px] text-white placeholder:text-white/30 outline-none focus:border-white/35 transition-colors';

  return (
    <div className="min-h-screen pt-20 md:pt-24 tv:pt-32 pb-16 px-5 md:px-8 tv:px-14 max-w-[1180px] mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-7">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.07] border border-white/10 text-[11px] font-semibold tracking-[0.08em] uppercase text-white/80 mb-2.5">
            <Server size={12} />
            <span>
              {backendConnected
                ? 'Terhubung ke Backend API & Database SQLite'
                : 'Mode Pratinjau Lokal (Fallback Browser)'}
            </span>
          </div>
          <h1 className="p-display text-[28px] sm:text-[36px] md:text-[42px]">
            Studio Kurator SPIL MAX
          </h1>
          <p className="text-[13.5px] md:text-[15px] p-dim mt-1.5 max-w-2xl">
            Kelola penambahan modul kompetensi baru, unggah berkas video level (`.mp4` / HLS `.m3u8`), dan unduh rekap kepatuhan belajar LARA.
          </p>
        </div>

        <a
          href="/api/lara/report?format=csv"
          download="spil-max-lara-report.csv"
          className="p-btn p-btn-ghost shrink-0 self-start md:self-auto"
        >
          <Download size={16} /> Ekspor CSV LARA
        </a>
      </div>

      {/* Mode Switcher */}
      <div className="inline-flex p-1 rounded-full bg-white/[0.07] border border-white/10 mb-7 overflow-x-auto max-w-full">
        <button
          type="button"
          onClick={() => setTab('episode')}
          className={`h-9 px-4 rounded-full text-[13px] font-medium flex items-center gap-2 whitespace-nowrap transition-colors ${
            tab === 'episode' ? 'bg-white text-black font-semibold' : 'text-white/70 hover:text-white'
          }`}
        >
          <Film size={15} /> Tambah Video Level
        </button>
        <button
          type="button"
          onClick={() => setTab('module')}
          className={`h-9 px-4 rounded-full text-[13px] font-medium flex items-center gap-2 whitespace-nowrap transition-colors ${
            tab === 'module' ? 'bg-white text-black font-semibold' : 'text-white/70 hover:text-white'
          }`}
        >
          <Layers size={15} /> Buat Modul Kompetensi Baru
        </button>
        <button
          type="button"
          onClick={() => setTab('manage')}
          className={`h-9 px-4 rounded-full text-[13px] font-medium flex items-center gap-2 whitespace-nowrap transition-colors ${
            tab === 'manage' ? 'bg-white text-black font-semibold' : 'text-white/70 hover:text-white'
          }`}
        >
          Daftar Katalog ({modules.length})
        </button>
      </div>

      {notice && (
        <div
          className={`mb-6 p-4 rounded-2xl border flex items-center gap-3 text-[13.5px] ${
            notice.type === 'ok'
              ? 'bg-white/[0.08] border-white/20 text-white'
              : 'bg-red-500/10 border-red-500/30 text-red-200'
          }`}
        >
          <CheckCircle2 size={17} className="shrink-0" />
          <span>{notice.text}</span>
        </div>
      )}

      {/* ── TAB 1: ADD VIDEO EPISODE TO EXISTING MODULE ── */}
      {tab === 'episode' && (
        <form
          onSubmit={submitEpisode}
          className="p-6 md:p-8 rounded-2xl bg-[#111114] border border-white/10 space-y-5"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="block text-[12px] font-medium text-white/60 mb-1.5">
                Pilih Modul Kompetensi Tujuan
              </label>
              <select
                value={epModuleId}
                onChange={(e) => setEpModuleId(e.target.value)}
                className={inputCls}
              >
                {modules.map((m) => (
                  <option key={m.id} value={m.id} className="bg-[#141416] text-white">
                    {m.title} ({m.episodes.length} Level saat ini)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[12px] font-medium text-white/60 mb-1.5">
                Urutan Level
              </label>
              <select
                value={epLevelNumber}
                onChange={(e) => {
                  const n = Number(e.target.value);
                  setEpLevelNumber(n);
                  const names: Record<number, string> = {
                    1: 'Level 1 · Dasar',
                    2: 'Level 2 · Praktik',
                    3: 'Level 3 · Mahir',
                    4: 'Level 4 · Strategis',
                  };
                  setEpLevelLabel(names[n] || `Level ${n}`);
                }}
                className={inputCls}
              >
                {[1, 2, 3, 4, 5].map((n) => (
                  <option key={n} value={n} className="bg-[#141416] text-white">
                    Level {n}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="block text-[12px] font-medium text-white/60 mb-1.5">
                Judul Video Training (Sesuai Nama Training DT) *
              </label>
              <input
                required
                value={epTitle}
                onChange={(e) => setEpTitle(e.target.value)}
                placeholder="Contoh: Basic Safety Training K3 — Simulasi Evakuasi Dermaga"
                className={inputCls}
              />
            </div>

            <div>
              <label className="block text-[12px] font-medium text-white/60 mb-1.5">
                Estimasi Durasi
              </label>
              <input
                value={epDurationText}
                onChange={(e) => setEpDurationText(e.target.value)}
                placeholder="12 mnt"
                className={inputCls}
              />
            </div>
          </div>

          <div>
            <label className="block text-[12px] font-medium text-white/60 mb-1.5">
              Sumber Video (URL MP4 / HLS `.m3u8` atau Unggah Berkas `.mp4` Lokal)
            </label>
            <div className="flex flex-col sm:flex-row gap-2.5">
              <input
                value={epVideoUrl}
                onChange={(e) => setEpVideoUrl(e.target.value)}
                placeholder="/media/spil-demo-720.mp4 atau https://cdn.spil.co.id/.../master.m3u8"
                className={`${inputCls} flex-1`}
              />
              <label className="h-11 px-4 rounded-xl bg-white/[0.1] hover:bg-white/[0.16] border border-white/15 text-[13px] font-medium text-white flex items-center justify-center gap-2 cursor-pointer shrink-0 transition-colors">
                <Upload size={15} />
                <span>{uploadingVideo ? 'Mengunggah…' : 'Unggah MP4'}</span>
                <input
                  type="file"
                  accept="video/mp4,video/webm,.mp4,.webm"
                  className="hidden"
                  disabled={uploadingVideo}
                  onChange={(e) =>
                    handleFileUpload(e.target.files?.[0], (url) => setEpVideoUrl(url))
                  }
                />
              </label>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[12px] font-medium text-white/60 mb-1.5">
                Ringkasan Materi Episode
              </label>
              <textarea
                rows={3}
                value={epDescription}
                onChange={(e) => setEpDescription(e.target.value)}
                placeholder="Ringkasan singkat materi yang dibahas pada video level ini…"
                className="w-full p-3.5 rounded-xl bg-white/[0.06] border border-white/10 text-[14px] text-white placeholder:text-white/30 outline-none focus:border-white/35"
              />
            </div>

            <div>
              <label className="block text-[12px] font-medium text-white/60 mb-1.5">
                Poin Intisari / Key Takeaways (Satu poin per baris)
              </label>
              <textarea
                rows={3}
                value={epTakeaways}
                onChange={(e) => setEpTakeaways(e.target.value)}
                placeholder={'Pastikan jalur evakuasi dermaga bebas hambatan\nKonfirmasi komunikasi radio sebelum pengangkatan'}
                className="w-full p-3.5 rounded-xl bg-white/[0.06] border border-white/10 text-[14px] text-white placeholder:text-white/30 outline-none focus:border-white/35"
              />
            </div>
          </div>

          <div>
            <label className="block text-[12px] font-medium text-white/60 mb-1.5">
              Track Subtitle Bahasa Indonesia (`.vtt` opsional)
            </label>
            <div className="flex flex-col sm:flex-row gap-2.5">
              <input
                value={epSubtitleUrl}
                onChange={(e) => setEpSubtitleUrl(e.target.value)}
                placeholder="/vtt/core.id.vtt"
                className={`${inputCls} flex-1`}
              />
              <label className="h-11 px-4 rounded-xl bg-white/[0.08] hover:bg-white/[0.14] border border-white/10 text-[13px] font-medium text-white/85 flex items-center justify-center gap-2 cursor-pointer shrink-0 transition-colors">
                <Upload size={15} />
                <span>Unggah .VTT</span>
                <input
                  type="file"
                  accept=".vtt,text/vtt"
                  className="hidden"
                  onChange={(e) =>
                    handleFileUpload(e.target.files?.[0], (url) => setEpSubtitleUrl(url))
                  }
                />
              </label>
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button type="submit" disabled={busy || uploadingVideo} className="p-btn disabled:opacity-50">
              <Plus size={17} /> {busy ? 'Menyimpan…' : 'Simpan & Putar Video Level'}
            </button>
          </div>
        </form>
      )}

      {/* ── TAB 2: CREATE NEW MODULE ── */}
      {tab === 'module' && (
        <form
          onSubmit={submitModule}
          className="p-6 md:p-8 rounded-2xl bg-[#111114] border border-white/10 space-y-5"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[12px] font-medium text-white/60 mb-1.5">
                Judul Modul Pembelajaran *
              </label>
              <input
                required
                value={modTitle}
                onChange={(e) => setModTitle(e.target.value)}
                placeholder="Contoh: Planning & Organizing Operational Excellence"
                className={inputCls}
              />
            </div>

            <div>
              <label className="block text-[12px] font-medium text-white/60 mb-1.5">
                Nama Kompetensi (Kamus Kompetensi SPIL)
              </label>
              <input
                value={modCompetency}
                onChange={(e) => setModCompetency(e.target.value)}
                placeholder="Planning & Organizing"
                className={inputCls}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-[12px] font-medium text-white/60 mb-1.5">
                Jenis Kompetensi
              </label>
              <select
                value={modKind}
                onChange={(e) => setModKind(e.target.value as CompetencyKind)}
                className={inputCls}
              >
                {(['Core', 'Managerial', 'Operasional & K3', 'Spesial', 'Eksternal'] as CompetencyKind[]).map(
                  (k) => (
                    <option key={k} value={k} className="bg-[#141416] text-white">
                      {k}
                    </option>
                  )
                )}
              </select>
            </div>

            <div>
              <label className="block text-[12px] font-medium text-white/60 mb-1.5">
                Divisi / Sasaran Peserta
              </label>
              <input
                value={modDivision}
                onChange={(e) => setModDivision(e.target.value)}
                placeholder="Fleet & Terminal Operations"
                className={inputCls}
              />
            </div>

            <div>
              <label className="block text-[12px] font-medium text-white/60 mb-1.5">
                Label Badge Kartu
              </label>
              <input
                value={modBadge}
                onChange={(e) => setModBadge(e.target.value)}
                placeholder="BARU / WAJIB / DARI ATASAN"
                className={inputCls}
              />
            </div>
          </div>

          <div>
            <label className="block text-[12px] font-medium text-white/60 mb-1.5">
              Ringkasan &amp; Deskripsi Modul *
            </label>
            <textarea
              required
              rows={3}
              value={modSummary}
              onChange={(e) => setModSummary(e.target.value)}
              placeholder="Jelaskan tujuan kompetensi dan manfaat praktis modul ini bagi karyawan SPIL…"
              className="w-full p-3.5 rounded-xl bg-white/[0.06] border border-white/10 text-[14px] text-white placeholder:text-white/30 outline-none focus:border-white/35"
            />
          </div>

          <div>
            <label className="block text-[12px] font-medium text-white/60 mb-1.5">
              Capaian Pembelajaran (Satu baris per poin)
            </label>
            <textarea
              rows={3}
              value={modObjectives}
              onChange={(e) => setModObjectives(e.target.value)}
              placeholder={'Menyusun prioritas sumber daya pelabuhan secara terukur\nMeningkatkan koordinasi jadwal sandar dan depo'}
              className="w-full p-3.5 rounded-xl bg-white/[0.06] border border-white/10 text-[14px] text-white placeholder:text-white/30 outline-none focus:border-white/35"
            />
          </div>

          {/* Artwork Preset or Upload */}
          <div>
            <label className="block text-[12px] font-medium text-white/60 mb-2">
              Tema Sampul Sinematik (Atau Unggah Poster &amp; Backdrop Kustom)
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5 mb-3">
              {ART_PRESETS.map((p, idx) => (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => setModArtIdx(idx)}
                  className={`relative rounded-xl overflow-hidden aspect-video border text-left transition-all ${
                    modArtIdx === idx
                      ? 'border-white ring-2 ring-white/40'
                      : 'border-white/10 opacity-65 hover:opacity-100'
                  }`}
                >
                  <img src={p.backdrop} alt={p.label} className="w-full h-full object-cover" />
                  <span className="absolute inset-x-0 bottom-0 p-1.5 bg-gradient-to-t from-black/90 to-transparent text-[10px] font-medium text-white truncate">
                    {p.label}
                  </span>
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex gap-2">
                <input
                  value={modCustomPoster}
                  onChange={(e) => setModCustomPoster(e.target.value)}
                  placeholder="URL Poster 2:3 kustom (opsional)"
                  className={`${inputCls} flex-1`}
                />
                <label className="h-11 px-3 rounded-xl bg-white/[0.08] hover:bg-white/[0.14] border border-white/10 text-[12px] font-medium text-white flex items-center cursor-pointer shrink-0">
                  <Upload size={14} className="mr-1.5" /> Poster
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) =>
                      handleFileUpload(e.target.files?.[0], (url) => setModCustomPoster(url))
                    }
                  />
                </label>
              </div>

              <div className="flex gap-2">
                <input
                  value={modCustomBackdrop}
                  onChange={(e) => setModCustomBackdrop(e.target.value)}
                  placeholder="URL Backdrop 16:9 kustom (opsional)"
                  className={`${inputCls} flex-1`}
                />
                <label className="h-11 px-3 rounded-xl bg-white/[0.08] hover:bg-white/[0.14] border border-white/10 text-[12px] font-medium text-white flex items-center cursor-pointer shrink-0">
                  <Upload size={14} className="mr-1.5" /> Backdrop
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) =>
                      handleFileUpload(e.target.files?.[0], (url) => setModCustomBackdrop(url))
                    }
                  />
                </label>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-6 pt-1">
            <label className="inline-flex items-center gap-2.5 text-[13.5px] text-white/85 cursor-pointer">
              <input
                type="checkbox"
                checked={modMandatory}
                onChange={(e) => setModMandatory(e.target.checked)}
                className="w-4 h-4 accent-white"
              />
              <span>Tandai sebagai Modul Wajib / Penugasan Atasan (LARA)</span>
            </label>

            <label className="inline-flex items-center gap-2.5 text-[13.5px] text-white/85 cursor-pointer">
              <input
                type="checkbox"
                checked={modHero}
                onChange={(e) => setModHero(e.target.checked)}
                className="w-4 h-4 accent-white"
              />
              <span>Tampilkan di Banner Hero Utama Beranda</span>
            </label>
          </div>

          <div className="pt-4 border-t border-white/10">
            <p className="p-label mb-3">Video Level 1 Awal (Opsional — Bisa Ditambah Nanti)</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                value={modFirstEpTitle}
                onChange={(e) => setModFirstEpTitle(e.target.value)}
                placeholder="Judul Video Level 1 (mis. Pengenalan Dasar Kompetensi)"
                className={inputCls}
              />
              <input
                value={modFirstEpVideo}
                onChange={(e) => setModFirstEpVideo(e.target.value)}
                placeholder="/media/spil-demo-720.mp4 atau URL video"
                className={inputCls}
              />
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button type="submit" disabled={busy || uploadingVideo} className="p-btn disabled:opacity-50">
              <Plus size={17} /> {busy ? 'Mempublikasikan…' : 'Publikasikan Modul Baru'}
            </button>
          </div>
        </form>
      )}

      {/* ── TAB 3: MANAGE EXISTING MODULES ── */}
      {tab === 'manage' && (
        <div className="rounded-2xl bg-[#111114] border border-white/10 divide-y divide-white/[0.08]">
          {modules.map((m) => (
            <div key={m.id} className="p-4 md:px-6 flex items-center gap-4">
              <img
                src={m.backdrop}
                alt={m.title}
                className="w-24 sm:w-32 aspect-video rounded-lg object-cover shrink-0 bg-black"
              />
              <div className="min-w-0 flex-1">
                <p className="text-[15px] font-semibold text-white truncate">{m.title}</p>
                <p className="text-[12px] p-faint truncate mt-0.5">
                  {m.kind} · {m.episodes.length} Level · {m.totalDurationText} · {m.division}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => navigate(`/modul/${m.slug}`)}
                  className="h-9 px-3.5 rounded-full bg-white/[0.08] hover:bg-white/[0.15] text-[12.5px] font-medium text-white flex items-center gap-1.5 transition-colors"
                >
                  <Play size={13} fill="currentColor" /> Buka
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm(`Hapus modul "${m.title}" dari katalog?`)) {
                      void learningStore.deleteModule(m.id);
                    }
                  }}
                  aria-label={`Hapus ${m.title}`}
                  className="w-9 h-9 rounded-full bg-white/[0.05] hover:bg-red-500/20 text-white/50 hover:text-red-300 flex items-center justify-center transition-colors"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
