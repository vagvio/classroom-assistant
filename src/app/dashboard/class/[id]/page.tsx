import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { AddStudentForm } from "@/components/class/add-student-form";
import { ClassTabs } from "@/components/class/class-tabs";
import { StudentGrid } from "@/components/class/student-grid";
import { CreateSubjectForm } from "@/components/dashboard/create-subject-form";
import { resolveStudentPhotoUrl } from "@/lib/photos";
import { createClient } from "@/lib/supabase/server";

export default async function ClassPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { id } = await params;
  const { tab } = await searchParams;
  const activeTab = tab === "seating" ? "seating" : "students";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: classroom } = await supabase
    .from("classes")
    .select("id, name, teacher_id")
    .eq("id", id)
    .eq("teacher_id", user.id)
    .maybeSingle();

  if (!classroom) {
    notFound();
  }

  const { data: classSubjects } = await supabase
    .from("subjects")
    .select("id, name")
    .eq("class_id", classroom.id)
    .order("name", { ascending: true });

  const { data: students } = await supabase
    .from("students")
    .select("id, first_name, last_name, photo_url")
    .eq("class_id", classroom.id)
    .order("last_name", { ascending: true })
    .order("first_name", { ascending: true });

  const studentsWithPhotos = await Promise.all(
    (students ?? []).map(async (student) => ({
      id: student.id,
      first_name: student.first_name,
      last_name: student.last_name,
      photo_url: student.photo_url,
      photoSrc: await resolveStudentPhotoUrl(student.photo_url),
    })),
  );

  return (
    <div className="mx-auto flex min-h-full w-full max-w-6xl flex-col px-6 py-8">
      <header className="flex flex-col gap-5 rounded-[2rem] border border-border bg-card px-6 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-8">
        <div className="space-y-2">
          <Link
            href="/dashboard"
            className="inline-flex h-11 items-center text-sm font-semibold text-primary"
          >
            ← Όλα τα τμήματα
          </Link>
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">{classroom.name}</h1>
            <p className="mt-2 text-base leading-7 text-muted">
              {classSubjects?.length
                ? classSubjects.map((subject) => subject.name).join(" · ")
                : "Χωρίς δηλωμένα μαθήματα"}
            </p>
          </div>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <CreateSubjectForm
            classes={[{ id: classroom.id, name: classroom.name }]}
            defaultClassId={classroom.id}
          />
          {activeTab === "students" ? (
            <AddStudentForm classId={classroom.id} teacherId={user.id} />
          ) : null}
        </div>
      </header>

      <div className="mt-8">
        <ClassTabs classId={classroom.id} active={activeTab} />
      </div>

      <section className="mt-8 flex-1">
        {activeTab === "seating" ? (
          <div className="flex min-h-80 flex-col items-center justify-center rounded-[2rem] border border-dashed border-border bg-card/70 px-6 py-16 text-center">
            <p className="text-2xl font-semibold">Πλάνο τάξης</p>
            <p className="mt-3 max-w-md text-base leading-7 text-muted">
              Εδώ θα τοποθετείτε τους μαθητές στα θρανία. Η λειτουργία θα προστεθεί στο
              επόμενο βήμα.
            </p>
          </div>
        ) : (
          <StudentGrid
            classId={classroom.id}
            teacherId={user.id}
            students={studentsWithPhotos}
          />
        )}
      </section>
    </div>
  );
}
