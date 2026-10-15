import {
  Activity,
  BookMarked,
  BookOpen,
  Brain,
  Calculator,
  Calendar,
  CalendarClock,
  Camera,
  CloudSun,
  Coins,
  Cpu,
  FileCode,
  FileText,
  Globe,
  HelpCircle,
  Image,
  Languages,
  Link2,
  Maximize2,
  MessageSquare,
  Mic,
  Moon,
  Music,
  Newspaper,
  QrCode,
  Quote,
  Search,
  Shield,
  Smile,
  Sparkles,
  TrendingUp,
  Truck,
  UserRoundSearch,
  Utensils,
  Zap,
} from 'lucide-react'
import type { ComponentType } from 'react'

export type BotCategory =
  | 'all'
  | 'AI & Memori'
  | 'Produktivitas'
  | 'Edukasi & Hiburan'
  | 'Utilitas'
  | 'Grup'
  | 'Sistem'

export interface BotFeature {
  id: string
  name: string
  command: string
  alias?: string
  category: 'AI & Memori' | 'Produktivitas' | 'Edukasi & Hiburan' | 'Utilitas' | 'Grup' | 'Sistem'
  provider: string
  apiStatus: string
  endpoint: string
  model?: string
  shortDesc: string
  fullDesc: string
  instruction: string
  exampleInput: string
  exampleOutput: string
  parameters: string[]
  latency: string
  autoTyping: boolean
  icon: ComponentType<{ className?: string }>
  isConfigurable: boolean
}

export interface QuoteItem {
  id: string
  quote: string
  author: string
}

export interface StoredFeatureConfig {
  command?: string
  alias?: string
  isActive?: boolean
  instruction?: string
  exampleInput?: string
  exampleOutput?: string
  autoTyping?: boolean
  custom?: Record<string, any>
}

export const DEFAULT_QUOTES: QuoteItem[] = [
  {
    id: '1',
    quote: 'Kesuksesan berawal dari langkah kecil yang konsisten setiap hari.',
    author: 'Eka Syarif',
  },
  {
    id: '2',
    quote: 'Hari ini adalah kesempatan terbaik untuk menjadi lebih baik dari kemarin.',
    author: 'Anonim',
  },
  {
    id: '3',
    quote: 'Fokus pada proses, hasil terbaik akan mengikuti dengan sendirinya.',
    author: 'Pribadi',
  },
  {
    id: '4',
    quote: 'Jangan menunggu waktu yang sempurna, mulailah sekarang dan sempurnakan jalannya.',
    author: 'Inspirasi',
  },
]

export interface FactItem {
  id: string
  category: string
  fact: string
}

export const DEFAULT_FACTS: FactItem[] = [
  {
    id: 'f1',
    category: 'sains',
    fact: 'DNA manusia jika dibentangkan dari satu sel tubuh bisa mencapai panjang sekitar 2 meter, dan jika digabungkan seluruh sel tubuh bisa mencapai jarak bolak-balik Bumi ke Matahari ratusan kali!',
  },
  {
    id: 'f2',
    category: 'hewan',
    fact: 'Gurita memiliki tiga buah jantung, sembilan otak, dan darah berwarna biru karena mengandung hemosianin.',
  },
  {
    id: 'f3',
    category: 'antariksa',
    fact: 'Satu hari di planet Venus lebih lama daripada satu tahun di planet tersebut karena rotasinya yang sangat lambat.',
  },
  {
    id: 'f4',
    category: 'tubuh',
    fact: 'Otak manusia menghasilkan daya listrik sekitar 12 hingga 25 watt saat terjaga, cukup untuk menyalakan lampu LED kecil.',
  },
  {
    id: 'f5',
    category: 'sejarah',
    fact: 'Perang tersingkat dalam sejarah terjadi antara Britania Raya dan Zanzibar pada tahun 1896, berlangsung hanya 38 menit.',
  },
  {
    id: 'f6',
    category: 'bumi',
    fact: 'Sekitar 71% permukaan Bumi tertutup air, namun lebih dari 80% lautan di dunia masih belum pernah dijelajahi manusia.',
  },
  {
    id: 'f7',
    category: 'teknologi',
    fact: 'Komputer misi Apollo 11 mendarat di Bulan pada tahun 1969 hanya memiliki RAM sebesar 4 kilobyte.',
  },
]

