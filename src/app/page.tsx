import { HomeShop, type TierExample } from "@/components/HomeShop";
import { getPack, PACKS } from "@/data/packs";
import { tierOf } from "@/lib/score";
import { TIER_IDS } from "@/lib/tiers";

/** One real answer per tier from the General pack's Beatles prompt, for the scroll dive. */
function examples(): { prompt: string; rows: TierExample[] } {
  const prompt = getPack("general")!.data.prompts.find((p) => p.id === "general-01")!;
  const rows = TIER_IDS.map((tier) => {
    const a = prompt.answers.find((x) => tierOf(x) === tier);
    return a ? { tier, name: a.name } : null;
  }).filter((r): r is TierExample => r !== null);
  return { prompt: prompt.text, rows };
}

export default function Home() {
  const ex = examples();
  return <HomeShop packs={PACKS} examples={ex.rows} examplePrompt={ex.prompt} />;
}
