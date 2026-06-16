# Class Diagram AMBIS

## Tujuan Diagram

Class diagram digunakan untuk menjelaskan struktur komponen perangkat lunak, kelas utama, dan hubungan antar kelas. Karena AMBIS terdiri dari aplikasi mobile Flutter dan dashboard admin Next.js, class diagram dapat dibuat sebagai diagram gabungan berbasis layer.

Fokus diagram ini bukan menggambar semua file, tetapi menggambarkan kelas/komponen penting yang mewakili arsitektur sistem.

## Pembagian Package

Saat menggambar class diagram, buat beberapa package atau kelompok:

1. Mobile App - Presentation
2. Mobile App - Provider / State Management
3. Mobile App - Repository / Service
4. Mobile App - Model / Entity
5. Admin Web - Page / Component
6. Admin Web - API Route / Service
7. External Service

## Mobile App - Presentation

Package ini berisi screen utama yang digunakan siswa dan orang tua.

### LoginScreen

Tanggung jawab:

- Menampilkan form login siswa.
- Mengirim NISN/username dan password ke AuthProvider.
- Mengarahkan pengguna ke dashboard setelah login.

Relasi:

- Menggunakan AuthProvider.

### ParentLoginScreen

Tanggung jawab:

- Menampilkan form login orang tua.
- Mengirim NISN anak dan password orang tua.

Relasi:

- Menggunakan AuthProvider.

### DashboardScreen

Tanggung jawab:

- Menampilkan ringkasan presensi hari ini.
- Menampilkan akses ke absensi, nilai, riwayat, izin, notifikasi, dan profil.

Relasi:

- Menggunakan FaceRepository untuk mengecek status data wajah.
- Menggunakan NotificationRepository untuk notifikasi.
- Menggunakan SupabaseClient untuk data attendance.

### NisnVerificationScreen

Tanggung jawab:

- Memverifikasi NISN sebelum registrasi wajah.
- Mengecek apakah NISN terdaftar sebagai siswa aktif.

Relasi:

- Menggunakan SupabaseClient.
- Mengarahkan ke EnrollmentScreen jika NISN valid.

### EnrollmentScreen

Tanggung jawab:

- Membuka kamera.
- Mengambil sampel wajah.
- Menjalankan proses registrasi wajah.
- Menyimpan embedding wajah.

Relasi:

- Menggunakan CameraController.
- Menggunakan EnrollmentController.
- Menggunakan FaceRepository.

### AttendanceScreen

Tanggung jawab:

- Menjalankan proses presensi masuk atau pulang.
- Mengecek data wajah, lokasi, waktu, dan liveness.
- Menyimpan data presensi.

Relasi:

- Menggunakan AttendanceRepository.
- Menggunakan FaceRepository.
- Menggunakan LocationService.
- Menggunakan GeofenceSettingsService.

### GradesScreen

Tanggung jawab:

- Menampilkan nilai siswa berdasarkan semester.

Relasi:

- Menggunakan GradeRepository.

### HistoryScreen

Tanggung jawab:

- Menampilkan riwayat absensi siswa.

Relasi:

- Menggunakan AttendanceHistoryRepository.

### LeaveRequestScreen

Tanggung jawab:

- Menampilkan form pengajuan izin atau sakit.
- Mengunggah lampiran jika ada.

Relasi:

- Menggunakan LeaveRepository.

### NotificationsScreen

Tanggung jawab:

- Menampilkan daftar notifikasi.
- Menandai notifikasi sebagai dibaca.

Relasi:

- Menggunakan NotificationRepository.
- Menggunakan NotificationPreferencesRepository.

### ParentDashboardScreen

Tanggung jawab:

- Menampilkan ringkasan data anak untuk orang tua.

Relasi:

- Menggunakan ParentRepository.

### ParentAttendanceHistoryScreen

Tanggung jawab:

- Menampilkan riwayat absensi anak.

Relasi:

- Menggunakan ParentRepository.

## Mobile App - Provider / State Management

### AuthProvider

Tanggung jawab:

- Menyimpan state login pengguna.
- Menentukan apakah pengguna adalah siswa atau orang tua.
- Menangani login dan logout.

Relasi:

- Menggunakan AuthRepository.
- Dipakai oleh AppRouter dan berbagai screen.

### EnrollmentController

Tanggung jawab:

- Mengelola state registrasi wajah.
- Menghitung jumlah sampel wajah yang sudah berhasil.
- Menentukan status proses, seperti capturing, saving, done, atau error.

Relasi:

- Menggunakan FaceRepository.

### GradesProvider

Tanggung jawab:

- Mengambil dan menyediakan data nilai siswa.

Relasi:

- Menggunakan GradeRepository.

### NotificationsProvider

Tanggung jawab:

