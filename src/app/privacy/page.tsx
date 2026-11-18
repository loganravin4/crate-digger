import type { Metadata } from "next";
import { NotesPage } from "@/components/NotesPage";

export const metadata: Metadata = {
  title: "Privacy",
  description: "What Crate Digger stores: your game progress and stats, in your own browser only.",
  alternates: { canonical: "/privacy" },
};

// Draft: have a lawyer review before launch. Contact details are placeholders.
export default function PrivacyPage() {
  return (
    <NotesPage title="Privacy" updated="November 18, 2026">
      <p>
        Crate Digger has no accounts, no ads, no analytics, and no tracking. We don&rsquo;t collect, sell, or share personal
        information.
      </p>
      <h2>What&rsquo;s stored, and where</h2>
      <p>
        Your answers for today&rsquo;s sets, your stats (games played, streak, best score), and the clock setting are saved in
        your browser&rsquo;s local storage so you can pick up where you left off. That data never leaves your device and we
        can&rsquo;t see it. Clear your browser&rsquo;s site data to delete it.
      </p>
      <h2>Sharing results</h2>
      <p>
        &ldquo;Share the tracklist&rdquo; copies a short text summary to your clipboard or opens your device&rsquo;s share
        sheet. Nothing is sent to us.
      </p>
      <h2>Hosting</h2>
      <p>
        Like any website, the host that serves these pages may keep standard request logs (such as IP address and browser
        type) for security and reliability.
      </p>
      <h2>Children</h2>
      <p>Crate Digger is a general-audience game and doesn&rsquo;t knowingly collect information from anyone.</p>
      <h2>Contact</h2>
      <p>Questions: [contact email].</p>
    </NotesPage>
  );
}
