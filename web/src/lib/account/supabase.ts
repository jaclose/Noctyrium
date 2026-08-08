import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | null | undefined;
export function cloudConfigured(): boolean { return Boolean(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY); }
export function getSupabase(): SupabaseClient | null {
  if (client !== undefined) return client;
  if (!cloudConfigured()) return (client=null);
  client=createClient(import.meta.env.VITE_SUPABASE_URL,import.meta.env.VITE_SUPABASE_ANON_KEY,{
    auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true},
  });
  return client;
}
