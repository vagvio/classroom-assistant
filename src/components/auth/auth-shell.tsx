import type { ReactNode } from "react";
import { BrandMark } from "@/components/brand-mark";

export function AuthShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-full flex-1 items-center justify-center px-6 py-10">
      <div className="w-full max-w-xl rounded-[2rem] border border-border bg-card p-8 shadow-[0_20px_50px_rgba(47,38,28,0.08)] sm:p-12">
        <BrandMark />
        <div className="mt-10 space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">
            {title}
          </h1>
          <p className="text-base leading-7 text-muted">{subtitle}</p>
        </div>
        <div className="mt-8">{children}</div>
      </div>
    </div>
  );
}
