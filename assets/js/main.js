/* ==========================================================================
   ONDA site — motion + interaction (shared by every page)
   ========================================================================== */
(function () {
  "use strict";

  var gsap = window.gsap, ScrollTrigger = window.ScrollTrigger;
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* ---------------- current page in nav ---------------- */
  var page = document.body.dataset.page;
  if (page) {
    $$('[data-nav="' + page + '"]').forEach(function (a) { a.setAttribute("aria-current", "page"); });
  }

  /* ---------------- header + mobile menu (no GSAP needed) ---------------- */
  var header = $(".site-header");
  var lastY = 0;
  function onScroll() {
    var y = window.scrollY;
    header.classList.toggle("is-solid", y > 40);
    var goingDown = y > lastY && y > 600 && !document.body.classList.contains("menu-open");
    header.classList.toggle("is-hidden", goingDown);
    lastY = y;
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  var toggle = $(".menu-toggle"), menu = $("#mobile-menu");
  function setMenu(open) {
    document.body.classList.toggle("menu-open", open);
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    menu.setAttribute("aria-hidden", String(!open));
    document.body.style.overflow = open ? "hidden" : "";
    if (open) menu.querySelector("a").focus();
  }
  toggle.addEventListener("click", function () { setMenu(!document.body.classList.contains("menu-open")); });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && document.body.classList.contains("menu-open")) { setMenu(false); toggle.focus(); }
  });
  $$("a", menu).forEach(function (a) { a.addEventListener("click", function () { setMenu(false); }); });

  /* ---------------- FAQ: accordion, search, scrollspy ---------------- */
  initFaq();

  /* ---------------- contact form ---------------- */
  initContactForm();

  // Without GSAP (blocked CDN) show everything statically
  if (!gsap || !ScrollTrigger) {
    document.documentElement.classList.remove("js");
    return;
  }
  gsap.registerPlugin(ScrollTrigger);

  /* ---------------- hero ---------------- */
  if (!reduced && $(".hero")) {
    gsap.timeline({ defaults: { ease: "power4.out" } })
      .from(".hero__media", { scale: 1.14, duration: 2.4, ease: "power2.out" }, 0)
      .from(".hero__rule", { scaleX: 0, duration: 1.2 }, 0.3)
      .from(".hero h1 .line > span", { yPercent: 110, duration: 1.1, stagger: 0.12 }, 0.45)
      .from(".hero__loc", { autoAlpha: 0, y: 16, duration: 0.9 }, 0.9)
      .from(".site-header .container > *", { autoAlpha: 0, y: -12, duration: 0.8, stagger: 0.08 }, 0.2);

    gsap.to(".hero__media", {
      yPercent: 12, ease: "none",
      scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true }
    });
    gsap.to(".hero .container", {
      y: -60, autoAlpha: 0.2, ease: "none",
      scrollTrigger: { trigger: ".hero", start: "40% top", end: "bottom top", scrub: true }
    });
  }

  /* ---------------- generic reveals ---------------- */
  if (reduced) {
    gsap.set("[data-reveal], [data-stagger]", { autoAlpha: 1, y: 0 });
  } else {
    $$("[data-rule]").forEach(function (r) {
      gsap.from(r, { scaleX: 0, duration: 1.2, ease: "power3.inOut", scrollTrigger: { trigger: r, start: "top 90%" } });
    });

    ScrollTrigger.batch("[data-reveal]", {
      start: "top 88%",
      once: true,
      onEnter: function (els) {
        gsap.to(els, { autoAlpha: 1, y: 0, duration: 0.9, stagger: 0.1, ease: "power3.out" });
      }
    });

    if ($("[data-stagger]")) gsap.set("[data-stagger]", { autoAlpha: 0, y: 36 });
    if ($("[data-stagger]")) ScrollTrigger.batch("[data-stagger]", {
      start: "top 90%",
      once: true,
      onEnter: function (els) {
        gsap.to(els, { autoAlpha: 1, y: 0, duration: 0.9, stagger: 0.12, ease: "power3.out" });
      }
    });

    $$("[data-parallax]").forEach(function (m) {
      var amt = parseFloat(m.dataset.parallax) || 12;
      gsap.fromTo(m, { yPercent: -amt / 2 }, {
        yPercent: amt / 2, ease: "none",
        scrollTrigger: { trigger: m.parentElement, start: "top bottom", end: "bottom top", scrub: true }
      });
    });

    $$("[data-parallax-img]").forEach(function (img) {
      gsap.fromTo(img, { yPercent: -8 }, {
        yPercent: 0, ease: "none",
        scrollTrigger: { trigger: img.parentElement, start: "top bottom", end: "bottom top", scrub: true }
      });
    });

    // statements that light up word by word as they cross the viewport
    $$("[data-words]").forEach(function (el) {
      var words = el.textContent.trim().split(/\s+/);
      el.setAttribute("aria-label", el.textContent.trim());
      el.innerHTML = words.map(function (w) { return '<span class="word" aria-hidden="true">' + w + "</span>"; }).join(" ");
      gsap.fromTo($$(".word", el), { opacity: 0.18 }, {
        opacity: 1, stagger: 0.08, ease: "none",
        scrollTrigger: { trigger: el, start: "top 80%", end: "bottom 45%", scrub: 0.4 }
      });
    });

    // stacked lines (e.g. "Enhanced data. / Enhanced decisions.")
    $$("[data-lines]").forEach(function (el) {
      gsap.from($$(".line > span", el), {
        yPercent: 110, duration: 1, stagger: 0.14, ease: "power4.out",
        scrollTrigger: { trigger: el, start: "top 82%" }
      });
    });
  }

  $$("[data-count]").forEach(function (n) {
    var to = parseInt(n.dataset.count, 10);
    if (reduced) return;
    var o = { v: 0 };
    n.textContent = "0";
    ScrollTrigger.create({
      trigger: n, start: "top 92%", once: true,
      onEnter: function () {
        gsap.to(o, { v: to, duration: 1.6, ease: "power3.out", onUpdate: function () { n.textContent = Math.round(o.v); } });
      }
    });
  });

  initPlatform();
  initQuotes();

  window.addEventListener("load", function () { ScrollTrigger.refresh(); });

  /* ======================================================================
     Homepage: platform scroll story
     ====================================================================== */
  function initPlatform() {
    var Dash = window.OndaDash;
    var track = $("#platform-track");
    if (!track || !Dash) return;

    var stage = $("#stage"), stageInner = $("#stage-inner"), dash = $("#dash");
    var stepsBox = $("#steps"), rail = $("#rail"), railFill = $("#rail-fill");
    var STEPS = Dash.STEPS, N = STEPS.length;
    var DW = 1200, DH = 720, SIDE = 178;

    STEPS.forEach(function (s, i) {
      var div = document.createElement("div");
      div.className = "step";
      div.innerHTML =
        '<span class="step__count">' + String(i + 1).padStart(2, "0") + " / " + String(N).padStart(2, "0") + "</span>" +
        "<h3>" + s.title + "</h3><p>" + s.text + "</p>" +
        '<ul class="tracks">' + s.tracks.map(function (t) { return "<li>" + t + "</li>"; }).join("") + "</ul>";
      stepsBox.appendChild(div);

      var b = document.createElement("button");
      b.type = "button";
      b.setAttribute("aria-label", "Go to " + s.title);
      b.innerHTML = "<span></span>";
      b.addEventListener("click", function () { goToStep(i); });
      rail.appendChild(b);
    });
    var stepEls = $$(".step", stepsBox), railBtns = $$("button", rail);

    Dash.mount(dash);

    // fit the fixed-size dashboard canvas into the stage
    function fit() {
      var w = stage.clientWidth, h = stage.clientHeight;
      var compact = w < 720;
      var dw = compact ? DW - SIDE : DW;
      dash.style.width = dw + "px";
      dash.querySelector(".dash__body").style.gridTemplateColumns = compact ? "1fr" : "";
      dash.querySelector(".dash__side").style.display = compact ? "none" : "";
      var s = Math.min(w / dw, h / DH);
      dash.style.transform = "scale(" + s + ")";
      stageInner.style.width = dw * s + "px";
      stageInner.style.height = DH * s + "px";
    }
    fit();
    new ResizeObserver(fit).observe(stage);

    track.style.height = (N * 80 + 100) + "vh";

    var active = -1;
    function setStep(i) {
      if (i === active) return;
      var prev = active;
      active = i;

      stepEls.forEach(function (el, idx) {
        if (idx === i) {
          el.classList.add("is-active");
          if (reduced) { gsap.set(el, { autoAlpha: 1, y: 0 }); }
          else {
            gsap.fromTo(el, { autoAlpha: 0, y: prev < i ? 26 : -26 }, { autoAlpha: 1, y: 0, duration: 0.6, delay: 0.12, ease: "power3.out" });
            gsap.fromTo($$(".tracks li", el), { autoAlpha: 0, y: 8 }, { autoAlpha: 1, y: 0, duration: 0.4, stagger: 0.05, delay: 0.3, ease: "power2.out" });
          }
        } else if (idx === prev) {
          el.classList.remove("is-active");
          gsap.to(el, { autoAlpha: 0, y: prev < i ? -20 : 20, duration: reduced ? 0 : 0.3, ease: "power2.in" });
        } else {
          el.classList.remove("is-active");
          gsap.set(el, { autoAlpha: 0 });
        }
      });
      railBtns.forEach(function (b, idx) {
        b.classList.toggle("is-active", idx === i);
        b.classList.toggle("is-done", idx < i);
        if (idx === i) b.setAttribute("aria-current", "step"); else b.removeAttribute("aria-current");
      });

      Dash.show(i, { reduced: reduced });
    }

    var vertical = window.matchMedia("(max-width: 1100px)");
    var storyST = ScrollTrigger.create({
      trigger: track,
      start: "top top",
      end: "bottom bottom",
      onUpdate: function (self) {
        var p = self.progress;
        setStep(Math.min(N - 1, Math.floor(p * N * 0.999)));
        railFill.style.transform = vertical.matches ? "scaleX(" + p + ")" : "scaleY(" + p + ")";
      },
      onRefresh: function (self) {
        setStep(Math.min(N - 1, Math.floor(self.progress * N * 0.999)));
      }
    });

    function goToStep(i) {
      var y = storyST.start + ((i + 0.5) / N) * (storyST.end - storyST.start);
      window.scrollTo({ top: y, behavior: reduced ? "auto" : "smooth" });
    }

    setStep(0);

    if (!reduced) {
      gsap.fromTo(stageInner,
        { rotateX: 24, y: 90, scale: 0.86, autoAlpha: 0.35 },
        {
          rotateX: 0, y: 0, scale: 1, autoAlpha: 1, ease: "none",
          scrollTrigger: { trigger: track, start: "top 95%", end: "top top", scrub: 0.6 }
        });
      gsap.fromTo(".story", { autoAlpha: 0, x: -30 }, {
        autoAlpha: 1, x: 0, ease: "none",
        scrollTrigger: { trigger: track, start: "top 60%", end: "top 10%", scrub: 0.6 }
      });
    }
  }

  /* ======================================================================
     Testimonials slider
     ====================================================================== */
  function initQuotes() {
    var qSection = $(".quotes");
    if (!qSection) return;
    var quotes = $$(".quote", qSection), dotsBox = $(".dots", qSection), bar = $(".quotes__progress i", qSection);
    var qi = 0, timer = null, DURATION = 6;
    quotes.forEach(function (_, i) {
      var b = document.createElement("button");
      b.type = "button";
      b.setAttribute("aria-label", "Show testimonial " + (i + 1));
      b.innerHTML = "<span></span>";
      b.addEventListener("click", function () { goQuote(i); });
      dotsBox.appendChild(b);
    });
    var qDots = $$("button", dotsBox);

    function goQuote(i) {
      var prev = qi;
      qi = (i + quotes.length) % quotes.length;
      quotes.forEach(function (q, idx) {
        if (idx === qi) {
          q.classList.add("is-active");
          gsap.fromTo(q, { autoAlpha: 0, y: reduced ? 0 : 24 }, { autoAlpha: 1, y: 0, duration: reduced ? 0 : 0.8, ease: "power3.out" });
          if (!reduced) gsap.fromTo(q.querySelector("blockquote"), { clipPath: "inset(0 100% 0 0)" }, { clipPath: "inset(0 0% 0 0)", duration: 1.1, ease: "power3.out" });
        } else {
          q.classList.remove("is-active");
          gsap.to(q, { autoAlpha: 0, duration: idx === prev && !reduced ? 0.3 : 0 });
        }
      });
      qDots.forEach(function (d, idx) { d.setAttribute("aria-current", String(idx === qi)); });
      restart();
    }
    function restart() {
      if (timer) timer.kill();
      if (reduced) return;
      timer = gsap.fromTo(bar, { scaleX: 0 }, { scaleX: 1, duration: DURATION, ease: "none", onComplete: function () { goQuote(qi + 1); } });
    }
    $$(".arrow", qSection).forEach(function (b) {
      b.addEventListener("click", function () { goQuote(qi + parseInt(b.dataset.dir, 10)); });
    });
    ["mouseenter", "focusin"].forEach(function (ev) { qSection.addEventListener(ev, function () { if (timer) timer.pause(); }); });
    ["mouseleave", "focusout"].forEach(function (ev) { qSection.addEventListener(ev, function () { if (timer) timer.resume(); }); });
    gsap.set(quotes, { autoAlpha: 0 });
    goQuote(0);
    ScrollTrigger.create({
      trigger: qSection, start: "top bottom", end: "bottom top",
      onToggle: function (self) { if (timer) self.isActive ? timer.resume() : timer.pause(); }
    });
  }

  /* ======================================================================
     FAQ
     ====================================================================== */
  function initFaq() {
    var faq = $(".faq");
    if (!faq) return;

    // accordion — height animates via CSS grid rows
    $$(".qa__q", faq).forEach(function (btn) {
      btn.addEventListener("click", function () {
        var open = btn.getAttribute("aria-expanded") === "true";
        btn.setAttribute("aria-expanded", String(!open));
        btn.closest(".qa").classList.toggle("is-open", !open);
      });
    });

    // search across questions and answers
    var input = $("#faq-search"), empty = $(".faq__empty", faq), count = $(".faq__count", faq);
    if (input) {
      input.addEventListener("input", function () {
        var term = input.value.trim().toLowerCase(), shown = 0;
        $$(".faq__group", faq).forEach(function (g) {
          var any = false;
          $$(".qa", g).forEach(function (qa) {
            var hit = !term || qa.textContent.toLowerCase().indexOf(term) !== -1;
            qa.hidden = !hit;
            if (hit) { any = true; shown++; }
            if (term && hit) { qa.classList.add("is-open"); $(".qa__q", qa).setAttribute("aria-expanded", "true"); }
          });
          g.hidden = !any;
        });
        empty.hidden = shown !== 0;
        count.textContent = term ? shown + (shown === 1 ? " result" : " results") : "";
      });
    }

    // highlight the category currently in view
    var links = $$(".faq__nav a", faq);
    if ("IntersectionObserver" in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (!e.isIntersecting) return;
          links.forEach(function (a) { a.classList.toggle("is-active", a.getAttribute("href") === "#" + e.target.id); });
        });
      }, { rootMargin: "-30% 0px -60% 0px" });
      $$(".faq__group", faq).forEach(function (g) { io.observe(g); });
    }
  }

  /* ======================================================================
     Contact form
     ====================================================================== */
  function initContactForm() {
    var form = $("#contact-form");
    if (!form) return;
    var status = $(".form__status", form), submit = $("button[type=submit]", form);

    function fieldError(input) {
      var v = input.value.trim();
      if (input.required && !v) return "This field is required.";
      if (input.type === "email" && v && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return "Please enter a valid email address.";
      if (input.type === "tel" && v && v.replace(/[^\d]/g, "").length < 8) return "Please enter a valid phone number.";
      return "";
    }
    function show(input, msg) {
      var wrap = input.closest(".field");
      wrap.classList.toggle("is-invalid", !!msg);
      input.setAttribute("aria-invalid", msg ? "true" : "false");
      $(".field__error", wrap).textContent = msg;
    }

    $$("input, textarea", form).forEach(function (input) {
      input.addEventListener("blur", function () { if (input.value) show(input, fieldError(input)); });
      input.addEventListener("input", function () {
        input.closest(".field").classList.toggle("has-value", !!input.value);
        if (input.closest(".field").classList.contains("is-invalid")) show(input, fieldError(input));
      });
    });

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var first = null;
      $$("input, textarea", form).forEach(function (input) {
        var msg = fieldError(input);
        show(input, msg);
        if (msg && !first) first = input;
      });
      if (first) { first.focus(); return; }

      form.classList.add("is-loading");
      submit.disabled = true;
      status.className = "form__status";
      status.textContent = "";

      var endpoint = form.dataset.endpoint;
      var isLocal = /^(localhost|127\.0\.0\.1)$/.test(location.hostname) || location.protocol === "file:";
      var send = endpoint
        ? fetch(endpoint, { method: "POST", body: new FormData(form), headers: { Accept: "application/json" } })
            .then(function (r) { if (!r.ok) throw new Error(r.status); })
        : isLocal
          ? new Promise(function (res) { setTimeout(res, 900); })   // local preview only
          : Promise.reject(new Error("No form endpoint configured"));

      send.then(function () {
        form.reset();
        $$(".field", form).forEach(function (f) { f.classList.remove("has-value"); });
        form.classList.add("is-sent");
        status.className = "form__status is-success";
        status.textContent = "Thank you — your enquiry has been received. One of our team will contact you shortly.";
      }).catch(function () {
        status.className = "form__status is-error";
        status.textContent = "Sorry, your enquiry could not be sent. Please try again.";
      }).then(function () {
        form.classList.remove("is-loading");
        submit.disabled = false;
        status.focus();
      });
    });
  }
})();
