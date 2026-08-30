"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type ClassActionResult = {
  error?: string;
  classId?: string;
};

export async function createClassWithStudents(
  name: string,
  students: { firstName: string; lastName: string }[],
): Promise<ClassActionResult> {
  const className = name.trim();

  if (!className) {
    return { error: "Δώστε όνομα στο τμήμα." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Πρέπει να είστε συνδεδεμένοι." };
  }

  const { data: classroom, error: classError } = await supabase
    .from("classes")
    .insert({
      teacher_id: user.id,
      name: className,
    })
    .select("id")
    .single();

  if (classError || !classroom) {
    return { error: "Δεν ήταν δυνατή η δημιουργία του τμήματος." };
  }

  const preparedStudents = students
    .map((student) => ({
      class_id: classroom.id,
      first_name: student.firstName.trim(),
      last_name: student.lastName.trim(),
    }))
    .filter((student) => student.first_name && student.last_name);

  if (preparedStudents.length) {
    const { error: studentsError } = await supabase
      .from("students")
      .insert(preparedStudents);

    if (studentsError) {
      revalidatePath("/dashboard");
      return {
        classId: classroom.id,
        error: "Το τμήμα δημιουργήθηκε, αλλά κάποιοι μαθητές δεν αποθηκεύτηκαν.",
      };
    }
  }

  revalidatePath("/dashboard");
  revalidatePath(`/dashboard/class/${classroom.id}`);
  return { classId: classroom.id };
}
