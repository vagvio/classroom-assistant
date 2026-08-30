"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type SubjectActionResult = {
  error?: string;
  subjectId?: string;
};

export async function createSubject(
  classId: string,
  name: string,
): Promise<SubjectActionResult> {
  const subjectName = name.trim();

  if (!classId) {
    return { error: "Επιλέξτε τμήμα." };
  }

  if (!subjectName) {
    return { error: "Δώστε όνομα στο μάθημα." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Πρέπει να είστε συνδεδεμένοι." };
  }

  const { data: classroom } = await supabase
    .from("classes")
    .select("id")
    .eq("id", classId)
    .eq("teacher_id", user.id)
    .maybeSingle();

  if (!classroom) {
    return { error: "Το τμήμα δεν βρέθηκε." };
  }

  const { data, error } = await supabase
    .from("subjects")
    .insert({
      class_id: classId,
      name: subjectName,
    })
    .select("id")
    .single();

  if (error || !data) {
    if (error?.code === "23505") {
      return { error: "Αυτό το μάθημα υπάρχει ήδη στο τμήμα." };
    }
    return { error: "Δεν ήταν δυνατή η δημιουργία του μαθήματος." };
  }

  revalidatePath("/dashboard");
  revalidatePath(`/dashboard/class/${classId}`);
  return { subjectId: data.id };
}
