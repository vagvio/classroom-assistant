import { createClient } from "@/lib/supabase/server";
import { STUDENT_PHOTOS_BUCKET, isStoragePath } from "@/lib/storage";

const PHOTO_SIGNED_URL_SECONDS = 60 * 60;

export async function resolveStudentPhotoUrl(photoUrl: string | null) {
  if (!photoUrl) return null;
  if (!isStoragePath(photoUrl)) return photoUrl;

  const supabase = await createClient();
  const { data } = await supabase.storage
    .from(STUDENT_PHOTOS_BUCKET)
    .createSignedUrl(photoUrl, PHOTO_SIGNED_URL_SECONDS);

  return data?.signedUrl ?? null;
}
