import { createHash, randomUUID } from 'crypto';
import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/supabase-server';

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://euxzifpvelqwqhbudppt.supabase.co';

function getAdminClient() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY tidak dikonfigurasi');
  }
  return createClient(SUPABASE_URL, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

function _uuid(): string {
  return randomUUID();
}

export async function POST(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabaseAdmin = getAdminClient();

  const { data: adminCheck } = await supabaseAdmin
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  if (adminCheck?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await req.json() as {
    nisn: string;
    fullname: string;
    class: string;
    password: string;
    homeroom_teacher?: string | null;
    parent?: {
      fullname: string;
      email: string;
      phone?: string;
      password: string;
    };
  };

  const { nisn, fullname, class: studentClass, password, homeroom_teacher } = body;

  if (!nisn?.trim() || !fullname?.trim() || !studentClass || !password) {
    return NextResponse.json({ error: 'Semua field wajib diisi' }, { status: 400 });
  }
  if (password.length < 6) {
    return NextResponse.json({ error: 'Password minimal 6 karakter' }, { status: 400 });
  }

  const { data: existing } = await supabaseAdmin
    .from('users')
    .select('id')
    .eq('nisn', nisn.trim())
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ error: 'NISN sudah terdaftar' }, { status: 409 });
  }

  const email = `${nisn.trim()}@sman07.local`;

  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (authError || !authData.user) {
    return NextResponse.json(
      { error: authError?.message ?? 'Gagal membuat akun auth' },
      { status: 500 }
    );
  }

  const userId = authData.user.id;
  const now = Date.now();

  const { error: userError } = await supabaseAdmin.from('users').insert({
    id: userId,
    nisn: nisn.trim(),
    fullname: fullname.trim(),
    email,
    role: 'siswa',
    is_active: true,
    password_hash: createHash('sha256').update(password).digest('hex'),
    created_at: now,
    updated_at: now,
  });

  if (userError) {
    await supabaseAdmin.auth.admin.deleteUser(userId);
    return NextResponse.json({ error: userError.message }, { status: 500 });
  }

  const { error: studentError } = await supabaseAdmin.from('students').insert({
    id: userId,
    nisn: nisn.trim(),
    class: studentClass,
    homeroom_teacher: homeroom_teacher ?? null,
    created_at: now,
    updated_at: now,
  });

  if (studentError) {
    await supabaseAdmin.auth.admin.deleteUser(userId);
    await supabaseAdmin.from('users').delete().eq('id', userId);
    return NextResponse.json({ error: studentError.message }, { status: 500 });
  }

  // Handle parent account creation if requested
  if (body.parent) {
    // Check if parent email is already taken
    const { data: existingParent } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('email', body.parent.email.trim())
      .maybeSingle();

    if (existingParent) {
      // Rollback student
      await supabaseAdmin.auth.admin.deleteUser(userId);
      await supabaseAdmin.from('users').delete().eq('id', userId);
      return NextResponse.json({ error: 'Email orang tua sudah dipakai' }, { status: 409 });
    }

    // Create auth user for parent
    const { data: parentAuth, error: parentAuthError } = await supabaseAdmin.auth.admin.createUser({
      email: body.parent.email.trim(),
      password: body.parent.password,
      email_confirm: true,
    });

    if (parentAuthError || !parentAuth.user) {
      // Rollback
      await supabaseAdmin.auth.admin.deleteUser(userId);
      await supabaseAdmin.from('users').delete().eq('id', userId);
      return NextResponse.json({ error: 'Gagal membuat akun orang tua' }, { status: 500 });
    }

    const parentId = parentAuth.user.id;

    // Insert into users table
    const { error: parentUserError } = await supabaseAdmin.from('users').insert({
      id: parentId,
      nisn: `PARENT-${parentId.slice(0, 8)}`,
      fullname: body.parent.fullname.trim(),
      email: body.parent.email.trim(),
      phone: body.parent.phone?.trim() ?? null,
      role: 'ortu',
      is_active: true,
      password_hash: createHash('sha256').update(body.parent.password).digest('hex'),
      created_at: now,
      updated_at: now,
    });

    if (parentUserError) {
      // Rollback all
      await supabaseAdmin.auth.admin.deleteUser(parentId);
      await supabaseAdmin.auth.admin.deleteUser(userId);
      await supabaseAdmin.from('users').delete().eq('id', userId);
      return NextResponse.json({ error: parentUserError.message }, { status: 500 });
    }

    // Link parent to student
    await supabaseAdmin
      .from('students')
      .update({ parent_id: parentId })
      .eq('id', userId);

    // Audit log
    try {
      await supabaseAdmin.from('audit_log').insert({
        id: _uuid(),
        admin_id: user.id,
        action: 'create_parent',
        entity_type: 'parent',
        entity_id: parentId,
        new_value: JSON.stringify({ linked_student_id: userId, fullname: body.parent.fullname }),
        created_at: now,
      });
    } catch (_) { /* non-blocking */ }
  }

  return NextResponse.json({ id: userId }, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabaseAdmin = getAdminClient();

  const { data: adminCheck } = await supabaseAdmin
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  if (adminCheck?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await req.json() as { id?: string };
  const { id } = body;

  if (!id) {
    return NextResponse.json({ error: 'id wajib diisi' }, { status: 400 });
  }

  // Hapus dari Supabase Auth — abaikan jika tidak ada akun auth
  // (siswa yang diinput langsung ke DB mungkin tidak punya akun auth)
  const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(id);
  if (authError && !authError.message.toLowerCase().includes('not found')) {
    return NextResponse.json({ error: authError.message }, { status: 500 });
  }

  // Hapus dari public.users — akan cascade ke students, attendance, grades,
  // leave_requests, dan face_embeddings sesuai FK ON DELETE CASCADE
  const { error: dbError } = await supabaseAdmin.from('users').delete().eq('id', id);
  if (dbError) {
    return NextResponse.json({ error: dbError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true }, { status: 200 });
}
