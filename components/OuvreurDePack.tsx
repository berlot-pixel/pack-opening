"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { prixDeVente, tirerPack, type Carte, type Rarete } from "@/lib/cartes";
import { ajouterPack, DELAI_ENTRE_PACKS, useAttentePack, useCollection } from "@/lib/collection";
import { CarteVisuelle, DosDeCarte } from "./CarteVisuelle";
import { EVENEMENT_RETOUR_ACCUEIL } from "./LienAccueil";
import { PieceCoin } from "./Navigation";

// ferme → dechirure (la bande du haut s'arrache) → sortie (les cartes sortent du paquet)
// → pile (on retourne les cartes une par une) → resume (toutes les cartes du pack)
type Etape = "ferme" | "dechirure" | "sortie" | "pile" | "resume";

const DUREE_DECHIRURE = 1100;
const DUREE_SORTIE = 900;
const DUREE_DEPART = 350;

// Couleur du halo qui apparaît derrière les cartes rares quand on les retourne
const HALOS: Partial<Record<Rarete, string>> = {
  rare: "#6f8fb8",
  epique: "#9a7cc0",
  ultra_rare: "#c9a55c",
};
const TRES_RARES: Rarete[] = ["epique", "ultra_rare"];

// 272000 ms → "4:32"
function formaterAttente(ms: number) {
  const secondes = Math.ceil(ms / 1000);
  return `${Math.floor(secondes / 60)}:${String(secondes % 60).padStart(2, "0")}`;
}

// Ligne de déchirure en dents irrégulières (profondeur de chaque dent en px),
// partagée par la bande du haut et le corps du paquet pour qu'ils s'emboîtent parfaitement.
const DENTS = [3, 7, 2, 6, 1, 8, 4, 7, 2, 5, 8, 3, 6, 1, 7, 4, 2, 6, 8, 3, 5, 1, 6, 2];
const HAUTEUR_BANDE = 40; // la déchirure passe à 40px du haut du paquet
const EPAISSEUR_BORD = 3; // bord clair du papier déchiré

const pointsDechirure = (decalage: number) =>
  DENTS.map((dent, i) => `${(i / (DENTS.length - 1)) * 100}% ${dent + decalage}px`);

const DECOUPE_BANDE = `polygon(0 0, 100% 0, ${pointsDechirure(HAUTEUR_BANDE).reverse().join(", ")})`;
const DECOUPE_CORPS = `polygon(${pointsDechirure(0).join(", ")}, 100% 100%, 0 100%)`;
const BORD_BANDE = `polygon(${pointsDechirure(HAUTEUR_BANDE - EPAISSEUR_BORD).join(", ")}, ${pointsDechirure(HAUTEUR_BANDE).reverse().join(", ")})`;
const BORD_CORPS = `polygon(${pointsDechirure(0).join(", ")}, ${pointsDechirure(EPAISSEUR_BORD).reverse().join(", ")})`;

// Petites maisons pastel éparpillées sur le booster : position (%), taille (px), angle, couleur
const FORME_MAISON = "M12 2 1 11.5h3V22h6v-6h4v6h6V11.5h3Z";
const MAISONS_PASTEL = [
  { x: 34, y: -4, taille: 62, angle: 12, couleur: "#c4b5fd" },
  { x: 72, y: 14, taille: 66, angle: -18, couleur: "#99f6e4" },
  { x: -6, y: 30, taille: 60, angle: -24, couleur: "#fdba74" },
  { x: 74, y: 56, taille: 60, angle: 20, couleur: "#fde68a" },
  { x: -4, y: 68, taille: 64, angle: 14, couleur: "#93c5fd" },
  { x: 60, y: 82, taille: 58, angle: -10, couleur: "#f9a8d4" },
];

// Petits morceaux d'emballage qui sautent pendant la déchirure : position (%), direction, taille
const MORCEAUX = [
  { x: 8, dx: -30, taille: 5 },
  { x: 20, dx: -12, taille: 4 },
  { x: 33, dx: 10, taille: 6 },
  { x: 45, dx: -20, taille: 4 },
  { x: 57, dx: 25, taille: 5 },
  { x: 70, dx: 5, taille: 4 },
  { x: 82, dx: 30, taille: 6 },
  { x: 93, dx: 18, taille: 4 },
];