export const BOT_FEATURES: BotFeature[] = [
  {
    id: 'ai-chat',
    name: 'Asisten AI',
    command: '.ai <pesan>',
    alias: '/ai, percakapan langsung',
    category: 'AI & Memori',
    provider: 'Bynara API (Gratis)',
    apiStatus: 'Online • Default Mati Total',
    endpoint: 'https://router.bynara.id/v1/chat/completions',
    model: 'step-5-preview',
    shortDesc: 'Asisten percakapan cerdas (Default Mati Total, aktifkan via /boost atau /plan).',
    fullDesc:
      'Engine AI pintar model step-5-preview. Secara default berstatus Mati Total demi keamanan kuota dan kenyamanan. Wajib diaktifkan eksplisit dengan perintah /boost atau /plan. Khusus grup WhatsApp, auto-reply default nonaktif dan hanya aktif di grup yang dipilih/di-whitelist.',
    instruction:
      'Balas obrolan jika AI aktif atau di grup terpilih. Jika mati total, ingatkan aktivasi lewat /boost atau /plan.',
    exampleInput: '.ai halo kamu kenal aku gak?',
    exampleOutput: 'Halo! Iya kenal dong, kamu {nama}. Ada yang bisa kubantu?',
    parameters: [
      '<pesan> (Pertanyaan atau perintah)',
      '100 pesan riwayat chat terakhir',
      'Username WhatsApp pengirim',
    ],
    latency: '400 - 900 ms',
    autoTyping: true,
    icon: Sparkles,
    isConfigurable: true,
  },
  {
    id: 'cek-analisis',
    name: 'Cek Analisis',
    command: '.cekanalisis <teks>',
    alias: 'cek analisis, .analisis, /analisis',
    category: 'Produktivitas',
    provider: 'GOWA Engine (Resmi)',
    apiStatus: 'Aktif • Built-in',
    endpoint: 'Internal Text & Sentiment Analyzer',
    shortDesc: 'Evaluasi sentimen pesan, metrik teks, estimasi baca, dan status proteksi grup AI.',
    fullDesc:
      'Fitur menu cek analisis yang menganalisis panjang teks, jumlah kata, estimasi durasi membaca, indikasi polaritas sentimen kalimat, serta menyertakan status proteksi grup dan status AI terkini.',
    instruction:
      'Evaluasi sentimen, panjang karakter, perkiraan durasi membaca, dan laporan status bot & perlindungan grup AI.',
    exampleInput: '.cekanalisis Pelayanan bot ini sangat responsif dan memuaskan!',
    exampleOutput:
      '📊 *HASIL CEK ANALISIS*\n\n📝 *Teks:* Pelayanan bot ini sangat responsif dan memuaskan!\n📈 *Panjang:* 53 karakter (7 kata)\n⏱️ *Estimasi Baca:* ~1 detik\n💡 *Sentimen:* Positif\n\n🛡️ *Status AI Grup:* Mati Total (Whitelisted Groups Only)',
    parameters: ['<teks> (Teks kalimat yang ingin dianalisis)'],
    latency: '10 - 50 ms',
    autoTyping: false,
    icon: TrendingUp,
    isConfigurable: true,
  },
  {
    id: 'boost-ai',
    name: 'Aktivasi Boost & Plan AI',
    command: '/boost [on|off]',
    alias: '/plan, .boost, .plan',
    category: 'AI & Memori',
    provider: 'GOWA Engine (Resmi)',
    apiStatus: 'Aktif • Built-in',
    endpoint: 'Internal Activation Engine',
    shortDesc: 'Aktivasi AI & Whitelist Grup via /boost atau /plan (Default Mati Total) serta cek lisensi & kuota plan.',
    fullDesc:
      'Perintah /boost atau /plan mengaktifkan AI dan mendaftarkan grup saat ini ke whitelist agar bisa berinteraksi. Perintah /boost off atau /plan off menonaktifkan AI ke default mati total. Perintah /plan menampilkan detail paket lisensi serta status kebijakan default mati total.',
    instruction:
      'Kelola aktivasi AI dan whitelist grup dengan /boost atau /plan, dan tinjau status kebijakan keamanan mati total.',
    exampleInput: '/boost',
    exampleOutput:
      '⚡ *AI BOOST DIAKTIFKAN*\n\nStatus AI telah dinyalakan untuk sesi ini.\nAI di grup ini sekarang diizinkan berinteraksi.',
    parameters: ['[on|off] (Opsional: nyalakan atau matikan boost)'],
    latency: '10 - 50 ms',
    autoTyping: false,
    icon: Zap,
    isConfigurable: true,
  },
  {
    id: 'weather',
    name: 'Prakiraan Cuaca',
    command: '.cuaca <wilayah>',
    alias: '/cuaca, !weather',
    category: 'Produktivitas',
    provider: 'BMKG Indonesia (Resmi)',
    apiStatus: 'Aktif • Bebas Kuota',
    endpoint: 'https://api.bmkg.go.id/publik/prakiraan-cuaca',
    shortDesc: 'Prakiraan cuaca resmi BMKG hingga tingkat desa & kecamatan.',
    fullDesc:
      'Layanan data terbuka resmi BMKG (Badan Meteorologi, Klimatologi, dan Geofisika). Menyajikan prakiraan cuaca akurat hingga tingkat desa/kelurahan, kecamatan, dan kota/kabupaten tanpa API key.',
    instruction:
      'Ambil data prakiraan cuaca BMKG via nama desa, kecamatan, kota, atau kode adm4. Sajikan suhu (°C), kelembaban (%), kondisi cuaca, kecepatan/arah angin, serta waktu berikutnya dengan atribusi BMKG.',
    exampleInput: '.cuaca Torganda',
    exampleOutput:
      '🌤️ *PRAKIRAAN CUACA BMKG*\n📍 *Lokasi:* Desa Torganda, Kec. Torgamba, Labuhanbatu Selatan (Sumatera Utara)\n⏱️ *Waktu:* 2026-10-07 11:00:00\n\n🌡️ *Suhu:* 32°C\n💧 *Kelembapan:* 63%\n☁️ *Kondisi:* Cerah\n💨 *Angin:* 4.5 km/jam (E)\n☁️ *Tutupan Awan:* 46%\n\n_Sumber: BMKG_',
    parameters: ['<wilayah> (Nama desa, kecamatan, kota/kab, atau kode adm4)'],
    latency: '150 - 300 ms',
    autoTyping: false,
    icon: CloudSun,
    isConfigurable: true,
  },
  {
    id: 'news',
    name: 'Berita Terkini',
    command: '.berita <topik>',
    alias: '/berita, !news',
    category: 'Produktivitas',
    provider: 'NewsAPI / RSS Portal',
    apiStatus: 'Aktif • Siap Pakai',
    endpoint: 'https://newsapi.org/v2/top-headlines',
    shortDesc: 'Headline berita terhangat nasional, teknologi, dan bisnis.',
    fullDesc:
      'Mengambil intisari berita teraktual dari berbagai portal berita terpercaya secara berkala berdasarkan topik yang diminta pengguna.',
    instruction:
      'Ambil 3 hingga 5 ringkasan berita terkini sesuai topik yang diminta. Berikan judul berita singkat, poin ringkasan 1 kalimat, dan sumber terpercaya.',
    exampleInput: '.berita teknologi',
    exampleOutput:
      '📰 *BERITA TEKNOLOGI TERKINI*\n1. Inovasi AI Terbaru Resmi Meluncur...\n2. Perkembangan Satelit Komunikasi Nasional...',
    parameters: ['<topik> (Pilihan: nasional, teknologi, bisnis, olahraga)'],
    latency: '200 - 450 ms',
    autoTyping: false,
    icon: Newspaper,
    isConfigurable: true,
  },
  {
    id: 'directory',
    name: 'Pencarian Direktori',
    command: '.cek <nomor>',
    alias: '!info, !avatar, !bisnis',
    category: 'Produktivitas',
    provider: 'WhatsApp Core API',
    apiStatus: 'Aktif • Multi-Akun',
    endpoint: 'Account Query & Contact Lookup',
    shortDesc: 'Cek status nomor, info akun, foto profil, dan profil bisnis.',
    fullDesc:
      'Fitur lookup WhatsApp terintegrasi yang memungkinkan pengecekan nomor aktif, informasi akun pengguna, foto profil (avatar), serta profil bisnis secara instan melalui chat bot.',
    instruction:
      'Lakukan lookup pada nomor tujuan. Tampilkan status pendaftaran di WhatsApp, JID resmi, nama tampilan publik jika tersedia, foto profil, dan informasi bisnis jika terdaftar sebagai WhatsApp Business.',
    exampleInput: '.cek 6281234567890',
    exampleOutput:
      '✅ *NOMOR TERDAFTAR*\nNomor: +62 812-3456-7890\nJID: 6281234567890@s.whatsapp.net\nStatus: Aktif di WhatsApp',
    parameters: ['<nomor> (Nomor WhatsApp atau JID)'],
    latency: '100 - 300 ms',
    autoTyping: false,
    icon: UserRoundSearch,
    isConfigurable: true,
  },
  {
    id: 'quote',
    name: 'Kata Mutiara',
    command: '.quote',
    alias: '/quote',
    category: 'Produktivitas',
    provider: 'Database Kata Bijak',
    apiStatus: 'Aktif • Database Lokal',
    endpoint: 'Internal Quote Database',
    shortDesc: 'Kutipan motivasi dan kata bijak dari database.',
    fullDesc:
      'Fitur penyemangat harian yang menyajikan kutipan motivasi dan kata mutiara yang tersimpan di dalam database bot secara acak dan instan.',
    instruction:
      'Pilih satu kata mutiara secara acak dari database quote. Format dengan rapi menggunakan tanda petik dan sertakan nama pembuat kutipan di baris baru.',
    exampleInput: '.quote',
    exampleOutput:
      '✨ *KATA BIJAK HARI INI:*\n\n"Kesuksesan berawal dari langkah kecil yang konsisten setiap hari."\n— Eka Syarif',
    parameters: ['Tanpa parameter'],
    latency: '< 15 ms',
    autoTyping: false,
    icon: Quote,
    isConfigurable: true,
  },
  {
    id: 'supermemory',
    name: 'Supermemory Engine',
    command: 'Otomatis via AI',
    alias: 'Persistent Memory Hub',
    category: 'AI & Memori',
    provider: 'Supermemory API (Gratis)',
    apiStatus: 'Terhubung • Free Tier',
    endpoint: 'https://api.supermemory.ai/v4/search',
    model: 'Vector Memory & Graph Context',
    shortDesc: 'Memori jangka panjang untuk mengingat preferensi dan fakta pengguna.',
    fullDesc:
      'Layanan memori persisten modern berbasis Supermemory API. Setiap percakapan pengguna diisolasi rapi menggunakan containerTag per-user untuk menjaga kesinambungan ingatan AI.',
    instruction:
      'Simpan fakta penting, preferensi, riwayat topik pembicaraan pengguna ke Supermemory secara asinkron. Panggil memori saat pengguna menanyakan hal masa lalu.',
    exampleInput: '.ai kemarin aku cerita kerja di mana ya?',
    exampleOutput:
      'Kemarin kamu cerita kerja di bidang jaringan IT! Masih ada yang mau dibahas?',
    parameters: ['containerTag: user_<sender_jid>'],
    latency: '150 - 350 ms',
    autoTyping: false,
    icon: Brain,
    isConfigurable: true,
  },
  {
    id: 'calc',
    name: 'Kalkulator',
    command: '.calc <ekspresi>',
    alias: '/calc <hitungan>',
    category: 'Produktivitas',
    provider: 'Math Engine',
    apiStatus: 'Online • Bebas Kuota',
    endpoint: 'Internal Math Evaluator',
    shortDesc: 'Menghitung rumus matematika secara cepat dan tepat.',
    fullDesc:
      'Layanan kalkulasi pintar yang mampu mengevaluasi perhitungan matematika, persentase, konversi unit, dan operasi logika dengan hasil yang ringkas.',
    instruction:
      'Hitung ekspresi matematika dengan teliti dan benar. Tampilkan hasil perhitungan akhir secara to the point tanpa penjelasan bertele-tele kecuali diminta.',
    exampleInput: '.calc (150000 * 0.12) + 25000',
    exampleOutput: '🔢 *Hasil Hitung ((150000 * 0.12) + 25000):*\n43.000',
    parameters: ['<ekspresi> (Ekspresi aritmatika seperti tambah, kurang, persen)'],
    latency: '< 20 ms',
    autoTyping: false,
    icon: Calculator,
    isConfigurable: true,
  },
  {
    id: 'ping',
    name: 'Latensi (Ping)',
    command: '.ping',
    alias: '/ping',
    category: 'Sistem',
    provider: 'WhatsMeow Engine',
    apiStatus: 'Aktif • Internal',
    endpoint: 'Local WebSocket Handler',
    shortDesc: 'Mengukur kecepatan respon pemrosesan pesan bot secara real-time.',
    fullDesc:
      'Perintah diagnostik untuk mengukur latensi round-trip antara penerimaan pesan masuk hingga respon keluar terkirim.',
    instruction:
      'Balas seketika dengan kata Pong dan sertakan durasi latensi dalam milidetik (ms).',
    exampleInput: '.ping',
    exampleOutput: 'Pong! 🏓 Kecepatan respon: 18 ms',
    parameters: ['Tanpa parameter'],
    latency: '< 25 ms',
    autoTyping: false,
    icon: Zap,
    isConfigurable: true,
  },
  {
    id: 'antilink',
    name: 'Moderasi Anti-Link',
    command: 'Otomatis di Grup',
    alias: 'Group Shield',
    category: 'Grup',
    provider: 'WhatsMeow Group Admin',
    apiStatus: 'Aktif • Realtime',
    endpoint: 'Internal Group Moderation',
    shortDesc: 'Menghapus tautan mencurigakan otomatis saat bot menjadi admin grup.',
    fullDesc:
      'Sistem keamanan grup otomatis yang memindai tautan WhatsApp, wa.me, dan URL ilegal. Pesan dari non-admin akan ditarik seketika.',
    instruction:
      'Periksa apakah pesan masuk di grup mengandung tautan website atau undangan WhatsApp. Jika pengirim bukan admin, tarik pesan seketika dan berikan peringatan singkat.',
    exampleInput: 'Anggota mengirimkan link grup lain',
    exampleOutput: 'Pesan ditarik otomatis (revoke) oleh bot.',
    parameters: ['Izin Admin grup'],
    latency: '< 30 ms',
    autoTyping: false,
    icon: Shield,
    isConfigurable: true,
  },
  {
    id: 'welcome-farewell',
    name: 'Sambutan & Pamitan',
    command: 'Otomatis di Grup',
    alias: 'Welcome & Farewell',
    category: 'Grup',
    provider: 'WhatsMeow Event Listener',
    apiStatus: 'Aktif • Realtime',
    endpoint: 'Group Participant Event',
    shortDesc: 'Menyapa anggota baru atau pamitan saat anggota keluar dari grup.',
    fullDesc:
      'Pesan sambutan dan perpisahan otomatis dengan kustomisasi template dinamis ({name} untuk nama dan {group} untuk nama grup).',
    instruction:
      'Kirim pesan sambutan ramah saat anggota baru bergabung ke grup. Kirim ucapan pamit saat anggota keluar.',
    exampleInput: 'Peserta bergabung ke dalam grup',
    exampleOutput:
      'Selamat datang {name} di grup {group}! Silakan baca peraturan grup ya.',
    parameters: ['Variabel: {name}, {group}'],
    latency: '< 40 ms',
    autoTyping: false,
    icon: MessageSquare,
    isConfigurable: true,
  },
  {
    id: 'scheduler',
    name: 'Pesan Terjadwal',
    command: 'Form Terjadwal',
    alias: 'Smart 24h Scheduler',
    category: 'Produktivitas',
    provider: 'SQLite Worker (WIB)',
    apiStatus: 'Aktif • Background',
    endpoint: 'Internal Scheduler Cron & Worker',
    shortDesc: 'Mengirim pesan terjadwal otomatis dengan zona waktu 24 jam WIB.',
    fullDesc:
      'Sistem penjadwalan pesan berbasis waktu 24 jam dan zona waktu permanen Asia/Jakarta (WIB) dengan pengulangan fleksibel.',
    instruction:
      'Pantau antrian pesan terjadwal di SQLite. Eksekusi pengiriman tepat pada waktu yang ditentukan dengan zona Asia/Jakarta (WIB).',
    exampleInput: 'Jadwalkan pesan jam 14:30',
    exampleOutput: 'Pesan terkirim tepat waktu ke penerima yang ditentukan.',
    parameters: ['Format waktu 24 Jam (00-23 : 00-59)'],
    latency: 'Tepat Waktu',
    autoTyping: false,
    icon: CalendarClock,
    isConfigurable: true,
  },
  {
    id: 'earthquake',
    name: 'Gempa Terkini (BMKG)',
    command: '.gempa',
    alias: '/gempa, !info-gempa',
    category: 'Produktivitas',
    provider: 'BMKG Open Data (Resmi)',
    apiStatus: 'Aktif • Bebas Kuota',
    endpoint: 'https://data.bmkg.go.id/DataMKG/TEWS/autogempa.json',
    shortDesc: 'Info realtime gempa bumi terkini dan magnitudo 5.0+ dari BMKG.',
    fullDesc:
      'Data resmi sistem peringatan dini gempa bumi & tsunami (TEWS) BMKG. Menyajikan magnitudo, kedalaman, pusat koordinat, waktu gempa, dan potensi tsunami secara akurat.',
    instruction:
      'Ambil data autogempa BMKG terbaru. Sajikan magnitudo, kedalaman, wilayah episentrum, waktu getaran, serta status peringatan potensi tsunami.',
    exampleInput: '.gempa',
    exampleOutput:
      '🔴 *INFO GEMPA TERKINI (BMKG)*\n\nMagnitudo: 5.2 SR\nKedalaman: 10 km\nLokasi: 45 km Barat Daya Luwuk, Banggai\nWaktu: 07 Okt 2026 10:15 WIB\nPotensi: Tidak berpotensi tsunami\n\n_Sumber: BMKG (TEWS)_',
    parameters: ['Tanpa parameter'],
    latency: '100 - 250 ms',
    autoTyping: false,
    icon: Activity,
    isConfigurable: true,
  },
  {
    id: 'kbbi',
    name: 'Kamus KBBI',
    command: '.kbbi <kata>',
    alias: '/kbbi, !arti',
    category: 'Produktivitas',
    provider: 'Kemendikbud Open API',
    apiStatus: 'Aktif • Bebas Kuota',
    endpoint: 'https://kbbi-api-amm.vercel.app/search?q={kata}',
    shortDesc: 'Pencarian definisi, lema, dan arti kata resmi sesuai KBBI.',
    fullDesc:
      'Layanan leksikografi digital terhubung dengan perbendaharaan kata resmi Kamus Besar Bahasa Indonesia (KBBI). Menyajikan kelas kata (nomina, verba, adjektiva) dan definisi baku.',
    instruction:
      'Cari definisi kata dalam KBBI. Tampilkan lema baku, kelas kata, dan arti formal kata tersebut secara ringkas dan rapi.',
    exampleInput: '.kbbi sangkil',
    exampleOutput: '📖 *KAMUS KBBI: SANGKIL*\n\n[a] berdaya guna; efisien; kena pada sasarannya.',
    parameters: ['<kata> (Kata dasar atau turunan)'],
    latency: '150 - 300 ms',
    autoTyping: false,
    icon: BookOpen,
    isConfigurable: true,
  },
  {
    id: 'wiki',
    name: 'Wikipedia Ringkas',
    command: '.wiki <topik>',
    alias: '/wiki, !wikipedia',
    category: 'Produktivitas',
    provider: 'Wikimedia REST API',
    apiStatus: 'Aktif • Bebas Kuota',
    endpoint: 'https://id.wikipedia.org/api/rest_v1/page/summary/{title}',
    shortDesc: 'Ensiklopedia kilat dan ringkasan pengetahuan umum Wikipedia.',
    fullDesc:
      'Mengambil intisari pengetahuan ensiklopedia resmi Wikipedia bahasa Indonesia. Menampilkan ringkasan esensial 1-2 paragraf mengenai tokoh, sains, sejarah, dan peristiwa.',
    instruction:
      'Ambil ringkasan artikel dari Wikipedia bahasa Indonesia. Sajikan judul, paragraf penjelasan utama, dan tautan baca selengkapnya.',
    exampleInput: '.wiki Teori Relativitas',
    exampleOutput:
      '📚 *WIKIPEDIA: Teori Relativitas*\n\nTeori relativitas adalah dua teori fisika yang dikemukakan oleh Albert Einstein...\n\n_Baca: https://id.wikipedia.org/wiki/Teori_relativitas_',
    parameters: ['<topik> (Nama tokoh, konsep sains, negara, peristiwa)'],
    latency: '200 - 400 ms',
    autoTyping: false,
    icon: Globe,
    isConfigurable: true,
  },
  {
    id: 'translate',
    name: 'Terjemahan Bahasa',
    command: '.tr <kode_tujuan> <teks>',
    alias: '!translate, /tr',
    category: 'Produktivitas',
    provider: 'Google Translate Engine',
    apiStatus: 'Aktif • Bebas Kuota',
    endpoint: 'https://translate.googleapis.com/translate_a/single',
    shortDesc: 'Terjemahkan teks antar lebih dari 100 bahasa dunia secara instan.',
    fullDesc:
      'Mesin penerjemah instan multi-bahasa yang mendukung deteksi bahasa asal otomatis dan menerjemahkannya ke bahasa target yang diinginkan.',
    instruction:
      'Deteksi bahasa kalimat sumber, lalu terjemahkan ke bahasa sasaran (default: id/en). Berikan hasil langsung tanpa basa-basi.',
    exampleInput: '.tr en Selamat pagi kawan, apa kabarmu?',
    exampleOutput: '🌐 *TERJEMAHAN (EN)*\n\nGood morning friend, how are you?',
    parameters: ['<kode_tujuan> (id, en, ar, ja, zh)', '<teks> (Kalimat)'],
    latency: '150 - 350 ms',
    autoTyping: false,
    icon: Languages,
    isConfigurable: true,
  },
  {
    id: 'quran',
    name: 'Al-Qur’an & Tafsir',
    command: '.quran <surah:ayat>',
    alias: '/quran, !ayat',
    category: 'Produktivitas',
    provider: 'Kemenag RI Open API',
    apiStatus: 'Aktif • Bebas Kuota',
    endpoint: 'https://equran.id/api/v2/surat/{nomor}',
    shortDesc: 'Menampilkan ayat Al-Qur’an dalam teks Arab, latin, dan terjemahan.',
    fullDesc:
      'Koleksi 114 Surah Al-Qur’an lengkap dengan teks mushaf rasm Utsmani, transliterasi huruf latin, serta terjemahan resmi Kementerian Agama Republik Indonesia.',
    instruction:
      'Ambil ayat sesuai nomor surah dan ayat yang diminta (contoh: 1:1 atau 2:255). Tampilkan lafaz Arab, latin, dan arti bahasa Indonesia.',
    exampleInput: '.quran 1:1',
    exampleOutput:
      '📖 *QS. Al-Fatihah : Ayat 1*\n\nبِسْمِ اللّٰهِ الرَّحْمٰنِ الرَّحِيْمِ\n_Bismillāhir-raḥmānir-raḥīm_\n\n"Dengan nama Allah Yang Maha Pengasih, Maha Penyayang."',
    parameters: ['<surah:ayat> (Format: nomor_surah:nomor_ayat)'],
    latency: '120 - 280 ms',
    autoTyping: false,
    icon: BookMarked,
    isConfigurable: true,
  },
  {
    id: 'prayer-time',
    name: 'Jadwal Sholat Kemenag',
    command: '.sholat <kota>',
    alias: '/sholat, !jadwalsholat',
    category: 'Produktivitas',
    provider: 'MyQuran (Bimas Islam)',
    apiStatus: 'Aktif • Bebas Kuota',
    endpoint: 'https://api.myquran.com/v2/sholat',
    shortDesc: 'Jadwal waktu sholat 5 waktu & Imsak harian seluruh Indonesia.',
    fullDesc:
      'Perhitungan waktu sholat presisi harian mengacu pada data hisab Kementerian Agama RI untuk seluruh kota dan kabupaten di Indonesia.',
    instruction:
      'Ambil jadwal sholat hari ini untuk kota yang diminta. Tampilkan waktu Imsak, Subuh, Terbit, Dhuha, Dzuhur, Ashar, Maghrib, dan Isya.',
    exampleInput: '.sholat Jakarta',
    exampleOutput:
      '🕌 *JADWAL SHOLAT JAKARTA*\n📅 Rabu, 07 Okt 2026\n\n• Imsak: 04:15 WIB\n• Subuh: 04:25 WIB\n• Dzuhur: 11:47 WIB\n• Ashar: 14:52 WIB\n• Maghrib: 17:52 WIB\n• Isya: 19:01 WIB',
    parameters: ['<kota> (Nama kota atau kabupaten)'],
    latency: '150 - 300 ms',
    autoTyping: false,
    icon: Moon,
    isConfigurable: true,
  },
  {
    id: 'daily-dua',
    name: 'Doa Harian Muslim',
    command: '.doa <nama_doa>',
    alias: '/doa, !kumpurandoa',
    category: 'Produktivitas',
    provider: 'Open Islamic Library',
    apiStatus: 'Aktif • Bebas Kuota',
    endpoint: 'https://open-api.my.id/api/doa',
    shortDesc: 'Kumpulan doa-doa harian lengkap lafaz Arab, latin, dan artinya.',
    fullDesc:
      'Database lebih dari 100 doa harian Islam, mulai dari doa bangun tidur, sebelum makan, keluar rumah, keselamatan dunia akhirat, hingga doa orang tua.',
    instruction:
      'Cari doa harian berdasarkan kata kunci yang dicari. Tampilkan judul doa, teks Arab, latin, dan terjemahan bahasa Indonesia.',
    exampleInput: '.doa keluar rumah',
    exampleOutput:
      '🤲 *DOA KELUAR RUMAH*\n\nبِسْمِ اللَّهِ تَوَكَّلْتُ عَلَى اللَّهِ\n_Bismillāhi tawakkaltu \'alallāh_\n\n"Dengan nama Allah, aku berserah diri kepada Allah."',
    parameters: ['<nama_doa> (Kata kunci nama doa)'],
    latency: '80 - 200 ms',
    autoTyping: false,
    icon: BookOpen,
    isConfigurable: true,
  },
  {
    id: 'currency',
    name: 'Konversi Kurs Valas',
    command: '.kurs <jumlah> <asal> <tujuan>',
    alias: '/kurs, !valas',
    category: 'Produktivitas',
    provider: 'ExchangeRate-API Open Data',
    apiStatus: 'Aktif • Bebas Kuota',
    endpoint: 'https://open.er-api.com/v6/latest/{base}',
    shortDesc: 'Konversi nilai tukar mata uang asing real-time (USD, IDR, EUR, SGD).',
    fullDesc:
      'Layanan kalkulasi kurs mata uang global real-time dengan update harian dari bank sentral internasional.',
    instruction:
      'Hitung konversi nilai tukar mata uang dari mata uang asal ke tujuan berdasarkan kurs spot terbaru.',
    exampleInput: '.kurs 100 USD IDR',
    exampleOutput:
      '💵 *KONVERSI KURS VALAS*\n\n100 USD = Rp 1.585.000 IDR\n_Kurs: 1 USD = Rp 15.850 IDR_',
    parameters: ['<jumlah>', '<asal> (USD, IDR, EUR, SGD, JPY)', '<tujuan>'],
    latency: '120 - 250 ms',
    autoTyping: false,
    icon: Coins,
    isConfigurable: true,
  },
  {
    id: 'crypto',
    name: 'Harga Aset Kripto',
    command: '.crypto <koin>',
    alias: '/crypto, !koin, !btc',
    category: 'Produktivitas',
    provider: 'CoinGecko Free API',
    apiStatus: 'Aktif • Bebas Kuota',
    endpoint: 'https://api.coingecko.com/api/v3/simple/price',
    shortDesc: 'Cek harga Bitcoin, Ethereum, Solana, dan koin kripto global.',
    fullDesc:
      'Informasi market harga crypto aset teraktual langsung dari pasar global CoinGecko tanpa memerlukan API key.',
    instruction:
      'Ambil harga spot kripto terkini beserta perubahan harga 24 jam terakhir dalam mata uang IDR dan USD.',
    exampleInput: '.crypto btc',
    exampleOutput:
      '🪙 *BITCOIN (BTC)*\n\nHarga (IDR): Rp 1.085.000.000\nHarga (USD): $68.500\nPerubahan 24j: +2.85% 📈',
    parameters: ['<koin> (btc, eth, sol, bnb, xrp, doge)'],
    latency: '150 - 350 ms',
    autoTyping: false,
    icon: TrendingUp,
    isConfigurable: true,
  },
  {
    id: 'receipt-tracking',
    name: 'Lacak Resi Ekspedisi',
    command: '.resi <kurir> <nomor_resi>',
    alias: '/resi, !lacak',
    category: 'Produktivitas',
    provider: 'Multi-Courier Tracker',
    apiStatus: 'Aktif • Siap Pakai',
    endpoint: 'Internal Courier Parser',
    shortDesc: 'Lacak status paket pengiriman JNE, J&T, SiCepat, Pos, SPX.',
    fullDesc:
      'Layanan pemantauan pengiriman paket belanja online dan ekspedisi logistik domestik secara real-time.',
    instruction:
      'Cari status pengiriman nomor resi pada ekspedisi yang ditentukan. Tampilkan status terakhir, lokasi paket, dan riwayat perjalanan.',
    exampleInput: '.resi jne JP1234567890',
    exampleOutput:
      '📦 *STATUS PENGIRIMAN (JNE)*\nNo. Resi: JP1234567890\nStatus: ON PROCESS\nPenerima: Eka Syarif\nPosisi: Hub Jakarta Selatan',
    parameters: ['<kurir> (jne, jnt, sicepat, pos, spx)', '<nomor_resi>'],
    latency: '250 - 500 ms',
    autoTyping: false,
    icon: Truck,
    isConfigurable: true,
  },
  {
    id: 'shipping-cost',
    name: 'Cek Ongkos Kirim',
    command: '.ongkir <asal> <tujuan> <berat>',
    alias: '/ongkir, !tarif',
    category: 'Produktivitas',
    provider: 'Domestic Shipping Matrix',
    apiStatus: 'Aktif • Siap Pakai',
    endpoint: 'Domestic Shipping Matrix API',
    shortDesc: 'Cek perkiraan tarif pengiriman barang antar kota di Indonesia.',
    fullDesc:
      'Kalkulasi tarif pengiriman paket reguler, kilat, dan kargo dari berbagai kurir ternama Indonesia berdasarkan kota asal, tujuan, dan berat timbangan.',
    instruction:
      'Hitung estimasi ongkos kirim dari kota asal ke kota tujuan untuk berat barang yang ditentukan.',
    exampleInput: '.ongkir Jakarta Bandung 1000',
    exampleOutput:
      '🚚 *TARIF ONGKIR (1.000g)*\nJakarta ➔ Bandung:\n\n• JNE REG: Rp 11.000 (1-2 hari)\n• J&T EZ: Rp 12.000 (1-2 hari)\n• SiCepat: Rp 11.500 (1 hari)',
    parameters: ['<asal>', '<tujuan>', '<berat> (Gram)'],
    latency: '200 - 450 ms',
    autoTyping: false,
    icon: Truck,
    isConfigurable: true,
  },
  {
    id: 'ip-lookup',
    name: 'Lookup IP Geolocation',
    command: '.ip <ip_address>',
    alias: '/ip, !geo',
    category: 'Utilitas',
    provider: 'IP-API Open Tier',
    apiStatus: 'Aktif • Bebas Kuota',
    endpoint: 'http://ip-api.com/json/{ip}',
    shortDesc: 'Deteksi negara, kota, ISP, dan zona waktu dari alamat IP publik.',
    fullDesc:
      'Alat diagnostik jaringan untuk menelusuri lokasi geografis, nama operator penyedia internet (ISP), nomor AS, dan koordinat IP publik.',
    instruction:
      'Ambil data geolokasi dari alamat IP publik yang dimasukkan. Sajikan negara, kota, ISP, AS Number, dan zona waktu.',
    exampleInput: '.ip 103.253.213.185',
    exampleOutput:
      '🌐 *IP GEOLOCATION*\nIP: 103.253.213.185\nNegara: Indonesia 🇮🇩\nKota: Jakarta\nISP: Cyberindo Mega Persada\nTimezone: Asia/Jakarta',
    parameters: ['<ip_address> (IPv4 publik)'],
    latency: '80 - 180 ms',
    autoTyping: false,
    icon: Cpu,
    isConfigurable: true,
  },
  {
    id: 'qr-code',
    name: 'Pembuat QR Code',
    command: '.qr <teks_atau_link>',
    alias: '/qr, !qrcode',
    category: 'Utilitas',
    provider: 'QR Server Free API',
    apiStatus: 'Aktif • Bebas Kuota',
    endpoint: 'https://api.qrserver.com/v1/create-qr-code/',
    shortDesc: 'Hasilkan gambar QR Code instan dari teks, nomor, atau tautan website.',
    fullDesc:
      'Mengonversi teks bebas, nomor rekening, alamat situs web, atau string konfigurasi menjadi gambar barcode QR Code berkualitas tinggi yang siap dipindai smartphone.',
    instruction:
      'Buat gambar barcode QR code dari string atau link URL yang diberikan, lalu kirimkan gambarnya langsung ke obrolan.',
    exampleInput: '.qr https://google.com',
    exampleOutput: '[Gambar QR Code Terkirim Otomatis]',
    parameters: ['<teks_atau_link> (Teks atau URL)'],
    latency: '150 - 300 ms',
    autoTyping: false,
    icon: QrCode,
    isConfigurable: true,
  },
  {
    id: 'shortlink',
    name: 'Pemendek Tautan',
    command: '.short <url>',
    alias: '/short, !tinyurl, !isgd',
    category: 'Utilitas',
    provider: 'TinyURL / is.gd Open API',
    apiStatus: 'Aktif • Bebas Kuota',
    endpoint: 'https://tinyurl.com/api-create.php',
    shortDesc: 'Persingkat tautan URL yang panjang menjadi link pendek yang rapi.',
    fullDesc:
      'Layanan pemendek URL instan tanpa akun untuk merapikan tautan promosi, dokumen, atau link grup agar mudah disebarkan.',
    instruction:
      'Kirim URL panjang ke provider tinyurl/isgd. Balas seketika dengan tautan pendek yang sudah dipadatkan.',
    exampleInput: '.short https://contoh-link-panjang.com/artikel?id=123',
    exampleOutput: '🔗 *LINK DIPENDEKKAN:*\nhttps://tinyurl.com/xyz123',
    parameters: ['<url> (Tautan website valid)'],
    latency: '150 - 300 ms',
    autoTyping: false,
    icon: Link2,
    isConfigurable: true,
  },
  {
    id: 'whois-domain',
    name: 'Whois & Cek Domain',
    command: '.whois <nama_domain>',
    alias: '/whois, !dns',
    category: 'Utilitas',
    provider: 'RDAP / DNS Engine',
    apiStatus: 'Aktif • Bebas Kuota',
    endpoint: 'https://dns.google/resolve',
    shortDesc: 'Periksa status pendaftaran domain, nameserver, dan IP hosting.',
    fullDesc:
      'Fitur audit domain web untuk memeriksa masa aktif domain, registrar, nameserver DNS, dan rekaman IP Address A/CNAME.',
    instruction:
      'Cari informasi DNS dan status registrasi domain. Tampilkan status aktif, alamat IP server, dan nameserver aktif.',
    exampleInput: '.whois google.com',
    exampleOutput:
      '🌐 *INFORMASI DOMAIN: google.com*\n\nStatus: Terdaftar & Aktif\nIP Address: 142.250.190.46\nNameserver: ns1.google.com, ns2.google.com',
    parameters: ['<nama_domain> (Contoh: google.com, portal.id)'],
    latency: '120 - 250 ms',
    autoTyping: false,
    icon: Search,
    isConfigurable: true,
  },
  {
    id: 'holidays',
    name: 'Hari Libur Nasional',
    command: '.libur',
    alias: '/libur, !harilibur, !kalender',
    category: 'Produktivitas',
    provider: 'Kalender Nasional Open API',
    apiStatus: 'Aktif • Bebas Kuota',
    endpoint: 'https://api-harilibur.vercel.app/api',
    shortDesc: 'Daftar tanggal merah dan cuti bersama resmi pemerintah tahun ini.',
    fullDesc:
      'Jadwal resmi hari libur nasional dan cuti bersama berdasarkan SKB 3 Menteri terbaru. Membantu pengguna merencanakan cuti dan liburan.',
    instruction:
      'Ambil daftar hari libur nasional dan cuti bersama bulan ini atau berikutnya. Sajikan tanggal, hari, dan nama peringatan hari libur.',
    exampleInput: '.libur',
    exampleOutput:
      '📅 *HARI LIBUR NASIONAL TERDEKAT:*\n\n• 25 Des 2026: Hari Raya Natal\n• 26 Des 2026: Cuti Bersama Natal\n• 01 Jan 2027: Tahun Baru Masehi',
    parameters: ['Tanpa parameter'],
    latency: '80 - 190 ms',
    autoTyping: false,
    icon: Calendar,
    isConfigurable: true,
  },
  {
    id: 'pantun',
    name: 'Pantun Nusantara',
    command: '.pantun',
    alias: '/pantun, !puisi',
    category: 'Edukasi & Hiburan',
    provider: 'Database Sastra Lokal',
    apiStatus: 'Aktif • Internal',
    endpoint: 'Internal Literature Database',
    shortDesc: 'Kumpulan pantun jenaka, pantun nasehat, dan pantun gombal santai.',
    fullDesc:
      'Karya sastra klasik pantun 4 baris berima a-b-a-b yang menyajikan hiburan ringan, humor segar, dan petuah bijak adat melayu nusantara.',
    instruction:
      'Pilih satu pantun secara acak dari database sastra pantun. Format baris bait 1-4 secara rapi.',
    exampleInput: '.pantun',
    exampleOutput:
      '📜 *PANTUN HARI INI:*\n\nBeli pulsa di toko Pak Rahmat,\nPulang ke rumah disambut senyuman.\nAwali hari dengan semangat,\nSemoga sukses dalam genggaman.',
    parameters: ['Tanpa parameter'],
    latency: '< 15 ms',
    autoTyping: false,
    icon: Smile,
    isConfigurable: true,
  },
  {
    id: 'tebak-gambar',
    name: 'Game Tebak Gambar',
    command: '.tebakgambar',
    alias: '/tebakgambar, !tebak',
    category: 'Edukasi & Hiburan',
    provider: 'Game Puzzle Engine',
    apiStatus: 'Aktif • Internal',
    endpoint: 'Internal Quiz & Riddle Dataset',
    shortDesc: 'Tebak susunan kata dari teka-teki petunjuk gambar interaktif.',
    fullDesc:
      'Permainan asah imajinasi tebak gambar khas Indonesia. Mengirim petunjuk teka-teki dan menantang pemain untuk menebak susunan kosakata yang tepat.',
    instruction:
      'Kirimkan soal teka-teki tebak gambar beserta petunjuk huruf. Simpan kunci jawaban untuk divalidasi saat pengguna membalas.',
    exampleInput: '.tebakgambar',
    exampleOutput:
      '🧩 *TEBAK GAMBAR*\n\nPetunjuk: [Batu + Api]\nClue: B _ _ _   A _ _\n\n_Ketik jawabanmu untuk menebak!_',
    parameters: ['Tanpa parameter'],
    latency: '< 20 ms',
    autoTyping: false,
    icon: HelpCircle,
    isConfigurable: true,
  },
  {
    id: 'brain-teaser',
    name: 'Kuis Asah Otak',
    command: '.asahotak',
    alias: '/asahotak, !kuis',
    category: 'Edukasi & Hiburan',
    provider: 'Trivia Knowledge Base',
    apiStatus: 'Aktif • Internal',
    endpoint: 'Internal Trivia Knowledge Base',
    shortDesc: 'Uji wawasan dan ketajaman logika dengan pertanyaan trivia pilihan.',
    fullDesc:
      'Bank soal asah otak, logika matematika ringan, dan pertanyaan pengetahuan umum untuk mencairkan suasana obrolan di grup maupun personal chat.',
    instruction:
      'Tampilkan 1 pertanyaan trivia atau logika unik. Sediakan pilihan bantuan atau clue jika diminta.',
    exampleInput: '.asahotak',
    exampleOutput:
      '🧠 *KUIS ASAH OTAK:*\n\nApa yang selalu datang tapi tidak pernah tiba?\n\n_Balas pesan ini dengan jawabanmu!_',
    parameters: ['Tanpa parameter'],
    latency: '< 15 ms',
    autoTyping: false,
    icon: Sparkles,
    isConfigurable: true,
  },
  {
    id: 'facts',
    name: 'Fakta Unik Dunia',
    command: '.fakta <topik>',
    alias: '/fakta, !tahukahkamu',
    category: 'Edukasi & Hiburan',
    provider: 'Database Fakta Lokal & Terjemahan Otomatis',
    apiStatus: 'Aktif • Bebas Kuota & Offline',
    endpoint: 'Internal Database + Google Translate',
    shortDesc: 'Fakta unik sains, hewan, antariksa, dan sejarah berbahasa Indonesia.',
    fullDesc:
      'Koleksi fakta unik dunia terlengkap dalam bahasa Indonesia. Mendukung pencarian topik (sains, hewan, antariksa, tubuh, sejarah, bumi, teknologi) serta terjemahan otomatis.',
    instruction:
      'Sajikan fakta unik berbahasa Indonesia sesuai topik yang diminta secara ringkas dan informatif.',
    exampleInput: '.fakta sains',
    exampleOutput:
      '💡 *TAHUKAH KAMU? (FAKTA UNIK)*\n🏷️ *Kategori:* SAINS\n\n"DNA manusia jika dibentangkan dari satu sel tubuh bisa mencapai panjang sekitar 2 meter, dan jika digabungkan seluruh sel tubuh bisa mencapai jarak bolak-balik Bumi ke Matahari ratusan kali!"\n\n_Sumber: Genetika_',
    parameters: ['<topik> (Pilihan: sains, hewan, antariksa, tubuh, sejarah, bumi, teknologi)'],
    latency: '< 10 ms',
    autoTyping: false,
    icon: BookOpen,
    isConfigurable: true,
  },
  {
    id: 'zodiac',
    name: 'Horoskop Zodiak',
    command: '.zodiak <nama_bintang>',
    alias: '/zodiak, !bintang',
    category: 'Edukasi & Hiburan',
    provider: 'Horoscope Engine',
    apiStatus: 'Aktif • Internal',
    endpoint: 'Internal Astrological Insights',
    shortDesc: 'Karakteristik, peruntungan harian, dan angka keberuntungan zodiak.',
    fullDesc:
      'Ulasan astrologi ringan mengenai sifat bawaan, energi positif, peruntungan karir, asmara, dan angka hoki untuk 12 lambang rasi bintang zodiak.',
    instruction:
      'Ambil profil ramalan bintang untuk zodiak yang diminta (contoh: aries, leo, scorpio). Sajikan ramalan karir, asmara, dan angka hoki.',
    exampleInput: '.zodiak scorpio',
    exampleOutput:
      '♏ *ZODIAK SCORPIO (23 Okt - 21 Nov)*\n\n• Karir: Fokusmu sedang di puncak, selesaikan target tertunda.\n• Asmara: Komunikasi terbuka akan menghangatkan suasana.\n• Angka Keberuntungan: 7, 19, 28',
    parameters: ['<nama_bintang> (Aries, Taurus, Gemini, Cancer, Leo, Virgo, Libra, Scorpio, Sagitarius, Capricorn, Aquarius, Pisces)'],
    latency: '< 20 ms',
    autoTyping: false,
    icon: Sparkles,
    isConfigurable: true,
  },
  {
    id: 'recipe',
    name: 'Resep Masakan',
    command: '.resep <nama_makanan>',
    alias: '/resep, !masak',
    category: 'Edukasi & Hiburan',
    provider: 'Culinary Recipe Base',
    apiStatus: 'Aktif • Internal',
    endpoint: 'Internal Culinary Knowledge Base',
    shortDesc: 'Bahan bumbu dapur dan panduan langkah memasak hidangan favorit.',
    fullDesc:
      'Koleksi resep masakan rumahan, kuliner tradisional nusantara, dan minuman segar lengkap dengan takaran bahan bumbu serta langkah memasak praktis.',
    instruction:
      'Cari resep makanan yang diminta. Tampilkan bahan-bahan yang dibutuhkan dan nomor langkah pengolahannya secara terstruktur.',
    exampleInput: '.resep nasi goreng kampung',
    exampleOutput:
      '🍳 *RESEP NASI GORENG KAMPUNG*\n\nBahan:\n• 1 piring nasi dingin\n• 3 siung bawang merah\n• 2 siung bawang putih & cabai rawit\n• 1 butir telur & terasi secukupnya\n\nCara Memasak:\n1. Tumis bumbu halus hingga harum...\n2. Masukkan telur, orak-arik...\n3. Masukkan nasi dan aduk merata.',
    parameters: ['<nama_makanan> (Nama hidangan atau lauk)'],
    latency: '< 25 ms',
    autoTyping: false,
    icon: Utensils,
    isConfigurable: true,
  },
  {
    id: 'lyrics',
    name: 'Pencarian Lirik Lagu',
    command: '.lirik <judul_lagu>',
    alias: '/lirik, !song',
    category: 'Edukasi & Hiburan',
    provider: 'Open Lyrics Database',
    apiStatus: 'Aktif • Bebas Kuota',
    endpoint: 'https://api.lyrics.ovh/v1/{artist}/{title}',
    shortDesc: 'Temukan bait lirik lagu Indonesia dan mancanegara secara lengkap.',
    fullDesc:
      'Mesin pencari teks lirik lagu dari berbagai genre musik, musisi tanah air, hingga artis internasional secara cepat.',
    instruction:
      'Cari lirik lagu dari judul atau artis yang dimasukkan. Sajikan bait lirik dengan tata letak bait yang rapi.',
    exampleInput: '.lirik Laskar Pelangi',
    exampleOutput:
      '🎵 *LIRIK LAGU: Laskar Pelangi (Nidji)*\n\nMimpi adalah kunci\nUntuk kita menaklukkan dunia\nBerlarilah tanpa lelah\nSampai engkau meraihnya...',
    parameters: ['<judul_lagu> (Judul lagu atau penyanyi)'],
    latency: '200 - 450 ms',
    autoTyping: false,
    icon: Music,
    isConfigurable: true,
  },
  {
    id: 'ocr',
    name: 'Ekstrak Teks Gambar',
    command: '.ocr',
    alias: '/ocr, !baca-gambar',
    category: 'Utilitas',
    provider: 'OCR Space Open Engine',
    apiStatus: 'Aktif • Bebas Kuota',
    endpoint: 'https://api.ocr.space/parse/image',
    shortDesc: 'Pindai dan salin teks tulisan tangan atau dokumen cetak dari foto.',
    fullDesc:
      'Teknologi pengenalan karakter optis (Optical Character Recognition) yang memindai gambar kiriman WhatsApp dan mengekstrak tulisan di dalamnya menjadi teks digital siap salin.',
    instruction:
      'Periksa apakah pesan memuat gambar atau mengutip (quote) foto. Ekstrak seluruh teks huruf dan angka di dalam gambar lalu kirimkan teksnya.',
    exampleInput: 'Balas gambar dokumen dengan perintah !ocr',
    exampleOutput:
      '📝 *HASIL EKSTRAK TEKS (OCR):*\n\nSURAT KETERANGAN RESMI\nNomor: 001/SK/2026\nMenyatakan bahwa...',
    parameters: ['Kirim/Quote gambar dengan perintah !ocr'],
    latency: '500 - 950 ms',
    autoTyping: false,
    icon: FileText,
    isConfigurable: true,
  },
  {
    id: 'tts',
    name: 'Teks ke Suara (VN)',
    command: '.tts <kode_bahasa> <kalimat>',
    alias: '/tts, !suara, !vn',
    category: 'Utilitas',
    provider: 'Google TTS Engine',
    apiStatus: 'Aktif • Bebas Kuota',
    endpoint: 'https://translate.google.com/translate_tts',
    shortDesc: 'Ubah teks tulisan menjadi rekaman pesan suara WhatsApp (VN) merdu.',
    fullDesc:
      'Sintesis suara natural kecerdasan buatan yang mengonversi teks apa pun menjadi audio rekaman suara (OGG/Opus PTT) yang terdengar langsung seperti Voice Note WhatsApp asli.',
    instruction:
      'Konversi teks menjadi file audio suara ucapan Google TTS, lalu kirimkan sebagai pesan suara (PTT Voice Note).',
    exampleInput: '.tts id Selamat pagi semuanya, jangan lupa bahagia hari ini ya!',
    exampleOutput: '[Audio Pesan Suara PTT WhatsApp Terkirim]',
    parameters: ['<kode_bahasa> (id, en, ja)', '<kalimat>'],
    latency: '250 - 550 ms',
    autoTyping: false,
    icon: Mic,
    isConfigurable: true,
  },
  {
    id: 'screenshot-web',
    name: 'Tangkapan Layar Web',
    command: '.ssweb <url>',
    alias: '/ssweb, !screenshot',
    category: 'Utilitas',
    provider: 'Web Screenshot Engine',
    apiStatus: 'Aktif • Bebas Kuota',
    endpoint: 'https://image.thum.io/get/width/1280/{url}',
    shortDesc: 'Ambil tangkapan layar (screenshot) halaman website secara instan.',
    fullDesc:
      'Mengambil foto visual rendering penuh dari alamat URL situs web di resolusi layar desktop HD dan mengirimkan hasilnya dalam format gambar WhatsApp.',
    instruction:
      'Buka alamat website yang diminta, lakukan capture screenshot layar, dan kirimkan fotonya ke obrolan.',
    exampleInput: '.ssweb https://github.com',
    exampleOutput: '[Foto Screenshot Layar Web Terkirim]',
    parameters: ['<url> (Alamat URL website valid)'],
    latency: '600 - 1200 ms',
    autoTyping: false,
    icon: Camera,
    isConfigurable: true,
  },
  {
    id: 'sticker-maker',
    name: 'Pembuat Stiker WA',
    command: '.stiker',
    alias: '/stiker, !s, /s',
    category: 'Utilitas',
    provider: 'WhatsMeow WebP Converter',
    apiStatus: 'Aktif • Internal',
    endpoint: 'Internal WebP Sticker Engine',
    shortDesc: 'Ubah foto atau gambar apa pun menjadi stiker WhatsApp seketika.',
    fullDesc:
      'Konverter media canggih yang mengubah file gambar JPG, PNG, atau animasi GIF menjadi paket stiker WhatsApp resmi WebP 512x512 dengan metadata author bot.',
    instruction:
      'Konversi gambar yang dikirim atau dikutip menjadi file stiker WhatsApp (image/webp) tanpa latar belakang berlebih.',
    exampleInput: 'Kirim foto dengan caption !stiker',
    exampleOutput: '[Stiker WhatsApp Terkirim]',
    parameters: ['Kirim/Quote gambar'],
    latency: '100 - 250 ms',
    autoTyping: false,
    icon: Image,
    isConfigurable: true,
  },
  {
    id: 'to-image',
    name: 'Stiker ke Foto (ToImg)',
    command: '.toimg',
    alias: '/toimg, !foto',
    category: 'Utilitas',
    provider: 'WhatsMeow Media Decoder',
    apiStatus: 'Aktif • Internal',
    endpoint: 'Internal Media Decoder',
    shortDesc: 'Kembalikan stiker WhatsApp menjadi file gambar foto asli (JPG/PNG).',
    fullDesc:
      'Mendekode stiker WhatsApp non-animasi menjadi file foto biasa agar pengguna dapat menyimpannya ke galeri ponsel dengan mudah.',
    instruction:
      'Kutip (quote) pesan stiker WhatsApp, lalu konversikan menjadi pesan gambar foto normal.',
    exampleInput: 'Balas stiker dengan perintah !toimg',
    exampleOutput: '[Foto JPG Gambar Asli Terkirim]',
    parameters: ['Quote pesan stiker'],
    latency: '100 - 200 ms',
    autoTyping: false,
    icon: Maximize2,
    isConfigurable: true,
  },
  {
    id: 'carbon-code',
    name: 'Cuplikan Kode (Carbon)',
    command: '.carbon <bahasa> <kode>',
    alias: '/carbon, !snippet',
    category: 'Utilitas',
    provider: 'Carbonara Renderer',
    apiStatus: 'Aktif • Bebas Kuota',
    endpoint: 'https://carbonara.solopov.dev/api/cook',
    shortDesc: 'Hasilkan gambar snippet source code berwarna indah dengan tema modern.',
    fullDesc:
      'Generator gambar cuplikan baris kode program (syntax highlighting) bergaya Carbon yang estetis untuk dibagikan ke teman atau grup programmer.',
    instruction:
      'Render baris kode program dengan syntax highlighting sesuai bahasa pemrograman dan kirimkan gambarnya.',
    exampleInput: '.carbon js console.log("Halo Dunia!");',
    exampleOutput: '[Gambar Cuplikan Kode Carbon Terkirim]',
    parameters: ['<bahasa> (js, py, go, ts, php)', '<kode>'],
    latency: '400 - 800 ms',
    autoTyping: false,
    icon: FileCode,
    isConfigurable: true,
  },
  {
    id: 'book-search',
    name: 'Pencarian Buku',
    command: '.buku <judul>',
    alias: '/buku, !sinopsis',
    category: 'Edukasi & Hiburan',
    provider: 'Google Books Open API',
    apiStatus: 'Aktif • Bebas Kuota',
    endpoint: 'https://www.googleapis.com/books/v1/volumes',
    shortDesc: 'Cari informasi penulis, tahun terbit, rating, dan sinopsis buku.',
    fullDesc:
      'Menelusuri jutaan buku di perpustakaan digital Google Books. Menampilkan nama penulis, penerbit, tahun terbit, halaman, dan sinopsis ringkas.',
    instruction:
      'Cari buku berdasarkan judul yang diminta. Tampilkan judul lengkap, penulis, tahun rilis, jumlah halaman, dan sinopsis cerita.',
    exampleInput: '.buku Filosofi Teras',
    exampleOutput:
      '📚 *BUKU: Filosofi Teras*\nPenulis: Henry Manampiring\nPenerbit: Kompas Buku\nHalaman: 346 Halaman\n\nSinopsis:\nPenerapan filsafat Yunani-Romawi Kuno (Stoisisme) untuk mengatasi emosi negatif dan membentuk ketenangan mental dalam hidup modern.',
    parameters: ['<judul> (Judul buku yang dicari)'],
    latency: '150 - 350 ms',
    autoTyping: false,
    icon: BookOpen,
    isConfigurable: true,
  },
]

