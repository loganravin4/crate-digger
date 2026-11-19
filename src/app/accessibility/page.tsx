import type { Metadata } from "next";
import { NotesPage } from "@/components/NotesPage";

export const metadata: Metadata = {
  title: "Accessibility",
  description: "Crate Digger's accessibility commitment, known gaps, and how to reach us.",
  alternates: { canonical: "/accessibility" },
};

export default function AccessibilityPage() {
  return (
    <NotesPage title="Accessibility" updated="November 18, 2026">
      <p>We aim for Crate Digger to meet WCAG 2.2 Level AA.</p>
      <h2>What we&rsquo;ve built in</h2>
      <ul className="list-disc space-y-2 pl-5">
        <li>The whole game plays by keyboard: type, press Enter to dig, and press Enter again for the next track. A typo prompt (&ldquo;did you mean…?&rdquo;) takes Enter for yes and Escape for no.</li>
        <li>Sound is optional and off with one switch; nothing depends on hearing it.</li>
        <li>The 30-second clock can be turned off at any time with the Clock switch. Your setting is remembered.</li>
        <li>Results are announced to screen readers, and the clock gives a single warning at 10 seconds.</li>
        <li>With reduced motion on, records land instantly instead of falling through the shop.</li>
        <li>Text meets AA contrast against every pack color.</li>
      </ul>
      <h2>Known gaps</h2>
      <p>Answer matching covers English spellings; some transliterated names may not match yet.</p>
      <h2>Contact</h2>
      <p>If something gets in your way, tell us at [contact email] and we&rsquo;ll fix it.</p>
    </NotesPage>
  );
}
