-- À coller dans Supabase > SQL Editor > Run

create table if not exists cartes (
  id bigint generated always as identity primary key,
  nom text not null,
  emoji text not null,
  description text not null,
  rarete text not null check (rarete in ('commun', 'peu_commun', 'rare', 'epique', 'ultra_rare'))
);

alter table cartes enable row level security;

-- Tout le monde peut voir les cartes (mais pas les modifier)
create policy "lecture publique" on cartes
  for select using (true);

insert into cartes (nom, emoji, description, rarete) values
  -- Communes
  ('Cuillère', '🥄', 'Toujours une de trop dans le tiroir.', 'commun'),
  ('Trombone', '📎', 'Tient 3 feuilles et tout ton destin.', 'commun'),
  ('Éponge', '🧽', 'A vu des choses qu''elle ne racontera jamais.', 'commun'),
  ('Papier toilette', '🧻', 'Valeur boursière variable selon les crises.', 'commun'),
  ('Crayon à papier', '✏️', 'La gomme est partie avant la mine.', 'commun'),
  ('Tasse', '☕', 'Porte fièrement une tache de café éternelle.', 'commun'),
  ('Brosse à dents', '🪥', 'Deux fois par jour. En théorie.', 'commun'),
  ('Savon', '🧼', 'Glisse des mains au pire moment.', 'commun'),
  ('Clé', '🔑', 'Personne ne sait ce qu''elle ouvre.', 'commun'),
  ('Bougie', '🕯️', 'Parfum « Bois de santal » ou « Panne de courant ».', 'commun'),
  ('Seau', '🪣', 'Collecteur officiel de fuites du plafond.', 'commun'),
  ('Balai', '🧹', 'Ne vole pas. On a vérifié.', 'commun'),
  ('Ampoule', '💡', 'Grille toujours le soir où tu en as besoin.', 'commun'),
  ('Ciseaux', '✂️', 'Introuvables quand on les cherche.', 'commun'),
  -- Peu communes
  ('Grille-pain', '🍞', 'Réglage 3 : cru. Réglage 4 : charbon.', 'peu_commun'),
  ('Parapluie', '☂️', 'Se retourne à la première rafale.', 'peu_commun'),
  ('Réveil', '⏰', 'Ennemi public numéro un du lundi.', 'peu_commun'),
  ('Lampe torche', '🔦', 'Piles vides depuis 2019.', 'peu_commun'),
  ('Poêle', '🍳', 'Antiadhésive. Enfin, elle l''était.', 'peu_commun'),
  ('Plante verte', '🪴', 'Survit malgré toi.', 'peu_commun'),
  ('Boîte à outils', '🧰', 'Contient 47 vis et zéro tournevis.', 'peu_commun'),
  ('Cadenas', '🔒', 'Le code, c''était 0000 ou 1234 ?', 'peu_commun'),
  ('Miroir', '🪞', 'Te juge silencieusement chaque matin.', 'peu_commun'),
  ('Théière', '🫖', 'Sortie uniquement quand mamie vient.', 'peu_commun'),
  -- Rares
  ('Télévision', '📺', 'La télécommande est vendue séparément.', 'rare'),
  ('Radio', '📻', 'Capte parfaitement une seule station.', 'rare'),
  ('Appareil photo', '📷', 'Rempli de photos floues de ton chat.', 'rare'),
  ('Horloge murale', '🕰️', 'Avance de 7 minutes depuis toujours.', 'rare'),
  ('Guitare', '🎸', 'Connaît seulement l''intro de Wonderwall.', 'rare'),
  ('Lit', '🛏️', 'Point de sauvegarde quotidien.', 'rare'),
  ('Ordinateur portable', '💻', '37 onglets ouverts. Minimum.', 'rare'),
  ('Téléphone fixe', '☎️', 'Ne sonne que pour les démarcheurs.', 'rare'),
  -- Épiques
  ('Réfrigérateur', '🧊', 'Ouvert 40 fois par jour, sans rien trouver.', 'epique'),
  ('Console de jeu', '🎮', '« Encore une partie » depuis 3 heures.', 'epique'),
  ('Machine à laver', '🫧', 'Dévoreuse légendaire de chaussettes.', 'epique'),
  ('Piano', '🎹', 'Impossible à déménager.', 'epique'),
  ('Aquarium', '🐠', 'Némo y est. Enfin, un Némo.', 'epique'),
  -- Ultra rares
  ('La paire de chaussettes complète', '🧦', 'Les deux. Ensemble. Un miracle.', 'ultra_rare'),
  ('Le chargeur qui marche', '🔌', 'Sans avoir à tenir le câble d''une certaine façon.', 'ultra_rare'),
  ('Le Tupperware avec son couvercle', '🥡', 'Les archéologues le cherchent encore.', 'ultra_rare');
