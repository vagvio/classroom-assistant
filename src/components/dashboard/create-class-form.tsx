"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { createClassWithStudents } from "@/lib/actions/classes";

type DraftStudent = {
  key: string;
  firstName: string;
  lastName: string;
};

function emptyStudent(): DraftStudent {
  return {
    key: crypto.randomUUID(),
    firstName: "",
    lastName: "",
  };
}

export function CreateClassForm() {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [students, setStudents] = useState<DraftStudent[]>([emptyStudent()]);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  function resetForm() {
    setName("");
    setStudents([emptyStudent()]);
    setError(null);
  }

  function closeDialog() {
    if (pending) return;
    setOpen(false);
    resetForm();
  }

  function updateStudent(key: string, field: "firstName" | "lastName", value: string) {
    setStudents((current) =>
      current.map((student) =>
        student.key === key ? { ...student, [field]: value } : student,
      ),
    );
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);

    const result = await createClassWithStudents(
      name,
      students.map(({ firstName, lastName }) => ({ firstName, lastName })),
    );

    setPending(false);

    if (result.error && !result.classId) {
      setError(result.error);
      return;
    }

    setOpen(false);
    resetForm();
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="h-14 rounded-2xl bg-primary px-6 text-base font-semibold text-primary-foreground transition hover:bg-primary-hover"
      >
        Δημιουργία Τμήματος
      </button>

      <dialog
        ref={dialogRef}
        onClose={closeDialog}
        className="w-[min(40rem,calc(100vw-2rem))] rounded-[1.75rem] border border-border bg-card p-0 text-foreground shadow-[0_24px_70px_rgba(47,38,28,0.18)] backdrop:bg-stone-900/30"
      >
        <form onSubmit={handleSubmit} className="max-h-[85vh] space-y-5 overflow-y-auto p-7 sm:p-8">
          <div className="space-y-1">
            <h2 className="text-2xl font-semibold tracking-tight">Νέο τμήμα</h2>
            <p className="text-base text-muted">
              Δώστε όνομα στο τμήμα και προσθέστε τους μαθητές. Τα μαθήματα δημιουργούνται ξεχωριστά.
            </p>
          </div>

          <div className="space-y-2">
            <label htmlFor="class-name" className="text-sm font-medium">
              Όνομα Τμήματος
            </label>
            <input
              id="class-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
              className="h-14 w-full rounded-2xl border border-border bg-background px-4 text-base outline-none ring-primary/20 transition focus:border-primary focus:ring-4"
              placeholder="π.χ. Β1"
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-medium">Μαθητές</p>
              <button
                type="button"
                onClick={() => setStudents((current) => [...current, emptyStudent()])}
                className="h-11 rounded-2xl border border-border px-4 text-sm font-semibold"
              >
                Προσθήκη μαθητή
              </button>
            </div>

            <div className="space-y-3">
              {students.map((student, index) => (
                <div key={student.key} className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
                  <input
                    value={student.firstName}
                    onChange={(event) =>
                      updateStudent(student.key, "firstName", event.target.value)
                    }
                    className="h-14 rounded-2xl border border-border bg-background px-4 text-base outline-none ring-primary/20 transition focus:border-primary focus:ring-4"
                    placeholder={`Όνομα ${index + 1}`}
                    aria-label={`Όνομα μαθητή ${index + 1}`}
                  />
                  <input
                    value={student.lastName}
                    onChange={(event) =>
                      updateStudent(student.key, "lastName", event.target.value)
                    }
                    className="h-14 rounded-2xl border border-border bg-background px-4 text-base outline-none ring-primary/20 transition focus:border-primary focus:ring-4"
                    placeholder="Επίθετο"
                    aria-label={`Επίθετο μαθητή ${index + 1}`}
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setStudents((current) =>
                        current.length === 1
                          ? [emptyStudent()]
                          : current.filter((item) => item.key !== student.key),
                      )
                    }
                    className="h-14 rounded-2xl border border-border px-4 text-sm font-semibold text-muted"
                    aria-label="Αφαίρεση γραμμής"
                  >
                    Αφαίρεση
                  </button>
                </div>
              ))}
            </div>
            <p className="text-sm text-muted">
              Οι φωτογραφίες μπορούν να προστεθούν μετά, μέσα στη σελίδα του τμήματος.
            </p>
          </div>

          {error ? (
            <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">
              {error}
            </p>
          ) : null}

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={closeDialog}
              className="h-14 rounded-2xl border border-border px-5 text-base font-semibold"
            >
              Ακύρωση
            </button>
            <button
              type="submit"
              disabled={pending}
              className="h-14 rounded-2xl bg-primary px-6 text-base font-semibold text-primary-foreground disabled:opacity-60"
            >
              {pending ? "Αποθήκευση..." : "Αποθήκευση τμήματος"}
            </button>
          </div>
        </form>
      </dialog>
    </>
  );
}
