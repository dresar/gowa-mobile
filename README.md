# GoWA Mobile

Aplikasi client Android resmi untuk WhatsApp Automation Suite (GoWA). Dibangun sebagai shell WebView native ultra-ringan (~1.0 MB) dengan pipeline build mandiri berbasis Node.js.

## Fitur Unggulan

- **Ukuran Ringkas**: ~1.0 MB tanpa dependensi bloatware atau framework berat.
- **Kompatibilitas Luas**: Mendukung Android 5.0 (API 21) hingga Android 15 (API 35).
- **Multi-Scheme Signing**: Ditandatangani otomatis dengan skema v1 (JAR signing), v2, dan v3 sehingga dapat diinstal langsung (sideload) di semua perangkat vendor (MIUI, OneUI, ColorOS, HyperOS).
- **Native Splash Screen**: Layar pembuka native bertema gelap (`#0B0F19`) dengan animasi transisi halus.
- **Immersive System Bars**: Status bar dan bilah navigasi ponsel serasi dengan tema aplikasi.
- **Offline / Error Fallback**: Layar error native dengan tombol coba lagi saat server tidak terjangkau.
- **Native File Download Manager**: Terintegrasi langsung dengan Android `DownloadManager` untuk media, vCard kontak, dan berkas sistem.
- **JavaScript Bridge**: Sinkronisasi preferensi endpoint server di `SharedPreferences`, getar haptic, dan notifikasi toast.
- **Double-Tap Back to Exit**: Menghindari aplikasi keluar tanpa sengaja.

## Unduhan & Riwayat Rilis

Setiap hasil build versi Android APK dan Windows x64 disimpan secara permanen di folder `releases/` dan tidak akan pernah dihapus atau ditimpa:

| Versi | Berkas | Ukuran | Catatan Rilis |
| :--- | :--- | :--- | :--- |
| **v1.1.4 (Terbaru)** | [`releases/v1.1.4/gowa-v1.1.4.apk`](releases/v1.1.4/gowa-v1.1.4.apk) | 1.05 MB | UI React Mandiri, WebSocket real-time, Notifikasi chat personal |
| **v1.1.3** | [`releases/v1.1.3/gowa-v1.1.3.apk`](releases/v1.1.3/gowa-v1.1.3.apk) | 1.05 MB | Notifikasi audio & perbaikan auto-reconnect |
| **v1.1.2** | [`releases/v1.1.2/gowa-v1.1.2.apk`](releases/v1.1.2/gowa-v1.1.2.apk) | 1.05 MB | Auto-updater APK & deteksi dinamis endpoint |
| **v1.1.0** | [`releases/v1.1.0/gowa-v1.1.0.apk`](releases/v1.1.0/gowa-v1.1.0.apk) | 1.06 MB | Rilis perdana native Android wrapper |

Dokumentasi lengkap dan checksum SHA256 dapat dilihat di [RELEASES.md](RELEASES.md).

## Instalasi

Unduh berkas `gowa.apk` dari direktori rilis atau pasang melalui ADB:

```bash
adb install gowa.apk
```

## Membangun dari Sumber

Prasyarat:
- Node.js >= 18
- Android SDK Build-Tools (AAPT2, D8, ZipAlign, APKSigner)
- JDK 8 atau lebih baru

Jalankan perintah build:

```bash
npm install
npm run build
```

Berkas APK bertanda tangan akan otomatis dibuat di berkas `gowa.apk`.
