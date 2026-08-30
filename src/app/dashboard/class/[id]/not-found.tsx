import Link from "next/link";

export default function ClassNotFound() {
  return (
    <div className="flex min-h-full flex-col items-center justify-center px-6 text-center">
      <h1 className="text-3xl font-semibold tracking-tight">Το τμήμα δεν βρέθηκε</h1>
      <p className="mt-3 max-w-md text-base leading-7 text-muted">
        Δεν υπάρχει αυτό το τμήμα ή δεν έχετε πρόσβαση σε αυτό.
      </p>
      <Link
        href="/dashboard"
        className="mt-8 inline-flex h-14 items-center rounded-2xl bg-primary px-6 text-base font-semibold text-primary-foreground"
      >
        Επιστροφή στα τμήματα
      </Link>
    </div>
  );
}
