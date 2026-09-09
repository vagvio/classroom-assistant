"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { seatCount, seatSlots, type CanvasDesk, type Placements } from "@/lib/seating";

export type SaveSeatingResult = {
  error?: string;
  success?: boolean;
};

export async function saveSeatingPlan(
  classId: string,
  desks: CanvasDesk[],
  placements: Placements,
): Promise<SaveSeatingResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Πρέπει να είστε συνδεδεμένοι." };
  }

  const { data: classroom } = await supabase
    .from("classes")
    .select("id")
    .eq("id", classId)
    .eq("teacher_id", user.id)
    .maybeSingle();

  if (!classroom) {
    return { error: "Το τμήμα δεν βρέθηκε." };
  }

  const { error: layoutDeleteError } = await supabase
    .from("seating_layouts")
    .delete()
    .eq("class_id", classId);

  if (layoutDeleteError) {
    return { error: "Δεν ήταν δυνατή η ενημέρωση των θέσεων." };
  }

  const { error: desksDeleteError } = await supabase
    .from("desks")
    .delete()
    .eq("class_id", classId);

  if (desksDeleteError) {
    return {
      error: "Δεν βρέθηκε ο πίνακας θρανίων. Τρέξτε το supabase/desks.sql στο SQL Editor.",
    };
  }

  if (desks.length) {
    const { error: desksInsertError } = await supabase.from("desks").insert(
      desks.map((desk) => ({
        id: desk.id,
        class_id: classId,
        label: null,
        position_x: desk.x,
        position_y: desk.y,
        width: desk.width,
        height: desk.height,
        seat_count: Math.min(24, Math.max(2, seatCount(desk))),
        arrangement: "row",
      })),
    );

    if (desksInsertError) {
      return { error: "Δεν ήταν δυνατή η αποθήκευση των θρανίων." };
    }
  }

  const deskById = new Map(desks.map((desk) => [desk.id, desk]));
  const rows = Object.entries(placements).flatMap(([studentId, placement]) => {
    const desk = deskById.get(placement.deskId);
    if (!desk) return [];
    const slot = seatSlots(desk).find(
      (item) => item.col === placement.col && item.row === placement.row,
    );
    if (!slot) return [];
    return [
      {
        class_id: classId,
        student_id: studentId,
        desk_id: desk.id,
        position_x: desk.x + slot.x,
        position_y: desk.y + slot.y,
      },
    ];
  });

  if (rows.length) {
    const { error: insertError } = await supabase.from("seating_layouts").insert(rows);
    if (insertError) {
      return { error: "Τα θρανία αποθηκεύτηκαν, αλλά όχι όλες οι θέσεις μαθητών." };
    }
  }

  revalidatePath(`/dashboard/class/${classId}`);
  return { success: true };
}
