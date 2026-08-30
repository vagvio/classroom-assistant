"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type ClassFormState = {
  error?: string;
  success?: boolean;
} | null;

export async function createClass(
  _prev: ClassFormState,
  formData: FormData,
): Promise<ClassFormState> {
  const name = String(formData.get("name") ?? "").trim();
  const subject = String(formData.get("subject") ?? "").trim();

  if (!name) {
    return { error: "Δώστε όνομα στο τμήμα." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Πρέπει να είστε συνδεδεμένοι." };
  }

  const { error } = await supabase.from("classes").insert({
    teacher_id: user.id,
    name,
    subject: subject || null,
  });

  if (error) {
    return { error: "Δεν ήταν δυνατή η δημιουργία του τμήματος." };
  }

  revalidatePath("/dashboard");
  return { success: true };
}
