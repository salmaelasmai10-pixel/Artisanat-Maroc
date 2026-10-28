// Artisanat Maroc — interactions du site.
// Le suivi (clics, formulaire, téléchargement du PDF) est entièrement configuré
// dans Google Tag Manager : ce fichier ne pousse rien dans la dataLayer.

(function () {
  "use strict";

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- La scène fixe : la photo change avec la section lue ---------- */
  const shots = Array.from(document.querySelectorAll(".shot"));
  const caption = document.querySelector(".stage-caption");
  let currentShot = "atelier";

  function showShot(name) {
    if (!name || name === currentShot) return;
    const next = shots.find((s) => s.dataset.shot === name);
    if (!next) return;
    shots.forEach((s) => s.classList.toggle("is-on", s === next));
    caption.textContent = next.dataset.caption;
    currentShot = name;
  }

  const stageSections = document.querySelectorAll(".read [data-stage]:not([role='tab'])");
  if ("IntersectionObserver" in window) {
    const stageObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          let name = entry.target.dataset.stage;
          // Dans les collections, la photo suit l'onglet ouvert.
          if (entry.target.id === "collections") {
            const active = document.querySelector('.tabs [aria-selected="true"]');
            if (active) name = active.dataset.stage;
          }
          showShot(name);
        });
      },
      { rootMargin: "-50% 0px -50% 0px" }
    );
    stageSections.forEach((section) => stageObserver.observe(section));
  }

  /* ---------- Onglets des collections ---------- */
  const tabs = Array.from(document.querySelectorAll('.tabs [role="tab"]'));

  function selectTab(tab, focus) {
    tabs.forEach((t) => {
      const selected = t === tab;
      t.setAttribute("aria-selected", String(selected));
      t.tabIndex = selected ? 0 : -1;
      const panel = document.getElementById(t.getAttribute("aria-controls"));
      panel.hidden = !selected;
      if (selected && !reduceMotion) {
        panel.classList.remove("is-entering");
        void panel.offsetWidth;
        panel.classList.add("is-entering");
      }
    });
    if (focus) tab.focus();
    showShot(tab.dataset.stage);
  }

  tabs.forEach((tab, i) => {
    if (tab.getAttribute("aria-selected") !== "true") {
      document.getElementById(tab.getAttribute("aria-controls")).hidden = true;
    }
    tab.addEventListener("click", () => selectTab(tab, false));
    tab.addEventListener("keydown", (e) => {
      let j = null;
      if (e.key === "ArrowRight") j = (i + 1) % tabs.length;
      if (e.key === "ArrowLeft") j = (i - 1 + tabs.length) % tabs.length;
      if (e.key === "Home") j = 0;
      if (e.key === "End") j = tabs.length - 1;
      if (j !== null) {
        e.preventDefault();
        selectTab(tabs[j], true);
      }
    });
  });

  /* ---------- Bouton « Demander un devis » ---------- */
  // GTM repère ce clic grâce à l'identifiant du bouton : btn-devis.
  const contact = document.getElementById("contact");
  const message = document.getElementById("message");

  function goToForm() {
    contact.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
    setTimeout(() => message.focus({ preventScroll: true }), reduceMotion ? 0 : 700);
  }

  document.getElementById("btn-devis").addEventListener("click", goToForm);

  /* ---------- Composer un panneau de zellige ---------- */
  const glazes = [
    { name: "Vert de Fès", color: "#1f6b4f" },
    { name: "Bleu cobalt", color: "#1d3f8f" },
    { name: "Blanc d'étain", color: "#f1efe9" },
    { name: "Noir de manganèse", color: "#1b1a1a" },
    { name: "Miel", color: "#c08a2b" },
    { name: "Turquoise", color: "#2a8d95" },
    { name: "Rouge brique", color: "#a33a2a" },
  ];
  const prices = { khatam: 1450, classique: 1150 };
  const motifLabels = { khatam: "étoile à huit branches", classique: "géométrique classique" };
  const choice = { star: "Vert de Fès", ground: "Blanc d'étain", joint: "Bleu cobalt", motif: "khatam", surface: 6 };

  const svg = document.getElementById("zellige");
  const fill = document.getElementById("zellige-fill");
  const surface = document.getElementById("surface");
  const surfaceOut = document.getElementById("surface-out");
  const total = document.getElementById("estimate-total");
  const detail = document.getElementById("estimate-detail");
  const estimate = total.closest(".estimate");
  const fmt = new Intl.NumberFormat("fr-FR");

  function paint() {
    ["star", "ground", "joint"].forEach((role) => {
      const g = glazes.find((x) => x.name === choice[role]);
      svg.style.setProperty("--z-" + role, g.color);
    });
    fill.setAttribute("fill", "url(#motif-" + choice.motif + ")");
    const price = prices[choice.motif];
    const sum = price * choice.surface;
    surfaceOut.textContent = choice.surface + " m²";
    total.textContent = fmt.format(sum) + " MAD";
    detail.textContent = "Prix estimé : " + choice.surface + " m² × " + fmt.format(price) + " MAD, pose non comprise";
    if (!reduceMotion) {
      estimate.classList.remove("pulse");
      void estimate.offsetWidth;
      estimate.classList.add("pulse");
    }
  }

  document.querySelectorAll(".swatches").forEach((fieldset) => {
    const role = fieldset.dataset.role;
    const row = document.createElement("div");
    row.className = "swatch-row";
    const label = document.createElement("span");
    label.className = "swatch-name";

    glazes.forEach((g) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "swatch";
      b.style.setProperty("--c", g.color);
      b.setAttribute("aria-label", g.name);
      b.setAttribute("aria-pressed", String(choice[role] === g.name));
      b.addEventListener("click", () => {
        choice[role] = g.name;
        row.querySelectorAll(".swatch").forEach((s) => s.setAttribute("aria-pressed", String(s === b)));
        label.textContent = g.name;
        paint();
      });
      row.appendChild(b);
    });

    label.textContent = choice[role];
    fieldset.appendChild(row);
    fieldset.appendChild(label);
  });

  document.querySelectorAll('input[name="motif"]').forEach((r) => {
    r.addEventListener("change", () => {
      choice.motif = r.value;
      paint();
    });
  });

  surface.addEventListener("input", () => {
    choice.surface = Number(surface.value);
    paint();
  });

  document.getElementById("btn-composition").addEventListener("click", () => {
    message.value =
      "Panneau de zellige, motif " + motifLabels[choice.motif] +
      " : étoile " + choice.star + ", fond " + choice.ground + ", petites pièces " + choice.joint +
      ". Surface : " + choice.surface + " m² (estimation " + total.textContent + ").";
    goToForm();
  });

  paint();
  estimate.classList.remove("pulse");

  /* ---------- Formulaire de contact ---------- */
  // Le formulaire s'envoie normalement vers merci.html (aucune donnée transmise :
  // les champs n'ont pas d'attribut name). GTM écoute cette soumission.
  document.getElementById("form-contact").addEventListener("submit", () => {
    try {
      sessionStorage.setItem("am-nom", document.getElementById("nom").value.trim());
    } catch (e) {
      /* stockage indisponible : la page de remerciement reste générique */
    }
  });

  /* ---------- Galerie : glisser à la souris ---------- */
  const row = document.querySelector(".gallery-row");
  let dragStart = null;
  row.addEventListener("pointerdown", (e) => {
    if (e.pointerType !== "mouse") return;
    dragStart = { x: e.clientX, left: row.scrollLeft };
    row.classList.add("dragging");
    row.setPointerCapture(e.pointerId);
  });
  row.addEventListener("pointermove", (e) => {
    if (!dragStart) return;
    row.scrollLeft = dragStart.left - (e.clientX - dragStart.x);
  });
  ["pointerup", "pointercancel"].forEach((type) =>
    row.addEventListener(type, () => {
      dragStart = null;
      row.classList.remove("dragging");
    })
  );

  /* ---------- Entrées : chaque partie monte à son tour ---------- */
  const reveals = document.querySelectorAll(".reveal");
  if (reduceMotion || !("IntersectionObserver" in window)) {
    reveals.forEach((el) => el.classList.add("in"));
  } else {
    const groups = new Map();
    reveals.forEach((el) => {
      const parent = el.closest("section, header") || document.body;
      const list = groups.get(parent) || [];
      el.style.setProperty("--d", list.length * 80 + "ms");
      list.push(el);
      groups.set(parent, list);
    });
    const revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("in");
            revealObserver.unobserve(entry.target);
          }
        });
      },
      { rootMargin: "0px 0px -10% 0px" }
    );
    reveals.forEach((el) => revealObserver.observe(el));
  }
})();
