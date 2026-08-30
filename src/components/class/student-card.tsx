"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { DeleteStudentButton } from "@/components/class/delete-student-button";
import {
  clearStudentPhoto,
  saveStudentPhoto,
  updateStudent,
} from "@/lib/actions/students";
import { uploadStudentPhoto } from "@/lib/upload-student-photo";

export type StudentCardData = {
  id: string;
  first_name: string;
  last_name: string;
  photo_url: string | null;
  photoSrc: string | null;
};

function initials(firstName: string, lastName: string) {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}

export function StudentCard({
  classId,
  teacherId,
  student,
}: {
  classId: string;
  teacherId: string;
  student: StudentCardData;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const previewUrlRef = useRef<string | null>(null);

  const [open, setOpen] = useState(false);
  const [firstName, setFirstName] = useState(student.first_name);
  const [lastName, setLastName] = useState(student.last_name);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(student.photoSrc);
  const [removeExistingPhoto, setRemoveExistingPhoto] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const fullName = `${student.first_name} ${student.last_name}`;

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

  function resetFromStudent() {
    setFirstName(student.first_name);
    setLastName(student.last_name);
    setPhotoFile(null);
    setRemoveExistingPhoto(false);
    setError(null);
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = null;
    }
    setPreviewUrl(student.photoSrc);
    if (cameraInputRef.current) cameraInputRef.current.value = "";
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function openEditor() {
    resetFromStudent();
    setOpen(true);
  }

  function closeEditor() {
    if (pending) return;
    setOpen(false);
    resetFromStudent();
  }

  function handlePhoto(file: File | undefined) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Επιλέξτε μια εικόνα.");
      return;
    }

    setPhotoFile(file);
    setRemoveExistingPhoto(false);
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

    const updated = await updateStudent(classId, student.id, firstName, lastName);
    if (updated.error) {
      setError(updated.error);
      setPending(false);
      return;
    }

    try {
      if (photoFile) {
        const path = await uploadStudentPhoto(
          teacherId,
          classId,
          student.id,
          photoFile,
        );
        const saved = await saveStudentPhoto(classId, student.id, path);
        if (saved.error) {
          setError(saved.error);
          setPending(false);
          return;
        }
      } else if (removeExistingPhoto && student.photo_url) {
        const cleared = await clearStudentPhoto(classId, student.id);
        if (cleared.error) {
          setError(cleared.error);
          setPending(false);
          return;
        }
      }
    } catch {
      setError("Τα στοιχεία αποθηκεύτηκαν, αλλά η φωτογραφία δεν ενημερώθηκε.");
      setPending(false);
      return;
    }

    setPending(false);
    setOpen(false);
  }

  return (
    <li>
      <button
        type="button"
        onClick={openEditor}
        className="w-full rounded-[1.75rem] border border-border bg-card p-5 text-left shadow-[0_10px_30px_rgba(47,38,28,0.05)] transition hover:border-primary/30 active:scale-[0.99]"
      >
        <div className="flex items-center gap-4">
          <div className="size-20 shrink-0 overflow-hidden rounded-full bg-background">
            {student.photoSrc ? (
              // Signed storage URL
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={student.photoSrc}
                alt={fullName}
                className="size-full object-cover"
              />
            ) : (
              <div className="flex size-full items-center justify-center text-lg font-semibold text-primary">
                {initials(student.first_name, student.last_name)}
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xl font-semibold tracking-tight">
              {student.last_name}
            </p>
            <p className="truncate text-base text-muted">{student.first_name}</p>
            <p className="mt-2 text-sm font-medium text-primary">Επεξεργασία</p>
          </div>
        </div>
      </button>

      <dialog
        ref={dialogRef}
        onClose={closeEditor}
        className="w-[min(36rem,calc(100vw-2rem))] rounded-[1.75rem] border border-border bg-card p-0 text-foreground shadow-[0_24px_70px_rgba(47,38,28,0.18)] backdrop:bg-stone-900/30"
      >
        <form onSubmit={handleSubmit} className="space-y-5 p-7 sm:p-8">
          <div className="space-y-1">
            <h2 className="text-2xl font-semibold tracking-tight">Επεξεργασία μαθητή</h2>
            <p className="text-base text-muted">
              Αλλάξτε όνομα, επίθετο ή φωτογραφία και πατήστε Αποθήκευση.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label htmlFor={`edit-first-${student.id}`} className="text-sm font-medium">
                Όνομα
              </label>
              <input
                id={`edit-first-${student.id}`}
                value={firstName}
                onChange={(event) => setFirstName(event.target.value)}
                required
                className="h-14 w-full rounded-2xl border border-border bg-background px-4 text-base outline-none ring-primary/20 transition focus:border-primary focus:ring-4"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor={`edit-last-${student.id}`} className="text-sm font-medium">
                Επίθετο
              </label>
              <input
                id={`edit-last-${student.id}`}
                value={lastName}
                onChange={(event) => setLastName(event.target.value)}
                required
                className="h-14 w-full rounded-2xl border border-border bg-background px-4 text-base outline-none ring-primary/20 transition focus:border-primary focus:ring-4"
              />
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-sm font-medium">Φωτογραφία</p>
            <div className="flex flex-col items-center gap-4 rounded-[1.5rem] border border-dashed border-border bg-background px-4 py-5">
              <div className="size-28 overflow-hidden rounded-full bg-card shadow-inner">
                {previewUrl ? (
                  // Preview may be a blob URL or signed storage URL
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={previewUrl} alt="Προεπισκόπηση" className="size-full object-cover" />
                ) : (
                  <div className="flex size-full items-center justify-center text-lg font-semibold text-primary">
                    {initials(firstName, lastName)}
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

              {previewUrl ? (
                <button
                  type="button"
                  onClick={() => {
                    setPhotoFile(null);
                    setRemoveExistingPhoto(true);
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

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <DeleteStudentButton
              classId={classId}
              studentId={student.id}
              studentName={`${firstName} ${lastName}`.trim() || fullName}
            />
            <div className="flex flex-col-reverse gap-3 sm:flex-row">
              <button
                type="button"
                onClick={closeEditor}
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
          </div>
        </form>
      </dialog>
    </li>
  );
}
