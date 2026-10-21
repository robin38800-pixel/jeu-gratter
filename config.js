// =====================================================================
//  CONFIGURATION DU JEU — tout ce qui est personnalisable est ici.
//  Modifie les textes entre guillemets, enregistre, c'est tout.
// =====================================================================
window.CONFIG = {
  // Prénom du pilote (le héros du jour)
  prenom: "Nathan",

  // Date affichée sur l'écran d'accueil (texte libre)
  date: "Soirée du 22 octobre",

  // Les 3 F1 Lego à gagner : une par carte (carte 1, carte 2, carte 3).
  // "image" est facultatif : mets un chemin comme "images/ferrari.jpg".
  f1: [
    { nom: "Ferrari SF-24", equipe: "Scuderia Ferrari", couleur: "#e10600", image: "images/ferrari.png" },
    { nom: "Red Bull RB20", equipe: "Oracle Red Bull Racing", couleur: "#3671c6", image: "images/redbull.png" },
    { nom: "Alpine A524", equipe: "BWT Alpine F1 Team", couleur: "#ff87bc", image: "images/alpine.jpg" },
  ],

  // Le meilleur cadeau, caché dans la carte Jackpot
  litiere: {
    nom: "La litière pour chat connectée",
    description: "Le summum de la technologie. Le chat te remercie déjà.",
  },

  // Probabilités (0.33 = 33 %)
  chanceF1: 0.33,
  chanceLitiere: 0.05, // uniquement sur la carte Jackpot

  // Question finale si toutes les F1 n'ont pas été gagnées
  question: "Quel est le muscle ?",
  // Les 2 premières réponses sont TOUJOURS refusées avec ces messages
  refus: [
    "Faux. Même un pneu dur aurait trouvé. Deuxième tentative, pilote.",
    "Toujours pas. La direction de course commence à rigoler. Dernière chance !",
  ],
  // La 3e réponse est TOUJOURS acceptée
  bravo: "BONNE RÉPONSE ! (évidemment.) Toutes les F1 manquantes sont débloquées !",

  // Textes et blagues (OM) affichés pendant le jeu
  blagues: {
    accueil: "Bienvenue au casino, Nathan ! Ici, comme à l'OM, on promet beaucoup et on paie rarement. Faites vos jeux !",
    // Une blague par partie perdue, dans l'ordre : Grille 1-2, Jackpot 1-3, Goal 1-2
    perdu: [
      "Perdu. Bienvenue à l'OM : beaucoup d'espoir en août, la déprime en novembre.",
      "Perdu. Ton espoir vient de mourir, comme chaque année au Vélodrome vers la 85e minute.",
      "Perdu… Rassure-toi, l'OM aussi perd ses finales. C'est même sa spécialité.",
      "Raté. Même le Vélodrome te siffle, et pourtant il en a vu d'autres.",
      "Perdu. À ce rythme, l'OM va te proposer le poste d'entraîneur. Pour trois mois, comme d'habitude.",
      "Défaite. Le Mistral a soufflé plus fort que toi.",
      "Perdu. Même la Bonne Mère a détourné le regard.",
    ],
    finale: "Joyeux anniversaire Nathan ! Que ton année soit aussi rapide qu'un tour de qualif.",
  },
};
