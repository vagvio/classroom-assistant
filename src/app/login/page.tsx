import { AuthShell } from "@/components/auth/auth-shell";
import { LoginForm } from "@/components/auth/login-form";

export default function LoginPage() {
  return (
    <AuthShell
      title="Καλωσήρθατε"
      subtitle="Συνδεθείτε για να δείτε τα τμήματά σας και να καταγράψετε παρουσίες, εργασίες και βαθμούς."
    >
      <LoginForm />
    </AuthShell>
  );
}
