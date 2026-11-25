# SPIL MAX — E-Learning Hub & Edu Stream (Apple TV+ Full-Stack Edition)

Platform streaming video pembelajaran (**E-Learning Hub / Edu Stream**) bergaya **Apple TV+ / tvOS** untuk **PT Salam Pacific Indonesia Lines (SPIL)**. Dirancang untuk menayangkan video pembelajaran berbasis **Kamus Kompetensi SPIL** (`1 kompetensi = 4 level video`), penugasan wajib atasan & inisiatif **LARA** (*Learning Automation for Reporting Administration*), serta kurasi materi eksternal.

---

## Fitur Utama

1. **Antarmuka Apple TV+ "Pure" & Responsif Penuh** (HP · Tablet · Laptop/PC · Smart TV 4K):
   - Diadaptasi dari open-source [`why7726/NovaStream`](https://github.com/why7726/NovaStream) (MIT License) tanpa desain spekulatif.
   - Navigasi kapsul **Apple Liquid Glass** (melayang di atas pada Laptop/PC/Smart TV, melayang di bawah layar pada HP & Tablet Portrait).
   - Navigasi **D-Pad Remote Smart TV & Keyboard Spatial** (`ArrowUp`, `ArrowDown`, `ArrowLeft`, `ArrowRight`, `Enter`, `Escape`).

2. **Apple TV / iOS Liquid Glass Video Player**:
   - Ditenagai *core* [`chaqchase/react-video`](https://github.com/chaqchase/react-video) (`react-video-kit` v4, Apache-2.0 License).
   - **Continue Where I Left Off** lintas perangkat: menyimpan detik terakhir secara otomatis saat diputar, dijeda, maupun saat tab ditutup (`navigator.sendBeacon`), lalu melanjutkan pemutaran tepat di detik terakhir disertai indikator *Melanjutkan dari mm:ss · Ulang dari awal*.
   - **Daftar Level (`Episodes Shelf`)**, **Panel Info Modul**, **Transkrip Materi Interaktif** berbahasa Indonesia, **Subtitle ID/EN (`.vtt`)**, **Bab Materi (`Chapters`)**, **Multi-Resolusi (`720p HD` / `360p` / HLS `.m3u8`)**, **Skip Intro**, **PiP**, dan **AirPlay**.

3. **Studio Kurator (`/studio`) — Penambahan Modul & Video Dinamis**:
   - Halaman CMS bergaya Apple dark-glass untuk menambah modul kompetensi baru, mengunggah file video `.mp4` / subtitle `.vtt` langsung ke server (atau menempelkan URL CDN/HLS `.m3u8`), serta mengunduh laporan **CSV LARA** (`/api/lara/report?format=csv`).

4. **Siap Handover & Deploy oleh Tim IT SPIL**:
   - Dilengkapi `docker-compose.yml`, `Dockerfile` multi-stage (`frontend` Nginx reverse-proxy + `backend` Node 22 LTS + SQLite WAL), skema PostgreSQL (`backend/sql/schema.postgres.sql`), GitHub Actions CI, dan dokumen teknis lengkap di [`docs/IT_HANDOVER.md`](./docs/IT_HANDOVER.md).

---

## Struktur Monorepo & Alur Kerja Git Tim (`main`, `frontend`, `backend`)

Repositori ini menggunakan struktur **Full-Stack Monorepo** agar frontend dan backend selalu sinkron dan dapat di-*deploy* Tim IT hanya dengan satu perintah `docker compose up -d --build`:

```text
SPIL-MAX/
├── frontend/               # Aplikasi Web React + Vite + TypeScript + Tailwind + Apple TV Player
│   ├── Dockerfile          # Multi-stage build -> Nginx 1.27 Alpine
│   ├── nginx.conf          # SPA router + Reverse proxy /api & HTTP 206 /uploads
│   └── src/                # Komponen UI, AppleTvPlayer, StudioPage (/studio), & store
├── backend/                # REST API Node.js 22 + Express + TypeScript + SQLite WAL
│   ├── Dockerfile          # Production container non-root + healthcheck
│   ├── sql/                # Skema PostgreSQL (schema.postgres.sql) untuk skala enterprise
│   └── src/                # Server API, database repository, upload media, & LARA CSV/JSON
├── docs/
│   └── IT_HANDOVER.md      # Panduan deployment, SSO header, & infrastruktur untuk Tim IT SPIL
├── scripts/
│   └── dev.mjs             # Menjalankan backend (:4000) + frontend (:5173) secara bersamaan
└── docker-compose.yml      # Orkestrasi produksi siap pakai (Frontend + Backend + Volumes)
```

### Pembagian Cabang (Branch) untuk Pengembangan Tim
Tersedia 3 cabang di GitHub untuk kolaborasi rapi tanpa konflik:
- **`main`**: Cabang utama terintegrasi yang stabil dan siap di-*deploy* oleh Tim IT.
- **`frontend`**: Cabang kerja khusus pengembangan antarmuka (`frontend/*`).
- **`backend`**: Cabang kerja khusus pengembangan API, database, dan integrasi LARA (`backend/*`).

Contoh alur kerja bersama rekan tim:
```bash
# Developer Frontend
git checkout frontend
git pull origin main
# ... kerjakan di dalam folder frontend/ ...
git push origin frontend

# Developer Backend
git checkout backend
git pull origin main
# ... kerjakan di dalam folder backend/ ...
git push origin backend
```
Setelah fitur selesai diuji, buat *Pull Request* dari `frontend` atau `backend` menuju `main`.

---

## Cara Menjalankan di Lokal (Development)

Pastikan menggunakan **Node.js ≥ 22.5.0** (sudah mendukung `node:sqlite` bawaan).

```bash
# 1. Instal dependensi backend & frontend sekaligus
npm run install:all

# 2. Jalankan Backend (:4000) & Frontend (:5173) secara bersamaan
npm run dev
```
- Aplikasi Web: `http://localhost:5173`
- Studio Kurator (Tambah Modul & Video): `http://localhost:5173/studio`
- Healthcheck API: `http://localhost:4000/api/health`
- Laporan CSV LARA: `http://localhost:4000/api/lara/report?format=csv`

Jika ingin menjalankan terpisah di terminal berbeda:
```bash
npm run dev:backend   # Port 4000
npm run dev:frontend  # Port 5173 (otomatis mem-proxy /api & /uploads ke :4000)
```

---

## Cara Deploy dengan Docker (Untuk Tim IT)

```bash
cp .env.example .env
docker compose up -d --build
```
Aplikasi langsung aktif di `http://localhost:8080`. Panduan lengkap SSO, volume NAS, dan PostgreSQL tersedia di [`docs/IT_HANDOVER.md`](./docs/IT_HANDOVER.md).

---

## Lisensi & Atribusi

Lihat [`LICENSE`](./LICENSE) dan [`THIRD_PARTY_NOTICES.md`](./THIRD_PARTY_NOTICES.md).
