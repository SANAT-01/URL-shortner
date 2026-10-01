"use client";

import { useActionState, useEffect, useSyncExternalStore } from "react";
import Link from "next/link";
import { AlertCircle, BarChart3, ExternalLink, Link2, X } from "lucide-react";
import { shortenUrl, type ShortenState } from "@/app/actions";
import { CopyButton } from "@/components/CopyButton";
import { SubmitButton } from "@/components/SubmitButton";
import {
  addLink,
  clearLinks,
  getServerSnapshot,
  getSnapshot,
  subscribe,
} from "@/lib/linkHistory";

const initialState: ShortenState = { status: "idle" };

export function ShortenForm() {
  const [state, formAction] = useActionState(shortenUrl, initialState);
  const links = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  // Fold a successful action result into the persisted link history. This is
  // synchronizing an external system (localStorage) with the latest action
  // result — the sanctioned use of an effect — rather than deriving local
  // component state, so it's not the "you might not need an effect" case.
  useEffect(() => {
    if (state.status === "success" && state.code && state.shortUrl && state.longUrl) {
      addLink({ code: state.code, shortUrl: state.shortUrl, longUrl: state.longUrl });
    }
  }, [state]);

  return (
    <div className="flex w-full flex-col gap-8">
      <form
        action={formAction}
        className="flex flex-col gap-3 rounded-xl border border-zinc-200 bg-white/80 p-3 shadow-sm backdrop-blur-sm sm:flex-row dark:border-zinc-800 dark:bg-zinc-950/60"
      >
        <div className="relative flex-1">
          <Link2 className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-zinc-700 dark:text-zinc-300" />
          <input
            name="longUrl"
            type="url"
            placeholder="https://example.com/a/very/long/url"
            required
            className="w-full rounded-lg border border-zinc-200 bg-white py-2.5 pr-4 pl-10 text-sm text-zinc-900 outline-none placeholder:text-zinc-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-50 dark:placeholder:text-zinc-500"
          />
        </div>
        <SubmitButton />
      </form>

      {state.status === "error" && (
        <p className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {state.message}
        </p>
      )}

      {links.length > 0 && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium tracking-wide text-zinc-600 uppercase dark:text-zinc-400">
              Your links
            </span>
            <button
              type="button"
              onClick={clearLinks}
              className="inline-flex items-center gap-1 text-xs text-zinc-600 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
            >
              <X className="h-3 w-3" />
              Clear
            </button>
          </div>
          <ul className="flex flex-col gap-3">
            {links.map((link) => (
              <li
                key={link.code}
                className="group flex flex-col gap-2.5 rounded-xl border border-zinc-200 bg-white p-4 transition-shadow hover:shadow-md dark:border-zinc-800 dark:bg-zinc-950"
              >
                <div className="flex items-center justify-between gap-3">
                  <a
                    href={link.shortUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex min-w-0 items-center gap-1.5 truncate font-mono text-sm font-medium text-indigo-600 hover:underline dark:text-indigo-400"
                  >
                    <span className="truncate">{link.shortUrl}</span>
                    <ExternalLink className="h-3.5 w-3.5 shrink-0 opacity-0 transition-opacity group-hover:opacity-100" />
                  </a>
                  <div className="flex shrink-0 items-center gap-2">
                    <CopyButton value={link.shortUrl} />
                    <Link
                      href={`/stats/${link.code}`}
                      className="inline-flex items-center gap-1.5 rounded-md border border-zinc-300 px-2.5 py-1.5 text-xs font-medium text-zinc-900 transition-colors hover:border-zinc-400 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-50 dark:hover:border-zinc-500 dark:hover:bg-zinc-900"
                    >
                      <BarChart3 className="h-3.5 w-3.5" />
                      Stats
                    </Link>
                  </div>
                </div>
                <p className="truncate text-xs text-zinc-700 dark:text-zinc-300">
                  {link.longUrl}
                </p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