export function OuvreurDePack({ cartes }: { cartes: Carte[] }) {
  const collection = useCollection();
  const attente = useAttentePack();
  const [etape, setEtape] = useState<Etape>("ferme");
  const bloque = etape === "ferme" && attente > 0;
  const [pack, setPack] = useState<Carte[]>([]);
  const [nouvelles, setNouvelles] = useState<Set<number>>(new Set());
  const [courante, setCourante] = useState(0);
  const [revelee, setRevelee] = useState(false);
  const [depart, setDepart] = useState(false);
  const minuteurs = useRef<ReturnType<typeof setTimeout>[]>([]);

  function plusTard(action: () => void, delai: number) {
    minuteurs.current.push(setTimeout(action, delai));
  }

  function annulerMinuteurs() {
    minuteurs.current.forEach(clearTimeout);
    minuteurs.current = [];
  }

  // Clic sur « PackOpening » ou « Ouvrir » alors qu'on est déjà sur l'accueil
  useEffect(() => {
    function revenirAuBooster() {
      annulerMinuteurs();
      setDepart(false);
      setRevelee(false);
      setEtape("ferme");
    }
    window.addEventListener(EVENEMENT_RETOUR_ACCUEIL, revenirAuBooster);
    return () => {
      window.removeEventListener(EVENEMENT_RETOUR_ACCUEIL, revenirAuBooster);
      annulerMinuteurs();
    };
  }, []);

  function ouvrir() {
    if (collection.dernierPack + DELAI_ENTRE_PACKS > Date.now()) return;
    annulerMinuteurs();
    const tirage = tirerPack(cartes);
    setNouvelles(new Set(tirage.filter((c) => !collection.cartes[c.id]).map((c) => c.id)));
    setPack(tirage);
    setCourante(0);
    setRevelee(false);
    setDepart(false);
    ajouterPack(tirage);
    setEtape("dechirure");
    plusTard(() => setEtape("sortie"), DUREE_DECHIRURE);
    plusTard(() => setEtape("pile"), DUREE_DECHIRURE + DUREE_SORTIE);
  }

  // 1er clic : retourne la carte du dessus. 2e clic : elle s'envole et on passe à la suivante.
  function cliquerPile() {
    if (depart) return;
    if (!revelee) {
      setRevelee(true);
      return;
    }
    setDepart(true);
    plusTard(() => {
      setDepart(false);
      setRevelee(false);
      if (courante + 1 >= pack.length) setEtape("resume");
      else setCourante(courante + 1);
    }, DUREE_DEPART);
  }

  if (etape === "resume") {
    return (
      <div className="flex w-full flex-col items-center gap-8">
        <div className="text-center">
          <h2 className="font-display text-3xl font-bold">Ton tirage</h2>
          <p className="mt-2 flex items-center justify-center gap-1.5 text-sm text-white/60">
            Valeur à la revente :
            <span className="font-semibold text-accent">
              {pack.reduce((total, carte) => total + prixDeVente(carte), 0)}
            </span>
            <PieceCoin className="size-3.5" />
          </p>
        </div>
        <div className="grid w-full grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {pack.map((carte, i) => (
            <div key={i} className="carte-arrive" style={{ animationDelay: `${i * 100}ms` }}>
              <CarteVisuelle
                carte={carte}
                badge={nouvelles.has(carte.id) ? "NOUVELLE" : undefined}
              />
            </div>
          ))}
        </div>
        <button
          onClick={() => setEtape("ferme")}
          className="cursor-pointer rounded-xl bg-accent px-8 py-3 font-display text-base font-bold text-black transition hover:brightness-110"
        >
          {attente > 0 ? `Prochain paquet dans ${formaterAttente(attente)}` : "Ouvrir un autre paquet"}
        </button>
      </div>
    );
  }

  const carteDessus = pack[courante];
  const halo = etape === "pile" && revelee ? HALOS[carteDessus.rarete] : undefined;

  let aide = "";
  if (etape === "pile") aide = revelee ? "Clique pour la carte suivante" : "Clique pour retourner la carte";

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="relative mt-4 h-80 w-56">
        {(etape === "sortie" || etape === "pile") && (
          <div
            className={`absolute inset-x-0 bottom-0 aspect-[5/7] ${etape === "sortie" ? "pile-sort" : ""}`}
          >
            {halo && (
              <div
                key={courante}
                className={`halo ${TRES_RARES.includes(carteDessus.rarete) ? "halo-rayons" : ""}`}
                style={{ "--halo": halo } as CSSProperties}
              />
            )}
            {etape === "pile" && revelee && carteDessus.rarete === "ultra_rare" && (
              <div key={`flash-${courante}`} className="flash" />
            )}

            {pack
              .map((carte, i) => {
                if (i < courante) return null;
                const profondeur = i - courante;
                const dessus = profondeur === 0;
                const tease = dessus && !revelee && TRES_RARES.includes(carte.rarete);
                return (
                  <button
                    key={i}
                    onClick={dessus ? cliquerPile : undefined}
                    disabled={!dessus || etape !== "pile"}
                    aria-label={dessus && revelee ? carte.nom : "Retourner la carte"}
                    style={
                      {
                        transform: `translate(${profondeur * 4}px, ${profondeur * -4}px) rotate(${profondeur * 2}deg)`,
                        zIndex: pack.length - profondeur,
                        "--halo": HALOS[carte.rarete],
                      } as CSSProperties
                    }
                    className={`carte-flip absolute inset-0 rounded-lg transition-transform duration-300 enabled:cursor-pointer ${
                      dessus && revelee ? "retournee" : ""
                    } ${dessus && depart ? "carte-depart" : ""} ${tease ? "carte-tease" : ""}`}
                  >
                    <div className="carte-flip-inner">
                      <div className="carte-face">
                        <DosDeCarte />
                      </div>
                      <div className="carte-face carte-face-avant">
                        <CarteVisuelle
                          carte={carte}
                          badge={nouvelles.has(carte.id) ? "NOUVELLE" : undefined}
                        />
                      </div>
                    </div>
                  </button>
                );
              })
              .reverse()}
          </div>
        )}

        {(etape === "ferme" || etape === "dechirure" || etape === "sortie") && (
          <div
            className={`absolute inset-0 z-10 transition duration-500 ${etape === "ferme" && !bloque ? "pack-flotte" : ""} ${bloque ? "pointer-events-none opacity-50 grayscale" : ""} ${
              etape === "sortie" ? "pack-descend" : ""
            }`}
          >
            <button
              onClick={ouvrir}
              disabled={etape !== "ferme" || bloque}
              aria-label="Déchirer le booster"
              className="group absolute inset-0 drop-shadow-[0_0_28px_rgb(251_191_36/0.3)] enabled:cursor-pointer enabled:transition enabled:duration-500 enabled:hover:scale-[1.03]"
            >
              {/* Bande du haut, celle qu'on arrache (son bas suit la ligne de déchirure) */}
              <div
                className={`absolute inset-x-0 top-0 booster-blanc h-12 rounded-t-md transition duration-500 ${
                  etape === "ferme" ? "group-hover:-translate-y-0.5 group-hover:rotate-1" : "bande-arrachee"
                }`}
                style={{ clipPath: DECOUPE_BANDE }}
              >
                <div className="pack-sertissage absolute inset-x-0 top-0 h-3 rounded-t-md" />
                {etape !== "ferme" && (
                  <div className="absolute inset-0 bg-zinc-300" style={{ clipPath: BORD_BANDE }} />
                )}
              </div>

              {/* Corps du paquet (son haut suit la même ligne de déchirure) */}
              <div
                className={`booster-blanc absolute inset-x-0 top-10 bottom-0 overflow-hidden rounded-b-md ${
                  etape === "dechirure" ? "pack-tremble" : ""
                }`}
                style={{ clipPath: DECOUPE_CORPS }}
              >
                {/* Petites maisons pastel éparpillées */}
                {MAISONS_PASTEL.map((maison, i) => (
                  <svg
                    key={i}
                    viewBox="0 0 24 24"
                    className="absolute opacity-75"
                    style={{
                      left: `${maison.x}%`,
                      top: `${maison.y}%`,
                      width: maison.taille,
                      rotate: `${maison.angle}deg`,
                      fill: maison.couleur,
                    }}
                    aria-hidden
                  >
                    <path d={FORME_MAISON} />
                  </svg>
                ))}

                {/* Logo : une maison noire au centre */}
                <svg
                  viewBox="0 0 64 64"
                  className="absolute top-[45%] left-1/2 w-28 -translate-x-1/2 -translate-y-1/2 drop-shadow-[0_2px_3px_rgb(0_0_0/0.25)] transition duration-500 group-hover:scale-110"
                  aria-hidden
                >
                  <path d="M32 5 3 30h8v27h42V30h8l-9-7.8V9h-7v7.2Z" fill="#111" />
                  <text
                    x="32"
                    y="50"
                    textAnchor="middle"
                    fill="#fff"
                    fontFamily="var(--font-outfit)"
                    fontSize="22"
                    fontWeight="800"
                  >
                    P
                  </text>
                </svg>

                <div className="pack-sertissage absolute inset-x-0 bottom-0 h-3" />
                <div className="booster-foil" />
                <div className="pack-reflet" />

                {etape === "ferme" ? (
                  <div className="absolute inset-x-0 top-1 border-t border-dashed border-black/15" />
                ) : (
                  // Le bord déchiré apparaît de gauche à droite
                  <div className="dechirure-avance absolute inset-x-0 top-0 h-3">
                    <div className="h-full bg-zinc-300" style={{ clipPath: BORD_CORPS }} />
                  </div>
                )}
              </div>

              {etape === "ferme" && (
                <span className="absolute top-[30px] -left-3 text-sm text-white drop-shadow">✂</span>
              )}
              {etape !== "ferme" && (
                <div className="pack-lumiere" style={{ top: HAUTEUR_BANDE - 20 }} />
              )}
              {etape === "dechirure" &&
                MORCEAUX.map((morceau, i) => (
                  <span
                    key={i}
                    className="morceau-emballage"
                    style={
                      {
                        left: `${morceau.x}%`,
                        top: HAUTEUR_BANDE,
                        width: morceau.taille,
                        height: morceau.taille,
                        animationDelay: `${100 + (morceau.x / 100) * 500}ms`,
                        "--dx": `${morceau.dx}px`,
                      } as CSSProperties
                    }
                  />
                ))}
            </button>
          </div>
        )}
      </div>

      <div className="flex min-h-20 flex-col items-center gap-3">
        {etape === "ferme" && (
          <>
            {bloque ? (
              <p className="font-display text-xl font-bold text-white/60">
                Prochain paquet dans{" "}
                <span className="font-mono text-accent tabular-nums">{formaterAttente(attente)}</span>
              </p>
            ) : (
              <button
                onClick={ouvrir}
                className="cursor-pointer font-display text-xl font-bold text-accent transition hover:brightness-125"
              >
                Ouvrir
              </button>
            )}
            <div className="mt-4 flex gap-6 rounded-2xl border border-bordure bg-panneau px-6 py-3 text-center">
              <div>
                <p className="font-display text-lg font-bold">{collection.packs}</p>
                <p className="text-xs text-white/50">paquets ouverts</p>
              </div>
              <div>
                <p className="font-display text-lg font-bold">
                  <span className="text-accent">
                    {cartes.filter((c) => collection.cartes[c.id]).length}
                  </span>{" "}
                  / {cartes.length}
                </p>
                <p className="text-xs text-white/50">cartes trouvées</p>
              </div>
            </div>
          </>
        )}
        {etape === "pile" && (
          <p className="font-display text-xl font-bold">
            <span className="text-accent">{courante + 1}</span> / {pack.length}
          </p>
        )}
        {aide && <p className="text-sm text-white/50">{aide}</p>}
        {etape === "pile" && (
          <button
            onClick={() => setEtape("resume")}
            className="cursor-pointer text-xs text-accent/80 transition hover:text-accent"
          >
            Tout voir d&apos;un coup
          </button>
        )}
      </div>
    </div>
  );
}
