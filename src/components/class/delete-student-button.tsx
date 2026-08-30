"use client";

import { useEffect, useRef, useState } from "react";
import { deleteStudent } from "@/lib/actions/students";

export function DeleteStudentButton({
  classId,
  studentId,
  studentName,
}: {
  classId: string;
  studentId: string;
  studentName: string;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  async function confirmDelete() {
    setPending(true);
    setError(null);
    const result = await deleteStudent(classId, studentId);
    setPending(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    setOpen(false);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="h-14 w-full rounded-2xl border border-red-200 bg-red-50 px-5 text-sm font-semibold text-red-800 sm:w-auto"
      >
        Διαγραφή
      </button>

      <dialog
        ref={dialogRef}
        onClose={() => !pending && setOpen(false)}
        className="w-[min(28rem,calc(100vw-2rem))] rounded-[1.75rem] border border-border bg-card p-0 text-foreground shadow-[0_24px_70px_rgba(47,38,28,0.18)] backdrop:bg-stone-900/30"
      >
        <div className="space-y-5 p-7">
          <div className="space-y-2">
            <h2 className="text-xl font-semibold">Διαγραφή μαθητή;</h2>
            <p className="text-base leading-7 text-muted">
              Ο/Η {studentName} θα αφαιρεθεί από το τμήμα. Η ενέργεια δεν αναιρείται.
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
              disabled={pending}
              onClick={() => setOpen(false)}
              className="h-14 rounded-2xl border border-border px-5 text-base font-semibold"
            >
              Ακύρωση
            </button>
            <button
              type="button"
              disabled={pending}
              onClick={confirmDelete}
              className="h-14 rounded-2xl bg-red-700 px-5 text-base font-semibold text-white disabled:opacity-60"
            >
              {pending ? "Διαγραφή..." : "Ναι, διαγραφή"}
            </button>
          </div>
        </div>
      </dialog>
    </>
  );
}