- Mengambil daftar notifikasi.
- Mengubah status baca notifikasi.

Relasi:

- Menggunakan NotificationRepository.

### ParentProvider

Tanggung jawab:

- Menyediakan data anak untuk akun orang tua.

Relasi:

- Menggunakan ParentRepository.

## Mobile App - Repository / Service

### AuthRepository

Tanggung jawab:

- Melakukan autentikasi siswa dan orang tua.
- Membaca data user dari Supabase.

Relasi:

- Menggunakan SupabaseClient.

### FaceRepository

Tanggung jawab:

- Mengekstrak embedding wajah.
- Menyimpan embedding ke SQLite lokal.
- Mengambil embedding untuk proses pencocokan wajah.
- Menghitung cosine similarity.

Relasi:

- Menggunakan AppDatabase.
- Menggunakan TFLite model.
- Menggunakan Google ML Kit untuk deteksi wajah.

### AttendanceRepository

Tanggung jawab:

- Mengecek jadwal presensi.
- Membaca threshold dari settings.
- Membandingkan wajah siswa.
- Menyimpan data attendance ke Supabase.

Relasi:

- Menggunakan SupabaseClient.
- Menggunakan FaceRepository.

### GeofenceSettingsService

Tanggung jawab:

- Membaca pengaturan geofence dari Supabase.

Relasi:

- Menggunakan SupabaseClient.

### LocationService

Tanggung jawab:

- Mengambil lokasi GPS.
- Menghitung jarak siswa dengan titik sekolah.

Relasi:

- Digunakan oleh AttendanceScreen.

### GradeRepository

Tanggung jawab:

- Mengambil nilai siswa dari Supabase.
- Menghitung ringkasan nilai.

Relasi:

- Menggunakan SupabaseClient.

### AttendanceHistoryRepository

Tanggung jawab:

- Mengambil riwayat attendance dan leave request.
- Menyusun data riwayat bulanan.

Relasi:

- Menggunakan SupabaseClient.

### LeaveRepository

Tanggung jawab:

- Mengirim pengajuan izin/sakit.
- Mengunggah atau menyimpan attachment.

Relasi:

- Menggunakan SupabaseClient.

### NotificationRepository

Tanggung jawab:

- Mengambil notifikasi.
- Menandai notifikasi sebagai dibaca.

Relasi:

- Menggunakan SupabaseClient.

### NotificationPreferencesRepository

Tanggung jawab:

- Mengambil dan menyimpan preferensi notifikasi.

Relasi:

- Menggunakan SupabaseClient.

### ParentRepository

Tanggung jawab:

- Mengambil data anak.
- Mengambil absensi anak.
- Mengambil nilai anak.

Relasi:

- Menggunakan SupabaseClient.

### SyncRepository

Tanggung jawab:

- Menyinkronkan face embedding lokal yang belum tersinkron ke Supabase.

Relasi:

- Menggunakan AppDatabase.
- Menggunakan SupabaseClient.

## Mobile App - Model / Entity

### UserEntity

Atribut:

- id
- nisn
- fullname
- role
- email
- phone
- avatarUrl
- isActive

### FaceEmbeddingEntity

Atribut:

- id
- studentId
- embedding
- enrollmentDate
- updatedAt
- isActive
- syncedToSupabase

### SubjectGrade

Atribut:

- subject
- uts
- uas
- average
- predikat

### GradeSummary

Atribut:

- average
- predikat
- totalSubjects

### NotificationModel

Atribut:

- id
- userId
- type
- title
- body
- isRead
- createdAt

### NotificationPreferencesModel

Atribut:

- userId
- attendance
- grade
- leave
- announcement
- system

## Admin Web - Page / Component

Dashboard admin menggunakan Next.js. Karena banyak bagian berupa function component, pada class diagram komponen tersebut dapat digambarkan sebagai class dengan stereotype `component`.

### AdminDashboardPage

Tanggung jawab:

- Menampilkan statistik siswa, kehadiran, izin pending, dan ringkasan nilai.
- Membaca data attendance, students, leave_requests, dan grades.

Relasi:

- Menggunakan SupabaseClient.
- Menggunakan GeofenceSection.
- Menggunakan AttendanceTimeSection.

### StudentsPage

Tanggung jawab:

- Menampilkan daftar siswa.
- Membuka modal tambah/edit siswa.
- Menjalankan reset data wajah.

Relasi:

- Menggunakan StudentModal.
- Menggunakan ResetFaceDialog.
- Menggunakan DeleteStudentDialog.
- Menggunakan API `/api/students`.

### StudentModal

Tanggung jawab:

- Form tambah atau edit siswa.
- Mengelola data user siswa dan data students.

Relasi:

- Menggunakan SupabaseClient.

### ResetFaceDialog

Tanggung jawab:

