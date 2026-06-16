# Use Case Diagram AMBIS

## Tujuan Diagram

Use case diagram dipakai untuk menjelaskan siapa saja aktor yang menggunakan sistem AMBIS dan fitur apa saja yang bisa dilakukan oleh masing-masing aktor. Diagram ini mencakup dua aplikasi:

- Aplikasi mobile attendance di HP untuk siswa dan orang tua.
- Dashboard web admin untuk pengelolaan data sekolah.

## Batas Sistem

Buat satu kotak besar bernama:

**Sistem AMBIS - Absensi Biometrik Siswa**

Semua use case utama diletakkan di dalam kotak tersebut. Aktor diletakkan di luar kotak.

## Aktor

### 1. Siswa

Siswa adalah pengguna utama aplikasi mobile. Siswa menggunakan HP untuk login, mendaftarkan wajah, melakukan presensi, melihat nilai, melihat riwayat absensi, mengajukan izin/sakit, dan menerima notifikasi.

### 2. Orang Tua

Orang tua menggunakan aplikasi mobile untuk memantau data anak. Orang tua tidak melakukan presensi, tetapi dapat melihat ringkasan kehadiran, riwayat absensi, nilai, dan notifikasi.

### 3. Admin

Admin menggunakan dashboard web. Admin mengelola data siswa, nilai, pengajuan izin/sakit, pengaturan presensi, geofence sekolah, notifikasi, dan audit log.

### 4. Kamera HP

Kamera HP bisa digambarkan sebagai aktor eksternal pendukung karena sistem membutuhkan kamera depan untuk registrasi wajah dan presensi wajah.

### 5. GPS / Location Service

GPS digunakan untuk validasi lokasi presensi. Aktor ini mendukung proses pengecekan apakah siswa berada di area sekolah.

### 6. Supabase

Supabase berperan sebagai layanan backend/cloud. Supabase menangani autentikasi, database, sinkronisasi data, dan penyimpanan data utama seperti users, students, attendance, grades, leave_requests, notifications, settings, audit_log, dan face_embeddings.

### 7. SQLite Lokal

SQLite lokal pada aplikasi mobile dapat digambarkan sebagai aktor pendukung penyimpanan lokal, khususnya untuk data embedding wajah yang dipakai pada proses pengenalan wajah di HP.

## Use Case untuk Siswa

### Login

Siswa masuk ke aplikasi menggunakan NISN/username dan password. Setelah login berhasil, siswa diarahkan ke dashboard mobile.

### Verifikasi NISN

Siswa yang belum mendaftarkan wajah memasukkan NISN untuk memastikan identitasnya terdaftar sebagai siswa aktif.

### Registrasi Wajah

Siswa melakukan pendaftaran wajah menggunakan kamera HP. Sistem mengambil beberapa sampel wajah, mengekstrak embedding wajah, lalu menyimpannya ke lokal dan menyinkronkannya ke Supabase.

Relasi:

- Use case ini menggunakan kamera HP.
- Use case ini terhubung dengan SQLite lokal dan Supabase.
- Bisa diberi relasi `include` ke "Ekstraksi Face Embedding".

### Melakukan Presensi Wajah

Siswa melakukan presensi masuk atau pulang menggunakan wajah. Sistem memvalidasi wajah, lokasi, waktu presensi, dan liveness.

Relasi:

- `include` Cek Wajah
- `include` Cek Liveness
- `include` Cek Lokasi Geofence
- `include` Cek Jadwal Presensi
- `include` Simpan Data Absensi

### Melihat Dashboard

Siswa melihat ringkasan status presensi hari ini, akses menu absensi, nilai, profil, riwayat, izin, dan notifikasi.

### Melihat Riwayat Absensi

Siswa melihat data absensi harian atau bulanan dari Supabase.

### Melihat Nilai

Siswa melihat nilai berdasarkan mata pelajaran, semester, dan tahun ajaran.

### Mengajukan Izin/Sakit

Siswa mengisi alasan izin/sakit dan dapat mengunggah lampiran. Data masuk ke tabel `leave_requests` dan menunggu persetujuan admin.

### Melihat Notifikasi

Siswa menerima notifikasi terkait absensi, nilai, pengajuan izin, pengumuman, atau informasi sistem.

### Mengelola Profil

Siswa melihat dan memperbarui data profil tertentu, seperti foto profil.

## Use Case untuk Orang Tua

### Login Orang Tua

