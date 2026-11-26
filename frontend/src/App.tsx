import React, { Suspense, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import NavPure from '@/components/NavPure';
import CardKeyNav from '@/components/CardKeyNav';
import HomePage from '@/pages/HomePage';

const CatalogPage = React.lazy(() => import('@/pages/CatalogPage'));
const ModuleDetailPage = React.lazy(() => import('@/pages/ModuleDetailPage'));
const WatchPage = React.lazy(() => import('@/pages/WatchPage'));
const MyListPage = React.lazy(() => import('@/pages/MyListPage'));
const HistoryPage = React.lazy(() => import('@/pages/HistoryPage'));
const CollectionPage = React.lazy(() => import('@/pages/CollectionPage'));
const StudioPage = React.lazy(() => import('@/pages/StudioPage'));

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

function RouteLoader() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center">
      <div className="w-7 h-7 border-2 border-white/15 border-t-[#22c55e] rounded-full animate-spin" />
    </div>
  );
}

function AppShell() {
  const { pathname } = useLocation();
  const isFullscreenPlayer = pathname.startsWith('/tonton/');

  return (
    <div className="nova-pure">
      <ScrollToTop />
      <CardKeyNav />
      {!isFullscreenPlayer && <NavPure />}

      <main className="v2-content">
        <Suspense fallback={<RouteLoader />}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/core" element={<CatalogPage mode="core" />} />
            <Route path="/technical" element={<CatalogPage mode="technical" />} />
            <Route path="/managerial" element={<CatalogPage mode="managerial" />} />
            <Route path="/learn-more" element={<CatalogPage mode="learn-more" />} />
            <Route path="/daftar-saya" element={<MyListPage />} />
            <Route path="/wajib" element={<CatalogPage mode="mandatory" />} />
            <Route path="/kompetensi" element={<CatalogPage mode="all" />} />
            <Route path="/riwayat" element={<HistoryPage />} />
            {/* Separate backoffice CMS route for L&D / IT Admin (not exposed as upload buttons on viewer pages) */}
            <Route path="/admin" element={<StudioPage />} />
            <Route path="/studio" element={<StudioPage />} />
            <Route path="/koleksi/:slug" element={<CollectionPage />} />
            <Route path="/modul/:slug" element={<ModuleDetailPage />} />
            <Route path="/tonton/:slug/:episodeId" element={<WatchPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppShell />
    </BrowserRouter>
  );
}
