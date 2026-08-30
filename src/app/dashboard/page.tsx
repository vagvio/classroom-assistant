import { redirect } from "next/navigation";
import { BrandMark } from "@/components/brand-mark";
import { CreateClassForm } from "@/components/dashboard/create-class-form";
import { SignOutButton } from "@/components/dashboard/sign-out-button";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [{ data: profile }, { data: classes }] = await Promise.all([
    supabase.from("profiles").select("full_name").eq("id", user.id).maybeSingle(),
    supabase
      .from("classes")
      .select("id, name, subject, created_at")
      .eq("teacher_id", user.id)
      .order("created_at", { ascending: false }),
  ]);

  const greeting = profile?.full_name || user.email || "Καθηγητή";

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

      <section className="mt-10 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <h1 className="text-4xl font-semibold tracking-tight">Τα τμήματά σας</h1>
          <p className="max-w-2xl text-lg leading-8 text-muted">
            Επιλέξτε ένα τμήμα για να συνεχίσετε, ή δημιουργήστε ένα νέο για να
            ξεκινήσετε την τάξη.
          </p>
        </div>
        <CreateClassForm />
      </section>

      {!classes?.length ? (
        <div className="mt-10 flex flex-1 flex-col items-center justify-center rounded-[2rem] border border-dashed border-border bg-card/70 px-6 py-16 text-center">
          <p className="text-2xl font-semibold">Δεν υπάρχουν τμήματα ακόμα</p>
          <p className="mt-3 max-w-md text-base leading-7 text-muted">
            Πατήστε «Δημιουργία Νέου Τμήματος» για να προσθέσετε την πρώτη σας τάξη.
          </p>
        </div>
      ) : (
        <ul className="mt-10 grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {classes.map((classroom) => (
            <li
              key={classroom.id}
              className="rounded-[1.75rem] border border-border bg-card p-6 shadow-[0_10px_30px_rgba(47,38,28,0.05)]"
            >
              <p className="text-sm font-medium uppercase tracking-wide text-muted">
                {classroom.subject || "Χωρίς μάθημα"}
              </p>
              <h2 className="mt-3 text-2xl font-semibold tracking-tight">
                {classroom.name}
              </h2>
              <p className="mt-4 text-sm text-muted">
                Δημιουργήθηκε{" "}
                {new Date(classroom.created_at).toLocaleDateString("el-GR")}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
