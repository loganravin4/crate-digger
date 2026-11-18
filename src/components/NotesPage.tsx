import Link from "next/link";
import { ArrowLeft } from "./icons";

/** Plain liner-notes page for policies. */
export function NotesPage({ title, updated, children }: { title: string; updated: string; children: React.ReactNode }) {
  return (
    <main className="mx-auto w-full max-w-[42rem] px-4 pb-20 sm:px-0">
      <header className="py-4">
        <Link href="/" className="smallprint inline-flex min-h-11 items-center gap-2 text-paper-dim no-underline hover:text-paper">
          <ArrowLeft className="size-4" />
          Crate
        </Link>
      </header>
      <h1 className="display-condensed mt-6 text-[clamp(3rem,12vw,5rem)]">{title}</h1>
      <p className="smallprint mt-3 text-paper-mute">Last updated {updated}</p>
      <div className="mt-8 space-y-5 leading-relaxed text-paper-dim [&_h2]:display-wide [&_h2]:mt-10 [&_h2]:text-lg [&_h2]:text-paper [&_a]:text-paper [&_a]:underline">
        {children}
      </div>
    </main>
  );
}
