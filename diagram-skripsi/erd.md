# ERD AMBIS

## Tujuan Diagram

ERD digunakan untuk menjelaskan struktur data pada sistem AMBIS dan hubungan antar tabel. ERD ini mencakup data yang digunakan oleh aplikasi mobile attendance di HP dan dashboard admin web.

Basis data utama berada di Supabase PostgreSQL. Pada aplikasi mobile, SQLite lokal hanya digunakan untuk menyimpan data face embedding agar proses pengenalan wajah tetap dapat berjalan lebih cepat dan mendukung kondisi offline terbatas.

## Entitas Utama

### 1. users

Tabel `users` menyimpan data akun pengguna sistem.

Atribut yang disarankan ditampilkan:

- id
- nisn
- fullname
- email
- phone
- role
- avatar_url
- is_active
- created_at
- updated_at

Role yang digunakan:

- siswa
- ortu
- admin

Relasi:

- Satu user dengan role siswa memiliki satu data student.
- Satu user dengan role orang tua dapat terhubung ke satu atau lebih siswa melalui `students.parent_id`.
- Satu user dengan role admin dapat menjadi pembuat atau pemeriksa data pada tabel tertentu, seperti `grades`, `leave_requests`, dan `audit_log`.

### 2. students

Tabel `students` menyimpan biodata siswa.

Atribut yang disarankan ditampilkan:

- id
- nisn
- class
- parent_id
- date_of_birth
- gender
- address
- phone_parent
- created_at
- updated_at

Relasi:

- `students.id` berelasi ke `users.id`.
- `students.parent_id` berelasi ke `users.id` milik orang tua.
- Satu siswa memiliki banyak data attendance.
- Satu siswa memiliki banyak data grades.
- Satu siswa memiliki banyak leave_requests.
- Satu siswa memiliki satu face_embeddings aktif.

### 3. face_embeddings

Tabel `face_embeddings` menyimpan data biometrik wajah dalam bentuk embedding, bukan foto mentah.

Atribut yang disarankan ditampilkan:

- id
- student_id
- embedding
- enrollment_date
- updated_at
- is_active
- synced_to_supabase jika ingin menampilkan konsep sync lokal

Catatan:

- Embedding berasal dari proses face recognition.
- Dalam implementasi saat ini embedding menggunakan output MobileFaceNet 192 dimensi.
- Di aplikasi HP, data ini juga disimpan di SQLite lokal.

Relasi:

- Satu siswa memiliki satu face embedding aktif.
- `face_embeddings.student_id` mengarah ke `students.id`.

### 4. attendance

Tabel `attendance` menyimpan data presensi siswa.

Atribut yang disarankan ditampilkan:

- id
- student_id
- date
- time_in
- time_out
- status
- is_within_geofence
- liveness_verified
- face_match_score
- location_lat
- location_lng
- device_id
- notes
- created_at
- updated_at

Status yang dapat digunakan:

- present
- absent
- late
- leave
- sick

Relasi:

- Satu siswa memiliki banyak data attendance.
- `attendance.student_id` mengarah ke `students.id`.
- Data attendance dibaca oleh siswa, orang tua, dan admin.

### 5. grades

Tabel `grades` menyimpan nilai siswa.

Atribut yang disarankan ditampilkan:

- id
- student_id
- subject
- type
- score
- semester
- year
- inputted_by
- created_at
- updated_at

Relasi:

- Satu siswa memiliki banyak nilai.
- `grades.student_id` mengarah ke `students.id`.
- `grades.inputted_by` mengarah ke `users.id` milik admin.

### 6. leave_requests

Tabel `leave_requests` menyimpan pengajuan izin atau sakit.

Atribut yang disarankan ditampilkan:

- id
- student_id
- attendance_id
- type
- reason
- attachment_url
- status
- rejected_reason
- reviewed_by
- reviewed_at
- date_from
- date_to
- created_at
- updated_at

Status:

- pending
- approved
- rejected

Relasi:

- Satu siswa memiliki banyak pengajuan izin/sakit.
- `leave_requests.student_id` mengarah ke `students.id`.
- `leave_requests.attendance_id` dapat mengarah ke `attendance.id`.
- `leave_requests.reviewed_by` mengarah ke `users.id` milik admin.

### 7. settings

Tabel `settings` menyimpan konfigurasi sistem yang dapat diatur admin.

Atribut yang disarankan ditampilkan:

- key
- value
- type
- updated_at

Contoh data:

- face_recognition_threshold
- geofence_enabled
- geofence_radius
- school_lat
- school_lng
- time_in_start
- time_in_end
- time_out_start
- time_out_end

Relasi:

