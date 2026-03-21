import { Link } from "@tanstack/react-router";

export default function Header() {
  return (
    <header className="border-b border-bg-muted bg-background px-4">
      <nav className="page-wrap flex items-center gap-3 py-3">
        <h2 className="m-0 shrink-0 text-base font-semibold tracking-tight">
          <Link to="/" className="font-mono text-sm font-semibold no-underline">
            ktchn
          </Link>
        </h2>

        <div className="ml-auto flex items-center gap-2 sm:gap-3"></div>
      </nav>
    </header>
  );
}
