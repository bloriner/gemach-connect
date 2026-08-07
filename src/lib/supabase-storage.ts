import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

export const storageClient = supabaseUrl && supabaseKey
  ? createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
  : null;

const BUCKET = "job-photos";
const MAX_SIZE = 10 * 1024 * 1024; // 10 MB

export async function uploadJobPhoto(
  file: File,
  workOrderId: string,
  userId: string,
  type: string,
): Promise<{ url: string; error?: string }> {
  if (!storageClient) {
    return { url: "", error: "Supabase storage not configured" };
  }

  if (file.size > MAX_SIZE) {
    return { url: "", error: "File too large (max 10MB)" };
  }

  const ext = file.name.split(".").pop() || "jpg";
  const path = `${workOrderId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

  const buffer = Buffer.from(await file.arrayBuffer());

  const { error: uploadErr } = await storageClient.storage
    .from(BUCKET)
    .upload(path, buffer, {
      contentType: file.type,
      upsert: false,
    });

  if (uploadErr) {
    console.error("[STORAGE] Upload failed:", uploadErr);
    return { url: "", error: uploadErr.message };
  }

  const { data: urlData } = storageClient.storage
    .from(BUCKET)
    .getPublicUrl(path);

  return { url: urlData.publicUrl };
}

export async function deleteJobPhoto(path: string): Promise<boolean> {
  if (!storageClient) return false;

  const { error } = await storageClient.storage
    .from(BUCKET)
    .remove([path]);

  return !error;
}
