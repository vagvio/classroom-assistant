"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { createClass } from "@/lib/actions/classes";

export function CreateClassForm() {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState(createClass, null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
    }
    if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  useEffect(() => {
    if (state?.success) {
      formRef.current?.reset();
      setOpen(false);
    }
  }, [state]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="h-14 rounded-2xl bg-primary px-6 text-base font-semibold text-primary-foreground transition hover:bg-primary-hover"
      >
        Δημιουργία Νέου Τμήματος
      </button>

      <dialog
        ref={dialogRef}
        onClose={() => setOpen(false)}
        className="w-[min(34rem,calc(100vw-2rem))] rounded-[1.75rem] border border-border bg-card p-0 text-foreground shadow-[0_24px_70px_rgba(47,38,28,0.18)] backdrop:bg-stone-900/30"
      >
        <form ref={formRef} action={action} className="space-y-5 p-7 sm:p-8">
          <div className="space-y-1">
            <h2 className="text-2xl font-semibold tracking-tight">Νέο τμήμα</h2>
            <p className="text-base text-muted">
              Προσθέστε το όνομα και το μάθημα. Τους μαθητές θα τους βάλετε μετά.
            </p>
          </div>

          <div className="space-y-2">
            <label htmlFor="class-name" className="text-sm font-medium">
              Όνομα τμήματος
            </label>
            <input
              id="class-name"
              name="name"
              required
              className="h-14 w-full rounded-2xl border border-border bg-background px-4 text-base outline-none ring-primary/20 transition focus:border-primary focus:ring-4"
              placeholder="π.χ. Β1"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="class-subject" className="text-sm font-medium">
              Μάθημα
            </label>
            <input
              id="class-subject"
              name="subject"
              className="h-14 w-full rounded-2xl border border-border bg-background px-4 text-base outline-none ring-primary/20 transition focus:border-primary focus:ring-4"
              placeholder="π.χ. Μαθηματικά"
            />
          </div>

          {state?.error ? (
            <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">
              {state.error}
            </p>
          ) : null}

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="h-14 rounded-2xl border border-border px-5 text-base font-semibold"
            >
              Ακύρωση
            </button>
            <button
              type="submit"
              disabled={pending}
              className="h-14 rounded-2xl bg-primary px-6 text-base font-semibold text-primary-foreground disabled:opacity-60"
            >
              {pending ? "Αποθήκευση..." : "Αποθήκευση"}
            </button>
          </div>
        </form>
      </dialog>
    </>
  );
}
