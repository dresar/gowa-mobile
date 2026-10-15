# Dokumentasi Rilis & Riwayat Versi GoWA

Halaman ini berisi daftar rilis resmi, arsip berkas unduhan, dan catatan perubahan untuk setiap versi **GoWA** (WhatsApp Gateway & Automation Platform).

Seluruh berkas kompilasi (**Android APK** dan **Windows x64 EXE/ZIP**) pada setiap versi **tetap diarsipkan dan tidak dihapus**, sehingga pengguna dapat mengunduh versi terbaru maupun versi sebelumnya sesuai kebutuhan.

---

## 🚀 Unduhan Cepat (Rilis Terbaru v1.1.4)

| Platform | Format | Ukuran | Berkas | Tautan Unduh Langsung |
| :--- | :--- | :--- | :--- | :--- |
| **Android** (5.0 – 15) | `.apk` | 1.05 MB | `gowa-v1.1.4.apk` | [Unduh APK](/statics/releases/v1.1.4/gowa-v1.1.4.apk) |
| **Windows x64** (Portable Package) | `.zip` | 12.5 MB | `gowa-v1.1.4-windows-amd64.zip` | [Unduh ZIP Bundle](/statics/releases/v1.1.4/gowa-v1.1.4-windows-amd64.zip) |
| **Windows x64** (Standalone Binary) | `.exe` | 36.2 MB | `gowa-v1.1.4-windows-amd64.exe` | [Unduh .EXE Mandiri](/statics/releases/v1.1.4/gowa-v1.1.4-windows-amd64.exe) |

> **Catatan Endpoint Alias**:
> - Versi terbaru APK selalu tersedia juga di: `/statics/gowa.apk`
> - Versi terbaru Windows EXE selalu tersedia juga di: `/statics/gowa.exe`
> - Versi terbaru Windows ZIP selalu tersedia juga di: `/statics/gowa-windows-amd64.zip`

---

## 📦 Matriks Semua Rilis & Arsip Versi

| Versi | Tanggal Rilis | Android APK | Windows x64 ZIP | Windows x64 EXE | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **v1.1.4** | 15 Okt 2026 | [`gowa-v1.1.4.apk`](/statics/releases/v1.1.4/gowa-v1.1.4.apk) (1.05 MB) | [`gowa-v1.1.4-windows-amd64.zip`](/statics/releases/v1.1.4/gowa-v1.1.4-windows-amd64.zip) (12.5 MB) | [`gowa-v1.1.4-windows-amd64.exe`](/statics/releases/v1.1.4/gowa-v1.1.4-windows-amd64.exe) (36.2 MB) | **Rilis Stabil Terbaru** |
| **v1.1.3** | 15 Okt 2026 | [`gowa-v1.1.3.apk`](/statics/releases/v1.1.3/gowa-v1.1.3.apk) (1.05 MB) | — | — | Arsip |
| **v1.1.2** | 15 Okt 2026 | [`gowa-v1.1.2.apk`](/statics/releases/v1.1.2/gowa-v1.1.2.apk) (1.05 MB) | — | — | Arsip |
| **v1.1.0** | 14 Okt 2026 | [`gowa-v1.1.0.apk`](/statics/releases/v1.1.0/gowa-v1.1.0.apk) (1.06 MB) | — | — | Arsip Perdana |

---

## 🔒 Integritas Berkas & SHA256 Checksum

Sebelum menjalankan berkas di perangkat Anda, Anda dapat memverifikasi integritas checksum SHA256 berikut:

### Versi 1.1.4
- **`gowa-v1.1.4.apk`**  
  `7eb2c5a4abc7bed3833a5baaec11785c3d04a8639ee1c3e8f87919af70db2514`
- **`gowa-v1.1.4-windows-amd64.zip`**  
  `870608b4f3e14d25890d33693ec19effead709934d6f044994a1858635af74ff`
- **`gowa-v1.1.4-windows-amd64.exe`**  
  `76ef5e0efce9379b8c92ffd6660f21427a77573caf786acc510a51c1204d2f6c`

### Versi 1.1.3
- **`gowa-v1.1.3.apk`**  
  `d738dfd86b895e7337877897bcecd6343d4cd5eff8ab81554302839c494efc8d`

