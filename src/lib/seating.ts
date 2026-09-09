export const SEAT_SIZE = 72;
export const SEAT_GAP = 14;
export const SEAT_LABEL_HEIGHT = 16;
export const DESK_PAD_X = 14;
export const DESK_PAD_Y = 18;
export const MIN_DESK_COLS = 2;
export const MIN_DESK_ROWS = 1;
export const MAX_DESK_COLS = 8;
export const MAX_DESK_ROWS = 4;

export type CanvasDesk = {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
};

export type SeatSlot = {
  x: number;
  y: number;
  col: number;
  row: number;
};

export type Placement = {
  deskId: string;
  col: number;
  row: number;
};

export type Placements = Record<string, Placement>;

export function deskSizeForGrid(cols: number, rows: number) {
  return {
    width: DESK_PAD_X * 2 + cols * SEAT_SIZE + (cols - 1) * SEAT_GAP,
    height:
      DESK_PAD_Y * 2 +
      rows * (SEAT_SIZE + SEAT_LABEL_HEIGHT) +
      (rows - 1) * SEAT_GAP,
  };
}

export function minDeskSize() {
  return deskSizeForGrid(MIN_DESK_COLS, MIN_DESK_ROWS);
}

export function deskGrid(desk: Pick<CanvasDesk, "width" | "height">) {
  const innerW = desk.width - DESK_PAD_X * 2;
  const innerH = desk.height - DESK_PAD_Y * 2;
  const rowStride = SEAT_SIZE + SEAT_LABEL_HEIGHT + SEAT_GAP;
  const cols = Math.min(
    MAX_DESK_COLS,
    Math.max(
      MIN_DESK_COLS,
      1 + Math.floor((innerW - SEAT_SIZE) / (SEAT_SIZE + SEAT_GAP)),
    ),
  );
  const rows = Math.min(
    MAX_DESK_ROWS,
    Math.max(
      MIN_DESK_ROWS,
      1 + Math.floor((innerH - SEAT_SIZE - SEAT_LABEL_HEIGHT) / rowStride),
    ),
  );
  return { cols, rows };
}

export function seatCount(desk: Pick<CanvasDesk, "width" | "height">) {
  const { cols, rows } = deskGrid(desk);
  return cols * rows;
}

export function seatSlots(desk: CanvasDesk): SeatSlot[] {
  const { cols, rows } = deskGrid(desk);
  const slots: SeatSlot[] = [];
  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      slots.push({
        col,
        row,
        x: DESK_PAD_X + col * (SEAT_SIZE + SEAT_GAP),
        y: DESK_PAD_Y + row * (SEAT_SIZE + SEAT_LABEL_HEIGHT + SEAT_GAP),
      });
    }
  }
  return slots;
}

export function studentTint(id: string) {
  const palette = [
    "bg-emerald-100 text-emerald-950",
    "bg-amber-100 text-amber-950",
    "bg-sky-100 text-sky-950",
    "bg-rose-100 text-rose-950",
    "bg-violet-100 text-violet-950",
    "bg-lime-100 text-lime-950",
    "bg-orange-100 text-orange-950",
    "bg-teal-100 text-teal-950",
  ];
  let hash = 0;
  for (const char of id) {
    hash = (hash + char.charCodeAt(0) * 17) % palette.length;
  }
  return palette[hash];
}

export function clampDesk(
  desk: CanvasDesk,
  canvasWidth: number,
  canvasHeight: number,
): CanvasDesk {
  const min = minDeskSize();
  const padding = 8;
  const width = Math.min(Math.max(desk.width, min.width), canvasWidth - padding * 2);
  const height = Math.min(Math.max(desk.height, min.height), canvasHeight - padding * 2);
  return {
    ...desk,
    width,
    height,
    x: Math.min(Math.max(desk.x, padding), Math.max(padding, canvasWidth - width - padding)),
    y: Math.min(Math.max(desk.y, padding), Math.max(padding, canvasHeight - height - padding)),
  };
}

export function prunePlacements(desks: CanvasDesk[], placements: Placements): Placements {
  const deskById = new Map(desks.map((desk) => [desk.id, desk]));
  const next: Placements = {};
  for (const [studentId, placement] of Object.entries(placements)) {
    const desk = deskById.get(placement.deskId);
    if (!desk) continue;
    const { cols, rows } = deskGrid(desk);
    if (placement.col >= cols || placement.row >= rows) continue;
    next[studentId] = placement;
  }
  if (Object.keys(next).length === Object.keys(placements).length) return placements;
  return next;
}

export function placementsFromLayouts(
  desks: CanvasDesk[],
  layouts: {
    student_id: string;
    desk_id: string | null;
    position_x: number;
    position_y: number;
  }[],
): Placements {
  const placements: Placements = {};
  const occupied = new Set<string>();

  for (const layout of layouts) {
    if (!layout.desk_id) continue;
    const desk = desks.find((item) => item.id === layout.desk_id);
    if (!desk) continue;

    const absX = Number(layout.position_x);
    const absY = Number(layout.position_y);
    const slots = seatSlots(desk);
    let best: SeatSlot | null = null;
    let bestDistance = Infinity;

    for (const slot of slots) {
      const key = `${desk.id}:${slot.col}:${slot.row}`;
      if (occupied.has(key)) continue;
      const dx = absX - (desk.x + slot.x);
      const dy = absY - (desk.y + slot.y);
      const distance = dx * dx + dy * dy;
      if (distance < bestDistance) {
        bestDistance = distance;
        best = slot;
      }
    }

    if (best) {
      occupied.add(`${desk.id}:${best.col}:${best.row}`);
      placements[layout.student_id] = {
        deskId: desk.id,
        col: best.col,
        row: best.row,
      };
    }
  }

  return placements;
}
