(() => {
  "use strict";

  const CONFIG = {
    telegramUrl: "https://t.me/advantplayofficial",
    officialUrl: "https://advantplay-preview.netlify.app/our-games.html",
    termsUrl: "https://advantplay-preview.netlify.app/index.html",
    supportUrl: "https://t.me/advantplayofficial",
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
    document.querySelectorAll("[data-support-link]").forEach((el) => (el.href = CONFIG.supportUrl));
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
    document.querySelectorAll("[data-scroll-btn]").forEach((el) => {
      el.addEventListener("click", () => scrollToId(el.getAttribute("data-target")));
    });
  }

  function wireNavAndSticky() {
    const nav = document.getElementById("nav");
    const sticky = document.getElementById("stickyCta");
    const onScroll = () => {
      const y = window.scrollY || window.pageYOffset;
      nav.classList.toggle("scrolled", y > 8);
      sticky.classList.toggle("show", y > 480);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  function wireReveal() {
    const nodes = [...document.querySelectorAll("[data-reveal]")];
    const reveal = (el) => el.classList.add("in");
    if ("IntersectionObserver" in window) {
      const io = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              reveal(entry.target);
              const id = entry.target.id;
              if (id === "series") trackEvent("series_view", {});
              if (id === "prizes") trackEvent("prize_section_view", {});
              if (id === "games") trackEvent("eligible_games_view", {});
              io.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.1, rootMargin: "0px 0px -8% 0px" }
      );
      nodes.forEach((n) => io.observe(n));
      setTimeout(() => nodes.forEach(reveal), 2200);
    } else {
      nodes.forEach(reveal);
    }
  }

  function wireFaq() {
    document.querySelectorAll("#faqCard .faq-item").forEach((item) => {
      const q = item.querySelector(".faq-q");
      q.addEventListener("click", () => {
        const wasOpen = item.classList.contains("open");
        document.querySelectorAll("#faqCard .faq-item.open").forEach((o) => o.classList.remove("open"));
        if (!wasOpen) {
          item.classList.add("open");
          trackEvent("faq_open", { question: q.textContent.trim() });
        }
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

  function updateHeroLivePill(now) {
    const pill = document.getElementById("heroLivePill");
    if (!pill) return;
    if (now >= END) {
      pill.classList.remove("live");
      pill.innerHTML = "Tournament Ended";
    } else if (now < START) {
      pill.classList.remove("live");
      pill.innerHTML = "Starts Soon";
    } else {
      pill.classList.add("live");
      pill.innerHTML = '<span class="livedot"></span>Live Tournament';
    }
  }

  // Derives the currently-active series from each timeline node's
  // data-start/data-end so the spotlight and countdown track real dates
  // instead of a fixed series regardless of when the page is viewed.
  function updateSeriesSpotlight(now) {
    const nodes = [...document.querySelectorAll("#series .tnode")];
    if (!nodes.length) return;

    let live = null, nextUpcoming = null, lastDone = null;
    nodes.forEach((n) => {
      const start = new Date(n.dataset.start).getTime();
      const end = new Date(n.dataset.end).getTime();
      let status;
      if (now > end) { status = "done"; lastDone = n; }
      else if (now >= start) { status = "live"; live = n; }
      else { status = "upcoming"; if (!nextUpcoming) nextUpcoming = n; }
      n.className = "tnode " + status;
    });

    const spotlight = live || nextUpcoming || lastDone;
    if (!spotlight) return;

    setText("liveSeriesName", spotlight.querySelector(".tname").textContent);
    setText("liveSeriesPool", spotlight.dataset.pool);

    const pill = document.getElementById("liveSpotlightPill");
    const label = document.getElementById("liveSpotlightLabel");
    const start = new Date(spotlight.dataset.start).getTime();
    const end = new Date(spotlight.dataset.end).getTime();
    let target;
    if (live) {
      if (pill) pill.innerHTML = '<span class="livedot"></span>Live Now';
      if (label) label.textContent = "Series ends in";
      target = end;
    } else if (nextUpcoming) {
      if (pill) pill.innerHTML = "Starts Soon";
      if (label) label.textContent = "Series starts in";
      target = start;
    } else {
      if (pill) pill.innerHTML = "Series Ended";
      if (label) label.textContent = "Series ended";
      target = end;
    }

    const scd = diffParts(target, now);
    setText("scdD", scd.d); setText("scdH", scd.h); setText("scdM", scd.m); setText("scdS", scd.s);
  }

  function updateCountdowns() {
    const now = Date.now();
    const isLive = now >= START && now < END;
    const target = now < START ? START : END;
    const cd = diffParts(target, now);
    const label = now >= END ? "Tournament has ended" : isLive ? "Tournament ends in" : "Tournament starts in";

    setText("cdLabel", label);
    setText("cdD", cd.d); setText("cdH", cd.h); setText("cdM", cd.m); setText("cdS", cd.s);
    setText("cd2D", cd.d); setText("cd2H", cd.h); setText("cd2M", cd.m); setText("cd2S", cd.s);

    updateHeroLivePill(now);
    updateSeriesSpotlight(now);
  }

  function wireCountdown() {
    updateCountdowns();
    setInterval(updateCountdowns, 1000);
  }

  document.addEventListener("DOMContentLoaded", () => {
    trackEvent("landing_page_view", {});
    wireLinks();
    wireScrollNav();
    wireNavAndSticky();
    wireReveal();
    wireFaq();
    wireCountdown();
  });
})();
