export function mapAuthError(message: string) {
  const value = message.toLowerCase();

  if (value.includes("invalid login")) {
    return "Λάθος email ή κωδικός.";
  }
  if (value.includes("email not confirmed")) {
    return "Επιβεβαιώστε το email σας πριν συνδεθείτε.";
  }
  if (value.includes("already registered") || value.includes("already been registered")) {
    return "Υπάρχει ήδη λογαριασμός με αυτό το email.";
  }
  if (value.includes("password")) {
    return "Ο κωδικός πρέπει να έχει τουλάχιστον 6 χαρακτήρες.";
  }
  if (value.includes("rate limit")) {
    return "Πολλές προσπάθειες. Περιμένετε λίγο και δοκιμάστε ξανά.";
  }

  return "Κάτι πήγε στραβά. Δοκιμάστε ξανά.";
}
