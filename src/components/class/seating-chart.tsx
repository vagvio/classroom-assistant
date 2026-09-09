"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { StudentToken, type SeatingStudent } from "@/components/class/student-token";
import { saveSeatingPlan } from "@/lib/actions/seating";
import {
  clampDesk,
  minDeskSize,
  placementsFromLayouts,
  prunePlacements,
  seatSlots,
  type CanvasDesk,
  type Placements,
} from "@/lib/seating";

type DropTarget =
  | { kind: "seat"; deskId: string; col: number; row: number }
  | { kind: "unplaced" };

type StudentDrag = {
  studentId: string;
  x: number;
  y: number;
  hover: DropTarget | null;
};

function readDropTarget(x: number, y: number): DropTarget | null {
  const element = document.elementFromPoint(x, y);
  if (!(element instanceof Element)) return null;
  const seat = element.closest("[data-seat]");
  if (seat instanceof HTMLElement) {
    const deskId = seat.dataset.deskId;
    const col = Number(seat.dataset.seatCol);
    const row = Number(seat.dataset.seatRow);
    if (deskId && Number.isInteger(col) && Number.isInteger(row)) {
      return { kind: "seat", deskId, col, row };
    }
  }
  if (element.closest("[data-unplaced-drop]")) {
    return { kind: "unplaced" };
  }
  return null;
}

