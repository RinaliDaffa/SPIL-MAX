import React, { useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import AppleTvPlayer from '@/components/AppleTvPlayer';
import { getModuleBySlug } from '@/data/catalog';

/**
 * Full-Viewport Cinema Playback Route (`/tonton/:slug/:episodeId`).
 */
export default function WatchPage() {
  const { slug, episodeId } = useParams<{ slug: string; episodeId: string }>();
  const navigate = useNavigate();

  const module = useMemo(() => getModuleBySlug(slug), [slug]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !document.fullscreenElement) {
        if (module) navigate(`/modul/${module.slug}`);
        else navigate('/');
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [module, navigate]);

  if (!module) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center gap-3 px-6 text-center">
        <p className="p-title text-xl text-white">Video materi tidak ditemukan</p>
        <button type="button" onClick={() => navigate('/')} className="p-btn mt-2">
          Kembali ke Beranda
        </button>
      </div>
    );
  }

  const targetEpId = episodeId || module.episodes[0]?.id || '';

  return (
    <AppleTvPlayer
      module={module}
      initialEpisodeId={targetEpId}
      onBack={() => navigate(`/modul/${module.slug}`)}
      onEpisodeChange={(nextEpId) => {
        navigate(`/tonton/${module.slug}/${nextEpId}`, { replace: true });
      }}
    />
  );
}
