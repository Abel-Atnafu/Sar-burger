// Supabase project connection.
// These are the safe public values — RLS policies and password-gated RPCs
// enforce all write security. The anon key is meant to live in the client.
export const SUPABASE_URL = 'https://plbxrvzkmxwabmbszrcm.supabase.co';
export const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsYnhydnprbXh3YWJtYnN6cmNtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY1NTE3NzcsImV4cCI6MjA5MjEyNzc3N30.JsPt2AWsu3uggxDbVi_8ndVRJBYlMVheNIRbZEkXc58';

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { persistSession: false },
});
