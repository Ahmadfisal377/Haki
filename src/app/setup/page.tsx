export const metadata = { title: "Haki — Setup" };

export default function SetupPage() {
  return (
    <main className="mx-auto max-w-xl px-6 py-16">
      <h1 className="font-display text-3xl font-bold whitespace-nowrap">
        Haki <span className="text-primary">حكي</span>
      </h1>
      <p className="sub mt-2 text-base">
        Almost there — the app needs its environment configured before it can run.
      </p>

      <ol className="mt-8 space-y-4 text-[15px] leading-relaxed">
        <li>
          <strong>1. Supabase.</strong> Create a project at supabase.com, open the
          SQL editor, and run <code className="rounded bg-surface px-1.5 py-0.5 text-sm">supabase/schema.sql</code> from this repo.
        </li>
        <li>
          <strong>2. Environment.</strong> Copy <code className="rounded bg-surface px-1.5 py-0.5 text-sm">.env.example</code> to{" "}
          <code className="rounded bg-surface px-1.5 py-0.5 text-sm">.env.local</code> and fill in{" "}
          <code className="rounded bg-surface px-1.5 py-0.5 text-sm">NEXT_PUBLIC_SUPABASE_URL</code> and{" "}
          <code className="rounded bg-surface px-1.5 py-0.5 text-sm">NEXT_PUBLIC_SUPABASE_ANON_KEY</code>.
        </li>
        <li>
          <strong>3. Optional — AI.</strong> Add{" "}
          <code className="rounded bg-surface px-1.5 py-0.5 text-sm">LLM_API_KEY</code> to bring
          Haki AI, smart replies and insights to life. Without it the app runs in
          placeholder mode.
        </li>
        <li>
          <strong>4. Restart</strong> the dev server and reload this page.
        </li>
      </ol>
    </main>
  );
}
