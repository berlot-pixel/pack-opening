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
  rare: "#38bdf8",
  epique: "#c084fc",
  ultra_rare: "#fcd34d",
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
        <h2 className="text-2xl font-bold">Ton butin</h2>
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
          className="cursor-pointer rounded-full bg-yellow-400 px-8 py-3 text-lg font-bold text-black shadow-lg transition hover:scale-105 hover:bg-yellow-300"
        >
          Ouvrir un autre booster
        </button>
      </div>
    );
  }

  const carteDessus = pack[courante];
  const halo = etape === "pile" && revelee ? HALOS[carteDessus.rarete] : undefined;

  let aide = "";
  if (etape === "ferme") aide = "Clique sur le booster pour le déchirer !";
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
                    className={`carte-flip absolute inset-0 rounded-xl transition-transform duration-300 enabled:cursor-pointer ${
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
              className="group absolute inset-0 drop-shadow-[0_20px_35px_rgb(139_92_246_/_0.4)] enabled:cursor-pointer enabled:transition enabled:hover:scale-105"
            >
              {/* Bande du haut, celle qu'on arrache (son bas suit la ligne de déchirure) */}
              <div
                className={`absolute inset-x-0 top-0 h-12 rounded-t-2xl border-4 border-b-0 border-yellow-300 bg-gradient-to-r from-fuchsia-600 via-violet-600 to-indigo-700 transition ${
                  etape === "ferme" ? "group-hover:-translate-y-1 group-hover:rotate-2" : "bande-arrachee"
                }`}
                style={{ clipPath: DECOUPE_BANDE }}
              >
                <div className="pack-sertissage absolute inset-x-0 top-0 h-3 rounded-t-xl" />
                {etape !== "ferme" && (
                  <div className="absolute inset-0 bg-white/80" style={{ clipPath: BORD_BANDE }} />
                )}
              </div>

              {/* Corps du paquet (son haut suit la même ligne de déchirure) */}
              <div
                className={`absolute inset-x-0 top-10 bottom-0 flex flex-col items-center justify-center gap-3 rounded-b-2xl border-4 border-t-0 border-yellow-300 bg-gradient-to-br from-fuchsia-600 via-violet-700 to-indigo-800 ${
                  etape === "dechirure" ? "pack-tremble" : ""
                }`}
                style={{ clipPath: DECOUPE_CORPS }}
              >
                {etape === "ferme" ? (
                  <div className="absolute inset-x-0 top-1 border-t-2 border-dashed border-white/60" />
                ) : (
                  // Le bord déchiré apparaît de gauche à droite
                  <div className="dechirure-avance absolute inset-x-0 top-0 h-3">
                    <div className="h-full bg-white/80" style={{ clipPath: BORD_CORPS }} />
                  </div>
                )}
                <div className="pack-reflet" />
                <div className="pack-sertissage absolute inset-x-0 bottom-0 h-3 rounded-b-xl" />

                <span className="text-7xl transition group-hover:scale-110">🏠</span>
                <span className="text-2xl font-black tracking-wide text-yellow-300 drop-shadow">
                  BOOSTER
                </span>
                <span className="text-sm text-white/80">Objets de la maison</span>
                <span className="text-xs text-white/60">5 cartes · 1 Rare garantie</span>
              </div>

              {etape === "ferme" && (
                <span className="absolute top-7 -left-2 text-lg text-white drop-shadow">✂</span>
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
          <p className="text-sm font-semibold text-white/50">
            Carte {courante + 1} / {pack.length}
          </p>
        )}
        <p className="text-white/70">{aide}</p>
        {etape === "pile" && (
          <button
            onClick={() => setEtape("resume")}
            className="cursor-pointer rounded-full border border-white/30 px-5 py-1.5 text-sm text-white/70 transition hover:bg-white/10"
          >
            Tout voir d&apos;un coup
          </button>
        )}
      </div>
    </div>
  );
}
