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

const EPINGLE = (
  <path
    fillRule="evenodd"
    d="M12 2a7 7 0 0 0-7 7c0 5 7 13 7 13s7-8 7-13a7 7 0 0 0-7-7Zm0 9.5a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5Z"
  />
);

const PIECE_PUZZLE = (
  <path d="M9 3.5a2.5 2.5 0 0 1 5 0V5h4a1 1 0 0 1 1 1v4h-1.5a2.5 2.5 0 0 0 0 5H19v4a1 1 0 0 1-1 1h-4v-1.5a2.5 2.5 0 0 0-5 0V20H5a1 1 0 0 1-1-1v-4h1.5a2.5 2.5 0 0 0 0-5H4V6a1 1 0 0 1 1-1h4Z" />
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
  // Booster blanc, pièces de puzzle pastel, pièce noire « W » au centre
  wikipedia: {
    fond: "booster-blanc",
    pointilles: "border-black/15",
    illustration: (
      <>
        <FormesEparpillees
          formes={colorer(["#c4b5fd", "#99f6e4", "#fdba74", "#fde68a", "#93c5fd", "#f9a8d4"])}
          dessin={PIECE_PUZZLE}
        />
        <svg viewBox="0 0 24 24" className={`${CLASSES_LOGO} w-28 drop-shadow-[0_2px_3px_rgb(0_0_0/0.25)]`} aria-hidden>
          <g fill="#111">{PIECE_PUZZLE}</g>
          <text x="11.5" y="15.6" textAnchor="middle" fill="#fff" fontFamily="var(--font-outfit)" fontSize="8" fontWeight="800">
            W
          </text>
        </svg>
      </>
    ),
  },
  // Booster bleu nuit, épingles de carte bleu-blanc-rouge, hexagone tricolore au centre
  france: {
    fond: "booster-bleu",
    pointilles: "border-white/30",
    illustration: (
      <>
        <FormesEparpillees
          formes={colorer(["#ffffff", "#f87171", "#93c5fd", "#fca5a5", "#e0e7ff", "#ef4444"])}
          dessin={EPINGLE}
        />
        <div className={`${CLASSES_LOGO} flex flex-col items-center gap-1.5`}>
          <svg viewBox="0 0 100 100" className="w-24 drop-shadow-[0_0_14px_rgb(255_255_255/0.35)]" aria-hidden>
            <defs>
              <clipPath id="hexagone">
                <path d="M50 4 90 27v46L50 96 10 73V27Z" />
              </clipPath>
            </defs>
            <g clipPath="url(#hexagone)">
              <rect x="0" y="0" width="34" height="100" fill="#2563eb" />
              <rect x="34" y="0" width="32" height="100" fill="#ffffff" />
              <rect x="66" y="0" width="34" height="100" fill="#dc2626" />
            </g>
            <path d="M50 4 90 27v46L50 96 10 73V27Z" fill="none" stroke="#ffffff" strokeWidth="4" />
          </svg>
          <span className="font-display text-xl font-black tracking-widest text-white">VILLES</span>
        </div>
      </>
    ),
  },
};
