import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Game } from "@/components/Game";
import { getPack, PACKS } from "@/data/packs";

export function generateStaticParams() {
  return PACKS.map((p) => ({ pack: p.id }));
}

export async function generateMetadata({ params }: PageProps<"/play/[pack]">): Promise<Metadata> {
  const { pack } = await params;
  const found = getPack(pack);
  if (!found) return {};
  return {
    title: `${found.meta.name} daily set`,
    description: `Today's seven ${found.meta.name} prompts. Name the rarest correct answer you can. ${found.meta.blurb}`,
    alternates: { canonical: `/play/${pack}` },
  };
}

export default async function PlayPage({ params }: PageProps<"/play/[pack]">) {
  const { pack } = await params;
  const found = getPack(pack);
  if (!found) notFound();
  return <Game meta={found.meta} pool={found.data.prompts} />;
}
