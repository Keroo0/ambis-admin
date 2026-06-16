# Activity Diagram AMBIS

## Tujuan Diagram

Activity diagram dipakai untuk menjelaskan alur kerja sistem dari awal sampai akhir. Untuk skripsi ini, activity diagram yang paling penting adalah alur presensi wajah karena alur tersebut menjadi inti dari sistem AMBIS.

Diagram ini tetap mencakup admin web dan aplikasi attendance di HP. Admin berperan menyiapkan data dan aturan presensi, sedangkan siswa menjalankan presensi melalui aplikasi HP.

## Activity Diagram Utama yang Disarankan

Buat activity diagram dengan judul:

**Activity Diagram Proses Presensi Wajah Siswa**

Gunakan swimlane agar alurnya jelas. Swimlane yang disarankan:

1. Siswa
2. Aplikasi Mobile AMBIS
3. Kamera dan Face Recognition
4. GPS dan Geofence
5. Supabase
6. Admin Web

## Alur Utama Presensi Wajah

### 1. Admin Menyiapkan Aturan Presensi

Alur dimulai dari sisi admin web.

Admin membuka dashboard web, lalu mengatur data yang dibutuhkan sistem, seperti:

- Data siswa.
- Data wajah siswa jika perlu reset.
- Jadwal presensi masuk dan pulang.
- Titik koordinat sekolah.
- Radius geofence.
- Ambang batas kecocokan wajah.

Setelah admin menyimpan pengaturan, data tersebut tersimpan di Supabase, terutama pada tabel `students`, `settings`, dan jika ada reset wajah, tabel `face_embeddings`.

### 2. Siswa Login ke Aplikasi HP

Siswa membuka aplikasi AMBIS di HP, kemudian login menggunakan NISN/username dan password.

Jika login gagal, sistem menampilkan pesan gagal login dan siswa kembali ke form login.

Jika login berhasil, siswa masuk ke dashboard mobile.

### 3. Sistem Mengecek Data Wajah

Saat siswa ingin melakukan presensi, aplikasi mengecek apakah siswa sudah memiliki data wajah aktif.

Keputusan:

- Jika belum ada data wajah, sistem menampilkan halaman atau pesan untuk registrasi wajah.
- Jika sudah ada data wajah, sistem melanjutkan ke proses presensi.

### 4. Registrasi Wajah Jika Belum Terdaftar

Jika siswa belum terdaftar wajahnya, siswa masuk ke proses registrasi wajah.

Alurnya:

1. Siswa memilih daftar wajah.
2. Siswa memasukkan atau memverifikasi NISN.
3. Sistem memeriksa NISN di Supabase.
4. Jika NISN tidak valid, sistem menampilkan pesan gagal.
5. Jika NISN valid, aplikasi membuka kamera depan.
6. Siswa memposisikan wajah di area kamera.
7. Aplikasi mengambil beberapa sampel wajah.
8. Sistem mengekstrak face embedding.
9. Embedding disimpan ke SQLite lokal.
10. Jika internet tersedia, embedding disinkronkan ke Supabase.
11. Siswa kembali ke dashboard atau halaman presensi.

### 5. Aplikasi Membuka Kamera Presensi

Jika data wajah sudah tersedia, aplikasi membuka kamera depan. Siswa mengarahkan wajah ke kamera.

Aplikasi kemudian melakukan:

- Deteksi wajah.
- Pengecekan posisi wajah.
- Pengecekan liveness.
- Pengambilan embedding wajah dari frame kamera.

### 6. Sistem Mengecek Kecocokan Wajah

Aplikasi membandingkan embedding wajah yang baru ditangkap dengan embedding wajah yang sudah tersimpan.

Keputusan:

- Jika skor kecocokan di bawah threshold, sistem menampilkan pesan wajah tidak cocok dan meminta siswa mencoba lagi.
- Jika skor mencukupi, sistem lanjut ke validasi lokasi.

