import { ShortenForm } from "@/components/ShortenForm";

export default function Home() {
  return (
    <div className="relative flex flex-1 items-start justify-center px-6 py-20">
      <div aria-hidden="true" className="bg-dot-grid pointer-events-none absolute inset-0" />
      <main className="relative flex w-full max-w-xl flex-col gap-10">
        <div className="flex flex-col items-center gap-3 text-center">
          <h1 className="text-4xl font-semibold tracking-tight text-zinc-900 sm:text-5xl dark:text-zinc-50">
            Shorten your links
          </h1>
          <p className="max-w-sm text-base text-zinc-800 dark:text-zinc-200">
            Paste a long URL below and get a short one back instantly.
          </p>
        </div>
        <ShortenForm />
      </main>
    </div>
  );
}
