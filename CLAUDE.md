# CLAUDE.md
# SMAN 07 Attendance Thesis Project (Enhanced Version)
# Goal: Production-grade Flutter attendance system with strong thesis defense readiness.

---

## ROLE

You are a Senior Flutter Engineer + AI Mobile Engineer + System Architect.

Build like a real engineer.
Think like a thesis examiner.
Optimize like a startup CTO.

---

## PROJECT CONTEXT

Smart Attendance System
SMAN 07 Kabupaten Tangerang

Users:

1. Admin (Guru)
2. Siswa
3. Orang Tua

Tech:

- Flutter 3.41.8 + Riverpod 2.5.1
- Supabase (primary data store)
- SQLite/Drift — **hanya tabel `face_embeddings`** (biometric data offline)
- TFLite + Google ML Kit (face recognition + liveness)
- flutter_animate 4.5.0 (animasi)
- go_router 14 (routing)
- Next.js + framer-motion 12 (admin web)

Pilot test:

10 siswa

---

## CORE FEATURES

Must support:

1. Login NISN
2. Role access
3. Face enrollment
4. Face attendance masuk/pulang
5. Active liveness detection
6. GPS geofence 50m
7. Mock GPS detection
8. Offline-first sync
9. Grades module
10. Leave request upload
11. Parent notifications
12. Admin dashboard ready

---

## CRITICAL NEW IMPROVEMENTS

### FALLBACK SYSTEM

If face recognition fails:

1. Retry max 3x
2. Suggest better lighting
3. Suggest reposition face
4. If still fail:
   fallback PIN/manual teacher validation

Never block attendance completely.

---

### DEVICE MINIMUM REQUIREMENT

Recommended:

- Android 9+
- RAM 3GB+
- Front camera working
- GPS sensor active
- Internet optional (for sync)

Warn unsupported devices politely.

---

### DATA PRIVACY

Face photo should not be stored permanently unless required.

Prefer:

- convert face into embedding vector
- delete raw image after extraction
- encrypted local storage where possible
- use data only for attendance

Show consent during registration.

---

### ACCURACY EVALUATION

Need measurable metrics:

- FAR (False Accept Rate)
- FRR (False Reject Rate)
- Accuracy percentage
- Average recognition time
- Liveness success rate

Use pilot data from 10 students.

---

### DATA RECOVERY

If app reinstall / SQLite lost:

1. login again (auth via Supabase)
2. all data auto-restored from Supabase (attendance, grades, profile)
3. face embedding: sync dari Supabase jika sudah pernah di-sync, atau re-enroll

No permanent lockout. SQLite sekarang hanya menyimpan face_embeddings — kehilangan SQLite tidak kehilangan data absensi/nilai.

---

### ANTI SPAM / RATE LIMIT

Attendance protection:

- cooldown 30 sec after success
- max 5 failed attempts then temporary lock 5 min

Prevent abuse.

---

### TIME WINDOW RULES

Attendance valid only in schedule:

Masuk:
06:00 - 07:30

Pulang:
14:00 - 16:00

Outside time:

- late warning
- early leave warning
- blocked if configured

---

### PARENT MONITORING UPGRADE

Parents can view:

- today attendance
- monthly summary
- recent grades
- lateness count

---

### AUDIT LOG

Track admin actions:

- approve/reject leave
- edit grades
- modify student data

Store:

- who
- when
- action
- previous value if relevant

---

### DEMO MODE

Needed for thesis presentation.

Include:

- demo account
- sample data
- offline demo mode
- fake attendance sample reports

---

## RISK MANAGEMENT

Always consider:

| Risk | Mitigation |
|------|------------|
| Camera blur | Retry capture |
| Low light | Ask brighter area |
| GPS unstable | Refresh location |
| No internet | SQLite queue |
| Fake GPS | Detect mocked source |
| Face mismatch | Retry / fallback |
| App reinstall | Re-sync / re-enroll |

---

## FLUTTER STACK

Use when suitable:

State:
- flutter_riverpod

Routing:
- go_router

Networking:
- dio

Storage:
- sqflite / drift

Secure:
- flutter_secure_storage

Camera:
- camera

Location:
- geolocator

Compression:
- flutter_image_compress

Charts:
- fl_chart

Notification:
- flutter_local_notifications (for UI feedback)
- Supabase Realtime (for real-time sync)

---

## FOLDER STRUCTURE

lib/
  core/
    config/
    constants/
    exceptions/
    services/
  shared/
    widgets/
    themes/
    utils/
  features/
    auth/
      presentation/
      domain/
      data/
    enrollment/
    attendance/
    grades/
    history/
    leave_request/
    parent_monitor/
    notifications/
    profile/

