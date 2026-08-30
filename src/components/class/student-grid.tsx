import { StudentCard, type StudentCardData } from "@/components/class/student-card";

export type { StudentCardData as StudentCard };

export function StudentGrid({
  classId,
  teacherId,
  students,
}: {
  classId: string;
  teacherId: string;
  students: StudentCardData[];
}) {
  if (!students.length) {
    return (
      <div className="flex flex-col items-center justify-center rounded-[2rem] border border-dashed border-border bg-card/70 px-6 py-16 text-center">
        <p className="text-2xl font-semibold">Δεν υπάρχουν μαθητές ακόμα</p>
        <p className="mt-3 max-w-md text-base leading-7 text-muted">
          Πατήστε «Προσθήκη Μαθητή» για να καταχωρίσετε την τάξη σας.
        </p>
      </div>
    );
  }

  return (
    <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {students.map((student) => (
        <StudentCard
          key={student.id}
          classId={classId}
          teacherId={teacherId}
          student={student}
        />
      ))}
    </ul>
  );
}
