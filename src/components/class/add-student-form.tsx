"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { createStudent, saveStudentPhoto } from "@/lib/actions/students";
import { uploadStudentPhoto } from "@/lib/upload-student-photo";

export function AddStudentForm({
  classId,
  teacherId,
}: {
  classId: string;
  teacherId: string;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const previewUrlRef = useRef<string | null>(null);

  const [open, setOpen] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  useEffect(() => {
    return () => {
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
      }
    };
  }, []);

  function resetForm() {
    setFirstName("");
    setLastName("");
    setPhotoFile(null);
    setError(null);
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = null;
    }
    setPreviewUrl(null);
    if (cameraInputRef.current) cameraInputRef.current.value = "";
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function closeDialog() {
    if (pending) return;
    setOpen(false);
    resetForm();
  }

  function handlePhoto(file: File | undefined) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Επιλέξτε μια εικόνα.");
      return;
    }

    setPhotoFile(file);
    setError(null);
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
    }
    const nextUrl = URL.createObjectURL(file);
    previewUrlRef.current = nextUrl;
    setPreviewUrl(nextUrl);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);

    const created = await createStudent(classId, firstName, lastName);
    if (created.error || !created.studentId) {
      setError(created.error ?? "Δεν ήταν δυνατή η προσθήκη του μαθητή.");
      setPending(false);
      return;
    }

    if (photoFile) {
      try {
        const path = await uploadStudentPhoto(
          teacherId,
          classId,
          created.studentId,
          photoFile,
        );
        const saved = await saveStudentPhoto(classId, created.studentId, path);
        if (saved.error) {
          setError(saved.error);
          setPending(false);
          return;
        }
      } catch {
        setPending(false);
        setOpen(false);
        resetForm();
        return;
      }
    }

    setPending(false);
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
        Προσθήκη Μαθητή
      </button>

      <dialog
        ref={dialogRef}
        onClose={closeDialog}
        className="w-[min(36rem,calc(100vw-2rem))] rounded-[1.75rem] border border-border bg-card p-0 text-foreground shadow-[0_24px_70px_rgba(47,38,28,0.18)] backdrop:bg-stone-900/30"
      >
        <form onSubmit={handleSubmit} className="space-y-5 p-7 sm:p-8">
          <div className="space-y-1">
            <h2 className="text-2xl font-semibold tracking-tight">Νέος μαθητής</h2>
            <p className="text-base text-muted">
              Προσθέστε όνομα, επίθετο και προαιρετικά φωτογραφία από την κάμερα ή τα αρχεία.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label htmlFor="first-name" className="text-sm font-medium">
                Όνομα
              </label>
              <input
                id="first-name"
                value={firstName}
                onChange={(event) => setFirstName(event.target.value)}
                required
                className="h-14 w-full rounded-2xl border border-border bg-background px-4 text-base outline-none ring-primary/20 transition focus:border-primary focus:ring-4"
                placeholder="π.χ. Γιάννης"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="last-name" className="text-sm font-medium">
                Επίθετο
              </label>
              <input
                id="last-name"
                value={lastName}
                onChange={(event) => setLastName(event.target.value)}
                required
                className="h-14 w-full rounded-2xl border border-border bg-background px-4 text-base outline-none ring-primary/20 transition focus:border-primary focus:ring-4"
                placeholder="π.χ. Οικονόμου"
              />
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-sm font-medium">Φωτογραφία</p>
            <div className="flex flex-col items-center gap-4 rounded-[1.5rem] border border-dashed border-border bg-background px-4 py-5">
              <div className="size-28 overflow-hidden rounded-full bg-card shadow-inner">
                {previewUrl ? (
                  // Preview is a local blob URL
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={previewUrl} alt="Προεπισκόπηση" className="size-full object-cover" />
                ) : (
                  <div className="flex size-full items-center justify-center text-sm text-muted">
                    Χωρίς φωτο
                  </div>
                )}
              </div>

              <div className="flex w-full flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={() => cameraInputRef.current?.click()}
                  className="h-14 flex-1 rounded-2xl bg-primary text-base font-semibold text-primary-foreground"
                >
                  Λήψη από κάμερα
                </button>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="h-14 flex-1 rounded-2xl border border-border text-base font-semibold"
                >
                  Επιλογή αρχείου
                </button>
              </div>

              {photoFile ? (
                <button
                  type="button"
                  onClick={() => {
                    setPhotoFile(null);
                    if (previewUrlRef.current) {
                      URL.revokeObjectURL(previewUrlRef.current);
                      previewUrlRef.current = null;
                    }
                    setPreviewUrl(null);
                  }}
                  className="text-sm font-semibold text-muted underline-offset-4 hover:underline"
                >
                  Αφαίρεση φωτογραφίας
                </button>
              ) : null}
            </div>

            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="sr-only"
              onChange={(event) => handlePhoto(event.target.files?.[0])}
            />
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={(event) => handlePhoto(event.target.files?.[0])}
            />
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
              {pending ? "Αποθήκευση..." : "Αποθήκευση"}
            </button>
          </div>
        </form>
      </dialog>
    </>
  );
}
