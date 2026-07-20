# 🍅 PomGiv - Pomodoro Focus Timer

**PomGiv** adalah aplikasi pengelola waktu dan fokus harian berbasis **ElectronJS** yang didesain modern dengan tampilan *Glassmorphism*. Aplikasi ini membantu Anda menerapkan metode Pomodoro secara terstruktur, mengelola *to-do list* sesuai sesi fokus, serta menyesuaikan pengingat suara sesuai preferensi Anda.

---

## ✨ Fitur Utama

- ⏱️ **Siklus Pomodoro Multimode**
  - Mode **Pomodoro** (Fokus), **Short Break** (Istirahat Pendek), dan **Long Break** (Istirahat Panjang).
  - Visual indikator progres melingkar (SVG ring) & penanda *session dots*.
  - Durasi fokus, istirahat, dan jumlah sesi (1–8 sesi) dapat disesuaikan sepenuhnya.

- 📋 **Manajemen Tugas Berbasis Sesi (Focus Tasks)**
  - Tambahkan tugas/pekerjaan harian Anda.
  - Alokasikan tugas ke sesi-sesi Pomodoro tertentu secara spesifik.
  - **Verifikasi Tugas Auto**: Pop-up konfirmasi status penyelesaian tugas saat sesi berakhir.

- 🔔 **Notifikasi & Audio Kustom**
  - Pilihan nada suara bawaan: *Synthesized Chime*, *Digital Beep*, dan *Gentle Bell*.
  - **Upload MP3 Sendiri**: Tambahkan file audio MP3 kustom pilihan Anda sebagai nada alarm.
  - Atur durasi penyuaraan notifikasi serta opsi pengulangan nada (*loop*).

- 💾 **Database Lokal SQLite**
  - Semua data tugas dan konfigurasi tersimpan dengan aman di perangkat lokal Anda.

- 🎨 **Desain Glassmorphism Modern**
  - Antarmuka visual yang elegan, responsif, dan nyaman untuk penggunaan jangka panjang.

---

## 📥 Link Download

Dapatkan installer versi terbaru sesuai dengan sistem operasi Anda melalui halaman **GitHub Releases**:

👉 **[Download PomGiv Terbaru di GitHub Releases](https://github.com/code-worker-me/PomGiv/releases)**

### Format Rilis yang Tersedia:
- **Windows**: `PomGiv-Setup-1.0.0.msi` / `.exe`
- **macOS**: `PomGiv-darwin-x64.zip`

---

## 🛠️ Cara Menjalankan dari Source Code

Jika Anda ingin mencoba atau mengembangkannya secara lokal:

1. **Clone repository**:
   ```bash
   git clone https://github.com/code-worker-me/PomGiv.git
   cd PomGiv
   ```

2. **Install dependensi**:
   ```bash
   npm install
   ```

3. **Jalankan aplikasi**:
   ```bash
   npm start
   ```

4. **Build installer aplikasi** (menggunakan Electron Forge):
   ```bash
   npm run make
   ```

---

## 📄 Lisensi & Pembuat

Dibuat oleh **Giveonaldo** ([code-worker-me](https://github.com/code-worker-me)).  
Berlisensi di bawah **ISC License**.
