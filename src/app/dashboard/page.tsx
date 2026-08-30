import Link from "next/link";
import { redirect } from "next/navigation";
import { BrandMark } from "@/components/brand-mark";
import { CreateClassForm } from "@/components/dashboard/create-class-form";
import { CreateSubjectForm } from "@/components/dashboard/create-subject-form";
import { SignOutButton } from "@/components/dashboard/sign-out-button";
import { createClient } from "@/lib/supabase/server";

function countFromEmbed(value: { count: number } | { count: number }[] | null | undefined) {
  if (!value) return 0;
  return Array.isArray(value) ? (value[0]?.count ?? 0) : value.count;
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [{ data: profile }, { data: classes }, { data: subjectRows }] = await Promise.all([
    supabase.from("profiles").select("full_name").eq("id", user.id).maybeSingle(),
    supabase
      .from("classes")
      .select("id, name, created_at, students(count)")
      .eq("teacher_id", user.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("subjects")
      .select("id, name, class_id")
      .order("name", { ascending: true }),
  ]);

  const greeting = profile?.full_name || user.email || "Καθηγητή";
  const classOptions = (classes ?? []).map((classroom) => ({
    id: classroom.id,
    name: classroom.name,
  }));
  const classNameById = new Map(classOptions.map((classroom) => [classroom.id, classroom.name]));
  const subjects = (subjectRows ?? [])
    .filter((subject) => classNameById.has(subject.class_id))
    .map((subject) => ({
      ...subject,
      className: classNameById.get(subject.class_id) ?? "",
      classId: subject.class_id,
    }));

  return (
    <div className="mx-auto flex min-h-full w-full max-w-6xl flex-col px-6 py-8">
      <header className="flex flex-col gap-6 rounded-[2rem] border border-border bg-card px-6 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-8">
        <BrandMark />
        <div className="flex items-center justify-between gap-4 sm:justify-end">
          <p className="text-base text-muted">
            Γεια σας, <span className="font-semibold text-foreground">{greeting}</span>
          </p>
          <SignOutButton />
        </div>
      </header>

      <section className="mt-10 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-2">
          <h1 className="text-4xl font-semibold tracking-tight">Πίνακας ελέγχου</h1>
          <p className="max-w-2xl text-lg leading-8 text-muted">
            Το τμήμα έχει τους μαθητές. Το μάθημα δηλώνεται ξεχωριστά και συνδέεται με ένα τμήμα.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <CreateClassForm />
          <CreateSubjectForm classes={classOptions} />
        </div>
      </section>

      <section className="mt-12 space-y-5">
        <h2 className="text-2xl font-semibold tracking-tight">Τμήματα</h2>
        {!classes?.length ? (
          <div className="rounded-[2rem] border border-dashed border-border bg-card/70 px-6 py-14 text-center">
            <p className="text-xl font-semibold">Δεν υπάρχουν τμήματα ακόμα</p>
            <p className="mt-3 text-base leading-7 text-muted">
              Δημιουργήστε πρώτα ένα τμήμα και προσθέστε τους μαθητές του.
            </p>
          </div>
        ) : (
          <ul className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
            {classes.map((classroom) => {
              const studentCount = countFromEmbed(classroom.students);
              const subjectNames = subjects
                .filter((subject) => subject.classId === classroom.id)
                .map((subject) => subject.name);
              return (
                <li key={classroom.id}>
                  <Link
                    href={`/dashboard/class/${classroom.id}?tab=students`}
                    className="block rounded-[1.75rem] border border-border bg-card p-6 shadow-[0_10px_30px_rgba(47,38,28,0.05)] transition hover:border-primary/30 active:scale-[0.99]"
                  >
                    <h3 className="text-2xl font-semibold tracking-tight">{classroom.name}</h3>
                    <p className="mt-3 text-base text-muted">
                      {studentCount === 1 ? "1 μαθητής" : `${studentCount} μαθητές`}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-muted">
                      {subjectNames.length
                        ? subjectNames.join(" · ")
                        : "Χωρίς δηλωμένα μαθήματα"}
                    </p>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="mt-12 space-y-5">
        <h2 className="text-2xl font-semibold tracking-tight">Μαθήματα</h2>
        {!subjects.length ? (
          <div className="rounded-[2rem] border border-dashed border-border bg-card/70 px-6 py-14 text-center">
            <p className="text-xl font-semibold">Δεν υπάρχουν μαθήματα ακόμα</p>
            <p className="mt-3 text-base leading-7 text-muted">
              {classes?.length
                ? "Πατήστε «Δημιουργία Μαθήματος» και επιλέξτε το αντίστοιχο τμήμα."
                : "Πρώτα δημιουργήστε ένα τμήμα και μετά δηλώστε τα μαθήματά του."}
            </p>
          </div>
        ) : (
          <ul className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
            {subjects.map((subject) => (
              <li key={subject.id}>
                <Link
                  href={`/dashboard/class/${subject.classId}?tab=students`}
                  className="block rounded-[1.75rem] border border-border bg-card p-6 shadow-[0_10px_30px_rgba(47,38,28,0.05)] transition hover:border-primary/30 active:scale-[0.99]"
                >
                  <p className="text-sm font-medium uppercase tracking-wide text-muted">
                    {subject.className}
                  </p>
                  <h3 className="mt-3 text-2xl font-semibold tracking-tight">{subject.name}</h3>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
