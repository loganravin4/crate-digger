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
  /** Average uppercase glyph width (em) of this pack's display voice, for fitting cover type. */
  glyph: number;
};

export const PACKS: PackMeta[] = [
  {
    id: "general",
    name: "General",
    series: "The Whole Shop",
    blurb: "Every genre, every decade. Beatles to Bad Bunny, Motown to Eurovision.",
    tone: "ochre",
    glyph: 0.46,
  },
  {
    id: "hiphop",
    name: "Hip-Hop",
    series: "Breaks & Bars",
    blurb: "Rap and R&B from the Bronx block parties to now. Crews, cities, producers.",
    tone: "vermilion",
    glyph: 0.9,
  },
  {
    id: "pop",
    name: "Pop",
    series: "Chart Material",
    blurb: "Divas, boy bands, Max Martin, and Eurovision. The eighties through today.",
    tone: "cobalt",
    glyph: 0.52,
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
