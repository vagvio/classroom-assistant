import { studentTint } from "@/lib/seating";

export type SeatingStudent = {
  id: string;
  first_name: string;
  last_name: string;
  photoSrc: string | null;
};

export function StudentToken({
  student,
  muted = false,
}: {
  student: SeatingStudent;
  muted?: boolean;
}) {
  const fullName = `${student.first_name} ${student.last_name}`;
  const initials = `${student.first_name.charAt(0)}${student.last_name.charAt(0)}`.toUpperCase();

  return (
    <div
      className={`flex w-[72px] flex-col items-center ${muted ? "opacity-40" : ""}`}
    >
      <div
        className={`flex size-[72px] items-center justify-center overflow-hidden rounded-2xl ${studentTint(student.id)}`}
      >
        {student.photoSrc ? (
          // Signed storage URL
          // eslint-disable-next-line @next/next/no-img-element
          <img src={student.photoSrc} alt={fullName} className="size-full object-cover" />
        ) : (
          <span className="text-sm font-semibold">{initials}</span>
        )}
      </div>
      <p className="mt-1 w-full truncate text-center text-xs font-semibold leading-tight">
        {student.last_name}
      </p>
    </div>
  );
}
