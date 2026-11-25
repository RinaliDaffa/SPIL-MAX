# SPIL MAX — E-Learning Hub & Edu Stream (Apple TV+ Edition)

Prototipe platform streaming video pembelajaran (**E-Learning Hub / Edu Stream**) bergaya **Apple TV+ / tvOS** untuk **PT Salam Pacific Indonesia Lines (SPIL)**. Dirancang untuk menayangkan seluruh video pembelajaran berbasis **Kamus Kompetensi SPIL** (1 kompetensi = 4 level video), penugasan atasan & inisiatif **LARA** (*Learning Automation for Reporting Administration*), serta kurasi materi pembelajaran eksternal.

---

## Mengapa Menggunakan Arsitektur Open-Source Ini?

Alih-alih membuat desain CSS spekulatif dari nol atau memakai repo latihan lama yang bergantung pada API key eksternal (TMDB/Firebase), repositori ini mengadopsi langsung dua sistem desain open-source bergaya Apple TV kelas produksi:

1. **Antarmuka Katalog & Navigasi Apple TV+ "Pure"** — diadaptasi dari [`why7726/NovaStream`](https://github.com/why7726/NovaStream) (`src/v2/pure/` & `pure.css`, **MIT License**):
   - Kanvas hitam murni (`#000000`), tipografi ketat `SF Pro Display` / `Inter`, kurva transisi khas Apple `cubic-bezier(0.32, 0.72, 0, 1)`.
   - Kapsul navigasi **Apple Liquid Glass** melayang di atas pada Laptop/PC/Smart TV dan di bawah layar pada HP & Tablet Portrait (`env(safe-area-inset-bottom)`).
   - **Showcase Hero** layar penuh dengan *auto-progress indicator*, dukungan *swipe* sentuh, dan tombol pill khas Apple TV.
   - **Horizontal Masked Rails** (`Lanjutkan Belajar`, `Dari Atasan & Modul Wajib`, `Top 10 Modul Terpopuler` dengan angka outline transparan, `Core Competency`, `Kepelabuhanan & K3`, `Leadership & Managerial`, `Kurasi Eksternal`).
   - **Navigasi D-Pad Smart TV & Keyboard Spatial** (`CardKeyNav`) untuk berpindah antarkartu dan antarbaris menggunakan tombol panah remote TV / keyboard.

2. **Apple TV / iOS Liquid Glass Video Player** — menggunakan *core* dari [`chaqchase/react-video`](https://github.com/chaqchase/react-video) (`react-video-kit` v4, **Apache-2.0 License**, di-*vendor* secara bersih di `src/vendor/react-video/`):
   - Kontrol kaca *specular rim* khas Apple TV / iOS (`--rv-glass`, `--rv-rim`).
   - **Daftar Level (`Episodes Shelf`)** langsung di dalam *fullscreen player* untuk berpindah antar Level 1–4 disertai indikator *Now Playing* dan progres tontonan.
   - **Panel Info Modul (`Info Sheet`)** langsung di atas video untuk melihat ringkasan kompetensi dan pemateri.
   - **Transkrip Materi Interaktif** tersinkronisasi (klik kalimat mana pun untuk melompat ke detiknya) + ringkasan *Key Takeaways* tiap level.
   - **Multi-Resolusi (`720p HD` / `360p Hemat Data`)** + dukungan native **HLS (`.m3u8`)** melalui `hls.js`.
   - **Subtitle Dwibahasa (`Bahasa Indonesia` & `English` WebVTT)**, **Bab Materi (`Chapters` WebVTT)** pada *timeline*, **Lewati Pembuka (`Skip Intro`)**, **Auto-Next Level Berikutnya**, **Picture-in-Picture (PiP)**, dan **AirPlay**.

---

## Dukungan Multi-Perangkat (Responsive)

| Kelas Perangkat | Ukuran Viewport | Adaptasi Antarmuka |
| :--- | :--- | :--- |
| **HP (Mobile)** | `< 640px` (mis. `390×844`) | Bar kapsul Liquid Glass di bawah layar, *swipe* horizontal pada Hero & Rail, *drag-to-dismiss* iOS bottom sheet untuk filter/level, kontrol player ringkas (`@container rv`). |
| **Tablet (iPad)** | `640px – 1023px` (mis. `820×1180`) | Header bersih tanpa tumpang tindih, kapsul navigasi bawah yang lebih lebar, grid katalog 4–5 kolom proporsional. |
| **Laptop & PC** | `1024px – 1799px` (mis. `1440×900`) | Kapsul navigasi Liquid Glass terpusat di atas, tombol panah *snap-to-card* saat *hover*, panel samping transkrip pada video player. |
| **Smart TV (1080p / 4K)** | `≥ 1800px` (`tv:` / `4k:`) | Skala tipografi & kartu *10-foot UI*, *focus ring* kontras tinggi, navigasi penuh menggunakan tombol `ArrowUp` / `ArrowDown` / `ArrowLeft` / `ArrowRight` / `Enter` / `Escape`. |

---

## Cara Menjalankan di Lokal

Tidak memerlukan `.env` atau API key apa pun — seluruh aset poster, video demo multi-resolusi, dan subtitle WebVTT sudah disertakan secara lokal agar langsung berjalan.

```bash
# 1. Masuk ke direktori repositori
cd Website-Video

# 2. Instal dependensi
npm install

# 3. Jalankan server pengembangan (http://localhost:5173)
npm run dev

# 4. Cek tipe TypeScript & build produksi
npm run build
npm run preview
```

---

## Struktur Folder Utama (Panduan Kolaborasi Tim)

```text
├── public/
│   ├── art/               # Poster 2:3 (*-poster.jpg) & Backdrop 16:9 (*-wide.jpg)
│   ├── brand/             # Logo resmi SPIL (spil-logo.png)
│   ├── media/             # Video MP4 fast-start (720p & 360p) — siap diganti URL CDN/HLS
│   └── vtt/               # Track subtitle (.id.vtt, .en.vtt) & bab materi (*-chapters.vtt)
├── src/
│   ├── components/
│   │   ├── AppleTvPlayer.tsx   # Wrapper player Apple TV + telemetri progres + panel transkrip
│   │   ├── CardKeyNav.tsx      # Navigasi D-Pad Smart TV & keyboard antar-rail
│   │   ├── CardPure.tsx        # Kartu modul poster (2:3) & widescreen (16:9)
│   │   ├── FilterBar.tsx       # Filter kompetensi, divisi, status selesai, & urutan
│   │   ├── GridPure.tsx        # Grid responsif katalog & Daftar Saya
│   │   ├── HeroPure.tsx        # Hero showcase beranda
│   │   ├── NavPure.tsx         # Navigasi Liquid Glass + kartu profil Jam Belajar LARA
│   │   ├── PickerPure.tsx      # Dropdown kaca desktop / iOS bottom sheet mobile
│   │   ├── RowPure.tsx         # Rail horizontal dengan mask fade tepi kiri
│   │   ├── SearchPure.tsx      # Pencarian instan layar penuh (⌘K / Ctrl+K)
│   │   └── SynopsisPure.tsx    # Modal detail sinopsis & capaian pembelajaran
│   ├── data/
│   │   └── catalog.ts          # Sumber data modul & level SPIL (titik integrasi API/LARA)
│   ├── pages/                  # Halaman rute aplikasi (Home, Catalog, Detail, Watch, MyList, History)
│   ├── services/
│   │   └── learningStore.ts    # State reaktif progres tontonan, riwayat LARA, & Daftar Saya
│   ├── styles/
│   │   ├── apple-tv-pure.css   # Token desain & komponen Apple TV+ Pure
│   │   └── player-tv.css       # Kustomisasi layar penuh & skala Smart TV 4K untuk player
│   ├── types/
│   │   └── learning.ts         # Definisi tipe TypeScript modul, episode, & progres
│   └── vendor/
│       └── react-video/        # Core Apple TV Liquid Glass Player (Apache-2.0)
├── vercel.json                 # Konfigurasi rewrite SPA siap deploy ke Vercel
└── netlify.toml                # Konfigurasi redirect SPA siap deploy ke Netlify
```

---

## Cara Menghubungkan Video Asli `elearning-spil` / Backend LARA

1. **Mengganti Sumber Video MP4 atau HLS (`.m3u8`)**:
   Buka `src/data/catalog.ts`. Setiap level di dalam `episodes` mendukung multi-resolusi MP4 maupun stream adaptif HLS:
   ```ts
   renditions: [
     { src: 'https://cdn.spil.co.id/elearning/k3/level-1-1080p.mp4', type: 'video/mp4', label: '1080p FHD', height: 1080 },
     { src: 'https://cdn.spil.co.id/elearning/k3/level-1-720p.mp4', type: 'video/mp4', label: '720p HD', height: 720 },
   ]
   ```
   *(Atau arahkan langsung ke manifest `.m3u8` karena plugin `hls()` sudah terpasang aktif di `AppleTvPlayer.tsx`.)*

2. **Menghubungkan Progres Tontonan ke Backend LARA**:
   Buka `src/services/learningStore.ts`. Fungsi `savePlaybackProgress()` dipanggil secara otomatis oleh player setiap detik saat video berjalan, dan `markEpisodeWatched()` dipanggil ketika progres mencapai `≥ 90%`. Cukup tambahkan panggilan `fetch('/api/lara/progress', ...)` di dalam kedua fungsi tersebut untuk menyinkronkan jam belajar karyawan ke database LARA.

---

## Pintasan Keyboard & Remote Smart TV

- **Di Katalog / Beranda**:
  - `ArrowUp` / `ArrowDown` / `ArrowLeft` / `ArrowRight` — berpindah fokus antarkartu & antarbaris modul
  - `Enter` / `Space` — membuka modul atau memutar level yang difokuskan
  - `⌘K` / `Ctrl+K` — membuka pencarian instan
- **Di Dalam Video Player**:
  - `Space` / `K` — Putar / Jeda
  - `ArrowLeft` / `ArrowRight` — Mundur / Maju 10 detik (atau *double-tap* sisi kiri/kanan pada layar sentuh)
  - `F` — Layar penuh (*Fullscreen*)
  - `M` — Bisukan suara (*Mute*)
  - `Escape` — Keluar dari panel/fullscreen atau kembali ke halaman detail modul

---

## Lisensi & Atribusi

Lihat [`LICENSE`](./LICENSE) dan [`THIRD_PARTY_NOTICES.md`](./THIRD_PARTY_NOTICES.md).
