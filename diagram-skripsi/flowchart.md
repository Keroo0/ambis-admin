# Flowchart AMBIS

## Tujuan Diagram

Flowchart digunakan untuk menjelaskan alur keputusan sistem dengan bentuk yang lebih sederhana dibanding activity diagram. Untuk skripsi AMBIS, flowchart yang paling penting adalah flowchart presensi wajah, karena fitur ini menjadi inti sistem attendance di HP dan tetap bergantung pada pengaturan dari admin web.

## Flowchart Utama yang Disarankan

Buat flowchart dengan judul:

**Flowchart Proses Presensi Wajah pada Aplikasi AMBIS**

Flowchart ini menjelaskan proses dari siswa membuka aplikasi sampai data presensi tersimpan dan dapat dilihat admin.

## Alur Flowchart

### 1. Mulai

Simbol terminator:

**Mulai**

### 2. Siswa Membuka Aplikasi AMBIS

Simbol proses:

**Buka aplikasi AMBIS di HP**

### 3. Cek Status Login

Simbol keputusan:

**Sudah login?**

Cabang:

- Tidak: tampilkan halaman login.
- Ya: lanjut ke dashboard.

### 4. Login Siswa

Jika belum login:

1. Siswa memasukkan NISN/username dan password.
2. Sistem memvalidasi data ke Supabase.

Simbol keputusan:

**Login valid?**

Cabang:

- Tidak: tampilkan pesan gagal login, kembali ke form login.
- Ya: masuk ke dashboard.

### 5. Siswa Memilih Menu Presensi

Simbol proses:

**Pilih menu Presensi**

### 6. Cek Data Wajah

Simbol keputusan:

**Data wajah sudah terdaftar?**

Cabang:

- Tidak: arahkan ke registrasi wajah.
- Ya: lanjut ke kamera presensi.

### 7. Registrasi Wajah Jika Belum Terdaftar

Jika data wajah belum ada:

1. Siswa memilih daftar wajah.
2. Siswa memverifikasi NISN.
3. Sistem membuka kamera.
4. Sistem mengambil sampel wajah.
5. Sistem mengekstrak face embedding.
6. Sistem menyimpan embedding ke SQLite lokal.
7. Sistem menyinkronkan embedding ke Supabase jika internet tersedia.

Simbol keputusan:

**Registrasi berhasil?**

Cabang:

- Tidak: tampilkan pesan gagal dan ulangi proses registrasi.
- Ya: lanjut ke proses presensi.

### 8. Buka Kamera Presensi

Simbol proses:

**Aktifkan kamera depan**

Siswa memposisikan wajah di area kamera.

### 9. Deteksi Wajah

Simbol keputusan:

**Wajah terdeteksi?**

Cabang:

- Tidak: tampilkan instruksi posisi wajah, ulangi deteksi.
- Ya: lanjut ke pengecekan liveness.

### 10. Cek Liveness

Simbol keputusan:

**Liveness valid?**

Cabang:

- Tidak: tampilkan pesan gagal liveness, ulangi.
- Ya: lanjut ke pencocokan wajah.

### 11. Cocokkan Wajah

Simbol proses:

**Bandingkan embedding wajah dengan data tersimpan**

Simbol keputusan:

**Skor wajah memenuhi threshold?**

Cabang:

- Tidak: tampilkan pesan wajah tidak cocok, ulangi capture.
- Ya: lanjut ke cek lokasi.

### 12. Ambil Lokasi GPS

Simbol proses:

**Ambil lokasi siswa dari GPS**

### 13. Cek Geofence

Sistem membaca pengaturan geofence dari Supabase. Pengaturan ini sebelumnya dibuat oleh admin melalui dashboard web.

Simbol keputusan:

**Geofence aktif?**

Cabang:

- Tidak: lanjut ke cek jadwal.
- Ya: hitung jarak siswa dari titik sekolah.

Simbol keputusan berikutnya:

**Siswa berada dalam radius sekolah?**

Cabang:

- Tidak: presensi ditolak, tampilkan pesan di luar area sekolah.
- Ya: lanjut ke cek jadwal.

### 14. Cek Jadwal Presensi

Sistem membaca jadwal presensi dari settings.

Simbol keputusan:

**Masih dalam waktu presensi?**

Cabang:

- Tidak: presensi ditolak atau diberi peringatan sesuai aturan.
- Ya: lanjut simpan data absensi.

### 15. Tentukan Jenis Presensi

Simbol keputusan:

**Presensi masuk atau pulang?**

Cabang:

- Masuk: isi `time_in`.
- Pulang: isi `time_out`.

### 16. Simpan Data ke Supabase

Simbol proses:

**Simpan data attendance ke Supabase**

Data yang disimpan:

- student_id
- date
- time_in atau time_out
- status
- face_match_score
- liveness_verified
- is_within_geofence
- location_lat
- location_lng

### 17. Tampilkan Hasil ke Siswa

Simbol proses:

**Tampilkan pesan presensi berhasil**

Dashboard siswa memperbarui status presensi hari ini.

### 18. Data Dapat Dilihat Admin

Simbol proses:

**Admin melihat data presensi di dashboard web**

Admin dapat melihat data kehadiran, persentase kehadiran, dan riwayat absensi.

### 19. Selesai

Simbol terminator:

**Selesai**

## Cabang Flowchart Pengajuan Izin/Sakit

Jika ingin menambahkan cabang kecil tanpa membuat diagram baru, tambahkan setelah dashboard siswa:

Keputusan:

**Siswa hadir?**

Cabang:

- Ya: lanjut ke presensi wajah.
- Tidak: siswa dapat mengajukan izin/sakit.

Alur izin/sakit:

1. Siswa membuka menu Pengajuan Izin.
2. Siswa mengisi jenis izin, alasan, tanggal, dan lampiran.
3. Sistem menyimpan data ke `leave_requests`.
4. Admin membuka dashboard attendance.
5. Admin menyetujui atau menolak pengajuan.
6. Status dapat dilihat siswa dan orang tua.

## Cabang Flowchart Admin

Admin tidak perlu dibuat terlalu panjang dalam flowchart utama. Cukup tampilkan pengaruh admin terhadap flow presensi:

1. Admin login ke dashboard web.
2. Admin mengatur data siswa.
3. Admin mengatur geofence.
4. Admin mengatur jadwal presensi.
5. Admin dapat reset data wajah siswa.
6. Data pengaturan tersimpan di Supabase.
7. Aplikasi HP membaca pengaturan tersebut saat presensi.

Bagian ini bisa diletakkan sebagai proses pendukung di sebelah kanan flowchart utama.

## Simbol Flowchart yang Digunakan

- Terminator untuk Mulai dan Selesai.
- Process untuk aktivitas biasa.
- Decision untuk kondisi ya/tidak.
- Database untuk Supabase dan SQLite lokal.
- Document jika ingin menggambarkan laporan/riwayat presensi.
- Connector jika flowchart terlalu panjang.

## Catatan Penggambaran

Flowchart sebaiknya fokus pada keputusan penting:

- Sudah login atau belum.
- Wajah sudah terdaftar atau belum.
- Wajah terdeteksi atau tidak.
- Liveness valid atau tidak.
- Wajah cocok atau tidak.
- Lokasi dalam radius sekolah atau tidak.
- Waktu presensi valid atau tidak.
- Presensi berhasil atau gagal.

Jangan memasukkan detail teknis seperti nama file Flutter, nama provider, atau query Supabase ke dalam flowchart. Detail teknis lebih cocok dijelaskan di class diagram dan ERD.