export function SeatingChart({
  classId,
  students,
  initialDesks,
  initialLayouts,
}: {
  classId: string;
  students: SeatingStudent[];
  initialDesks: CanvasDesk[];
  initialLayouts: {
    student_id: string;
    desk_id: string | null;
    position_x: number;
    position_y: number;
  }[];
}) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [desks, setDesks] = useState<CanvasDesk[]>(initialDesks);
  const [placements, setPlacements] = useState<Placements>(() =>
    placementsFromLayouts(initialDesks, initialLayouts),
  );
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [studentDrag, setStudentDrag] = useState<StudentDrag | null>(null);
  const studentDragRef = useRef<StudentDrag | null>(null);
  studentDragRef.current = studentDrag;
  const desksRef = useRef(desks);
  desksRef.current = desks;
  const [canvasSize, setCanvasSize] = useState({ width: 900, height: 640 });

  const studentById = useMemo(
    () => new Map(students.map((student) => [student.id, student])),
    [students],
  );

  const unplaced = students.filter((student) => !placements[student.id]);

  useEffect(() => {
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const updateSize = () => {
      setCanvasSize({
        width: canvas.clientWidth,
        height: canvas.clientHeight,
      });
    };

    updateSize();
    const observer = new ResizeObserver(updateSize);
    observer.observe(canvas);
    return () => observer.disconnect();
  }, []);

  const markDirty = () => {
    setDirty(true);
    setMessage(null);
  };

  const patchDesk = useCallback(
    (deskId: string, patch: Partial<CanvasDesk>) => {
      const min = minDeskSize();
      const nextDesks = desksRef.current.map((desk) => {
        if (desk.id !== deskId) return desk;
        const next = { ...desk, ...patch };
        return clampDesk(
          {
            ...next,
            width: Math.max(next.width, min.width),
            height: Math.max(next.height, min.height),
          },
          canvasSize.width,
          canvasSize.height,
        );
      });
      desksRef.current = nextDesks;
      setDesks(nextDesks);
      if (patch.width !== undefined || patch.height !== undefined) {
        setPlacements((current) => prunePlacements(nextDesks, current));
      }
    },
    [canvasSize.height, canvasSize.width],
  );

  function addDesk() {
    const min = minDeskSize();
    const desk = clampDesk(
      {
        id: crypto.randomUUID(),
        x: 48 + (desks.length % 4) * 28,
        y: 40 + desks.length * 18,
        width: min.width,
        height: min.height,
      },
      canvasSize.width,
      canvasSize.height,
    );
    setDesks((current) => [...current, desk]);
    markDirty();
  }

  function removeDesk(deskId: string) {
    setDesks((current) => current.filter((desk) => desk.id !== deskId));
    setPlacements((current) => {
      const next = { ...current };
      for (const [studentId, placement] of Object.entries(next)) {
        if (placement.deskId === deskId) delete next[studentId];
      }
      return next;
    });
    markDirty();
  }

  function occupant(deskId: string, col: number, row: number) {
    return Object.entries(placements).find(
      ([, placement]) =>
        placement.deskId === deskId && placement.col === col && placement.row === row,
    )?.[0];
  }

  function dropStudent(studentId: string, target: DropTarget | null) {
    if (!target || target.kind === "unplaced") {
      setPlacements((current) => {
        if (!current[studentId]) return current;
        const next = { ...current };
        delete next[studentId];
        return next;
      });
      markDirty();
      return;
    }

    setPlacements((current) => {
      const next = { ...current };
      const occupying = Object.entries(next).find(
        ([id, placement]) =>
          id !== studentId &&
          placement.deskId === target.deskId &&
          placement.col === target.col &&
          placement.row === target.row,
      );
      const previous = next[studentId];
      if (occupying && previous) {
        next[occupying[0]] = previous;
      } else if (occupying) {
        delete next[occupying[0]];
      }
      next[studentId] = {
        deskId: target.deskId,
        col: target.col,
        row: target.row,
      };
      return next;
    });
    markDirty();
  }

  function startStudentDrag(event: ReactPointerEvent<HTMLButtonElement>, studentId: string) {
    if (event.button !== 0 && event.pointerType === "mouse") return;
    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.setPointerCapture(event.pointerId);
    document.body.style.overflow = "hidden";
    setStudentDrag({
      studentId,
      x: event.clientX,
      y: event.clientY,
      hover: readDropTarget(event.clientX, event.clientY),
    });
  }

  function moveStudentDrag(event: ReactPointerEvent<HTMLButtonElement>) {
    event.preventDefault();
    setStudentDrag((current) =>
      current
        ? {
            ...current,
            x: event.clientX,
            y: event.clientY,
            hover: readDropTarget(event.clientX, event.clientY),
          }
        : current,
    );
  }

  function endStudentDrag(event: ReactPointerEvent<HTMLButtonElement>) {
    event.preventDefault();
    document.body.style.overflow = "";
    const studentId = studentDragRef.current?.studentId;
    const target = readDropTarget(event.clientX, event.clientY);
    setStudentDrag(null);
    if (studentId) {
      dropStudent(studentId, target);
    }
  }

  function startDeskDrag(event: ReactPointerEvent<HTMLElement>, desk: CanvasDesk) {
    if ((event.target as HTMLElement).closest("[data-no-desk-drag]")) return;
    if (event.button !== 0 && event.pointerType === "mouse") return;
    event.preventDefault();
    const originX = event.clientX;
    const originY = event.clientY;
    const startX = desk.x;
    const startY = desk.y;
    const pointerId = event.pointerId;
    event.currentTarget.setPointerCapture(pointerId);
    markDirty();
    document.body.style.overflow = "hidden";

    const onMove = (moveEvent: PointerEvent) => {
      if (moveEvent.pointerId !== pointerId) return;
      moveEvent.preventDefault();
      patchDesk(desk.id, {
        x: startX + (moveEvent.clientX - originX),
        y: startY + (moveEvent.clientY - originY),
      });
    };
    const onUp = (upEvent: PointerEvent) => {
      if (upEvent.pointerId !== pointerId) return;
      document.body.style.overflow = "";
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
    window.addEventListener("pointermove", onMove, { passive: false });
    window.addEventListener("pointerup", onUp);
  }

  function startResize(event: ReactPointerEvent<HTMLButtonElement>, desk: CanvasDesk) {
    event.preventDefault();
    event.stopPropagation();
    const originX = event.clientX;
    const originY = event.clientY;
    const startW = desk.width;
    const startH = desk.height;
    const pointerId = event.pointerId;
    event.currentTarget.setPointerCapture(pointerId);
    markDirty();
    document.body.style.overflow = "hidden";

    const onMove = (moveEvent: PointerEvent) => {
      if (moveEvent.pointerId !== pointerId) return;
      moveEvent.preventDefault();
      patchDesk(desk.id, {
        width: startW + (moveEvent.clientX - originX),
        height: startH + (moveEvent.clientY - originY),
      });
    };
    const onUp = (upEvent: PointerEvent) => {
      if (upEvent.pointerId !== pointerId) return;
      document.body.style.overflow = "";
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
    window.addEventListener("pointermove", onMove, { passive: false });
    window.addEventListener("pointerup", onUp);
  }

  async function handleSave() {
    setSaving(true);
    setMessage(null);
    const result = await saveSeatingPlan(classId, desks, placements);
    setSaving(false);
    if (result.error) {
      setMessage(result.error);
      return;
    }
    setDirty(false);
    setMessage("Το πλάνο αποθηκεύτηκε.");
  }

  const draggingStudent = studentDrag
    ? studentById.get(studentDrag.studentId)
    : undefined;

  return (
    <div className="flex h-[calc(100dvh-12.5rem)] min-h-[36rem] flex-col gap-4 overflow-hidden md:flex-row">
      <aside
        data-unplaced-drop=""
        className={`flex shrink-0 touch-pan-y flex-col rounded-[1.75rem] border bg-card p-4 md:w-72 ${
          studentDrag?.hover?.kind === "unplaced"
            ? "border-primary ring-4 ring-primary/15"
            : "border-border"
        }`}
      >
        <div className="mb-3">
          <p className="text-sm font-semibold uppercase tracking-wide text-muted">
            Μη τοποθετημένοι
          </p>
          <p className="mt-1 text-sm text-muted">
            {unplaced.length === 1
              ? "1 μαθητής χωρίς θέση"
              : `${unplaced.length} μαθητές χωρίς θέση`}
          </p>
        </div>
        <div className="flex flex-1 gap-3 overflow-x-auto overflow-y-hidden md:flex-col md:overflow-x-hidden md:overflow-y-auto">
          {unplaced.length ? (
            unplaced.map((student) => (
              <button
                key={student.id}
                type="button"
                className="touch-none rounded-2xl border border-border bg-background px-2 py-2 text-left"
                onPointerDown={(event) => startStudentDrag(event, student.id)}
                onPointerMove={moveStudentDrag}
                onPointerUp={endStudentDrag}
                onPointerCancel={endStudentDrag}
              >
                <StudentToken
                  student={student}
                  muted={studentDrag?.studentId === student.id}
                />
              </button>
            ))
          ) : (
            <p className="text-sm leading-6 text-muted">
              Όλοι οι μαθητές έχουν θέση. Σύρετε έναν πίσω εδώ για να τον αφαιρέσετε.
            </p>
          )}
        </div>
      </aside>

      <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
          <button
            type="button"
            onClick={addDesk}
            className="h-12 rounded-2xl bg-primary px-4 text-sm font-semibold text-primary-foreground"
          >
            Προσθήκη Θρανίου
          </button>
          <div className="flex items-center gap-3">
            {message ? <p className="text-sm text-muted">{message}</p> : null}
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="h-12 rounded-2xl bg-primary px-5 text-sm font-semibold text-primary-foreground disabled:opacity-60"
            >
              {saving ? "Αποθήκευση..." : dirty ? "Αποθήκευση Πλάνου*" : "Αποθήκευση Πλάνου"}
            </button>
          </div>
        </div>

        <div
          ref={canvasRef}
          className="relative min-h-0 flex-1 touch-none overflow-hidden rounded-[1.75rem] border border-border"
          style={{
            backgroundColor: "#f3eee4",
            backgroundImage:
              "linear-gradient(to right, rgba(31,78,70,0.06) 1px, transparent 1px), linear-gradient(to bottom, rgba(31,78,70,0.06) 1px, transparent 1px)",
            backgroundSize: "28px 28px",
          }}
        >
          {!desks.length ? (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center p-6 text-center">
              <p className="max-w-sm text-base leading-7 text-muted">
                Προσθέστε θρανίο και σύρετε το κάτω δεξιά για περισσότερες θέσεις.
              </p>
            </div>
          ) : null}

          {desks.map((desk) => (
            <article
              key={desk.id}
              className="absolute z-10 touch-none rounded-[1.4rem] border border-[#d7c9b0] bg-[#efe4cf] shadow-[0_10px_24px_rgba(47,38,28,0.12)]"
              style={{
                left: desk.x,
                top: desk.y,
                width: desk.width,
                height: desk.height,
              }}
              onPointerDown={(event) => startDeskDrag(event, desk)}
            >
              <button
                type="button"
                data-no-desk-drag=""
                onClick={() => removeDesk(desk.id)}
                className="absolute top-1 right-1 z-10 size-8 rounded-lg text-sm font-semibold text-red-800"
                aria-label="Διαγραφή θρανίου"
              >
                ×
              </button>

              {seatSlots(desk).map((slot) => {
                const studentId = occupant(desk.id, slot.col, slot.row);
                const student = studentId ? studentById.get(studentId) : undefined;
                const isHover =
                  studentDrag?.hover?.kind === "seat" &&
                  studentDrag.hover.deskId === desk.id &&
                  studentDrag.hover.col === slot.col &&
                  studentDrag.hover.row === slot.row;
                return (
                  <div
                    key={`${desk.id}-${slot.col}-${slot.row}`}
                    data-seat=""
                    data-desk-id={desk.id}
                    data-seat-col={slot.col}
                    data-seat-row={slot.row}
                    data-no-desk-drag=""
                    className="absolute w-[72px]"
                    style={{ left: slot.x, top: slot.y }}
                  >
                    {student ? (
                      <button
                        type="button"
                        className="relative w-full touch-none"
                        onPointerDown={(event) => startStudentDrag(event, student.id)}
                        onPointerMove={moveStudentDrag}
                        onPointerUp={endStudentDrag}
                        onPointerCancel={endStudentDrag}
                      >
                        <StudentToken
                          student={student}
                          muted={studentDrag?.studentId === student.id}
                        />
                        <span
                          className={`pointer-events-none absolute inset-x-0 top-0 size-[72px] rounded-2xl border ${
                            isHover ? "border-primary" : "border-transparent"
                          }`}
                        />
                      </button>
                    ) : (
                      <div
                        className={`size-[72px] rounded-2xl border border-dashed ${
                          isHover
                            ? "border-primary bg-primary/10"
                            : "border-[#c8b89a] bg-[#f7f0e3]/80"
                        }`}
                      />
                    )}
                  </div>
                );
              })}

              <button
                type="button"
                data-no-desk-drag=""
                aria-label="Άνοιγμα θρανίου"
                className="absolute right-0 bottom-0 size-5 touch-none rounded-tl-md rounded-br-[1.4rem] bg-primary/85"
                onPointerDown={(event) => startResize(event, desk)}
              />
            </article>
          ))}
        </div>
      </div>

      {draggingStudent && studentDrag ? (
        <div
          className="pointer-events-none fixed z-50"
          style={{ left: studentDrag.x - 36, top: studentDrag.y - 36 }}
        >
          <StudentToken student={draggingStudent} />
        </div>
      ) : null}
    </div>
  );
}
