export type AttendanceStatus = "present" | "absent" | "late";

export type Profile = {
  id: string;
  updated_at: string;
  full_name: string | null;
};

export type ClassRecord = {
  id: string;
  teacher_id: string;
  name: string;
  subject: string | null;
  created_at: string;
};

export type Student = {
  id: string;
  class_id: string;
  first_name: string;
  last_name: string;
  photo_url: string | null;
  created_at: string;
};

export type SeatingLayout = {
  id: string;
  class_id: string;
  student_id: string;
  position_x: number;
  position_y: number;
  desk_id: string | null;
  created_at: string;
};

export type Attendance = {
  id: string;
  student_id: string;
  date: string;
  status: AttendanceStatus;
  notes: string | null;
};

export type HomeworkCheck = {
  id: string;
  student_id: string;
  date: string;
  completed: boolean;
  notes: string | null;
};

export type Grade = {
  id: string;
  student_id: string;
  title: string;
  score: number;
  max_score: number;
  date: string;
};

type TableDef<Row, Insert, Update> = {
  Row: Row;
  Insert: Insert;
  Update: Update;
  Relationships: [];
};

export type Database = {
  public: {
    Tables: {
      profiles: TableDef<
        Profile,
        { id: string; full_name?: string | null; updated_at?: string },
        { full_name?: string | null; updated_at?: string }
      >;
      classes: TableDef<
        ClassRecord,
        {
          id?: string;
          teacher_id: string;
          name: string;
          subject?: string | null;
          created_at?: string;
        },
        { name?: string; subject?: string | null }
      >;
      students: TableDef<
        Student,
        {
          id?: string;
          class_id: string;
          first_name: string;
          last_name: string;
          photo_url?: string | null;
          created_at?: string;
        },
        {
          class_id?: string;
          first_name?: string;
          last_name?: string;
          photo_url?: string | null;
        }
      >;
      seating_layouts: TableDef<
        SeatingLayout,
        {
          id?: string;
          class_id: string;
          student_id: string;
          position_x: number;
          position_y: number;
          desk_id?: string | null;
          created_at?: string;
        },
        {
          class_id?: string;
          student_id?: string;
          position_x?: number;
          position_y?: number;
          desk_id?: string | null;
        }
      >;
      attendance: TableDef<
        Attendance,
        {
          id?: string;
          student_id: string;
          date: string;
          status: AttendanceStatus;
          notes?: string | null;
        },
        { date?: string; status?: AttendanceStatus; notes?: string | null }
      >;
      homework_checks: TableDef<
        HomeworkCheck,
        {
          id?: string;
          student_id: string;
          date: string;
          completed?: boolean;
          notes?: string | null;
        },
        { date?: string; completed?: boolean; notes?: string | null }
      >;
      grades: TableDef<
        Grade,
        {
          id?: string;
          student_id: string;
          title: string;
          score: number;
          max_score: number;
          date?: string;
        },
        { title?: string; score?: number; max_score?: number; date?: string }
      >;
    };
    Views: Record<string, never>;
    Functions: {
      is_teacher_of_class: {
        Args: { target_class_id: string };
        Returns: boolean;
      };
      is_teacher_of_student: {
        Args: { target_student_id: string };
        Returns: boolean;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