export function getStoredFeatureConfig(featureId: string, deviceId?: string | null): StoredFeatureConfig {
  const globalKey = `bot_feature_cfg_${featureId}`
  const deviceKey = deviceId ? `bot_feature_cfg_${featureId}_${deviceId}` : null

  try {
    if (deviceKey) {
      const devVal = localStorage.getItem(deviceKey)
      if (devVal) return JSON.parse(devVal)
    }
    const globVal = localStorage.getItem(globalKey)
    if (globVal) return JSON.parse(globVal)
  } catch {
    // fallback
  }

  const feat = BOT_FEATURES.find((f) => f.id === featureId)
  return {
    command: feat?.command,
    alias: feat?.alias,
    isActive: true,
    instruction: feat?.instruction,
    exampleInput: feat?.exampleInput,
    exampleOutput: feat?.exampleOutput,
    autoTyping: feat?.autoTyping ?? false,
    custom: {},
  }
}

export function saveStoredFeatureConfig(
  featureId: string,
  config: StoredFeatureConfig,
  deviceId?: string | null,
  applyToAll: boolean = true,
): void {
  try {
    const raw = JSON.stringify(config)
    localStorage.setItem(`bot_feature_cfg_${featureId}`, raw)
    if (!applyToAll && deviceId) {
      localStorage.setItem(`bot_feature_cfg_${featureId}_${deviceId}`, raw)
    }
  } catch {
    // ignore
  }
}
