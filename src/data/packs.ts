import general from "./packs/general.json";
import hiphop from "./packs/hiphop.json";
import pop from "./packs/pop.json";
import type { PackFile } from "./types";

export type PackMeta = {
  id: string;
  name: string;
  /** Series line printed on the sleeve. */
  series: string;
  blurb: string;
  /** CSS custom-property suffix: --field-<tone>, --on-<tone>. */
  tone: "ochre" | "vermilion" | "cobalt";
};

export const PACKS: PackMeta[] = [
  {
    id: "general",
    name: "General",
    series: "The Whole Shop",
    blurb: "Every genre, every decade. Beatles to Bad Bunny, Motown to Eurovision.",
    tone: "ochre",
  },
  {
    id: "hiphop",
    name: "Hip-Hop",
    series: "Breaks & Bars",
    blurb: "Rap and R&B from the Bronx block parties to now. Crews, cities, producers.",
    tone: "vermilion",
  },
  {
    id: "pop",
    name: "Pop",
    series: "Chart Material",
    blurb: "Divas, boy bands, Max Martin, and Eurovision. The eighties through today.",
    tone: "cobalt",
  },
];

const DATA: Record<string, PackFile> = {
  general: general as PackFile,
  hiphop: hiphop as PackFile,
  pop: pop as PackFile,
};

export function getPack(id: string): { meta: PackMeta; data: PackFile } | null {
  const meta = PACKS.find((p) => p.id === id);
  const data = DATA[id];
  return meta && data ? { meta, data } : null;
}