Orang tua masuk menggunakan NISN anak dan password orang tua.

### Melihat Dashboard Anak

Orang tua melihat ringkasan data anak, seperti status kehadiran hari ini, jumlah hadir bulan ini, nilai terbaru, dan informasi penting lain.

### Melihat Riwayat Absensi Anak

Orang tua melihat data absensi anak dalam periode tertentu.

### Melihat Nilai Anak

Orang tua melihat nilai anak berdasarkan mata pelajaran dan semester.

### Melihat Notifikasi

Orang tua menerima informasi terkait perkembangan anak, absensi, nilai, dan pengumuman.

## Use Case untuk Admin

### Login Admin

Admin masuk ke dashboard web sebelum mengelola data.

### Melihat Dashboard Admin

Admin melihat statistik jumlah siswa, persentase kehadiran, pengajuan izin pending, dan data absensi terbaru.

### Mengelola Data Siswa

Admin dapat menambah, mengubah, menonaktifkan, atau menghapus data siswa. Data yang dikelola berhubungan dengan tabel `users` dan `students`.

### Reset Data Wajah Siswa

Admin menghapus data embedding wajah siswa agar siswa dapat melakukan registrasi wajah ulang.

Relasi:

- Use case ini berhubungan dengan tabel `face_embeddings`.
- Bisa dianggap sebagai use case khusus dari "Mengelola Data Siswa".

### Mengelola Nilai

Admin memasukkan atau memperbarui nilai siswa berdasarkan kelas, mata pelajaran, semester, dan tahun ajaran.

### Memproses Izin/Sakit

Admin meninjau pengajuan izin/sakit siswa, lalu menyetujui atau menolak pengajuan tersebut.

Relasi:

- `extend` Setujui Izin/Sakit
- `extend` Tolak Izin/Sakit
- Saat menolak, admin mengisi alasan penolakan.

### Mengatur Geofence Sekolah

Admin mengatur titik koordinat sekolah dan radius geofence yang digunakan aplikasi HP saat siswa melakukan presensi.

### Mengatur Jadwal Presensi

Admin mengatur jam masuk, jam pulang, dan batas waktu presensi.

### Mengirim Notifikasi

Admin mengirim notifikasi ke siswa, kelas tertentu, atau seluruh pengguna.

### Melihat Audit Log

Admin melihat catatan aktivitas penting, seperti perubahan nilai, reset wajah, perubahan data siswa, dan keputusan izin/sakit.

## Relasi Include yang Disarankan

Gunakan relasi `include` untuk proses yang selalu terjadi.

- Melakukan Presensi Wajah `include` Cek Wajah
- Melakukan Presensi Wajah `include` Cek Liveness
- Melakukan Presensi Wajah `include` Cek Geofence
- Melakukan Presensi Wajah `include` Cek Jadwal Presensi
- Melakukan Presensi Wajah `include` Simpan Absensi
- Registrasi Wajah `include` Ambil Sampel Kamera
- Registrasi Wajah `include` Ekstraksi Face Embedding
- Registrasi Wajah `include` Simpan Embedding Wajah
- Mengelola Nilai `include` Simpan Audit Log
- Memproses Izin/Sakit `include` Simpan Audit Log
- Mengelola Data Siswa `include` Simpan Audit Log

## Relasi Extend yang Disarankan

Gunakan relasi `extend` untuk kondisi opsional atau cabang proses.

- Melakukan Presensi Wajah `extend` Tampilkan Gagal Wajah jika wajah tidak cocok.
- Melakukan Presensi Wajah `extend` Tampilkan Gagal Lokasi jika siswa di luar area sekolah.
- Melakukan Presensi Wajah `extend` Tampilkan Gagal Jadwal jika di luar jam presensi.
- Memproses Izin/Sakit `extend` Tolak Izin/Sakit.
- Memproses Izin/Sakit `extend` Setujui Izin/Sakit.
- Mengelola Data Siswa `extend` Reset Data Wajah.

## Saran Bentuk Diagram

Letakkan aktor Siswa dan Orang Tua di sisi kiri karena keduanya memakai aplikasi mobile. Letakkan Admin di sisi kanan karena memakai dashboard web. Aktor teknis seperti Kamera HP, GPS, Supabase, dan SQLite Lokal bisa diletakkan di bawah atau kanan bawah sebagai sistem pendukung.

Diagram tidak perlu memuat semua detail tombol atau halaman. Fokus pada fitur utama dan hubungan aktor dengan sistem.