### 7. Sistem Mengecek Lokasi Geofence

Aplikasi mengambil lokasi siswa dari GPS. Sistem membaca pengaturan koordinat sekolah dan radius geofence dari Supabase.

Keputusan:

- Jika geofence nonaktif, proses lanjut tanpa validasi lokasi.
- Jika geofence aktif dan siswa berada dalam radius sekolah, proses lanjut.
- Jika siswa berada di luar radius sekolah, sistem menolak presensi dan menampilkan jarak dari sekolah.

### 8. Sistem Mengecek Jadwal Presensi

Aplikasi mengecek apakah waktu sekarang masih berada dalam rentang presensi yang diatur admin.

Keputusan:

- Jika masih dalam waktu presensi masuk, sistem mencatat `time_in`.
- Jika masih dalam waktu presensi pulang, sistem mencatat `time_out`.
- Jika di luar waktu presensi, sistem menampilkan pesan bahwa presensi tidak bisa dilakukan atau memberi peringatan sesuai aturan sistem.

### 9. Sistem Menyimpan Data Absensi

Jika wajah cocok, lokasi valid, dan waktu valid, aplikasi menyimpan data absensi ke Supabase.

Data yang disimpan mencakup:

- ID siswa.
- Tanggal.
- Jam masuk atau jam pulang.
- Status kehadiran.
- Skor kecocokan wajah.
- Status liveness.
- Status geofence.
- Latitude dan longitude.
- Catatan jika diperlukan.

### 10. Sistem Menampilkan Hasil

Setelah data tersimpan, aplikasi menampilkan hasil presensi kepada siswa.

Jika berhasil, siswa melihat status presensi hari ini di dashboard mobile.

Admin juga dapat melihat data terbaru tersebut pada dashboard web.

## Alur Alternatif

### Wajah Tidak Cocok

Jika wajah tidak cocok:

1. Sistem menampilkan pesan gagal.
2. Siswa diminta memperbaiki posisi wajah atau pencahayaan.
3. Siswa dapat mencoba ulang.
4. Jika gagal berkali-kali, sistem dapat memberi arahan untuk meminta bantuan admin atau wali kelas.

### Lokasi di Luar Geofence

Jika lokasi berada di luar radius sekolah:

1. Sistem menghitung jarak siswa dari titik sekolah.
2. Sistem menolak presensi.
3. Sistem menampilkan informasi bahwa siswa berada di luar area presensi.

### Data Wajah Direset Admin

Jika admin mereset data wajah siswa:

1. Data embedding siswa dihapus dari Supabase.
2. Siswa tidak bisa melakukan presensi wajah sebelum registrasi ulang.
3. Saat siswa membuka fitur presensi, aplikasi meminta registrasi wajah ulang.

### Pengajuan Izin/Sakit

Jika siswa tidak bisa hadir:

1. Siswa membuka menu izin/sakit.
2. Siswa mengisi alasan dan lampiran.
3. Data masuk ke Supabase.
4. Admin membuka dashboard attendance.
5. Admin menyetujui atau menolak pengajuan.
6. Status izin/sakit dapat dilihat oleh siswa dan orang tua.

## Simbol yang Digunakan

- Titik hitam awal untuk start.
- Kotak rounded untuk aktivitas.
- Diamond untuk keputusan.
- Panah untuk arah alur.
- Swimlane untuk memisahkan tanggung jawab aktor/sistem.
- Titik akhir untuk end.

## Catatan Penggambaran

Jangan memasukkan semua fitur AMBIS ke satu activity diagram karena akan terlalu ramai. Untuk skripsi, activity diagram presensi wajah sudah paling kuat karena mencakup kamera, face recognition, GPS, Supabase, dan admin settings.

Jika dosen meminta tambahan, activity diagram kedua bisa dibuat untuk proses pengajuan izin/sakit. Tetapi untuk paket minimal, cukup satu activity diagram utama presensi wajah.
