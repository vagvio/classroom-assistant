export const STUDENT_PHOTOS_BUCKET = "student-photos";

export function studentPhotoPath(
  teacherId: string,
  classId: string,
  studentId: string,
) {
  return `${teacherId}/${classId}/${studentId}.jpg`;
}

export function isStoragePath(value: string) {
  return !value.startsWith("http://") && !value.startsWith("https://");
}
