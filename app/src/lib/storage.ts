import { supabase } from "./db";

const BUCKET = process.env.SUPABASE_BUCKET || "proofs";

export async function uploadProof(args: {
  slug: string;
  buffer: Buffer;
  mediaType: string;
}): Promise<string> {
  if (!supabase) throw new Error("Supabase not configured");
  const ext = args.mediaType.split("/")[1] ?? "jpg";
  const path = `${args.slug}/${Date.now()}.${ext}`;
  const { error } = await supabase.storage.from(BUCKET).upload(
    path,
    args.buffer,
    {
      contentType: args.mediaType,
      cacheControl: "31536000",
      upsert: false,
    }
  );
  if (error) throw error;
  return path;
}

export async function createProofSignedUrl(
  path: string,
  expiresInSeconds = 60 * 60
): Promise<string> {
  if (!supabase) throw new Error("Supabase not configured");
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(path, expiresInSeconds);
  if (error) throw error;
  return data.signedUrl;
}
