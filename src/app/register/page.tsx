import { AuthShell } from "@/components/auth/auth-shell";
import { RegisterForm } from "@/components/auth/register-form";

export default function RegisterPage() {
  return (
    <AuthShell
      title="Δημιουργία λογαριασμού"
      subtitle="Η εγγραφή είναι μόνο για καθηγητές. Τα δεδομένα κάθε τάξης μένουν ιδιωτικά."
    >
      <RegisterForm />
    </AuthShell>
  );
}
