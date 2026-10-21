(() => {
  "use strict";
  const C = window.CONFIG;
  const $ = (s, r = document) => r.querySelector(s);
  const pick = (a) => a[Math.floor(Math.random() * a.length)];
  const shuffle = (a) => {
    a = a.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };
  const buzz = (ms) => { try { navigator.vibrate && navigator.vibrate(ms); } catch (e) {} };

  const CAR = "🏎️";
  const CAT = "🐱";
  const SYMBOLS = [CAR, "🍒", "🔔", "💎", "⭐", "🍀"];
  const REEL_SYMBOLS = [CAR, "🍒", "🔔", "💎", "🍋", CAT];

  // ------------------------------------------------------------------
  //  État (tirage fait une seule fois, gardé si la page est rechargée)
  // ------------------------------------------------------------------
  const KEY = "gp-anniv-v3";
  const store = {
    get() { try { return JSON.parse(localStorage.getItem(KEY)); } catch (e) { return null; } },
    set(v) { try { localStorage.setItem(KEY, JSON.stringify(v)); } catch (e) {} },
    clear() { try { localStorage.removeItem(KEY); } catch (e) {} },
  };
  if (/[?&]reset\b/.test(location.search)) {
    store.clear();
    history.replaceState(null, "", location.pathname);
  }

  const CARDS = ["c1", "c2", "c3"];
  // Nombre de parties par jeu (3 tirages au jackpot)
  const PARTIES = { c1: 2, c2: 3, c3: 2 };
  const PART_WORD = { c1: "Partie", c2: "Tirage", c3: "Partie" };

  function drawPartie(card) {
    const others = SYMBOLS.filter((x) => x !== CAR);
    if (card === "c1") {
      // 9 cases. Gagné = 3 voitures ; perdu = aucun symbole 3 fois.
      const win = Math.random() < C.chanceF1;
      const grid = win
        ? shuffle([CAR, CAR, CAR, ...shuffle(others.flatMap((x) => [x, x])).slice(0, 6)])
        : shuffle(shuffle(SYMBOLS.flatMap((x) => [x, x])).slice(0, 9));
      return { out: win, lay: grid };
    }
    if (card === "c2") {
      // Rouleaux. Perdu = presque gagné (2 identiques, 1 différent)
      const r = Math.random();
      const out = r < C.chanceLitiere ? "litiere" : r < C.chanceLitiere + C.chanceF1 ? "f1" : "perdu";
      let reels;
      if (out === "litiere") reels = [CAT, CAT, CAT];
      else if (out === "f1") reels = [CAR, CAR, CAR];
      else {
        const a = pick(REEL_SYMBOLS);
        const b = pick(REEL_SYMBOLS.filter((x) => x !== a));
        reels = shuffle([a, a, b]);
      }
      return { out, lay: reels };
    }
    // Goal : le gain est la F1 ; un ballon identique = gagné
    const win = Math.random() < C.chanceF1;
    const balls = shuffle(others.concat(["⚽", "🧤"])).slice(0, win ? 4 : 5);
    if (win) balls.splice(Math.floor(Math.random() * 5), 0, CAR);
    return { out: win, lay: balls };
  }

  function draw() {
    const S = { step: "intro", part: 0, out: {}, lay: {}, res: { c1: [], c2: [], c3: [] }, q: 0, viaQ: [] };
    CARDS.forEach((c) => {
      const ps = Array.from({ length: PARTIES[c] }, () => drawPartie(c));
      S.out[c] = ps.map((x) => x.out);
      S.lay[c] = ps.map((x) => x.lay);
    });
    return S;
  }

  let S = store.get();
  if (!S || !S.out || !Array.isArray(S.out.c1)) { S = draw(); store.set(S); }
  const save = () => store.set(S);

  // ------------------------------------------------------------------
  //  Zone à gratter (canvas, doigt + souris)
  // ------------------------------------------------------------------
  function makeScratch(el, { label = "", tone = "silver", threshold = 0.5, onReveal }) {
    const cv = document.createElement("canvas");
    el.appendChild(cv);
    const ctx = cv.getContext("2d", { willReadFrequently: true });
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let w, h, revealed = false, drawing = false, last = null, moves = 0;

    function paint() {
      const r = el.getBoundingClientRect();
      w = Math.max(1, Math.round(r.width * dpr));
      h = Math.max(1, Math.round(r.height * dpr));
      cv.width = w; cv.height = h;
      const g = ctx.createLinearGradient(0, 0, w, h);
      const cols = tone === "gold"
        ? ["#b8860b", "#ffe27a", "#c9971c", "#fff1b0", "#a87400"]
        : ["#8e8e9a", "#e6e6ee", "#a5a5b2", "#f4f4f8", "#7d7d89"];
      cols.forEach((c, i) => g.addColorStop(i / (cols.length - 1), c));
      ctx.globalCompositeOperation = "source-over";
      if (tone === "ball") { paintBall(); return; }
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
      // grain métallique
      const n = Math.round((w * h) / 30);
      for (let i = 0; i < n; i++) {
        ctx.fillStyle = Math.random() < 0.5 ? "rgba(255,255,255,.25)" : "rgba(0,0,0,.12)";
        ctx.fillRect(Math.random() * w, Math.random() * h, dpr, dpr);
      }
      if (label) {
        ctx.fillStyle = "rgba(40,40,50,.55)";
        ctx.font = `${Math.round(Math.min(w, h) * 0.24)}px "Luckiest Guy", sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(label, w / 2, h / 2);
      }
    }

    function paintBall() {
      const r = w / 2;
      const g = ctx.createRadialGradient(r * 0.7, r * 0.6, r * 0.1, r, r, r);
      g.addColorStop(0, "#ffffff"); g.addColorStop(0.7, "#e9e9e9"); g.addColorStop(1, "#9a9a9a");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
      const penta = (cx, cy, rad, rot) => {
        ctx.beginPath();
        for (let k = 0; k < 5; k++) {
          const a = rot + (k * 2 * Math.PI) / 5 - Math.PI / 2;
          ctx[k ? "lineTo" : "moveTo"](cx + rad * Math.cos(a), cy + rad * Math.sin(a));
        }
        ctx.closePath();
        ctx.fill();
      };
      const rot = Math.random() * Math.PI;
      ctx.strokeStyle = "#555"; ctx.lineWidth = Math.max(1, r * 0.03);
      for (let k = 0; k < 5; k++) {
        const a = rot + (k * 2 * Math.PI) / 5 - Math.PI / 2;
        ctx.beginPath();
        ctx.moveTo(r + r * 0.28 * Math.cos(a), r + r * 0.28 * Math.sin(a));
        ctx.lineTo(r + r * 0.72 * Math.cos(a), r + r * 0.72 * Math.sin(a));
        ctx.stroke();
      }
      ctx.fillStyle = "#1b1b1b";
      penta(r, r, r * 0.3, rot);
      for (let k = 0; k < 5; k++) {
        const a = rot + Math.PI / 5 + (k * 2 * Math.PI) / 5 - Math.PI / 2;
        penta(r + r * 0.92 * Math.cos(a), r + r * 0.92 * Math.sin(a), r * 0.3, a + Math.PI / 2);
      }
      // reflet
      const s = ctx.createRadialGradient(r * 0.6, r * 0.5, 0, r * 0.6, r * 0.5, r * 0.5);
      s.addColorStop(0, "rgba(255,255,255,.55)"); s.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = s;
      ctx.fillRect(0, 0, w, h);
    }

    function pos(e) {
      const r = cv.getBoundingClientRect();
      return { x: (e.clientX - r.left) * dpr, y: (e.clientY - r.top) * dpr };
    }
    function scratchTo(p) {
      ctx.globalCompositeOperation = "destination-out";
      ctx.lineCap = ctx.lineJoin = "round";
      ctx.lineWidth = Math.max(26 * dpr, Math.min(w, h) * 0.28);
      ctx.beginPath();
      ctx.moveTo(last ? last.x : p.x, last ? last.y : p.y);
      ctx.lineTo(p.x + 0.1, p.y + 0.1);
      ctx.stroke();
      last = p;
      if (++moves % 6 === 0) { buzz(4); check(); }
    }
    function check() {
      if (revealed) return;
      const data = ctx.getImageData(0, 0, w, h).data;
      let clear = 0, total = 0;
      for (let i = 3; i < data.length; i += 4 * 16) { total++; if (data[i] < 128) clear++; }
      if (clear / total >= threshold) reveal();
    }
    function reveal(silent) {
      if (revealed) return;
      revealed = true;
      el.classList.add("done");
      if (!silent && onReveal) onReveal();
    }

    // iOS : bloquer le défilement de la page quand le doigt est sur la zone
    const stop = (e) => { if (!revealed) e.preventDefault(); };
    cv.addEventListener("touchstart", stop, { passive: false });
    cv.addEventListener("touchmove", stop, { passive: false });

    cv.addEventListener("pointerdown", (e) => {
      if (revealed) return;
      drawing = true; last = null;
      document.documentElement.classList.add("scratching");
      try { cv.setPointerCapture(e.pointerId); } catch (_) {}
      scratchTo(pos(e));
      e.preventDefault();
    });
    cv.addEventListener("pointermove", (e) => {
      if (!drawing) return;
      const evs = e.getCoalescedEvents ? e.getCoalescedEvents() : [e];
      (evs.length ? evs : [e]).forEach((ev) => scratchTo(pos(ev)));
      e.preventDefault();
    });
    const end = () => {
      document.documentElement.classList.remove("scratching");
      if (drawing) { drawing = false; last = null; check(); }
    };
    cv.addEventListener("pointerup", end);
    cv.addEventListener("pointercancel", end);

    requestAnimationFrame(paint);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { if (!revealed && moves === 0) paint(); });

    return { reveal, get revealed() { return revealed; } };
  }

  // ------------------------------------------------------------------
  //  Navigation + HUD
  // ------------------------------------------------------------------
  const STEPS = ["intro", "c1", "c2", "c3", "q", "end"];
  const CARD_LABEL = { c1: "Jeu 1", c2: "Jeu 2", c3: "Jeu 3" };
  function show(step, part = 0) {
    S.step = step; S.part = part; save();
    STEPS.forEach((s) => { $("#screen-" + s).hidden = s !== step; });
    $("#hud").hidden = step === "intro";
    const labels = { c1: "Jeu 1/3", c2: "Jeu 2/3", c3: "Jeu 3/3", q: "Question bonus", end: "Résultats" };
    $("#hud-step").textContent = (labels[step] || "") + (CARD_LABEL[step] ? ` · ${PART_WORD[step]} ${part + 1}/${PARTIES[step]}` : "");
    if (CARD_LABEL[step]) {
      $(`#screen-${step} .card-num`).textContent = `${CARD_LABEL[step]} · ${PART_WORD[step]} ${part + 1}/${PARTIES[step]}`;
      $("#res-" + step).hidden = true;
    }
    renderGarage();
    window.scrollTo({ top: 0, behavior: "smooth" });
    ({ c1: initC1, c2: initC2, c3: initC3, q: initQ, end: initEnd }[step] || (() => {}))();
  }

  const hasLitiere = () => S.res.c2.includes("litiere");
  const cardWon = (c) => (c === "c2" ? S.res.c2.includes("f1") : S.res[c].includes(true));

  function wonF1() {
    if (hasLitiere()) return [false, false, false];
    return CARDS.map((c, i) => cardWon(c) || S.viaQ.includes(i));
  }

  function renderGarage() {
    const g = $("#garage");
    g.innerHTML = "";
    if (hasLitiere()) {
      g.innerHTML = `<div class="slot-car won" style="width:auto;padding:0 8px">${CAT} Litière !</div>`;
      return;
    }
    wonF1().forEach((w, i) => {
      const d = document.createElement("div");
      const done = S.res[CARDS[i]].length === PARTIES[CARDS[i]];
      d.className = "slot-car" + (w ? " won" : done ? " lost" : "");
      d.textContent = w ? CAR : "";
      if (w) d.style.borderColor = C.f1[i].couleur;
      g.appendChild(d);
    });
  }

  // Enregistre le résultat de la partie en cours et renvoie l'étape suivante
  function record(c, value) {
    const p = S.part;
    const before = cardWon(c);
    if (S.res[c][p] === undefined) { S.res[c][p] = value; save(); }
    return { already: before && p > 0 && S.res[c].slice(0, p).some((v) => v === true || v === "f1") };
  }
  function nextOf(c) {
    if (hasLitiere()) return ["end", 0];
    if (S.part + 1 < PARTIES[c]) return [c, S.part + 1];
    if (c === "c1") return ["c2", 0];
    if (c === "c2") return ["c3", 0];
    return [wonF1().every(Boolean) ? "end" : "q", 0];
  }

  // Une blague de défaite différente par partie (7 au total, dans l'ordre des parties)
  function lossJoke(c) {
    const idx = CARDS.slice(0, CARDS.indexOf(c)).reduce((n, k) => n + PARTIES[k], 0) + S.part;
    const list = C.blagues.perdu;
    return list[idx % list.length];
  }

  function showResult(id, kind, already) {
    const box = $("#res-" + id);
    const i = CARDS.indexOf(id);
    const car = C.f1[i];
    box.className = "result " + (kind === "litiere" ? "mega" : kind ? "win" : "");
    let html;
    if (kind === "litiere") {
      html = `<h3>${CAT} Jackpot légendaire ${CAT}</h3>
        <p>Les 5 % de chance sont tombés sur toi. Tu remportes le meilleur cadeau du monde :</p>
        <p class="prize-name">${C.litiere.nom}</p>
        <p>${C.litiere.description}</p>
        <p style="margin-top:10px"><em>Règlement de course : la litière remplace toutes les F1. Le chat a gagné, pas toi.</em></p>`;
    } else if (kind && already) {
      html = `<h3>Encore gagné !</h3><p>Mais ta ${car.nom} est déjà dans ton garage.</p>`;
    } else if (kind) {
      html = `<h3>Victoire !</h3>
        <p class="prize-name">${car.nom}</p><p>${car.equipe}</p>
        ${car.image ? `<img src="${car.image}" alt="${car.nom}">` : ""}`;
    } else if (cardWon(id)) {
      html = `<h3>Perdu...</h3><p>${lossJoke(id)}</p><p style="margin-top:8px">Pas grave, ta ${car.nom} est déjà dans ton garage.</p>`;
    } else {
      html = `<h3>Perdu...</h3><p>${lossJoke(id)}</p>`;
    }
    const [next, part] = nextOf(id);
    const nextLabel = next === id ? `${PART_WORD[id]} ${part + 1}` : next === "c2" || next === "c3" ? "Carte suivante" : next === "q" ? "Question bonus" : "Voir le classement";
    box.innerHTML = html + `<button class="btn">${nextLabel}</button>`;
    box.hidden = false;
    $("button", box).addEventListener("click", () => show(next, part));
    setTimeout(() => box.scrollIntoView({ behavior: "smooth", block: "center" }), 300);
    if (kind && !already) confetti(kind === "litiere" ? 400 : 180);
    buzz(kind ? [60, 40, 120] : 80);
    renderGarage();
    if (!kind) maybeMarbella(id);
  }

  // Pop-up « stage à Marbella » : 2 défaites de suite sur un même jeu (une fois par jeu)
  const GAME_NAME = { c1: "Grille d'Or", c2: "Mega Jackpot", c3: "Goal!" };
  const isLoss = (v) => v === false || v === "perdu";
  function maybeMarbella(c) {
    const p = S.part, r = S.res[c];
    S.mb = S.mb || {};
    if (S.mb[c] || p < 1 || !isLoss(r[p]) || !isLoss(r[p - 1]) || cardWon(c)) return;
    S.mb[c] = true; save();
    const done = r.filter((v) => v !== undefined).length;
    setTimeout(() => {
      document.body.insertAdjacentHTML("beforeend", `
        <div class="mb-overlay" id="mb"><div class="mb-pop"><div class="mb-in">
          <div class="mb-stamp">2 défaites</div>
          <span class="card-num">${GAME_NAME[c]} · 0/${done}</span>
          <h2 class="t-title"><span class="t3d yellow">Aïe aïe aïe</span></h2>
          <div class="mb-scene">${MARBELLA_SVG}</div>
          <p class="mb-msg">Tu es mauvais…<b>Il te faudrait un stage à Marbella !</b><small>Là-bas, au moins, personne ne te demandera de battre le PSG.</small></p>
          <button class="btn">J'ai compris, je continue</button>
        </div></div></div>`);
      buzz([100, 60, 100]);
      $("#mb .btn").addEventListener("click", () => $("#mb").remove());
    }, 900);
  }
  const MARBELLA_SVG = `<svg viewBox="0 0 360 200" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="mbsky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ff9a3c"/><stop offset=".55" stop-color="#ffd36b"/><stop offset="1" stop-color="#ffe9a8"/></linearGradient>
        <linearGradient id="mbsea" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1fb5d6"/><stop offset="1" stop-color="#0a7aa8"/></linearGradient>
      </defs>
      <rect width="360" height="200" fill="url(#mbsky)"/>
      <circle cx="250" cy="96" r="38" fill="#fff36b"/><circle cx="250" cy="96" r="50" fill="#fff36b" opacity=".25"/>
      <path d="M0 112 Q60 104 120 112 T240 112 T360 112 V150 H0Z" fill="url(#mbsea)"/>
      <path d="M0 126 q20-6 40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0" stroke="#bff2ff" stroke-width="3" fill="none" opacity=".7"/>
      <path d="M0 150 Q90 132 180 146 T360 140 V200 H0Z" fill="#ffd98a"/>
      <path d="M172 108 h44 l-8 9 h-30z" fill="#fff"/><path d="M190 108 v-24 l16 24z" fill="#fff"/><rect x="189" y="82" width="2" height="26" fill="#555"/>
      <path d="M62 196 C66 160 70 128 82 92" stroke="#8a5a2b" stroke-width="9" fill="none" stroke-linecap="round"/>
      <g fill="#1f9d4a">
        <path d="M82 92 C60 80 38 84 22 98 C44 90 62 92 82 92Z"/><path d="M82 92 C70 70 52 62 34 64 C54 70 68 78 82 92Z"/>
        <path d="M82 92 C92 68 110 60 128 62 C110 70 96 78 82 92Z"/><path d="M82 92 C104 84 126 88 140 102 C120 94 100 92 82 92Z"/>
        <path d="M82 92 C82 70 90 56 100 48 C94 62 88 76 82 92Z"/>
      </g>
      <circle cx="80" cy="96" r="5" fill="#7a4a1a"/><circle cx="88" cy="94" r="5" fill="#7a4a1a"/>
      <path d="M268 190 L282 132" stroke="#555" stroke-width="3"/>
      <path d="M244 140 Q282 104 320 128 Z" fill="#e0123c"/><path d="M263 134 Q282 112 300 130 Z" fill="#fff"/>
      <path d="M250 186 l40 -14 l22 14" stroke="#fff" stroke-width="5" fill="none" stroke-linejoin="round"/>
      <text x="300" y="182" font-size="26">😎</text>
      <rect x="128" y="150" width="4" height="40" fill="#8a5a2b"/>
      <rect x="96" y="132" width="88" height="28" rx="5" fill="#fffdf6" stroke="#8a5a2b" stroke-width="3"/>
      <text x="140" y="151" text-anchor="middle" font-family="Luckiest Guy" font-size="15" fill="#b4258f">MARBELLA</text>
      <text x="20" y="40" font-size="22">🍹</text><text x="320" y="44" font-size="20">⛱️</text>
    </svg>`;

  // Pièces d'or décoratives autour de chaque ticket
  const COINS = [[-3, 4, 34], [88, 2, 30], [93, 22, 24], [-4, 30, 22], [91, 48, 28], [-5, 60, 30], [94, 74, 22], [-2, 88, 26], [86, 92, 32], [40, -2, 20]];
  document.querySelectorAll(".ticket-in").forEach((t) => {
    COINS.forEach(([l, tp, sz], i) => {
      const c = document.createElement("i");
      c.className = "coin";
      c.style.cssText = `left:${l}%;top:${tp}%;width:${sz}px;height:${sz}px;transform:rotate(${i * 37}deg)`;
      t.prepend(c);
    });
  });

  // ------------------------------------------------------------------
  //  Accueil + feux de départ
  // ------------------------------------------------------------------
  $("#intro-name").textContent = C.prenom;
  $("#intro-date").textContent = C.date;
  $("#intro-text").textContent = C.blagues.accueil;

  // Pourcentage de chance affiché sur chaque carte
  const pct = (x) => `${Math.round(x * 100)} %`;
  $("#odds-c1").innerHTML = `Chance de gagner : <b>${pct(C.chanceF1)}</b> par partie`;
  $("#odds-c2").innerHTML = `Par tirage : F1 <b>${pct(C.chanceF1)}</b> · <span class="cat-logo">${CAT}</span> Litière <b>${pct(C.chanceLitiere)}</b>`;
  $("#odds-c3").innerHTML = `Chance de gagner : <b>${pct(C.chanceF1)}</b> par partie`;
  $("#btn-start").addEventListener("click", (e) => {
    const btn = e.currentTarget;
    btn.disabled = true;
    const L = $("#lights");
    const spans = [...L.children];
    L.classList.add("on");
    spans.forEach((s, i) => setTimeout(() => { s.classList.add("lit"); buzz(30); }, 500 * (i + 1)));
    setTimeout(() => {
      L.classList.remove("on");
      spans.forEach((s) => s.classList.remove("lit"));
      L.classList.add("go");
      btn.textContent = "C'est parti !";
      buzz(120);
    }, 500 * 6 + Math.random() * 700);
    setTimeout(() => show("c1"), 500 * 6 + 1500);
  });

  // ------------------------------------------------------------------
  //  Carte 1 : grille de départ
  // ------------------------------------------------------------------
  function initC1() {
    const root = $("#grid9");
    root.innerHTML = "";
    const p = S.part;
    const done = S.res.c1[p] !== undefined;
    let left = 9;
    const cells = S.lay.c1[p].map((sym) => {
      const el = document.createElement("div");
      el.className = "scratch";
      el.innerHTML = `<div class="under">${sym}</div>`;
      root.appendChild(el);
      return { el, sym };
    });
    const finish = () => {
      const { already } = record("c1", S.out.c1[p]);
      if (S.res.c1[p]) cells.filter((c) => c.sym === CAR).forEach((c) => c.el.classList.add("match"));
      showResult("c1", S.res.c1[p], already);
    };
    cells.forEach((c) => {
      c.s = makeScratch(c.el, { label: "?", threshold: 0.45, onReveal: () => { if (--left === 0) finish(); } });
    });
    if (done) { cells.forEach((c) => c.s.reveal(true)); finish(); }
  }

  // ------------------------------------------------------------------
  //  Carte 2 : jackpot
  // ------------------------------------------------------------------
  let c2Run = 0;
  function initC2() {
    const run = ++c2Run;
    const p = S.part;
    const lay = S.lay.c2[p];
    const reels = [...document.querySelectorAll("#slot .reel")];
    const N = REEL_SYMBOLS.length;
    const state = reels.map((reel, i) => {
      reel.classList.remove("win");
      const strip = $(".strip", reel);
      const seq = shuffle(REEL_SYMBOLS);
      strip.innerHTML = seq.concat(seq).map((s) => (s === CAT ? `<div><span class="cat-reel">${s}</span></div>` : `<div>${s}</div>`)).join("");
      return { reel, strip, seq, p: Math.random() * 1000, v: 0.9 + i * 0.15, stopping: null, stopped: false };
    });
    const H = () => reels[0].offsetHeight;
    let lastT = performance.now();
    function frame(t) {
      if (run !== c2Run) return;
      const dt = Math.min(50, t - lastT); lastT = t;
      const h = H(), loop = h * N;
      let running = false;
      state.forEach((r) => {
        if (r.stopped) return;
        running = true;
        if (r.stopping) {
          const k = Math.min(1, (t - r.stopping.t0) / r.stopping.dur);
          const e = 1 - Math.pow(1 - k, 3); // easeOutCubic
          r.p = r.stopping.from + (r.stopping.to - r.stopping.from) * e;
          if (k >= 1) { r.p = r.stopping.to; r.stopped = true; buzz(40); r.stopping.done(); }
        } else {
          r.p += r.v * dt;
        }
        const y = ((r.p % loop) + loop) % loop;
        r.strip.style.transform = `translateY(${-y}px)`;
      });
      if (running) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);

    const stopReel = (r, sym, delay) => new Promise((resolve) => {
      setTimeout(() => {
        const h = H(), loop = h * N;
        const idx = r.seq.indexOf(sym);
        const base = r.p - (((r.p % loop) + loop) % loop);
        let to = base + idx * h;
        while (to < r.p + loop * 1.5) to += loop;
        r.stopping = { from: r.p, to, t0: performance.now(), dur: 1100, done: resolve };
      }, delay);
    });

    const lever = $("#lever");
    lever.disabled = false;
    lever.classList.remove("pulled");
    $("#slot-hint").textContent = "Les rouleaux tournent... tire le levier !";
    const finish = () => {
      const { already } = record("c2", S.out.c2[p]);
      const res = S.res.c2[p];
      if (res !== "perdu") reels.forEach((r) => r.classList.add("win"));
      $("#slot-hint").textContent = res === "perdu" ? "Si près du but..." : res === "litiere" ? "TROIS CHATS ?!" : "Trois F1 !";
      showResult("c2", res === "litiere" ? "litiere" : res === "f1", already);
    };

    if (S.res.c2[p] !== undefined) {
      lever.disabled = true;
      lever.classList.add("pulled");
      state.forEach((r, i) => {
        const h = H();
        r.p = r.seq.indexOf(lay[i]) * h;
        r.stopped = true;
        r.strip.style.transform = `translateY(${-r.p}px)`;
      });
      finish();
      return;
    }

    lever.onclick = async () => {
      if (lever.disabled) return;
      lever.disabled = true;
      lever.classList.add("pulled");
      buzz(50);
      setTimeout(() => lever.classList.remove("pulled"), 450);
      $("#slot-hint").textContent = "Ça ralentit...";
      // suspense en plus sur le dernier rouleau si les deux premiers sont identiques
      const [a, b, c] = lay;
      await Promise.all([
        stopReel(state[0], a, 200),
        stopReel(state[1], b, 900),
        stopReel(state[2], c, a === b ? 2300 : 1600),
      ]);
      finish();
    };
  }

  // ------------------------------------------------------------------
  //  Carte 3 : goal
  // ------------------------------------------------------------------
  // Disposition des 5 ballons (en % de la zone), comme sur la vraie carte
  const BALL_POS = [
    { l: 2, t: 30, w: 30 },
    { l: 33, t: 3, w: 26 },
    { l: 64, t: 10, w: 25 },
    { l: 34, t: 38, w: 30 },
    { l: 8, t: 67, w: 28 },
  ];
  function initC3() {
    const field = $("#balls");
    field.querySelectorAll(".ball").forEach((el) => el.remove());
    $("#goal-prize").innerHTML = "";
    const p = S.part;
    const done = S.res.c3[p] !== undefined;
    const prizeEl = document.createElement("div");
    prizeEl.className = "scratch";
    prizeEl.innerHTML = `<div class="under">${CAR}</div>`;
    $("#goal-prize").appendChild(prizeEl);
    const items = [{ el: prizeEl, sym: CAR, tone: "silver", label: "GAIN" }];
    S.lay.c3[p].forEach((sym, i) => {
      const el = document.createElement("div");
      const bp = BALL_POS[i];
      el.className = "scratch ball";
      el.style.cssText = `left:${bp.l}%;top:${bp.t}%;width:${bp.w}%`;
      el.innerHTML = `<div class="under">${sym}</div>`;
      field.appendChild(el);
      items.push({ el, sym, tone: "ball" });
    });
    let left = items.length;
    const finish = () => {
      const { already } = record("c3", S.out.c3[p]);
      if (S.res.c3[p]) items.filter((it) => it.sym === CAR).forEach((it) => it.el.classList.add("match"));
      showResult("c3", S.res.c3[p], already);
    };
    items.forEach((it) => {
      it.s = makeScratch(it.el, { label: it.label, tone: it.tone, threshold: 0.45, onReveal: () => { if (--left === 0) finish(); } });
    });
    if (done) { items.forEach((it) => it.s.reveal(true)); finish(); }
  }

  // ------------------------------------------------------------------
  //  Question finale
  // ------------------------------------------------------------------
  let qReady = false;
  function initQ() {
    if (qReady) return;
    qReady = true;
    const missing = wonF1().filter((w) => !w).length;
    $("#q-intro").textContent = `Il te manque ${missing} F1. Une seule question pour toutes les débloquer. Une seule. Facile, non ?`;
    $("#q-text").textContent = C.question;
    const tries = $("#q-tries");
    const paintTries = (ok) => {
      tries.innerHTML = [0, 1, 2].map((i) => `<span class="${i < S.q ? "used" : ""}${ok && i === S.q ? " ok" : ""}"></span>`).join("");
    };
    paintTries();
    const fb = $("#q-feedback");
    const input = $("#q-input");
    $("#q-form").addEventListener("submit", (e) => {
      e.preventDefault();
      if (!input.value.trim()) return;
      if (S.q < 2) {
        fb.textContent = `« ${input.value.trim()} » ? ${C.refus[S.q]}`;
        fb.className = "q-feedback";
        void fb.offsetWidth;
        fb.className = "q-feedback no";
        S.q++; save();
        paintTries();
        input.value = "";
        input.focus();
        buzz([80, 50, 80]);
        return;
      }
      paintTries(true);
      fb.className = "q-feedback yes";
      fb.textContent = C.bravo;
      S.viaQ = wonF1().map((w, i) => (w ? -1 : i)).filter((i) => i >= 0);
      save();
      renderGarage();
      $("#q-form").hidden = true;
      confetti(300);
      buzz([60, 40, 160]);
      const b = document.createElement("button");
      b.className = "btn";
      b.textContent = "Voir le classement";
      b.addEventListener("click", () => show("end"));
      fb.after(b);
    });
  }

  // ------------------------------------------------------------------
  //  Classement final
  // ------------------------------------------------------------------
  function initEnd() {
    const won = wonF1();
    const litiere = hasLitiere();
    let gifts;
    if (litiere) {
      gifts = [{ ico: CAT, nom: C.litiere.nom, sub: "Jackpot légendaire (5 % de chance !)", c: "#c084fc" }];
    } else {
      gifts = C.f1.map((car, i) => won[i] && {
        img: car.image, nom: car.nom, c: car.couleur,
        sub: `${car.equipe} · ${cardWon(CARDS[i]) ? `gagnée au jeu ${i + 1}` : "débloquée grâce au muscle"}`,
      }).filter(Boolean);
    }
    $("#gift-count").textContent = gifts.length > 1 ? `${gifts.length} cadeaux gagnés` : "1 cadeau gagné";
    $("#prizes").innerHTML = gifts.map((g, i) => `
      <div class="gift" style="--c:${g.c};animation-delay:${i * 0.2}s">
        <div class="gift-pic">${g.img ? `<img src="${g.img}" alt="">` : `<span>${g.ico || CAR}</span>`}</div>
        <div class="gift-txt"><b>${g.nom}</b><small>${g.sub}</small></div>
      </div>`).join("");
    $("#end-text").textContent = C.blagues.finale;
    setTimeout(() => confetti(500), 300);
  }

  // ------------------------------------------------------------------
  //  Confettis (couleurs + petits drapeaux à damier)
  // ------------------------------------------------------------------
  const cv = $("#confetti");
  const cx = cv.getContext("2d");
  let parts = [], anim = false;
  function resize() { cv.width = innerWidth * devicePixelRatio; cv.height = innerHeight * devicePixelRatio; }
  addEventListener("resize", resize); resize();
  function confetti(count) {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) count = Math.round(count / 4);
    const W = cv.width, d = devicePixelRatio;
    const cols = ["#ff2d6f", "#ffd23f", "#ffffff", "#22c55e", "#3aa0ff", "#b14dff"];
    for (let i = 0; i < count; i++) {
      parts.push({
        x: W / 2 + (Math.random() - 0.5) * W * 0.3, y: cv.height * 0.35,
        vx: (Math.random() - 0.5) * 18 * d, vy: (-Math.random() * 18 - 6) * d,
        s: (6 + Math.random() * 8) * d, r: Math.random() * 6, vr: (Math.random() - 0.5) * 0.3,
        c: pick(cols), flag: Math.random() < 0.3, life: 0,
      });
    }
    if (!anim) { anim = true; requestAnimationFrame(tick); }
  }
  function tick() {
    cx.clearRect(0, 0, cv.width, cv.height);
    const d = devicePixelRatio;
    parts = parts.filter((p) => p.y < cv.height + 40 && p.life < 400);
    parts.forEach((p) => {
      p.life++; p.vy += 0.45 * d; p.vx *= 0.99; p.vy *= 0.99;
      p.x += p.vx; p.y += p.vy; p.r += p.vr;
      cx.save(); cx.translate(p.x, p.y); cx.rotate(p.r);
      if (p.flag) { // pièce d'or
        const sx = Math.abs(Math.cos(p.r));
        cx.scale(Math.max(0.15, sx), 1);
        cx.fillStyle = "#c98a00"; cx.beginPath(); cx.arc(0, 0, p.s * 0.6, 0, 7); cx.fill();
        cx.fillStyle = "#ffd84a"; cx.beginPath(); cx.arc(0, 0, p.s * 0.45, 0, 7); cx.fill();
      } else {
        cx.fillStyle = p.c;
        cx.fillRect(-p.s / 2, -p.s / 4, p.s, p.s / 2 * Math.abs(Math.cos(p.r * 2)) + d);
      }
      cx.restore();
    });
    if (parts.length) requestAnimationFrame(tick);
    else { anim = false; cx.clearRect(0, 0, cv.width, cv.height); }
  }

  // ------------------------------------------------------------------
  //  Démarrage (reprend là où il s'était arrêté)
  // ------------------------------------------------------------------
  if (S.step && S.step !== "intro") show(S.step, S.part || 0);
  else { STEPS.forEach((s) => { $("#screen-" + s).hidden = s !== "intro"; }); }
})();
