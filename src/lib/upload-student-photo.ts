import { compressImage } from "@/lib/image";
import { createClient } from "@/lib/supabase/client";
import { STUDENT_PHOTOS_BUCKET, studentPhotoPath } from "@/lib/storage";

export async function uploadStudentPhoto(
  teacherId: string,
  classId: string,
  studentId: string,
  file: File,
) {
  const blob = await compressImage(file);
  const path = studentPhotoPath(teacherId, classId, studentId);
  const supabase = createClient();
  const { error } = await supabase.storage
    .from(STUDENT_PHOTOS_BUCKET)
    .upload(path, blob, {
      contentType: "image/jpeg",
      upsert: true,
    });

  if (error) {
    throw error;
  }

  return path;
}
