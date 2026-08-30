export function BrandMark({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <span className="flex size-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          className="size-6"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
        >
          <path d="M4 6.5 12 4l8 2.5v6.2c0 4.1-3.4 6.6-8 8.3-4.6-1.7-8-4.2-8-8.3V6.5Z" />
          <path d="M9 12.2 11.1 14.3 15.4 10" />
        </svg>
      </span>
      <div>
        <p className="text-lg font-semibold tracking-tight text-foreground">
          Classroom Assistant
        </p>
        <p className="text-sm text-muted">Για καθηγητές, στο tablet</p>
      </div>
    </div>
  );
}
