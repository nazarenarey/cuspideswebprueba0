/**
 * CÚSPIDES — Interacciones de scroll
 * - Parallax hero (2 capas)
 * - Reveal de color palabra por palabra (Nosotros)
 * - Carrusel horizontal por scroll vertical (Preparación)
 * Todo throttleado con requestAnimationFrame
 */

(function () {
  "use strict";

  /* ---------- Utilidades ---------- */

  /** Convierte hex (#RRGGBB) a [r, g, b] */
  function hexToRgb(hex) {
    const n = parseInt(hex.slice(1), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }

  /** Interpola entre dos colores hex según t (0–1) */
  function lerpColor(hexA, hexB, t) {
    const a = hexToRgb(hexA);
    const b = hexToRgb(hexB);
    const c = a.map((v, i) => Math.round(v + (b[i] - v) * t));
    return `rgb(${c[0]}, ${c[1]}, ${c[2]})`;
  }

  /** Progreso 0–1 dentro de un rango scroll */
  function scrollProgress(start, end, scrollY) {
    if (scrollY <= start) return 0;
    if (scrollY >= end) return 1;
    return (scrollY - start) / (end - start);
  }

  /** Throttle de scroll con rAF */
  function createScrollController(onTick) {
    let ticking = false;

    function tick() {
      onTick(window.scrollY);
      ticking = false;
    }

    window.addEventListener(
      "scroll",
      () => {
        if (!ticking) {
          requestAnimationFrame(tick);
          ticking = true;
        }
      },
      { passive: true }
    );

    window.addEventListener("resize", () => {
      requestAnimationFrame(tick);
    });

    // Primer render
    requestAnimationFrame(tick);
  }

  const COLORS = {
    muted: "#A19484",
    text: "#27221C",
    accent: "#E74F26",
  };

  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const isMobile = () => window.matchMedia("(max-width: 768px)").matches;

  /* ==========================================================
     HERO — Parallax en scroll
     ========================================================== */
  const heroBack = document.querySelector(".hero__layer--back");
  const heroFront = document.querySelector(".hero__layer--front");
  const heroSection = document.querySelector(".hero");

  function updateHeroParallax(scrollY) {
    if (!heroBack || !heroFront || prefersReducedMotion || isMobile()) {
      if (heroBack) heroBack.style.transform = "";
      if (heroFront) heroFront.style.transform = "";
      return;
    }

    const heroTop = heroSection.offsetTop;
    const relativeScroll = Math.max(0, scrollY - heroTop);

    // Fondo más lento, frente un poco más rápido
    heroBack.style.transform = `translate3d(0, ${relativeScroll * 0.18}px, 0)`;
    heroFront.style.transform = `translate3d(0, ${relativeScroll * 0.32}px, 0)`;
  }

  /* ==========================================================
     NOSOTROS — Pin + reveal palabra por palabra
     ========================================================== */
  const nosotrosPin = document.querySelector(".nosotros-pin");
  const nosotrosWords = document.querySelectorAll("#nosotros-text .word");

  function setupNosotrosPin() {
    if (!nosotrosPin) return;

    const revealDistance = window.innerHeight * 0.85;
    nosotrosPin.style.height = `${window.innerHeight + revealDistance}px`;
    nosotrosPin.dataset.revealDistance = String(revealDistance);
  }

  function updateNosotrosReveal(scrollY) {
    if (!nosotrosPin || !nosotrosWords.length) return;

    const pinTop = nosotrosPin.offsetTop;
    const revealDistance = Number(nosotrosPin.dataset.revealDistance) || window.innerHeight * 0.85;
    const progress = scrollProgress(pinTop, pinTop + revealDistance, scrollY);
    const total = nosotrosWords.length;

    nosotrosWords.forEach((word, index) => {
      // Cada palabra "activa" en una fracción del progreso total
      const wordStart = index / total;
      const wordEnd = (index + 1) / total;
      const localT = scrollProgress(wordStart * revealDistance + pinTop, wordEnd * revealDistance + pinTop, scrollY);
      // Normalizar progreso local de la palabra (0–1)
      const t = Math.min(1, Math.max(0, (progress * total - index)));

      const target = word.classList.contains("word--accent") ? COLORS.accent : COLORS.text;
      word.style.color = prefersReducedMotion && progress > 0.5
        ? target
        : lerpColor(COLORS.muted, target, t);
    });
  }

  /* ==========================================================
     PREPARACIÓN — Scroll-jacking horizontal
     ========================================================== */
  const preparacionPin = document.querySelector(".preparacion-pin");
  const carouselTrack = document.getElementById("carousel-track");
  const cards = document.querySelectorAll(".preparacion__card");

  function getCardMetrics() {
    if (!cards.length) return { blockWidth: 0, gap: 0, count: 0, totalDistance: 0 };

    const cardRect = cards[0].getBoundingClientRect();
    const blockWidth = cardRect.width;
    const gap = parseFloat(getComputedStyle(carouselTrack).gap) || 0;
    const count = cards.length;
    const totalDistance = (blockWidth + gap) * (count - 1);

    return { blockWidth, gap, count, totalDistance };
  }

  function setupPreparacionPin() {
    if (!preparacionPin || !carouselTrack) return;

    if (isMobile() || prefersReducedMotion) {
      preparacionPin.style.height = "";
      carouselTrack.style.transform = "";
      return;
    }

    const { totalDistance } = getCardMetrics();
    // Altura extra = viewport + distancia horizontal a recorrer (1:1)
    preparacionPin.style.height = `${window.innerHeight + totalDistance}px`;
    preparacionPin.dataset.totalDistance = String(totalDistance);
  }

  function updatePreparacionCarousel(scrollY) {
    if (!preparacionPin || !carouselTrack || isMobile() || prefersReducedMotion) return;

    const pinTop = preparacionPin.offsetTop;
    const totalDistance = Number(preparacionPin.dataset.totalDistance) || getCardMetrics().totalDistance;
    const progress = scrollProgress(pinTop, pinTop + totalDistance, scrollY);

    carouselTrack.style.transform = `translate3d(${-progress * totalDistance}px, 0, 0)`;
  }

  /* ==========================================================
     Menú mobile
     ========================================================== */
  const navToggle = document.querySelector(".site-header__toggle");
  const mainNav = document.getElementById("main-nav");

  if (navToggle && mainNav) {
    navToggle.addEventListener("click", () => {
      const open = mainNav.classList.toggle("is-open");
      navToggle.setAttribute("aria-expanded", String(open));
    });

    mainNav.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => {
        mainNav.classList.remove("is-open");
        navToggle.setAttribute("aria-expanded", "false");
      });
    });
  }

  /* ==========================================================
     Loop principal de scroll
     ========================================================== */
  function onScroll(scrollY) {
    updateHeroParallax(scrollY);
    updateNosotrosReveal(scrollY);
    updatePreparacionCarousel(scrollY);
  }

  // Init + resize
  function init() {
    setupNosotrosPin();
    setupPreparacionPin();
    onScroll(window.scrollY);
  }

  window.addEventListener("load", init);
  window.addEventListener("resize", () => {
    setupNosotrosPin();
    setupPreparacionPin();
    onScroll(window.scrollY);
  });

  createScrollController(onScroll);
})();