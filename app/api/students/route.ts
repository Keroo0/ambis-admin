import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabaseAdmin = createClient(
  'https://euxzifpvelqwqhbudppt.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

export async function POST(req: NextRequest) {
  const body = await req.json() as {
    nisn: string;
    fullname: string;
    class: string;
    password: string;
  };

  const { nisn, fullname, class: studentClass, password } = body;

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

  const { error: userError } = await supabaseAdmin.from('users').insert({
    id: userId,
    nisn: nisn.trim(),
    fullname: fullname.trim(),
    email,
    role: 'siswa',
    is_active: true,
  });

  if (userError) {
    await supabaseAdmin.auth.admin.deleteUser(userId);
    return NextResponse.json({ error: userError.message }, { status: 500 });
  }

  const { error: studentError } = await supabaseAdmin.from('students').insert({
    id: userId,
    nisn: nisn.trim(),
    class: studentClass,
  });

  if (studentError) {
    await supabaseAdmin.auth.admin.deleteUser(userId);
    await supabaseAdmin.from('users').delete().eq('id', userId);
    return NextResponse.json({ error: studentError.message }, { status: 500 });
  }

  return NextResponse.json({ id: userId }, { status: 201 });
}
