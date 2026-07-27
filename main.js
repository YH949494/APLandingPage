(() => {
  "use strict";

  const CONFIG = {
    telegramUrl: "https://t.me/advantplayofficial",
    officialUrl: "https://advantplay-preview.netlify.app/our-games.html",
    termsUrl: "https://advantplay-preview.netlify.app/index.html",
    supportUrl: "https://t.me/advantplayofficial",
  };

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

  function wireSeriesExpand() {
    const btn = document.getElementById("seriesExpandBtn");
    const wrap = document.getElementById("seriesExpandWrap");
    btn.addEventListener("click", () => {
      document.querySelectorAll(".scard.series-extra").forEach((el) => el.removeAttribute("hidden"));
      wrap.style.display = "none";
    });
  }

  function wireSeriesClickTracking() {
    document.querySelectorAll(".scard").forEach((card) => {
      const idx = card.getAttribute("data-series-index");
      const link = card.querySelector(".scard-foot a");
      if (link) {
        link.addEventListener("click", () => trackEvent("series_view", { series: "s" + (Number(idx) + 1) }));
      }
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    trackEvent("landing_page_view", {});
    wireLinks();
    wireScrollNav();
    wireNavAndSticky();
    wireReveal();
    wireFaq();
    wireSeriesExpand();
    wireSeriesClickTracking();
  });
})();
