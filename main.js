(() => {
  "use strict";

  const CONFIG = {
    telegramUrl: "https://t.me/advantplayofficial",
    officialUrl: "https://advantplay-preview.netlify.app/our-games.html",
    termsUrl: "https://advantplay-preview.netlify.app/index.html",
  };

  const START = new Date("2026-08-01T00:00:00+08:00").getTime();
  const END = new Date("2026-09-04T23:59:59+08:00").getTime();

  function withUtm(url) {
    try {
      const search = window.location.search;
      if (!search) return url;
      const u = new URL(url);
      const params = new URLSearchParams(search);
      params.forEach((v, k) => {
        if (k.toLowerCase().startsWith("utm_") || k === "ad_id" || k === "adset_id" || k === "creative_id") {
          u.searchParams.set(k, v);
        }
      });
      return u.toString();
    } catch (e) {
      return url;
    }
  }

  function trackEvent(name, params) {
    try {
      if (window.dataLayer) window.dataLayer.push({ event: name, ...params });
      if (window.fbq) window.fbq("trackCustom", name, params);
      if (window.ttq) window.ttq.track(name, params);
    } catch (e) {}
  }

  function wireLinks() {
    const telegram = withUtm(CONFIG.telegramUrl);
    const official = withUtm(CONFIG.officialUrl);
    document.querySelectorAll("[data-telegram-link]").forEach((el) => (el.href = telegram));
    document.querySelectorAll("[data-official-link]").forEach((el) => (el.href = official));
    document.querySelectorAll("[data-terms-link]").forEach((el) => (el.href = CONFIG.termsUrl));
    document.querySelectorAll("[data-track]").forEach((el) => {
      el.addEventListener("click", () => trackEvent(el.getAttribute("data-track"), {}));
    });
  }

  function scrollToId(id) {
    const el = document.getElementById(id);
    if (!el) return;
    const top = el.getBoundingClientRect().top + window.scrollY - 60;
    window.scrollTo({ top, behavior: "smooth" });
  }

  function wireScrollNav() {
    document.querySelectorAll("[data-scroll-link]").forEach((el) => {
      el.addEventListener("click", (e) => {
        e.preventDefault();
        scrollToId(el.getAttribute("data-target"));
      });
    });
  }

  function pad(n) {
    return String(n).padStart(2, "0");
  }

  function diffParts(target, now) {
    let diff = Math.max(0, target - now);
    const d = Math.floor(diff / 86400000); diff -= d * 86400000;
    const h = Math.floor(diff / 3600000); diff -= h * 3600000;
    const m = Math.floor(diff / 60000); diff -= m * 60000;
    const s = Math.floor(diff / 1000);
    return { d: pad(d), h: pad(h), m: pad(m), s: pad(s) };
  }

  function setText(id, val) {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
  }

  function updateCountdown(now) {
    const isLive = now >= START && now < END;
    const isEnded = now >= END;
    const target = isEnded ? END : isLive ? END : START;
    const cd = diffParts(target, now);
    const label = isEnded ? "Tournament has ended" : isLive ? "Tournament ends in" : "Tournament starts in";
    setText("cdLabel", label);
    setText("cdD", cd.d); setText("cdH", cd.h); setText("cdM", cd.m); setText("cdS", cd.s);
  }

  // Derives each round card's live/upcoming/done state from its own
  // data-start/data-end so the schedule always reflects the real date
  // instead of a status baked in at design time.
  function updateRounds(now) {
    document.querySelectorAll(".round-card").forEach((card) => {
      const start = new Date(card.dataset.start).getTime();
      const end = new Date(card.dataset.end).getTime();
      const statusEl = card.querySelector(".round-status");
      let status, text;
      if (now > end) { status = "done"; text = "Ended"; }
      else if (now >= start) { status = "live"; text = "Live Now"; }
      else { status = "upcoming"; text = "Upcoming"; }
      card.classList.remove("live", "upcoming", "done");
      card.classList.add(status);
      if (statusEl) {
        statusEl.className = "round-status " + status;
        statusEl.textContent = text;
      }
    });
  }

  function wireCountdown() {
    const tick = () => {
      const now = Date.now();
      updateCountdown(now);
      updateRounds(now);
    };
    tick();
    setInterval(tick, 1000);
  }

  function clamp01(v) { return Math.max(0, Math.min(1, v)); }
  function smoothstep(t) { return t * t * (3 - 2 * t); }

  // Cinematic hero: as the user scrolls through the hero art, the key art
  // darkens to the page background and the CTA/note fade out ahead of it,
  // so the transition into the next section reads as a deliberate reveal
  // rather than the background art just being clipped off.
  function wireHeroScroll() {
    const heroEl = document.getElementById("hero");
    const bgFixed = document.getElementById("heroBgFixed");
    const heroImg = document.getElementById("heroImg");
    const heroFade = document.getElementById("heroFade");
    const heroCtas = document.getElementById("heroCtas");
    const heroNote = document.getElementById("heroNote");
    if (!heroEl || !bgFixed) return;

    let heroH = heroEl.offsetHeight || 800;
    const measure = () => {
      heroH = heroEl.offsetHeight || 800;
      bgFixed.style.height = heroH + "px";
    };
    measure();
    window.addEventListener("resize", measure);

    const apply = () => {
      const y = window.scrollY || window.pageYOffset;

      const fadeEnd = heroH;
      const fadeStart = heroH - Math.min(280, Math.max(160, heroH * 0.28));
      const fadeT = smoothstep(clamp01((y - fadeStart) / (fadeEnd - fadeStart)));

      const noteStart = heroH * 0.58, noteEnd = heroH * 0.73;
      const noteT = smoothstep(clamp01((y - noteStart) / (noteEnd - noteStart)));

      const ctaStart = heroH * 0.70, ctaEnd = heroH * 0.85;
      const ctaT = smoothstep(clamp01((y - ctaStart) / (ctaEnd - ctaStart)));

      if (heroFade) heroFade.style.opacity = fadeT;
      if (heroImg) heroImg.style.filter = `brightness(${(1 - 0.55 * fadeT).toFixed(3)})`;
      if (heroNote) heroNote.style.opacity = (1 - noteT).toFixed(3);
      if (heroCtas) {
        heroCtas.style.opacity = (1 - ctaT).toFixed(3);
        heroCtas.style.transform = `translateY(${Math.round(ctaT * 10)}px)`;
        heroCtas.style.pointerEvents = ctaT > 0.9 ? "none" : "auto";
      }
    };
    apply();
    window.addEventListener("scroll", apply, { passive: true });
  }

  function wireNavAndSticky() {
    const nav = document.getElementById("nav");
    const sticky = document.getElementById("stickyCta");
    const onScroll = () => {
      const y = window.scrollY || window.pageYOffset;
      if (nav) nav.classList.toggle("scrolled", y > 8);
      if (sticky) sticky.classList.toggle("show", y > 480);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  document.addEventListener("DOMContentLoaded", () => {
    trackEvent("landing_page_view", {});
    wireLinks();
    wireScrollNav();
    wireNavAndSticky();
    wireHeroScroll();
    wireCountdown();
  });
})();
