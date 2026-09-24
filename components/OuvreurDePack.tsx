"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { tirerPack, type Carte, type Rarete } from "@/lib/cartes";
import { ajouterPack, useCollection } from "@/lib/collection";
import { CarteVisuelle, DosDeCarte } from "./CarteVisuelle";
import { EVENEMENT_RETOUR_ACCUEIL } from "./LienAccueil";

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
  const [etape, setEtape] = useState<Etape>("ferme");
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
        <h2 className="font-serif text-4xl text-ivoire">
          Ton <span className="text-or-clair italic">tirage</span>
        </h2>
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
          className="cursor-pointer border border-or/70 px-8 py-3 text-[11px] tracking-[0.3em] text-or-clair uppercase transition hover:bg-or hover:text-[#0c0b0a]"
        >
          Ouvrir un autre booster
        </button>
      </div>
    );
  }

  const carteDessus = pack[courante];
  const halo = etape === "pile" && revelee ? HALOS[carteDessus.rarete] : undefined;

  let aide = "";
  if (etape === "ferme") aide = "Touche le booster pour le déchirer";
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
            className={`absolute inset-0 z-10 ${etape === "ferme" ? "pack-flotte" : ""} ${
              etape === "sortie" ? "pack-descend" : ""
            }`}
          >
            <button
              onClick={ouvrir}
              disabled={etape !== "ferme"}
              aria-label="Déchirer le booster"
              className="group absolute inset-0 drop-shadow-[0_25px_40px_rgb(0_0_0/0.7)] enabled:cursor-pointer enabled:transition enabled:duration-500 enabled:hover:scale-[1.03]"
            >
              {/* Bande du haut, celle qu'on arrache (son bas suit la ligne de déchirure) */}
              <div
                className={`absolute inset-x-0 top-0 h-12 rounded-t-lg border border-b-0 border-or/50 bg-gradient-to-b from-[#26221c] to-[#1c1915] transition duration-500 ${
                  etape === "ferme" ? "group-hover:-translate-y-0.5 group-hover:rotate-1" : "bande-arrachee"
                }`}
                style={{ clipPath: DECOUPE_BANDE }}
              >
                <div className="pack-sertissage absolute inset-x-0 top-0 h-3 rounded-t-md" />
                {etape !== "ferme" && (
                  <div className="absolute inset-0 bg-ivoire/70" style={{ clipPath: BORD_BANDE }} />
                )}
              </div>

              {/* Corps du paquet (son haut suit la même ligne de déchirure) */}
              <div
                className={`absolute inset-x-0 top-10 bottom-0 flex flex-col items-center justify-center gap-3 rounded-b-lg border border-t-0 border-or/50 bg-gradient-to-b from-[#1d1a16] via-[#12100e] to-[#0b0a09] ${
                  etape === "dechirure" ? "pack-tremble" : ""
                }`}
                style={{ clipPath: DECOUPE_CORPS }}
              >
                {etape === "ferme" ? (
                  <div className="absolute inset-x-0 top-1 border-t border-dashed border-or/40" />
                ) : (
                  // Le bord déchiré apparaît de gauche à droite
                  <div className="dechirure-avance absolute inset-x-0 top-0 h-3">
                    <div className="h-full bg-ivoire/70" style={{ clipPath: BORD_CORPS }} />
                  </div>
                )}
                <div className="pack-reflet" />
                <div className="pack-sertissage absolute inset-x-0 bottom-0 h-3 rounded-b-md" />
                <div className="absolute inset-x-3 top-4 bottom-5 rounded-sm border border-or/20" />

                <span className="text-[9px] tracking-[0.4em] text-or/80 uppercase">Édition Maison</span>
                <div className="my-1 flex size-20 items-center justify-center rounded-full border border-or/60 transition duration-500 group-hover:border-or">
                  <div className="flex size-16 items-center justify-center rounded-full border border-or/25 font-serif text-4xl text-or-clair italic">
                    P
                  </div>
                </div>
                <span className="font-serif text-3xl tracking-wide text-ivoire">Booster</span>
                <span className="-mt-2 font-serif text-sm text-white/55 italic">Objets de la maison</span>
                <div className="h-px w-10 bg-or/50" />
                <span className="text-[9px] tracking-[0.3em] text-white/45 uppercase">
                  5 cartes · 1 rare garantie
                </span>
              </div>

              {etape === "ferme" && (
                <span className="absolute top-[30px] -left-3 text-sm text-or/80">✂</span>
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
        {etape === "pile" && (
          <p className="font-serif text-xl text-or-clair">
            {courante + 1} <span className="text-white/30">/ {pack.length}</span>
          </p>
        )}
        <p className="text-[11px] tracking-[0.25em] text-white/45 uppercase">{aide}</p>
        {etape === "pile" && (
          <button
            onClick={() => setEtape("resume")}
            className="cursor-pointer border-b border-white/20 pb-0.5 text-[11px] tracking-[0.2em] text-white/40 uppercase transition hover:border-or hover:text-or-clair"
          >
            Tout voir d&apos;un coup
          </button>
        )}
      </div>
    </div>
  );
}