- Tabel ini tidak harus memiliki relasi foreign key ke tabel lain.
- Tabel ini digunakan oleh aplikasi mobile saat validasi presensi.
- Tabel ini dikelola melalui dashboard admin.

### 8. notifications

Tabel `notifications` menyimpan notifikasi untuk pengguna.

Atribut yang disarankan ditampilkan:

- id
- user_id
- type
- title
- body
- is_read
- created_at

Tipe notifikasi:

- attendance
- grade
- leave
- announcement
- system

Relasi:

- Satu user memiliki banyak notification.
- `notifications.user_id` mengarah ke `users.id`.

### 9. notification_preferences

Tabel `notification_preferences` menyimpan preferensi notifikasi pengguna.

Atribut yang disarankan ditampilkan:

- user_id
- attendance
- grade
- leave
- announcement
- system
- updated_at

Relasi:

- Satu user memiliki satu notification preference.
- `notification_preferences.user_id` mengarah ke `users.id`.

### 10. audit_log

Tabel `audit_log` menyimpan catatan aktivitas admin.

Atribut yang disarankan ditampilkan:

- id
- admin_id
- action
- entity_type
- entity_id
- old_value
- new_value
- ip_address
- created_at

Relasi:

- Satu admin memiliki banyak audit log.
- `audit_log.admin_id` mengarah ke `users.id`.
- `entity_id` dapat merujuk ke data yang berubah, seperti student, grade, leave request, attendance, atau face embedding.

## Relasi dan Kardinalitas

Gunakan relasi berikut saat menggambar ERD:

### users ke students

`users.id` ke `students.id`

Kardinalitas:

- 1 user siswa memiliki 1 student.
- 1 student dimiliki oleh 1 user siswa.

### users orang tua ke students

`users.id` ke `students.parent_id`

Kardinalitas:

- 1 orang tua dapat memiliki banyak siswa.
- 1 siswa dapat memiliki 0 atau 1 orang tua yang terhubung.

### students ke face_embeddings

`students.id` ke `face_embeddings.student_id`

Kardinalitas:

- 1 siswa memiliki 0 atau 1 face embedding aktif.
- 1 face embedding hanya milik 1 siswa.

### students ke attendance

`students.id` ke `attendance.student_id`

Kardinalitas:

- 1 siswa memiliki banyak attendance.
- 1 attendance hanya milik 1 siswa.

### students ke grades

`students.id` ke `grades.student_id`

Kardinalitas:

- 1 siswa memiliki banyak grades.
- 1 grade hanya milik 1 siswa.

### students ke leave_requests

`students.id` ke `leave_requests.student_id`

Kardinalitas:

- 1 siswa memiliki banyak leave request.
- 1 leave request hanya milik 1 siswa.

### attendance ke leave_requests

`attendance.id` ke `leave_requests.attendance_id`

Kardinalitas:

- 1 attendance dapat memiliki 0 atau 1 leave request.
- 1 leave request dapat terkait ke 0 atau 1 attendance.

### users admin ke grades

`users.id` ke `grades.inputted_by`

Kardinalitas:

- 1 admin dapat menginput banyak grade.
- 1 grade dapat diinput oleh 0 atau 1 admin.

### users admin ke leave_requests

`users.id` ke `leave_requests.reviewed_by`

Kardinalitas:

- 1 admin dapat memeriksa banyak leave request.
- 1 leave request diperiksa oleh 0 atau 1 admin.

### users ke notifications

`users.id` ke `notifications.user_id`

Kardinalitas:

- 1 user memiliki banyak notification.
- 1 notification hanya untuk 1 user.

### users ke notification_preferences

`users.id` ke `notification_preferences.user_id`

Kardinalitas:

- 1 user memiliki 0 atau 1 notification preference.
- 1 notification preference hanya milik 1 user.

### users admin ke audit_log

`users.id` ke `audit_log.admin_id`

Kardinalitas:

- 1 admin memiliki banyak audit log.
- 1 audit log dicatat untuk 1 admin.

## Catatan untuk Menggambar ERD

Untuk skripsi, tampilkan entitas utama saja agar diagram tidak terlalu padat. Prioritaskan:

- users
- students
- face_embeddings
- attendance
- grades
- leave_requests
- settings
- notifications
- notification_preferences
- audit_log

Jika diagram terlalu ramai, `settings` boleh digambar sebagai tabel konfigurasi terpisah tanpa relasi. `audit_log` juga dapat digambar sebagai tabel pendukung yang berelasi ke admin.

Pisahkan konsep penyimpanan seperti ini:

- Supabase sebagai database utama.
- SQLite lokal hanya untuk `face_embeddings` di aplikasi HP.

Jangan menggambar foto wajah sebagai data yang disimpan, karena sistem menyimpan embedding wajah, bukan foto mentah permanen.
