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
  const CAT = "🐈";
  const SYMBOLS = [CAR, "🏆", "🏁", "🚦", "🔧", "⛽"];
  const REEL_SYMBOLS = [CAR, "🏆", "🏁", "🚦", "⏱️", CAT];

  // ------------------------------------------------------------------
  //  État (tirage fait une seule fois, gardé si la page est rechargée)
  // ------------------------------------------------------------------
  const KEY = "gp-anniv-v1";
  const store = {
    get() { try { return JSON.parse(localStorage.getItem(KEY)); } catch (e) { return null; } },
    set(v) { try { localStorage.setItem(KEY, JSON.stringify(v)); } catch (e) {} },
    clear() { try { localStorage.removeItem(KEY); } catch (e) {} },
  };
  if (/[?&]reset\b/.test(location.search)) {
    store.clear();
    history.replaceState(null, "", location.pathname);
  }

  function draw() {
    const c1 = Math.random() < C.chanceF1;
    const r = Math.random();
    const c2 = r < C.chanceLitiere ? "litiere" : Math.random() < C.chanceF1 ? "f1" : "perdu";
    const c3 = Math.random() < C.chanceF1;

    // Carte 1 : 9 cases. Gagné = 3 voitures ; perdu = aucun symbole 3 fois.
    const others = SYMBOLS.filter((s) => s !== CAR);
    let grid;
    if (c1) grid = shuffle([CAR, CAR, CAR, ...shuffle(others.flatMap((s) => [s, s])).slice(0, 6)]);
    else grid = shuffle(shuffle(SYMBOLS.flatMap((s) => [s, s])).slice(0, 9));

    // Carte 2 : rouleaux. Perdu = presque gagné (2 identiques, 1 différent)
    let reels;
    if (c2 === "litiere") reels = [CAT, CAT, CAT];
    else if (c2 === "f1") reels = [CAR, CAR, CAR];
    else {
      const a = pick(REEL_SYMBOLS);
      const b = pick(REEL_SYMBOLS.filter((s) => s !== a));
      reels = shuffle([a, a, b]);
    }

    // Carte 3 : le gain dans la cage est la F1 ; un ballon identique = gagné
    const ballPool = SYMBOLS.filter((s) => s !== CAR).concat(["⚽", "🧤"]);
    const balls = shuffle(ballPool).slice(0, c3 ? 4 : 5);
    if (c3) balls.splice(Math.floor(Math.random() * 5), 0, CAR);

    return { step: "intro", out: { c1, c2, c3 }, lay: { grid, reels, balls }, res: {}, q: 0, viaQ: [] };
  }

  let S = store.get();
  if (!S || !S.out) { S = draw(); store.set(S); }
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
        ctx.font = `900 italic ${Math.round(Math.min(w, h) * 0.22)}px "Titillium Web", sans-serif`;
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

    cv.addEventListener("pointerdown", (e) => {
      if (revealed) return;
      drawing = true; last = null;
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
    const end = () => { if (drawing) { drawing = false; last = null; check(); } };
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
  function show(step) {
    S.step = step; save();
    STEPS.forEach((s) => { $("#screen-" + s).hidden = s !== step; });
    $("#hud").hidden = step === "intro";
    const labels = { c1: "Course 1/3", c2: "Course 2/3", c3: "Course 3/3", q: "Question bonus", end: "Arrivée" };
    $("#hud-step").textContent = labels[step] || "";
    renderGarage();
    window.scrollTo({ top: 0, behavior: "smooth" });
    ({ c1: initC1, c2: initC2, c3: initC3, q: initQ, end: initEnd }[step] || (() => {}))();
  }

  function wonF1() {
    if (S.res.c2 === "litiere") return [false, false, false];
    return [S.res.c1 === true || S.viaQ.includes(0), S.res.c2 === "f1" || S.viaQ.includes(1), S.res.c3 === true || S.viaQ.includes(2)];
  }

  function renderGarage() {
    const g = $("#garage");
    g.innerHTML = "";
    const won = wonF1();
    const keys = ["c1", "c2", "c3"];
    if (S.res.c2 === "litiere") {
      g.innerHTML = `<div class="slot-car won" style="width:auto;padding:0 8px">${CAT} Litière !</div>`;
      return;
    }
    won.forEach((w, i) => {
      const d = document.createElement("div");
      const done = S.res[keys[i]] !== undefined;
      d.className = "slot-car" + (w ? " won" : done ? " lost" : "");
      d.textContent = w ? CAR : "";
      if (w) d.style.borderColor = C.f1[i].couleur;
      g.appendChild(d);
    });
  }

  function showResult(id, kind, next) {
    const box = $("#res-" + id);
    const i = { c1: 0, c2: 1, c3: 2 }[id];
    const car = C.f1[i];
    box.className = "result " + (kind === "litiere" ? "mega" : kind ? "win" : "");
    let html;
    if (kind === "litiere") {
      html = `<h3>${CAT} Jackpot légendaire ${CAT}</h3>
        <p>Les 5 % de chance sont tombés sur toi. Tu remportes le meilleur cadeau du monde :</p>
        <p class="prize-name">${C.litiere.nom}</p>
        <p>${C.litiere.description}</p>
        <p style="margin-top:10px"><em>Règlement de course : la litière remplace toutes les F1. Le chat a gagné, pas toi.</em></p>`;
    } else if (kind) {
      html = `<h3>Victoire !</h3><p>${pick(C.blagues.gagne)}</p>
        <p class="prize-name">${car.nom}</p><p>${car.equipe}</p>
        ${car.image ? `<img src="${car.image}" alt="${car.nom}">` : ""}`;
    } else {
      html = `<h3>Perdu...</h3><p>${pick(C.blagues.perdu)}</p>`;
    }
    const nextLabel = next === "c2" || next === "c3" ? "Carte suivante" : next === "q" ? "Question bonus" : "Voir le classement";
    box.innerHTML = html + `<button class="btn">${nextLabel}</button>`;
    box.hidden = false;
    $("button", box).addEventListener("click", () => show(next));
    setTimeout(() => box.scrollIntoView({ behavior: "smooth", block: "center" }), 300);
    if (kind) confetti(kind === "litiere" ? 400 : 180);
    buzz(kind ? [60, 40, 120] : 80);
    renderGarage();
  }

  const afterC3 = () => (wonF1().every(Boolean) ? "end" : "q");

  // ------------------------------------------------------------------
  //  Accueil + feux de départ
  // ------------------------------------------------------------------
  $("#intro-name").textContent = C.prenom;
  $("#intro-date").textContent = C.date;
  $("#intro-text").textContent = C.blagues.accueil;
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
    if (root.childElementCount) return;
    const done = S.res.c1 !== undefined;
    let left = 9;
    const cells = S.lay.grid.map((sym) => {
      const el = document.createElement("div");
      el.className = "scratch";
      el.innerHTML = `<div class="under">${sym}</div>`;
      root.appendChild(el);
      return { el, sym };
    });
    const finish = () => {
      if (S.res.c1 === undefined) { S.res.c1 = S.out.c1; save(); }
      if (S.res.c1) cells.filter((c) => c.sym === CAR).forEach((c) => c.el.classList.add("match"));
      showResult("c1", S.res.c1, "c2");
    };
    cells.forEach((c) => {
      c.s = makeScratch(c.el, { label: "?", threshold: 0.45, onReveal: () => { if (--left === 0) finish(); } });
    });
    if (done) { cells.forEach((c) => c.s.reveal(true)); finish(); }
  }

  // ------------------------------------------------------------------
  //  Carte 2 : jackpot
  // ------------------------------------------------------------------
  let c2Ready = false;
  function initC2() {
    if (c2Ready) return;
    c2Ready = true;
    const reels = [...document.querySelectorAll("#slot .reel")];
    const N = REEL_SYMBOLS.length;
    const state = reels.map((reel, i) => {
      const strip = $(".strip", reel);
      const seq = shuffle(REEL_SYMBOLS);
      strip.innerHTML = seq.concat(seq).map((s) => `<div>${s}</div>`).join("");
      return { reel, strip, seq, p: Math.random() * 1000, v: 0.9 + i * 0.15, stopping: null, stopped: false };
    });
    const H = () => reels[0].offsetHeight;
    let lastT = performance.now();
    function frame(t) {
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
    const finish = async () => {
      if (S.res.c2 === undefined) { S.res.c2 = S.out.c2; save(); }
      const res = S.res.c2;
      if (res !== "perdu") reels.forEach((r) => r.classList.add("win"));
      $("#slot-hint").textContent = res === "perdu" ? "Si près du but..." : res === "litiere" ? "TROIS CHATS ?!" : "Trois F1 !";
      if (res === "litiere") showResult("c2", "litiere", "end");
      else showResult("c2", res === "f1", "c3");
    };

    if (S.res.c2 !== undefined) {
      lever.disabled = true;
      lever.classList.add("pulled");
      state.forEach((r, i) => {
        const h = H();
        r.p = r.seq.indexOf(S.lay.reels[i]) * h;
        r.stopped = true;
        r.strip.style.transform = `translateY(${-r.p}px)`;
      });
      finish();
      return;
    }

    lever.addEventListener("click", async () => {
      if (lever.disabled) return;
      lever.disabled = true;
      lever.classList.add("pulled");
      buzz(50);
      setTimeout(() => lever.classList.remove("pulled"), 450);
      $("#slot-hint").textContent = "Ça ralentit...";
      // suspense en plus sur le dernier rouleau si les deux premiers sont identiques
      const [a, b, c] = S.lay.reels;
      await Promise.all([
        stopReel(state[0], a, 200),
        stopReel(state[1], b, 900),
        stopReel(state[2], c, a === b ? 2300 : 1600),
      ]);
      finish();
    });
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
    if (field.querySelector(".scratch")) return;
    const done = S.res.c3 !== undefined;
    const prizeEl = document.createElement("div");
    prizeEl.className = "scratch";
    prizeEl.innerHTML = `<div class="under">${CAR}</div>`;
    $("#goal-prize").appendChild(prizeEl);
    const items = [{ el: prizeEl, sym: CAR, tone: "silver", label: "GAIN" }];
    S.lay.balls.forEach((sym, i) => {
      const el = document.createElement("div");
      const p = BALL_POS[i];
      el.className = "scratch ball";
      el.style.cssText = `left:${p.l}%;top:${p.t}%;width:${p.w}%`;
      el.innerHTML = `<div class="under">${sym}</div>`;
      field.appendChild(el);
      items.push({ el, sym, tone: "ball" });
    });
    let left = items.length;
    const finish = () => {
      if (S.res.c3 === undefined) { S.res.c3 = S.out.c3; save(); }
      if (S.res.c3) items.filter((it) => it.sym === CAR).forEach((it) => it.el.classList.add("match"));
      showResult("c3", S.res.c3, afterC3());
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
    const litiere = S.res.c2 === "litiere";
    const n = won.filter(Boolean).length;
    const rows = [
      { pos: "P1", who: C.prenom, sub: litiere ? "Champion du monde de la propreté féline" : `${n} F1 au garage`, pts: litiere ? 500 : 25 * 3 + 26, c: "#ffd23f", me: true },
      { pos: "P2", who: "Max Verstappen", sub: "Pas invité", pts: 100, c: "#3671c6" },
      { pos: "P3", who: "Lewis Hamilton", sub: "Toujours en train de chercher le muscle", pts: 77, c: "#e10600" },
      { pos: "P4", who: litiere ? "Le chat" : "Les F1 que tu n'as pas eues", sub: litiere ? "Enfin des toilettes dignes de lui" : "Il n'y en a pas, bien joué", pts: litiere ? 499 : 0, c: "#888" },
    ];
    if (litiere) {
      [rows[1], rows[3]] = [rows[3], rows[1]];
      rows.forEach((r, i) => (r.pos = "P" + (i + 1)));
    }
    $("#standings").innerHTML = rows.map((r, i) => `
      <li class="${r.me ? "me" : ""}" style="animation-delay:${i * 0.15}s">
        <span class="pos">${r.pos}</span><span class="bar" style="background:${r.c}"></span>
        <span class="who">${r.who}<small>${r.sub}</small></span><span class="pts">${r.pts} pts</span>
      </li>`).join("");

    const keys = ["c1", "c2", "c3"];
    let prizes;
    if (litiere) {
      prizes = `<div class="prize-card" style="--c:#c084fc"><span class="ico">${CAT}</span>
        <div><b>${C.litiere.nom}</b><small>Jackpot légendaire (5 % de chance !)</small></div></div>`;
    } else {
      prizes = C.f1.map((car, i) => {
        if (!won[i]) return "";
        const how = S.res[keys[i]] === true || S.res[keys[i]] === "f1" ? `Gagnée sur la carte ${i + 1}` : "Débloquée grâce au muscle";
        return `<div class="prize-card" style="--c:${car.couleur}"><span class="ico">${CAR}</span>
          <div><b>${car.nom}</b><small>${car.equipe} · ${how}</small></div>
          ${car.image ? `<img src="${car.image}" alt="">` : ""}</div>`;
      }).join("");
    }
    $("#prizes").innerHTML = prizes;
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
    const cols = ["#e10600", "#ffd23f", "#ffffff", "#22c55e", "#3671c6", "#ff8000"];
    for (let i = 0; i < count; i++) {
      parts.push({
        x: W / 2 + (Math.random() - 0.5) * W * 0.3, y: cv.height * 0.35,
        vx: (Math.random() - 0.5) * 18 * d, vy: (-Math.random() * 18 - 6) * d,
        s: (6 + Math.random() * 8) * d, r: Math.random() * 6, vr: (Math.random() - 0.5) * 0.3,
        c: pick(cols), flag: Math.random() < 0.15, life: 0,
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
      if (p.flag) {
        const q = p.s / 2;
        for (let a = 0; a < 3; a++) for (let b = 0; b < 2; b++) {
          cx.fillStyle = (a + b) % 2 ? "#111" : "#fff";
          cx.fillRect(-p.s * 0.75 + a * q, -q + b * q, q, q);
        }
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
  if (S.step && S.step !== "intro") show(S.step);
  else { STEPS.forEach((s) => { $("#screen-" + s).hidden = s !== "intro"; }); }
})();
