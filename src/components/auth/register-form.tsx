"use client";

import Link from "next/link";
import { useActionState } from "react";
import { signUp } from "@/lib/actions/auth";

export function RegisterForm() {
  const [state, action, pending] = useActionState(signUp, null);

  if (state?.needsConfirmation) {
    return (
      <div className="space-y-6 rounded-2xl bg-emerald-50 px-5 py-6 text-emerald-950">
        <p className="text-lg font-semibold">Ελέγξτε το email σας</p>
        <p className="text-base leading-7">
          Σας στείλαμε σύνδεσμο επιβεβαίωσης. Αφού τον ανοίξετε, μπορείτε να
          συνδεθείτε στην εφαρμογή.
        </p>
        <Link
          href="/login"
          className="inline-flex h-14 items-center justify-center rounded-2xl bg-primary px-6 text-base font-semibold text-primary-foreground"
        >
          Μετάβαση στη σύνδεση
        </Link>
      </div>
    );
  }

  return (
    <form action={action} className="space-y-5">
      <div className="space-y-2">
        <label htmlFor="full_name" className="text-sm font-medium text-foreground">
          Ονοματεπώνυμο
        </label>
        <input
          id="full_name"
          name="full_name"
          type="text"
          autoComplete="name"
          required
          className="h-14 w-full rounded-2xl border border-border bg-background px-4 text-base outline-none ring-primary/20 transition focus:border-primary focus:ring-4"
          placeholder="π.χ. Μαρία Παπαδοπούλου"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="email" className="text-sm font-medium text-foreground">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          className="h-14 w-full rounded-2xl border border-border bg-background px-4 text-base outline-none ring-primary/20 transition focus:border-primary focus:ring-4"
          placeholder="name@school.gr"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="password" className="text-sm font-medium text-foreground">
          Κωδικός
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={6}
          className="h-14 w-full rounded-2xl border border-border bg-background px-4 text-base outline-none ring-primary/20 transition focus:border-primary focus:ring-4"
          placeholder="Τουλάχιστον 6 χαρακτήρες"
        />
      </div>

      {state?.error ? (
        <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">
          {state.error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="h-14 w-full rounded-2xl bg-primary text-base font-semibold text-primary-foreground transition hover:bg-primary-hover disabled:opacity-60"
      >
        {pending ? "Δημιουργία λογαριασμού..." : "Δημιουργία λογαριασμού"}
      </button>

      <p className="text-center text-base text-muted">
        Έχετε ήδη λογαριασμό;{" "}
        <Link href="/login" className="font-semibold text-primary underline-offset-4 hover:underline">
          Σύνδεση
        </Link>
      </p>
    </form>
  );
}
