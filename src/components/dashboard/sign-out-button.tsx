import { signOut } from "@/lib/actions/auth";

export function SignOutButton() {
  return (
    <form action={signOut}>
      <button
        type="submit"
        className="h-12 rounded-2xl border border-border px-5 text-sm font-semibold text-foreground transition hover:bg-white"
      >
        Αποσύνδεση
      </button>
    </form>
  );
}
