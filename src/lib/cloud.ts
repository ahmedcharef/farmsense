import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";

// Shared online copy so every phone sees the same records.
export async function loadState<T>(key: "passport" | "drying-beds"): Promise<T | null> {
  const { data, error } = await supabase.from("shared_state").select("data").eq("key", key).maybeSingle();
  if (error) throw error;
  return (data?.data as T) ?? null;
}

export async function saveState(key: "passport" | "drying-beds", value: unknown) {
  const { error } = await supabase.from("shared_state").upsert({ key, data: value as Json, updated_at: new Date().toISOString() });
  if (error) throw error;
}

export async function loadDryingEvents<T>(): Promise<T[]> {
  const { data, error } = await supabase.from("drying_events").select("payload").order("created_at");
  if (error) throw error;
  return (data ?? []).map((r) => r.payload as T);
}

export async function appendDryingEvents(events: { id: string }[]) {
  if (!events.length) return;
  const { error } = await supabase.from("drying_events").upsert(events.map((e) => ({ id: e.id, payload: e as unknown as Json })), { onConflict: "id", ignoreDuplicates: true });
  if (error) throw error;
}

export async function uploadPhoto(file: File, folder: string): Promise<string> {
  const ext = file.name.split(".").pop() || "jpg";
  const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const { error } = await supabase.storage.from("photos").upload(path, file, { contentType: file.type });
  if (error) throw error;
  const { data, error: e2 } = await supabase.storage.from("photos").createSignedUrl(path, 60 * 60 * 24 * 365 * 5);
  if (e2 || !data) throw e2 ?? new Error("No photo link");
  return data.signedUrl;
}
