import Link from "next/link";
import { AlertCircle, ArrowLeft, MousePointerClick } from "lucide-react";
import { BACKEND_URL } from "@/lib/backend";

type StatsResponse = { code: string; clicks: number };

export default async function StatsPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;

  let clicks: number | null = null;
  let error: string | null = null;

  try {
    const res = await fetch(`${BACKEND_URL}/stats/${encodeURIComponent(code)}`, {
      cache: "no-store",
    });
    if (res.ok) {
      const data: StatsResponse = await res.json();
      clicks = data.clicks;
    } else {
      error = `Backend returned ${res.status}`;
    }
  } catch {
    error = `Could not reach the backend at ${BACKEND_URL}.`;
  }

  return (
    <div className="relative flex flex-1 items-start justify-center px-6 py-20">
      <div aria-hidden="true" className="bg-dot-grid pointer-events-none absolute inset-0" />
      <main className="relative flex w-full max-w-md flex-col gap-6">
        <Link
          href="/"
          className="inline-flex w-fit items-center gap-1.5 text-sm text-zinc-800 transition-colors hover:text-zinc-900 dark:text-zinc-200 dark:hover:text-zinc-50"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back
        </Link>

        <div className="flex flex-col items-center gap-6 rounded-xl border border-zinc-200 bg-white p-8 text-center dark:border-zinc-800 dark:bg-zinc-950">
          <p className="rounded-full border border-zinc-300 px-3 py-1 font-mono text-xs text-zinc-900 dark:border-zinc-700 dark:text-zinc-50">
            {code}
          </p>

          {error ? (
            <p className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </p>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-cyan-500 text-white shadow-sm shadow-indigo-500/30">
                <MousePointerClick className="h-5 w-5" />
              </span>
              <p className="text-5xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
                {clicks}
              </p>
              <p className="text-sm text-zinc-800 dark:text-zinc-200">
                click{clicks === 1 ? "" : "s"}
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
