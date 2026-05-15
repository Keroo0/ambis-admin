import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/supabase-server';

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://euxzifpvelqwqhbudppt.supabase.co';

function getAdminClient() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new Error('SUPABASE_SERVICE_ROLE_KEY tidak dikonfigurasi');
  return createClient(SUPABASE_URL, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export async function POST(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const supabaseAdmin = getAdminClient();

  const { data: adminCheck } = await supabaseAdmin
    .from('users').select('role').eq('id', user.id).single();
  if (adminCheck?.role !== 'admin')
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await req.json() as {
    title: string;
    body: string;
    target: 'all' | 'class' | 'student';
    class?: string;
    student_id?: string;
  };

  const { title, body: msgBody, target } = body;

  if (!title?.trim() || !msgBody?.trim())
    return NextResponse.json({ error: 'Judul dan isi notifikasi wajib diisi' }, { status: 400 });

  let userIds: string[] = [];

  if (target === 'all') {
    const { data } = await supabaseAdmin
      .from('users').select('id').eq('role', 'siswa').eq('is_active', true);
    userIds = data?.map((u: { id: string }) => u.id) ?? [];
  } else if (target === 'class' && body.class) {
    const { data } = await supabaseAdmin
      .from('students').select('id').eq('class', body.class);
    userIds = data?.map((s: { id: string }) => s.id) ?? [];
  } else if (target === 'student' && body.student_id) {
    userIds = [body.student_id];
  }

  if (userIds.length === 0)
    return NextResponse.json({ error: 'Tidak ada siswa untuk target tersebut' }, { status: 400 });

  const now = new Date().toISOString();
  const notifications = userIds.map(uid => ({
    user_id: uid,
    type: 'announcement',
    title: title.trim(),
    body: msgBody.trim(),
    is_read: false,
    created_at: now,
  }));

  const { error } = await supabaseAdmin.from('notifications').insert(notifications);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ sent: userIds.length });
}
