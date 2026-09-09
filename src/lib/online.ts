import { createClient, type RealtimeChannel, type SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | null = null;

export function getSupabaseClient() {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  client ??= createClient(url, key);
  return client;
}

export function createRoomChannel(roomId: string): RealtimeChannel | null {
  const supabase = getSupabaseClient();
  return supabase?.channel(`aadu-puli-room:${roomId}`, {
    config: { broadcast: { self: true } },
  }) ?? null;
}
