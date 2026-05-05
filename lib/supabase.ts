import { createBrowserClient } from '@supabase/ssr';

const SUPABASE_URL = 'https://euxzifpvelqwqhbudppt.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV1eHppZnB2ZWxxd3FoYnVkcHB0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzczMzgxMTgsImV4cCI6MjA5MjkxNDExOH0.NGx3x-uus2FuPeSKJwSgDB15_uEsBQ6OqBxf-Njnxws';

export const supabase = createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY);
