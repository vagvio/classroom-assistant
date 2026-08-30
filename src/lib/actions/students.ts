"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { STUDENT_PHOTOS_BUCKET, isStoragePath } from "@/lib/storage";

export type StudentActionResult = {
  error?: string;
  studentId?: string;
};

async function getAuthenticatedClient() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { supabase, user: null, error: "Πρέπει να είστε συνδεδεμένοι." };
  }

  return { supabase, user, error: null };
}

export async function createStudent(
  classId: string,
  firstName: string,
  lastName: string,
): Promise<StudentActionResult> {
  const first = firstName.trim();
  const last = lastName.trim();

  if (!first || !last) {
    return { error: "Συμπληρώστε όνομα και επίθετο." };
  }

  const { supabase, error } = await getAuthenticatedClient();
  if (error) return { error };

  const { data, error: insertError } = await supabase
    .from("students")
    .insert({
      class_id: classId,
      first_name: first,
      last_name: last,
    })
    .select("id")
    .single();

  if (insertError || !data) {
    return { error: "Δεν ήταν δυνατή η προσθήκη του μαθητή." };
  }

  revalidatePath(`/dashboard/class/${classId}`);
  revalidatePath("/dashboard");
  return { studentId: data.id };
}

export async function updateStudent(
  classId: string,
  studentId: string,
  firstName: string,
  lastName: string,
): Promise<StudentActionResult> {
  const first = firstName.trim();
  const last = lastName.trim();

  if (!first || !last) {
    return { error: "Συμπληρώστε όνομα και επίθετο." };
  }

  const { supabase, error } = await getAuthenticatedClient();
  if (error) return { error };

  const { error: updateError } = await supabase
    .from("students")
    .update({
      first_name: first,
      last_name: last,
    })
    .eq("id", studentId)
    .eq("class_id", classId);

  if (updateError) {
    return { error: "Δεν ήταν δυνατή η ενημέρωση του μαθητή." };
  }

  revalidatePath(`/dashboard/class/${classId}`);
  revalidatePath("/dashboard");
  return { studentId };
}

export async function clearStudentPhoto(
  classId: string,
  studentId: string,
): Promise<StudentActionResult> {
  const { supabase, error } = await getAuthenticatedClient();
  if (error) return { error };

  const { data: student } = await supabase
    .from("students")
    .select("photo_url")
    .eq("id", studentId)
    .eq("class_id", classId)
    .maybeSingle();

  if (student?.photo_url && isStoragePath(student.photo_url)) {
    await supabase.storage
      .from(STUDENT_PHOTOS_BUCKET)
      .remove([student.photo_url]);
  }

  const { error: updateError } = await supabase
    .from("students")
    .update({ photo_url: null })
    .eq("id", studentId)
    .eq("class_id", classId);

  if (updateError) {
    return { error: "Δεν ήταν δυνατή η αφαίρεση της φωτογραφίας." };
  }

  revalidatePath(`/dashboard/class/${classId}`);
  return { studentId };
}

export async function saveStudentPhoto(
  classId: string,
  studentId: string,
  photoPath: string,
): Promise<StudentActionResult> {
  const { supabase, error } = await getAuthenticatedClient();
  if (error) return { error };

  const { error: updateError } = await supabase
    .from("students")
    .update({ photo_url: photoPath })
    .eq("id", studentId)
    .eq("class_id", classId);

  if (updateError) {
    return { error: "Ο μαθητής αποθηκεύτηκε, αλλά όχι η φωτογραφία." };
  }

  revalidatePath(`/dashboard/class/${classId}`);
  return { studentId };
}

export async function deleteStudent(
  classId: string,
  studentId: string,
): Promise<StudentActionResult> {
  const { supabase, error } = await getAuthenticatedClient();
  if (error) return { error };

  const { data: student } = await supabase
    .from("students")
    .select("photo_url")
    .eq("id", studentId)
    .eq("class_id", classId)
    .maybeSingle();

  if (student?.photo_url && isStoragePath(student.photo_url)) {
    await supabase.storage
      .from(STUDENT_PHOTOS_BUCKET)
      .remove([student.photo_url]);
  }

  const { error: deleteError } = await supabase
    .from("students")
    .delete()
    .eq("id", studentId)
    .eq("class_id", classId);

  if (deleteError) {
    return { error: "Δεν ήταν δυνατή η διαγραφή του μαθητή." };
  }

  revalidatePath(`/dashboard/class/${classId}`);
  revalidatePath("/dashboard");
  return { studentId };
}
