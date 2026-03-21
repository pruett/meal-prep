import type { ComponentPropsWithoutRef } from "react";
import { cn } from "~/lib/utils";

type AppShellProps = ComponentPropsWithoutRef<"main">;

export function AppShell({ className, children, ...props }: AppShellProps) {
  return (
    <main
      className={cn("mx-auto min-h-dvh max-w-5xl px-4 pb-8 pt-14", className)}
      {...props}
    >
      {children}
    </main>
  );
}
