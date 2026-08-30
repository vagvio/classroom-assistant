import Link from "next/link";

type ClassTab = "seating" | "students";

export function ClassTabs({
  classId,
  active,
}: {
  classId: string;
  active: ClassTab;
}) {
  const tabs: { id: ClassTab; label: string }[] = [
    { id: "seating", label: "Πλάνο Τάξης" },
    { id: "students", label: "Μαθητές" },
  ];

  return (
    <div className="flex gap-2 rounded-[1.5rem] bg-card p-2 shadow-[0_8px_24px_rgba(47,38,28,0.05)]">
      {tabs.map((tab) => {
        const isActive = tab.id === active;
        return (
          <Link
            key={tab.id}
            href={`/dashboard/class/${classId}?tab=${tab.id}`}
            className={`flex h-14 flex-1 items-center justify-center rounded-2xl text-base font-semibold transition ${
              isActive
                ? "bg-primary text-primary-foreground"
                : "text-muted hover:bg-background"
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
