import { NextResponse, type NextRequest } from 'next/server';
import { createMiddlewareClient } from '@/lib/supabase-server';

export async function middleware(request: NextRequest) {
  const { supabase, response } = createMiddlewareClient(request);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isLoginPage = request.nextUrl.pathname === '/login';

  if (!user && !isLoginPage) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  if (user && isLoginPage) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
