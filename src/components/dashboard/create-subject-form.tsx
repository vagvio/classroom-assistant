"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { createSubject } from "@/lib/actions/subjects";

export function CreateSubjectForm({
  classes,
  defaultClassId,
}: {
  classes: { id: string; name: string }[];
  defaultClassId?: string;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [classId, setClassId] = useState(defaultClassId ?? classes[0]?.id ?? "");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  useEffect(() => {
    if (defaultClassId) {
      setClassId(defaultClassId);
    }
  }, [defaultClassId]);

  function closeDialog() {
    if (pending) return;
    setOpen(false);
    setName("");
    setError(null);
    setClassId(defaultClassId ?? classes[0]?.id ?? "");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);

    const result = await createSubject(classId, name);
    setPending(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    setOpen(false);
    setName("");
    setError(null);
    setClassId(defaultClassId ?? classes[0]?.id ?? "");
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        disabled={!classes.length}
        className="h-14 rounded-2xl border border-border bg-card px-6 text-base font-semibold text-foreground transition hover:border-primary/30 disabled:opacity-50"
      >
        Δημιουργία Μαθήματος
      </button>

      <dialog
        ref={dialogRef}
        onClose={closeDialog}
        className="w-[min(34rem,calc(100vw-2rem))] rounded-[1.75rem] border border-border bg-card p-0 text-foreground shadow-[0_24px_70px_rgba(47,38,28,0.18)] backdrop:bg-stone-900/30"
      >
        <form onSubmit={handleSubmit} className="space-y-5 p-7 sm:p-8">
          <div className="space-y-1">
            <h2 className="text-2xl font-semibold tracking-tight">Νέο μάθημα</h2>
            <p className="text-base text-muted">
              Δηλώστε το μάθημα και επιλέξτε σε ποιο τμήμα ανήκει.
            </p>
          </div>

          <div className="space-y-2">
            <label htmlFor="subject-name" className="text-sm font-medium">
              Μάθημα
            </label>
            <input
              id="subject-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
              className="h-14 w-full rounded-2xl border border-border bg-background px-4 text-base outline-none ring-primary/20 transition focus:border-primary focus:ring-4"
              placeholder="π.χ. Μαθηματικά"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="subject-class" className="text-sm font-medium">
              Τμήμα
            </label>
            <select
              id="subject-class"
              value={classId}
              onChange={(event) => setClassId(event.target.value)}
              required
              className="h-14 w-full rounded-2xl border border-border bg-background px-4 text-base outline-none ring-primary/20 transition focus:border-primary focus:ring-4"
            >
              {classes.map((classroom) => (
                <option key={classroom.id} value={classroom.id}>
                  {classroom.name}
                </option>
              ))}
            </select>
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
              disabled={pending || !classes.length}
              className="h-14 rounded-2xl bg-primary px-6 text-base font-semibold text-primary-foreground disabled:opacity-60"
            >
              {pending ? "Αποθήκευση..." : "Αποθήκευση μαθήματος"}
            </button>
          </div>
        </form>
      </dialog>
    </>
  );
}
