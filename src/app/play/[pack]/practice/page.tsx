import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Game } from "@/components/Game";
import { getPack, PACKS } from "@/data/packs";

export function generateStaticParams() {
  return PACKS.map((p) => ({ pack: p.id }));
}

export async function generateMetadata({ params }: PageProps<"/play/[pack]/practice">): Promise<Metadata> {
  const { pack } = await params;
  const found = getPack(pack);
  if (!found) return {};
  return {
    title: `${found.meta.name} practice`,
    description: `Random ${found.meta.name} prompts, as many rounds as you like. Nothing is saved.`,
    alternates: { canonical: `/play/${pack}/practice` },
    robots: { index: false },
  };
}

export default async function PracticePage({ params }: PageProps<"/play/[pack]/practice">) {
  const { pack } = await params;
  const found = getPack(pack);
  if (!found) notFound();
  return <Game meta={found.meta} pool={found.data.prompts} practice />;
}
