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

  // Petites blagues affichées pendant le jeu (remplace par vos blagues internes)
  blagues: {
    accueil: "Bienvenue au casino, Nathan ! Trois jeux à gratter, deux parties chacun. Faites vos jeux !",
    perdu: [
      "Crevaison lente. Ça arrive aux meilleurs.",
      "Stratégie pneus douteuse. Le muret des stands s'excuse.",
      "Même Lance Stroll aurait fait mieux. (Non, c'est faux, mais quand même.)",
    ],
    gagne: [
      "Victoire ! Champagne sur le podium !",
      "Pole position et victoire. Masterclass.",
      "Doublé historique ! Enfin, simple. Mais historique.",
    ],
    finale: "Joyeux anniversaire Nathan ! Que ton année soit aussi rapide qu'un tour de qualif.",
  },
};
