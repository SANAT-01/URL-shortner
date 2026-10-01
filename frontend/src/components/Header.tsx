import Link from "next/link";
import { Link2 } from "lucide-react";

export function Header() {
  return (
    <header className="border-b border-zinc-200/70 dark:border-zinc-800/70">
      <div className="mx-auto flex w-full max-w-3xl items-center justify-between px-6 py-5">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-cyan-500 text-white shadow-sm shadow-indigo-500/30">
            <Link2 className="h-4 w-4" strokeWidth={2.5} />
          </span>
          <span className="text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            shortly
          </span>
        </Link>
        <span className="hidden text-sm text-zinc-800 sm:inline dark:text-zinc-200">
          Fast, no-frills link shortening
        </span>
      </div>
    </header>
  );
}
