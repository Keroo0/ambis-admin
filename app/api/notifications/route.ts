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

type NotificationType = 'attendance' | 'grade' | 'leave' | 'announcement' | 'system';

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
    type?: NotificationType;
    target: 'all' | 'class' | 'student';
    class?: string;
    student_id?: string;
  };

  const { title, body: msgBody, target } = body;
  const type: NotificationType = body.type ?? 'announcement';

  if (!title?.trim() || !msgBody?.trim())
    return NextResponse.json({ error: 'Judul dan isi notifikasi wajib diisi' }, { status: 400 });

  const userIds = new Set<string>();

  if (target === 'all') {
    const { data } = await supabaseAdmin
      .from('users')
      .select('id')
      .in('role', ['siswa', 'ortu'])
      .eq('is_active', true);
    data?.forEach((u: { id: string }) => userIds.add(u.id));
  } else if (target === 'class' && body.class) {
    const { data } = await supabaseAdmin
      .from('students')
      .select('id, parent_id')
      .eq('class', body.class);
    data?.forEach((s: { id: string; parent_id: string | null }) => {
      userIds.add(s.id);
      if (s.parent_id) userIds.add(s.parent_id);
    });
  } else if (target === 'student' && body.student_id) {
    userIds.add(body.student_id);
    const { data } = await supabaseAdmin
      .from('students')
      .select('parent_id')
      .eq('id', body.student_id)
      .maybeSingle();
    if (data?.parent_id) userIds.add(data.parent_id);
  }

  const recipientIds = [...userIds];

  if (recipientIds.length === 0)
    return NextResponse.json({ error: 'Tidak ada pengguna untuk target tersebut' }, { status: 400 });

  // Filter out users who have disabled this notification type in their preferences
  const { data: prefs } = await supabaseAdmin
    .from('notification_preferences')
    .select('user_id, attendance, grade, leave, announcement, system')
    .in('user_id', recipientIds);

  const disabledUsers = new Set(
    (prefs ?? [])
      .filter((p: Record<string, unknown>) => p[type] === false)
      .map((p: { user_id: string }) => p.user_id)
  );

  const filteredUserIds = recipientIds.filter((uid: string) => !disabledUsers.has(uid));

  if (filteredUserIds.length === 0)
    return NextResponse.json({ sent: 0, message: 'Semua pengguna menonaktifkan tipe notifikasi ini' });

  const now = new Date().toISOString();
  const notifications = filteredUserIds.map(uid => ({
    user_id: uid,
    type,
    title: title.trim(),
    body: msgBody.trim(),
    is_read: false,
    created_at: now,
  }));

  const { error } = await supabaseAdmin.from('notifications').insert(notifications);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ sent: filteredUserIds.length });
}