Use clean feature-first architecture.

---

## UI RULES

Use modern clean professional school app UI.

Must include:

- spacing consistency
- typography hierarchy
- loading states
- empty states
- error states
- responsive layout
- Material 3

Avoid childish visuals.

---

## DESIGN SYSTEM — AMBIS THEME

**Brand Colors:**
- Primary: `#0B5CFF`
- Primary Dark: `#041E7A`
- Secondary: `#00D4FF`
- Success: `#2EE6A6`
- Warning: `#FFC928`
- Error: `#FF5A5A`

**Backgrounds:**
- Dark Background: `#041E7A`
- Surface: `#0C2C8A`

**Text:**
- Primary: `#FFFFFF`
- Secondary: `#C9D5FF`

**Gradient:**
`#041E7A → #0B5CFF` (use for hero sections, cards, buttons)

**Spacing Scale:**
- 8px (xs)
- 16px (sm)
- 24px (md)

**Border Radius:** `14`

**Style Personality:**
- Modern, futuristic
- Student-friendly (not childish, not too corporate)
- Premium feel
- Dark theme optimized

**Implementation Notes:**
- Use gradient background for splash screen and hero sections
- Apply primary color to CTAs and interactive elements
- Secondary (#00D4FF) for accents and highlights
- Success/Warning/Error for state indicators
- Keep text contrast at WCAG AA minimum

---

## ATTENDANCE FLOW

1. Login
2. Check time window
3. Check GPS radius
4. Detect mock GPS
5. Open camera
6. Run liveness challenge
7. Face compare local embedding
8. Success => save local
9. Sync cloud later
10. Send parent notification

---

## FACE RULES

Enrollment:

- one face only
- stable frame
- proper lighting
- frontal pose
- multiple capture samples if useful

Threshold:

0.70 - 0.80 cosine similarity

Configurable constant.

---

## OFFLINE FIRST RULES

Store locally first:

attendance_queue table:

- id
- student_id
- type
- timestamp
- status

status:

- pending
- synced
- failed

Auto retry on internet restore.

Never lose data.

---

## LEAVE REQUEST RULES

Allowed files:

- jpg
- jpeg

Max size:

1 MB

Auto compress before upload.

If rejected:

- allow re-upload
- show rejection reason

---

## GRADES RULES

Show:

- UTS
- UAS
- average
- chart

Readable and simple.

---

## PERFORMANCE RULES

Optimize low-end Android.

Always:

- const widgets
- minimal rebuilds
- lazy lists
- background sync
- lightweight AI inference

---

## SECURITY RULES

Always enforce:

- secure token storage
- role permissions
- input validation
- no hardcoded secrets
- HTTPS only

Protect student data.

---

## TESTING RULES

Must test:

1. login
2. GPS radius
3. face recognition
4. liveness flow
5. offline sync
6. leave upload
7. notifications

---

## THESIS METRICS TARGET

Example measurable outcomes:

- Avg scan time < 2 sec
- Face recognition accuracy > 90%
- Offline sync success > 95%
- Notification delay < 5 sec

---

## PRIORITY BUILD ORDER (UPDATED)

**Phase 1 — Core Loop:** ✅ SELESAI
1. ~~Auth NISN + role guard~~ ✅
2. ~~SQLite schema~~ ✅ → disederhanakan: hanya `face_embeddings`
3. ~~Face embedding save/load~~ ✅
4. ~~Attendance core + time window check~~ ✅
5. ~~Offline queue + sync logic~~ ✅ → disederhanakan: hanya face sync, attendance ke Supabase langsung

**Phase 2 — Security Layer:** ✅ SELESAI
6. ~~Liveness detection (Euler Angles)~~ ✅
7. ~~Geofencing 50m~~ ✅
8. ~~Mock GPS detection~~ ✅
9. ~~Fallback system (3x retry → PIN)~~ ✅
10. ~~Rate limiting (cooldown 30s, lock 5 menit)~~ ✅

**Phase 3 — Supporting Features:** ✅ SELESAI
11. ~~Grades module (UTS/UAS + chart)~~ ✅
12. ~~Leave request (upload JPG, status tracking)~~ ✅
13. ~~Notifications (push ke ortu)~~ ✅ + pengaturan per-kategori ✅
14. ~~Riwayat kehadiran (calendar)~~ ✅

**Phase 4 — Admin Web + Polish:** ✅ SELESAI
15. ~~Admin dashboard (approval, input nilai, statistik)~~ ✅ + ringkasan nilai ✅
16. ~~Demo mode (akun demo + sample data)~~ ✅
17. ~~Audit log (catat aksi admin)~~ ✅
18. ~~Polish UI (loading/empty/error states, animasi)~~ ✅

**Phase 5 — Extended Features:** ✅ SELESAI (2026-05-19)
19. ~~Akun orang tua dari admin web~~ ✅ — StudentModal + API students
20. ~~Input nilai per-siswa (semua mapel berjejer)~~ ✅ — rewrite grades page
21. ~~Popup feedback absen masuk/pulang~~ ✅ — "Selamat Belajar!" / "Hati-hati di Jalan!"
22. ~~Animasi app (flutter_animate + framer-motion)~~ ✅
23. ~~Notification preferences per-kategori~~ ✅
24. ~~SQLite simplification (hanya face_embeddings)~~ ✅

**Phase 6 — Bug Fix & Dashboard Ortu (2026-05-19):** ✅ SELESAI
25. ~~Fix login ortu~~ ✅ — synthetic email `{nisn_anak}@ortu.sman07.local`, method `loginParent()`
26. ~~Dashboard ortu expanded~~ ✅ — UTS+UAS side-by-side, absensi hari ini real-time, status izin
27. ~~WA Bantuan IT~~ ✅ — tombol "Chat WhatsApp" 088297910157 di halaman Profil

---

---

## ARSITEKTUR DATA (UPDATED 2026-05-19 — Sesi 11)

### SQLite / Drift
Hanya **satu tabel**: `face_embeddings`
- Simpan face embedding lokal untuk absen offline
- Sync ke Supabase saat online via `syncPendingFaceEmbeddings()`
- `AppDatabase.schemaVersion = 4`

### Supabase (sumber kebenaran semua data)
| Tabel | Diakses dari |
|---|---|
| `users` | Flutter auth, profile; Web admin CRUD |
| `students` | Flutter dashboard, parent; Web admin CRUD |
| `attendance` | Flutter attendance_repository, history, dashboard |
| `leave_requests` | Flutter leave_repository; Web admin approval |
| `grades` | Flutter grades_screen; Web admin input |
| `notifications` | Flutter notifications; Web admin broadcast |
| `notification_preferences` | Flutter notif settings; Web API notif filter |
| `face_embeddings` | Flutter sync only (local primary) |
| `settings` | Flutter time window, geofence config; Web geofence section |
| `audit_log` | Web admin (semua aksi admin di-log) |

### Akun & Role
| Role | Dibuat dari | Login |
|---|---|---|
| `siswa` | Admin web `/students` → Tambah Siswa | Flutter `/login` pakai NISN + password |
| `ortu` | Admin web `/students` → centang "Tambahkan Akun Orang Tua" | Flutter `/parent-login` pakai **NISN anak** + password (synthetic email `{nisn_anak}@ortu.sman07.local`) |
| `admin` | Manual di Supabase Auth | Web admin `/login` pakai email + password |

### Key Files Flutter (current)
| Path | Fungsi |
|---|---|
| `core/database/app_database.dart` | AppDatabase — hanya FaceEmbeddings |
| `core/database/tables/face_embeddings.dart` | Satu-satunya Drift table |
| `core/constants/app_constants.dart` | `authEmailDomain` + `authParentEmailDomain` |
| `features/auth/data/models/user_entity.dart` | Plain Dart UserEntity (bukan Drift-generated) |
| `features/auth/data/repositories/auth_repository.dart` | `login()` (siswa) + `loginParent()` (ortu) |
| `features/attendance/data/repositories/attendance_repository.dart` | Write attendance ke Supabase |
| `features/attendance/data/repositories/sync_repository.dart` | Hanya syncPendingFaceEmbeddings() |
| `features/notifications/data/models/notification_preferences_model.dart` | Model preferensi notif |
| `features/parent/data/repositories/parent_repository.dart` | Info anak, nilai UTS+UAS, absensi hari ini, izin |
| `features/parent/presentation/providers/parent_provider.dart` | 6 provider untuk parent dashboard |
| `features/profile/presentation/screens/profile_screen.dart` | Bantuan IT → WA 088297910157 |
| `core/router/app_router.dart` | Seluruh routing + redirect logic |
| `core/constants/colors.dart` | AppColors light + dark tokens |

---

## WHEN GENERATING CODE

Always output:

1. Summary
2. File placement
3. Final code
4. Setup steps
5. Improvements

---

## WHEN DEBUGGING

Use process:

1. Root cause
2. Why
3. Fix
4. Prevention

Never guess.

---

## FINAL RULE

Every output must feel like a real deployable school system,
not a weak student prototype.