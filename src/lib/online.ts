import { createClient, type RealtimeChannel, type SupabaseClient } from "@supabase/supabase-js";

// User's configured Supabase project credentials for online room sync
const USER_SUPABASE_URL = "https://zlujdghvdeedeytybacw.supabase.co";
const USER_SUPABASE_KEY = "sb_publishable_wFHMBEzQectyS32T3num8w_HVUbbI86";

let client: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient | null {
  const url =
    import.meta.env.VITE_SUPABASE_URL ||
    import.meta.env.NEXT_PUBLIC_SUPABASE_URL ||
    USER_SUPABASE_URL;

  const key =
    import.meta.env.VITE_SUPABASE_ANON_KEY ||
    import.meta.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    USER_SUPABASE_KEY;

  if (!url || !key) return null;
  try {
    client ??= createClient(url, key);
    return client;
  } catch {
    return null;
  }
}

export type RoomMessage = {
  type: "broadcast";
  event: string;
  payload: any;
};

export interface UnifiedRealtimeChannel {
  on(
    type: "broadcast",
    filter: { event: string },
    callback: (data: { payload: any }) => void,
  ): UnifiedRealtimeChannel;
  subscribe(callback?: (status: string) => void): UnifiedRealtimeChannel;
  send(message: RoomMessage): Promise<void>;
  unsubscribe(): Promise<void>;
}

export function createRoomChannel(roomId: string): UnifiedRealtimeChannel {
  const supabase = getSupabaseClient();
  const supabaseChannel = supabase
    ? supabase.channel(`aadu-puli-room:${roomId}`, {
        config: { broadcast: { self: true } },
      })
    : null;

  const localBc =
    typeof window !== "undefined" && "BroadcastChannel" in window
      ? new BroadcastChannel(`aadu-puli-room:${roomId}`)
      : null;

  const callbacks = new Map<string, Set<(data: { payload: any }) => void>>();

  if (localBc) {
    localBc.onmessage = (event) => {
      const { event: evtName, payload } = event.data || {};
      const handlers = callbacks.get(evtName);
      if (handlers) {
        handlers.forEach((fn) => fn({ payload }));
      }
    };
  }

  const wrapper: UnifiedRealtimeChannel = {
    on(type, filter, callback) {
      if (type === "broadcast" && filter.event) {
        if (!callbacks.has(filter.event)) {
          callbacks.set(filter.event, new Set());
        }
        callbacks.get(filter.event)?.add(callback);

        if (supabaseChannel) {
          supabaseChannel.on("broadcast" as any, filter as any, callback as any);
        }
      }
      return wrapper;
    },

    subscribe(callback) {
      if (supabaseChannel) {
        supabaseChannel.subscribe((status) => {
          callback?.(status);
        });
      } else {
        setTimeout(() => callback?.("SUBSCRIBED"), 50);
      }
      return wrapper;
    },

    async send(message) {
      if (localBc) {
        try {
          localBc.postMessage({ event: message.event, payload: message.payload });
        } catch {
          // ignore local bc errors
        }
      }
      if (supabaseChannel) {
        try {
          await supabaseChannel.send(message as any);
        } catch {
          // ignore supabase send errors
        }
      }
    },

    async unsubscribe() {
      if (localBc) {
        localBc.close();
      }
      if (supabaseChannel) {
        await supabaseChannel.unsubscribe();
      }
    },
  };

  return wrapper;
}
