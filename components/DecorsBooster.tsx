import type { ReactNode } from "react";
import type { IdExtension } from "@/lib/extensions";

// Petites formes éparpillées sur le booster : position (%), taille (px), angle, couleur
type Forme = { x: number; y: number; taille: number; angle: number; couleur: string };

const POSITIONS = [
  { x: 34, y: -4, taille: 62, angle: 12 },
  { x: 72, y: 14, taille: 66, angle: -18 },
  { x: -6, y: 30, taille: 60, angle: -24 },
  { x: 74, y: 56, taille: 60, angle: 20 },
  { x: -4, y: 68, taille: 64, angle: 14 },
  { x: 60, y: 82, taille: 58, angle: -10 },
];
const colorer = (couleurs: string[]): Forme[] =>
  POSITIONS.map((position, i) => ({ ...position, couleur: couleurs[i] }));

function FormesEparpillees({ formes, dessin }: { formes: Forme[]; dessin: ReactNode }) {
  return formes.map((forme, i) => (
    <svg
      key={i}
      viewBox="0 0 24 24"
      className="absolute opacity-75"
      style={{
        left: `${forme.x}%`,
        top: `${forme.y}%`,
        width: forme.taille,
        rotate: `${forme.angle}deg`,
        fill: forme.couleur,
      }}
      aria-hidden
    >
      {dessin}
    </svg>
  ));
}

const CLASSES_LOGO =
  "absolute top-[45%] left-1/2 -translate-x-1/2 -translate-y-1/2 transition duration-500 group-hover:scale-110";

const MAISON = <path d="M12 2 1 11.5h3V22h6v-6h4v6h6V11.5h3Z" />;

const BALLON = (
  <>
    <circle cx="12" cy="12" r="10" />
    <path
      d="M2 12h20M12 2v20M5 5c3.4 3.4 3.4 10.6 0 14M19 5c-3.4 3.4-3.4 10.6 0 14"
      fill="none"
      stroke="rgb(0 0 0 / 0.45)"
      strokeWidth="1.2"
    />
  </>
);

export type DecorBooster = {
  fond: string; // classe CSS de l'emballage
  pointilles: string; // ligne de déchirure en pointillés
  illustration: ReactNode;
};

export const DECORS: Record<IdExtension, DecorBooster> = {
  // Booster blanc, maisons pastel, maison noire au centre
  maison: {
    fond: "booster-blanc",
    pointilles: "border-black/15",
    illustration: (
      <>
        <FormesEparpillees
          formes={colorer(["#c4b5fd", "#99f6e4", "#fdba74", "#fde68a", "#93c5fd", "#f9a8d4"])}
          dessin={MAISON}
        />
        <svg viewBox="0 0 64 64" className={`${CLASSES_LOGO} w-28 drop-shadow-[0_2px_3px_rgb(0_0_0/0.25)]`} aria-hidden>
          <path d="M32 5 3 30h8v27h42V30h8l-9-7.8V9h-7v7.2Z" fill="#111" />
          <text x="32" y="50" textAnchor="middle" fill="#fff" fontFamily="var(--font-outfit)" fontSize="22" fontWeight="800">
            P
          </text>
        </svg>
      </>
    ),
  },
  // Booster noir, ballons colorés, gros ballon orange au centre
  nba: {
    fond: "booster-noir",
    pointilles: "border-white/25",
    illustration: (
      <>
        <FormesEparpillees
          formes={colorer(["#ef4444", "#3b82f6", "#f97316", "#e5e7eb", "#f59e0b", "#60a5fa"])}
          dessin={BALLON}
        />
        <div className={`${CLASSES_LOGO} flex flex-col items-center gap-1`}>
          <svg viewBox="0 0 24 24" className="w-24 fill-[#f97316] drop-shadow-[0_0_14px_rgb(249_115_22/0.6)]" aria-hidden>
            {BALLON}
          </svg>
          <span className="font-display text-2xl font-black tracking-widest text-white">NBA</span>
        </div>
      </>
    ),
  },
};