### Versi 1.1.2
- **`gowa-v1.1.2.apk`**  
  `9d041cee21fd9b6ff0143821e53683cd7886d3bf37f28aab138af652be7f4c31`

### Versi 1.1.0
- **`gowa-v1.1.0.apk`**  
  `a115d96f3bdf5f5cc67f3e5502d42f9ddbb33bacdd105516165a39171b7c2034`

---

## 📖 Detail Catatan Perubahan Per Versi (Changelog)

### [v1.1.4] - 15 Oktober 2026
**Sorotan Pembaruan Terbesar:**
1. **Pure Go SQLite Engine**:
   - Backend Go telah dimigrasikan sepenuhnya ke pure Go driver (`modernc.org/sqlite`), meniadakan dependensi GCC/CGO (`CGO_ENABLED=0`).
   - Dapat dikompilasi secara portabel untuk Linux, macOS, dan Windows.
2. **Build Resmi Windows x64 (.EXE & .ZIP)**:
   - Tersedia paket biner mandiri 64-bit untuk Windows 10 dan Windows 11.
   - Paket ZIP portabel menyertakan peluncur klik-ganda `run.bat` dan `run.ps1`, file konfigurasi `.env`, dan UI dashboard web tertanam di `storages/ui/index.html`.
3. **UI React Mandiri Tertanam di APK Android**:
   - Sumber kode React / TSX dimigrasikan ke dalam modul `gowa-mobile/ui/` dengan alur kompilasi mandiri.
   - Aplikasi mobile tahan terhadap pemutusan koneksi server tanpa layar error putih (*graceful floating banner*).
4. **WebSocket Real-time Sync**:
   - Broadcast channel pesan masuk dan keluar dengan *buffered non-blocking channel* (kapasitas 256 pesan).
   - Chat dan log terbarui seketika (*instant zero-delay*).
5. **Menu Lampiran WhatsApp Komprehensif**:
   - Menu popover lampiran di panel obrolan: Dokumen, Foto/Gambar, Video, Pesan Suara/Audio, dan Stiker WhatsApp.
6. **Notifikasi In-App Pesan Personal**:
   - Notifikasi real-time khusus chat personal (nomor individu) lengkap dengan nama pengirim dan isi pesan. Chat grup tidak membunyikan notifikasi berulang.
7. **Pengaturan Keamanan AI Default**:
   - Auto-reply AI secara bawaan **mati total** (`AI_AUTO_REPLY_ENABLED=false`).
   - AI untuk grup dimatikan dan wajib dipilih secara manual melalui *whitelist* di menu Analisis.

### [v1.1.3] - 15 Oktober 2026
- Menambahkan audio chime notifikasi saat pesan masuk.
- Indikator koneksi WebSocket dan sistem auto-reconnect cerdas.

### [v1.1.2] - 15 Oktober 2026
- Peningkatan deteksi endpoint API otomatis pada jaringan lokal maupun domain publik.
- Dukungan auto-updater in-app untuk APK mobile.

### [v1.1.0] - 14 Oktober 2026
- Rilis perdana paket aplikasi native Android APK dengan WebView performa tinggi.
- Penyertaan splash screen dan dukungan auto-login token via shared storage.

---

## 💻 Panduan Menjalankan di Windows (x64)

### Cara Termudah (Menggunakan Paket ZIP):
1. Unduh file [`gowa-v1.1.4-windows-amd64.zip`](/statics/releases/v1.1.4/gowa-v1.1.4-windows-amd64.zip).
2. Ekstrak file zip ke folder mana saja di komputer Anda (contoh: `C:\gowa`).
3. Klik ganda file **`run.bat`**.
4. Browser akan otomatis terbuka ke `http://localhost:8011`.
5. Buka WhatsApp di ponsel Anda > Perangkat Tertaut > Tautkan Perangkat > Arahkan kamera ke QR Code di layar.

---

## 📱 Panduan Memasang di Android

1. Unduh file [`gowa-v1.1.4.apk`](/statics/releases/v1.1.4/gowa-v1.1.4.apk) langsung dari browser ponsel Android Anda.
2. Buka berkas yang baru diunduh. Jika muncul peringatan keamanan, pilih **Izinkan instalasi dari sumber ini** (*Allow from this source*).
3. Klik **Instal**.
4. Buka aplikasi **GoWA Mobile**, masukkan PIN atau URL server Anda, dan aplikasi siap digunakan.