- Menghapus data face embedding siswa agar siswa dapat registrasi ulang.

Relasi:

- Menggunakan SupabaseClient.
- Mengakses tabel `face_embeddings`.

### AttendanceAdminPage

Tanggung jawab:

- Menampilkan pengajuan izin/sakit.
- Menyetujui atau menolak pengajuan.

Relasi:

- Menggunakan SupabaseClient.
- Menulis audit_log.

### GradesAdminPage

Tanggung jawab:

- Input dan update nilai siswa.

Relasi:

- Menggunakan SupabaseClient.
- Menulis audit_log.

### NotificationsAdminPage

Tanggung jawab:

- Mengirim notifikasi ke siswa, kelas, atau semua user.

Relasi:

- Menggunakan API `/api/notifications`.

### AuditPage

Tanggung jawab:

- Menampilkan audit_log.

Relasi:

- Menggunakan SupabaseClient.

### GeofenceSection

Tanggung jawab:

- Mengatur status geofence, radius, latitude, dan longitude sekolah.

Relasi:

- Menggunakan MapPicker.
- Menggunakan API `/api/settings`.

### AttendanceTimeSection

Tanggung jawab:

- Mengatur jam presensi masuk dan pulang.

Relasi:

- Menggunakan API `/api/settings`.

## Admin Web - API Route / Service

### StudentsApiRoute

Tanggung jawab:

- Membuat data user siswa.
- Membuat data students.
- Membuat data user orang tua jika diperlukan.
- Menghapus data siswa.
- Menulis audit_log.

Relasi:

- Menggunakan Supabase service role.

### SettingsApiRoute

Tanggung jawab:

- Menyimpan pengaturan sistem, seperti geofence dan jadwal presensi.

Relasi:

- Menggunakan Supabase service role.

### NotificationsApiRoute

Tanggung jawab:

- Membuat notifikasi massal.
- Memfilter user berdasarkan kelas atau role.
- Memperhatikan notification_preferences.

Relasi:

- Menggunakan Supabase service role.

## External Service

### SupabaseClient

Tanggung jawab:

- Autentikasi user.
- Query database.
- Insert/update/delete data.
- Realtime notification.
- Storage untuk lampiran atau foto profil.

### AppDatabase

Tanggung jawab:

- Database lokal SQLite.
- Menyimpan face_embeddings lokal.

### CameraController

Tanggung jawab:

- Mengakses kamera HP.
- Menyediakan frame/gambar untuk registrasi dan presensi wajah.

### TFLiteModel

Tanggung jawab:

- Menghasilkan embedding wajah dari gambar wajah.

### MLKitFaceDetector

Tanggung jawab:

- Mendeteksi wajah dan membantu validasi posisi/liveness.

## Relasi Penting yang Digambar

Gunakan relasi dependency atau association berikut:

- LoginScreen menggunakan AuthProvider.
- AuthProvider menggunakan AuthRepository.
- AuthRepository menggunakan SupabaseClient.
- EnrollmentScreen menggunakan EnrollmentController.
- EnrollmentController menggunakan FaceRepository.
- FaceRepository menggunakan AppDatabase, TFLiteModel, dan MLKitFaceDetector.
- AttendanceScreen menggunakan AttendanceRepository, LocationService, dan GeofenceSettingsService.
- AttendanceRepository menggunakan FaceRepository dan SupabaseClient.
- GradesScreen menggunakan GradeRepository.
- GradeRepository menggunakan SupabaseClient.
- LeaveRequestScreen menggunakan LeaveRepository.
- LeaveRepository menggunakan SupabaseClient.
- NotificationsScreen menggunakan NotificationRepository.
- ParentDashboardScreen menggunakan ParentRepository.
- ParentRepository menggunakan SupabaseClient.
- StudentsPage menggunakan StudentModal dan ResetFaceDialog.
- AdminDashboardPage menggunakan GeofenceSection dan AttendanceTimeSection.
- Admin web pages menggunakan SupabaseClient atau API routes.

## Catatan Penggambaran

Class diagram tidak perlu menggambar seluruh file. Pilih class dan komponen yang menunjukkan arsitektur utama.

Untuk membedakan jenis class, dapat gunakan stereotype:

- `<<screen>>` untuk halaman Flutter.
- `<<provider>>` untuk Riverpod provider/controller.
- `<<repository>>` untuk repository.
- `<<service>>` untuk service.
- `<<model>>` untuk data model.
- `<<component>>` untuk komponen admin web.
- `<<api route>>` untuk endpoint Next.js.
- `<<external>>` untuk Supabase, kamera, ML Kit, TFLite, dan SQLite.

Diagram akan lebih rapi jika mobile dan admin web tetap dalam satu diagram besar, tetapi dipisahkan oleh package.
