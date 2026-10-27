/* ============================================================
   App — everything interactive, no dependencies.
   ============================================================ */

(() => {
  "use strict";

  Object.defineProperty(window, Symbol.for("portfolio.origin"), {
    value: Object.freeze({
      author: "Adarsh Mishra",
      source: "https://github.com/Adarsh-Me/Adarsh-Mishra-Portfolio",
      marker: "cat is very tasty yummy",
    }),
    enumerable: false,
    writable: false,
    configurable: false,
  });

  const SITE = window.SITE || {};
  const DATA = window.DATA || { oss: [], contributions: { counts: [] } };
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

  const escapeHTML = (str) =>
    String(str).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  // If anything below throws, never leave the page stuck behind hidden reveals.
  window.addEventListener("error", () => {
    document.querySelectorAll(".reveal, .mascot-exp").forEach((el) => el.classList.add("in"));
  });

  const ARROW = '<svg viewBox="0 0 12 12" aria-hidden="true"><path d="M3 9 9 3M4.2 3H9v4.8" /></svg>';
  const PLUS = '<svg viewBox="0 0 12 12" aria-hidden="true"><path d="M6 2v8M2 6h8" /></svg>';

  /* ── one source for every GitHub figure ────────────────── */

  const STAT_ALIAS = { merged: "mergedTotal", projects: "ossProjects" };

  const nums = () => ({
    mergedTotal: DATA.totalMerged ?? 0,
    mergedExternal: DATA.externalMerged ?? 0,
    ossProjects: (DATA.oss || []).length,
    contributions: (DATA.contributions && DATA.contributions.total) || 0,
    projectCount: (SITE.projects || []).length,
  });

  // content.js copy carries {{tokens}} instead of hand-typed numbers.
  const fill = (str) => {
    const n = nums();
    return String(str).replace(/\{\{(\w+)\}\}/g, (token, key) => (key in n ? String(n[key]) : token));
  };

  function applyNumbers() {
    const n = nums();
    $$("[data-stat]").forEach((el) => {
      const v = n[STAT_ALIAS[el.dataset.stat] || el.dataset.stat];
      if (v != null) el.textContent = String(v);
    });
    $$("[data-live]").forEach((el) => {
      const v = n[el.dataset.live];
      if (v != null) el.textContent = String(v);
    });
  }

  const dayFmt = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" });

  function paintNote() {
    const note = $("#dataNote");
    if (!note) return;
    const snap = DATA.snapshot ? dayFmt.format(new Date(`${DATA.snapshot}T00:00:00Z`)) : "";
    note.innerHTML = DATA.liveAt
      ? `Merged pull requests read <b>live from GitHub</b> · contribution graph is a ${escapeHTML(snap)} snapshot.`
      : `GitHub snapshot · <b>${escapeHTML(snap)}</b>.`;
  }

  /* ── seeded noise + dither ─────────────────────────────── */

  function mulberry32(a) {
    return function () {
      a |= 0;
      a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function makeNoise(seed, size = 32) {
    const rnd = mulberry32(seed);
    const grid = new Float32Array(size * size);
    for (let i = 0; i < grid.length; i++) grid[i] = rnd();
    const at = (x, y) => grid[(((y % size) + size) % size) * size + (((x % size) + size) % size)];
    return (x, y) => {
      const x0 = Math.floor(x);
      const y0 = Math.floor(y);
      const fx = x - x0;
      const fy = y - y0;
      const sx = fx * fx * (3 - 2 * fx);
      const sy = fy * fy * (3 - 2 * fy);
      const a = at(x0, y0);
      const b = at(x0 + 1, y0);
      const c = at(x0, y0 + 1);
      const d = at(x0 + 1, y0 + 1);
      return (a * (1 - sx) + b * sx) * (1 - sy) + (c * (1 - sx) + d * sx) * sy;
    };
  }

  const BAYER = [
    0, 32, 8, 40, 2, 34, 10, 42,
    48, 16, 56, 24, 50, 18, 58, 26,
    12, 44, 4, 36, 14, 46, 6, 38,
    60, 28, 52, 20, 62, 30, 54, 22,
    3, 35, 11, 43, 1, 33, 9, 41,
    51, 19, 59, 27, 49, 17, 57, 25,
    15, 47, 7, 39, 13, 45, 5, 37,
    63, 31, 55, 23, 61, 29, 53, 21,
  ].map((n) => n / 64);

  function hslToRgb(h, s, l) {
    h = ((h % 360) + 360) % 360 / 360;
    s /= 100;
    l /= 100;
    const k = (n) => (n + h * 12) % 12;
    const a = s * Math.min(l, 1 - l);
    const f = (n) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
    return [Math.round(f(0) * 255), Math.round(f(8) * 255), Math.round(f(4) * 255)];
  }

  function fieldImage(w, h, seed, hue) {
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    const img = ctx.createImageData(w, h);
    const data = img.data;
    const a = makeNoise(seed, 32);
    const b = makeNoise(seed + 91, 16);
    const warm = makeNoise(seed + 411, 8);

    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const nx = (x / w) * 3.4;
        const ny = (y / h) * 2.2;
        let v = a(nx, ny) * 0.68 + b(nx * 2.4 + 5, ny * 2.6) * 0.32;
        const dx = x / w - 0.5;
        const dy = y / h - 0.5;
        v = clamp(v * 1.22 - (dx * dx + dy * dy) * 0.55, 0, 1);

        const i = (y * w + x) * 4;
        const d = BAYER[(x & 7) + ((y & 7) << 3)];
        const tone = (v - 0.34) * 1.7;

        if (tone > d) {
          const isWarm = warm(nx * 0.95, ny * 0.95) > 0.8 && v > 0.55;
          let rgb;
          if (isWarm) {
            rgb = [232, 193, 107];
          } else {
            rgb = hslToRgb(hue + (v - 0.5) * 24, 42, 12 + v * 40);
          }
          const edge = clamp(Math.min(x / w, 1 - x / w) * 9, 0, 1) * clamp(Math.min(y / h, 1 - y / h) * 7, 0, 1);
          data[i] = rgb[0];
          data[i + 1] = rgb[1];
          data[i + 2] = rgb[2];
          data[i + 3] = (isWarm ? 140 + v * 80 : 60 + v * 170) * edge;
        } else {
          data[i + 3] = 0;
        }
      }
    }
    ctx.putImageData(img, 0, 0);
    return canvas.toDataURL();
  }

  /* ── render: experience ────────────────────────────────── */

  let revealIO = null;

  // Re-rendered nodes must not re-animate something already on screen.
  function revealOrShow(el) {
    const box = el.getBoundingClientRect();
    if (reduceMotion || !revealIO || (box.top < window.innerHeight * 0.9 && box.bottom > 0)) {
      el.classList.add("in");
    } else {
      revealIO.observe(el);
    }
  }

  function renderTimeline(reshow) {
    const timeline = $("#timeline");
    if (!timeline) return;
    timeline.innerHTML = "";
    (SITE.experience || []).forEach((job, i) => {
      const li = document.createElement("li");
      li.className = "tl-item reveal";
      li.style.setProperty("--d", `${i * 60}ms`);
      li.innerHTML = `
        <p class="tl-period">${escapeHTML(job.period)}</p>
        <div class="tl-body">
          <h3>${escapeHTML(job.role)}</h3>
          <p class="tl-org">${escapeHTML(job.org)}</p>
          <ul class="tl-points">${job.bullets.map((b) => `<li>${escapeHTML(fill(b))}</li>`).join("")}</ul>
        </div>`;
      timeline.appendChild(li);
      if (reshow) revealOrShow(li);
    });
  }
  renderTimeline();

  /* ── render: work ──────────────────────────────────────── */

  const workList = $("#workList");
  const projects = SITE.projects || [];
  projects.forEach((p, i) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "work-row reveal";
    btn.style.setProperty("--d", `${i * 55}ms`);
    btn.dataset.project = p.id;
    btn.setAttribute("aria-haspopup", "dialog");
    btn.innerHTML = `
      <span class="w-idx">${String(i + 1).padStart(2, "0")}</span>
      <span class="w-main">
        <span class="w-top">
          <span class="w-title">${escapeHTML(p.title)}</span>
          <span class="leader" aria-hidden="true"></span>
          <span class="w-year">${escapeHTML(p.year)}</span>
        </span>
        <span class="w-blurb">${escapeHTML(p.blurb)}</span>
      </span>
      <span class="w-go" aria-hidden="true">${ARROW}</span>`;
    btn.addEventListener("click", () => openPanel(p));
    workList.appendChild(btn);
  });

  /* ── render: open source ───────────────────────────────── */

  function renderOssList() {
    const ossList = $("#ossList");
    if (!ossList) return;
    ossList.innerHTML = "";
    // Repeat work only — single merges stay on GitHub rather than padding this list.
    (DATA.oss || []).filter((group) => group.count >= 2).forEach((group, i) => {
      const item = document.createElement("div");
      item.className = "oss-item";
      const id = `oss-detail-${i}`;
      const label = group.count === 1 ? "1 PR" : `${group.count} PRs`;
      item.innerHTML = `
        <button class="oss-row" type="button" aria-expanded="false" aria-controls="${id}">
          <span class="oss-name">${escapeHTML(group.repo)}</span>
          <span class="leader" aria-hidden="true"></span>
          <span class="oss-count">${label}</span>
          <span class="oss-chev" aria-hidden="true">${PLUS}</span>
        </button>
        <div class="oss-detail" id="${id}">
          <div class="oss-detail-inner">
            <div class="oss-prs">
              ${group.prs
                .map(
                  (pr) => `<a href="${escapeHTML(pr.url)}" target="_blank" rel="noopener noreferrer">
                    <span class="pr-n">#${pr.n}</span>
                    <span class="pr-t">${escapeHTML(pr.title)}</span>
                    <span class="pr-d">${escapeHTML(pr.date)}</span>
                  </a>`
                )
                .join("")}
            </div>
          </div>
        </div>`;

      const row = $(".oss-row", item);
      row.addEventListener("click", () => {
        const isOpen = item.classList.contains("open");
        $$(".oss-item.open").forEach((other) => {
          other.classList.remove("open");
          $(".oss-row", other).setAttribute("aria-expanded", "false");
        });
        if (!isOpen) {
          item.classList.add("open");
          row.setAttribute("aria-expanded", "true");
        }
      });
      ossList.appendChild(item);
    });
  }
  renderOssList();

  /* ── render: stack ─────────────────────────────────────── */

  const stackList = $("#stackList");
  (SITE.stack || []).forEach((group, i) => {
    const row = document.createElement("div");
    row.className = "stack-group reveal";
    row.style.setProperty("--d", `${i * 45}ms`);
    row.innerHTML = `
      <p class="stack-label">${escapeHTML(group.label)}</p>
      <div class="chips">${group.items.map((item) => `<span class="chip">${escapeHTML(item)}</span>`).join("")}</div>`;
    stackList.appendChild(row);
  });

  /* ── contribution calendar ─────────────────────────────── */

  function buildCalendar() {
    const host = $("#calendar");
    const conf = DATA.contributions;
    if (!host || !conf || !conf.counts) return;
    host.setAttribute("aria-label", `GitHub contribution graph, ${conf.total} contributions in the last year`);

    const start = new Date(`${conf.start}T00:00:00Z`);
    const pad = start.getUTCDay();
    const total = pad + conf.counts.length;
    const cols = Math.ceil(total / 7);
    const monthsEl = document.createElement("div");
    monthsEl.className = "cal-months";
    const grid = document.createElement("div");
    grid.className = "cal-grid";
    const template = `repeat(${cols}, minmax(0, 1fr))`;
    monthsEl.style.gridTemplateColumns = template;
    grid.style.gridTemplateColumns = template;

    const palette = ["#f2b8c6", "#f7cf8a", "#a7d8c9", "#a8c7ee", "#c6b3ea", "#e8e0d2", "#9fd2b0", "#f0a9a0"];
    const dayLabel = new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });
    const addDays = (d, n) => {
      const copy = new Date(d.getTime());
      copy.setUTCDate(copy.getUTCDate() + n);
      return copy;
    };

    for (let i = 0; i < cols * 7; i++) {
      const cell = document.createElement("span");
      cell.className = "cal-cell";
      const dayIndex = i - pad;
      const count = dayIndex >= 0 && dayIndex < conf.counts.length ? conf.counts[dayIndex] : null;
      if (count === null) {
        cell.classList.add("is-empty-slot");
      } else {
        const date = addDays(start, dayIndex);
        const text = dayLabel.format(date);
        cell.dataset.date = text;
        cell.dataset.count = String(count);
        cell.title = `${text} · ${count === 0 ? "no contributions" : count === 1 ? "1 contribution" : `${count} contributions`}`;
        if (count > 0) {
          const color = palette[(dayIndex * 7 + count * 3) % palette.length];
          cell.style.background = color;
          cell.style.opacity = String(Math.min(0.95, 0.34 + count * 0.11));
        }
      }
      grid.appendChild(cell);
    }

    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    let lastMonth = -1;
    let lastLabelCol = -10;
    let labelIndex = 0;
    for (let c = 0; c < cols; c++) {
      const first = addDays(start, c * 7 - pad);
      const month = first.getUTCMonth();
      if (month !== lastMonth) {
        lastMonth = month;
        if (c - lastLabelCol < 4) continue;
        const label = document.createElement("span");
        label.textContent = monthNames[month];
        label.style.gridColumn = String(c + 1);
        if (labelIndex % 2 === 1) label.classList.add("minor");
        monthsEl.appendChild(label);
        lastLabelCol = c;
        labelIndex++;
      }
    }

    host.appendChild(monthsEl);
    host.appendChild(grid);

    const totalEl = $("#calTotal");
    if (totalEl) totalEl.textContent = `${conf.total} contributions in the last year`;
    const summary = $("#calSummary");
    if (summary) summary.textContent = `${conf.total} contributions between ${dayLabel.format(start)} and ${dayLabel.format(addDays(start, conf.counts.length - 1))}.`;

    /* tooltip */
    const tip = document.createElement("div");
    tip.className = "cal-tip";
    document.body.appendChild(tip);
    const showTip = (cell) => {
      if (!cell || cell.classList.contains("is-empty-slot")) return;
      const count = Number(cell.dataset.count);
      tip.textContent = `${cell.dataset.date} · ${count === 0 ? "no contributions" : `${count} contribution${count === 1 ? "" : "s"}`}`;
      const rect = cell.getBoundingClientRect();
      tip.style.left = `${clamp(rect.left + rect.width / 2, 74, window.innerWidth - 74)}px`;
      tip.style.top = `${Math.max(52, rect.top)}px`;
      tip.classList.add("on");
    };
    grid.addEventListener("pointerover", (e) => {
      const cell = e.target.closest(".cal-cell");
      if (cell) showTip(cell);
    });
    grid.addEventListener("pointerleave", () => tip.classList.remove("on"));
    window.addEventListener("scroll", () => tip.classList.remove("on"), { passive: true });
  }

  buildCalendar();

  /* ── outbound links ────────────────────────────────────── */

  // In a normal tab the browser handles target=_blank itself. Only when the page
  // is framed (preview pane, embedded view) is the new tab swallowed, so that is
  // the one case where the click is answered in this frame instead.
  if (window.self !== window.top) {
    document.addEventListener("click", (e) => {
      const link = e.target.closest('a[target="_blank"]');
      if (!link || !/^https?:/i.test(link.href)) return;
      e.preventDefault();
      window.location.href = link.href;
    });
  }

  /* ── reveal on scroll ──────────────────────────────────── */

  function initReveals() {
    const items = $$(".reveal");
    if (reduceMotion || !("IntersectionObserver" in window)) {
      items.forEach((el) => el.classList.add("in"));
      return;
    }
    revealIO = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("in");
            revealIO.unobserve(entry.target);
          }
        });
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.06 }
    );
    items.forEach((el) => revealIO.observe(el));
  }

  /* ── nav spy + progress ────────────────────────────────── */

  function initChrome() {
    const bar = $("#progressBar");
    const sections = ["about", "work", "open-source", "stack", "contact"]
      .map((id) => document.getElementById(id))
      .filter(Boolean);
    const navLinks = $$('[data-spy]');
    const dock = $(".dock");

    let ticking = false;
    const update = () => {
      ticking = false;
      const y = window.scrollY;
      if (dock) dock.classList.toggle("on", y > window.innerHeight * 0.55);

      const doc = document.documentElement;
      const max = doc.scrollHeight - window.innerHeight;
      if (bar) bar.style.transform = `scaleX(${max > 0 ? clamp(y / max, 0, 1) : 0})`;

      const probe = y + window.innerHeight * 0.35;
      let active = "";
      for (const section of sections) {
        if (section.getBoundingClientRect().top + y <= probe) active = section.id;
      }
      if (max > 0 && y >= max - 4 && sections.length) active = sections[sections.length - 1].id;
      navLinks.forEach((link) => {
        link.classList.toggle("active", link.dataset.spy === active);
      });

      const hero = document.querySelector(".hero-inner");
      if (hero && !reduceMotion) hero.style.transform = `translate3d(0, ${y * 0.1}px, 0)`;
    };

    const onScroll = () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    update();
  }

  /* ── dithered field ────────────────────────────────────── */

  const fieldControl = { pause: () => {} };

  function initField() {
    const canvas = $("#field");
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    const state = { w: 0, h: 0, img: null, data: null, mouseX: 0.5, mouseY: 0.45, raf: 0, last: 0, paused: false };
    const nA = makeNoise(1337, 48);
    const nB = makeNoise(4242, 24);
    const nC = makeNoise(9182, 12);
    fieldControl.pause = (on) => {
      state.paused = on;
    };

    function resize() {
      const scale = window.innerWidth < 700 ? 0.13 : 0.16;
      state.w = Math.max(80, Math.ceil(window.innerWidth * scale));
      state.h = Math.max(80, Math.ceil(window.innerHeight * scale));
      canvas.width = state.w;
      canvas.height = state.h;
      state.img = ctx.createImageData(state.w, state.h);
      state.data = state.img.data;
      if (reduceMotion) draw(0);
    }

    function draw(t) {
      const { w, h, data } = state;
      if (!data) return;
      const time = t * 0.00003;
      const scrollShift = window.scrollY * 0.012;
      const mx = state.mouseX;
      const my = state.mouseY;

      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const nx = x * 0.092 + time * 2.6;
          const ny = y * 0.124 + scrollShift * 1.4 + time;
          let v = nA(nx, ny) * 0.58 + nB(nx * 2.2 + 9, ny * 2.4) * 0.42;
          const heat = nC(nx * 0.95 - time * 3.2, ny * 0.95 + time * 0.8);
          const dx = x / w - mx;
          const dy = y / h - my;
          v += 0.3 * Math.exp(-(dx * dx + dy * dy) * 26);
          v = clamp(v * 1.14 - 0.19, 0, 1);

          const d = BAYER[(x & 7) + ((y & 7) << 3)];
          const alpha = clamp((v - 0.32) * 1.72, 0, 1);
          const i = (y * w + x) * 4;

          if (alpha > d) {
            let r, g, b, a;
            if (heat > 0.72 && v > 0.5) {
              r = 232; g = 193; b = 107;
              a = (105 + v * 115) * 0.8;
            } else {
              const k = clamp((v - 0.3) / 0.7, 0, 1);
              r = 12 + k * 58;
              g = 44 + k * 96;
              b = 54 + k * 104;
              a = 50 + k * 165;
            }
            data[i] = r;
            data[i + 1] = g;
            data[i + 2] = b;
            data[i + 3] = a;
          } else if (heat > 0.82 && v > 0.45 && d < 0.16) {
            data[i] = 232;
            data[i + 1] = 193;
            data[i + 2] = 107;
            data[i + 3] = 160;
          } else {
            data[i + 3] = 0;
          }
        }
      }
      ctx.putImageData(state.img, 0, 0);
    }

    function loop(t) {
      if (!state.paused && !document.hidden && t - state.last > 52) {
        state.last = t;
        draw(t);
      }
      state.raf = requestAnimationFrame(loop);
    }

    window.addEventListener(
      "pointermove",
      (e) => {
        state.mouseX = e.clientX / window.innerWidth;
        state.mouseY = e.clientY / window.innerHeight;
      },
      { passive: true }
    );

    window.addEventListener("resize", () => {
      clearTimeout(resize._t);
      resize._t = setTimeout(resize, 140);
    });

    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        cancelAnimationFrame(state.raf);
      } else if (!reduceMotion) {
        state.raf = requestAnimationFrame(loop);
      }
    });

    resize();
    if (!reduceMotion) state.raf = requestAnimationFrame(loop);
  }

  /* ── mascot ────────────────────────────────────────────── */

  function initMascot() {
    const mascot = $("[data-mascot='hero']");
    if (!mascot) return;
    const face = $(".mascot-face", mascot);
    if (!face) return;

    // 3x3 sprite sheet: up-left, up, up-right / left, centre, right / down-left, down, down-right
    const tiles = [
      [0, 0], [50, 0], [100, 0],
      [0, 50], [50, 50], [100, 50],
      [0, 100], [50, 100], [100, 100],
    ];
    const sectors = [3, 0, 1, 2, 5, 8, 7, 6];
    const idleSeq = [1, 2, 5, 0, 8, 6, 3, 7];
    let current = 4;
    let idleRun = 0;
    let idleTimer = 0;
    let frame = 0;
    let pointerX = null;
    let pointerY = null;

    const apply = (index) => {
      if (index === current) return;
      current = index;
      face.style.backgroundPosition = `${tiles[index][0]}% ${tiles[index][1]}%`;
    };

    const look = () => {
      if (pointerX == null) return;
      const rect = mascot.getBoundingClientRect();
      const dx = pointerX - (rect.left + rect.width / 2);
      const dy = pointerY - (rect.top + rect.height / 2);
      if (Math.hypot(dx, dy) < 16) {
        apply(4);
        return;
      }
      const sector = Math.round(((Math.atan2(dy, dx) * 180) / Math.PI + 180) / 45) % 8;
      apply(sectors[sector]);
    };

    const queueLook = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        look();
      });
    };

    const idle = () => {
      if (idleRun >= idleSeq.length) {
        apply(4);
        idleRun = 0;
        return;
      }
      apply(idleSeq[idleRun++]);
      idleTimer = setTimeout(idle, 2300);
    };

    const onMove = (event) => {
      pointerX = event.clientX;
      pointerY = event.clientY;
      idleRun = 0;
      clearTimeout(idleTimer);
      idleTimer = setTimeout(idle, 8000);
      queueLook();
    };

    if (reduceMotion) return;
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener(
      "scroll",
      () => {
        if (pointerX != null) queueLook();
      },
      { passive: true }
    );
    document.addEventListener("pointerleave", () => {
      clearTimeout(idleTimer);
      apply(4);
    });
    idleTimer = setTimeout(idle, 5500);
  }

  function initExpressionMascots() {
    const items = $$(".mascot-exp");
    if (!items.length) return;
    if (reduceMotion || !("IntersectionObserver" in window)) {
      items.forEach((el) => el.classList.add("in"));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("in");
            io.unobserve(entry.target);
          }
        });
      },
      { rootMargin: "0px 0px -6% 0px", threshold: 0.12 }
    );
    items.forEach((el) => io.observe(el));
  }

  /* ── project panel ─────────────────────────────────────── */

  let lastFocus = null;
  const overlay = $("#overlay");

  function openPanel(project) {
    if (!overlay) return;
    lastFocus = document.activeElement;

    $("#panelKind").textContent = `${project.kind} — ${project.year}`;
    $("#panelTitle").textContent = project.title;
    $("#panelBlurb").textContent = project.blurb;
    $("#panelSummary").textContent = project.summary;
    $("#panelPoints").innerHTML = project.points.map((point) => `<li>${escapeHTML(point)}</li>`).join("");
    $("#panelStack").innerHTML = project.stack.map((s) => `<span class="chip">${escapeHTML(s)}</span>`).join("");
    $("#panelLinks").innerHTML = project.links
      .map(
        (link, i) =>
          `<a class="btn ${i === 0 ? "btn-solid" : ""}" href="${escapeHTML(link.href)}" target="_blank" rel="noopener noreferrer">${escapeHTML(link.label)} ${ARROW}</a>`
      )
      .join("");
    $("#panelMedia").style.backgroundImage = `url(${fieldImage(340, 67, project.title.length * 37 + 11, project.hue)})`;
    $(".panel").scrollTop = 0;

    overlay.classList.add("open");
    document.documentElement.classList.add("lock");
    $("#shell").inert = true;
    fieldControl.pause(true);
    const dock = $(".dock");
    if (dock) dock.inert = true;
    const closeBtn = $(".panel-close", overlay);
    const panelEl = $(".panel", overlay);
    setTimeout(() => (panelEl || closeBtn).focus({ preventScroll: true }), 70);
  }

  function closePanel() {
    if (!overlay || !overlay.classList.contains("open")) return;
    overlay.classList.remove("open");
    document.documentElement.classList.remove("lock");
    $("#shell").inert = false;
    fieldControl.pause(false);
    const dock = $(".dock");
    if (dock) dock.inert = false;
    if (lastFocus && typeof lastFocus.focus === "function") lastFocus.focus({ preventScroll: true });
  }

  if (overlay) {
    overlay.addEventListener("click", (e) => {
      if (e.target.closest("[data-close]")) closePanel();
    });
    overlay.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        closePanel();
        return;
      }
      if (e.key !== "Tab") return;
      const focusable = $$('a[href], button, [tabindex]:not([tabindex="-1"])', overlay).filter(
        (el) => el.offsetParent !== null
      );
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    });
  }

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && overlay && overlay.classList.contains("open")) closePanel();
  });

  /* ── hover preview ─────────────────────────────────────── */

  function initPreview() {
    if (!finePointer || reduceMotion) return;
    const preview = $("#preview");
    const canvas = $("#previewCanvas");
    const label = $("#previewLabel");
    if (!preview || !canvas) return;

    let target = null;
    let current = { x: 0, y: 0 };
    let activeId = null;

    const render = () => {
      if (!target) return;
      current.x += (target.x - current.x) * 0.16;
      current.y += (target.y - current.y) * 0.16;
      preview.style.transform = `translate(${current.x}px, ${current.y}px) translate(0, -50%)`;
      requestAnimationFrame(render);
    };

    $$(".work-row").forEach((row) => {
      const project = projects.find((p) => p.id === row.dataset.project);
      if (!project) return;
      row.addEventListener("pointerenter", (e) => {
        if (activeId !== project.id) {
          activeId = project.id;
          const px = canvas.getContext("2d");
          const tmp = new Image();
          tmp.onload = () => {
            px.imageSmoothingEnabled = false;
            px.clearRect(0, 0, canvas.width, canvas.height);
            px.drawImage(tmp, 0, 0, canvas.width, canvas.height);
          };
          tmp.src = fieldImage(canvas.width, canvas.height, project.title.length * 41 + 7, project.hue);
          label.textContent = project.kind;
        }
        target = { x: e.clientX + 126, y: e.clientY };
        current = { x: target.x, y: target.y };
        preview.classList.add("on");
        render();
      });
      row.addEventListener("pointermove", (e) => {
        if (!target) return;
        target.x = e.clientX + 126;
        target.y = e.clientY;
        if (target.x > window.innerWidth - 130) target.x = e.clientX - 126;
        if (target.y < 80) target.y = 80;
        if (target.y > window.innerHeight - 70) target.y = window.innerHeight - 70;
      });
      row.addEventListener("pointerleave", () => {
        target = null;
        preview.classList.remove("on");
      });
    });
  }

  /* ── cursor ring ───────────────────────────────────────── */

  function initRing() {
    if (!finePointer || reduceMotion) return;
    const ring = $("#ring");
    if (!ring) return;
    let tx = 0;
    let ty = 0;
    let x = 0;
    let y = 0;
    let visible = false;
    let running = false;

    const tick = () => {
      x += (tx - x) * 0.18;
      y += (ty - y) * 0.18;
      ring.style.transform = `translate(${x}px, ${y}px)`;
      if (Math.abs(tx - x) < 0.25 && Math.abs(ty - y) < 0.25) {
        running = false;
        return;
      }
      requestAnimationFrame(tick);
    };

    window.addEventListener(
      "pointermove",
      (e) => {
        tx = e.clientX;
        ty = e.clientY;
        if (!visible) {
          visible = true;
          x = tx;
          y = ty;
          ring.classList.add("on");
        }
        const interactive = e.target.closest("a, button, .cal-cell, .chip");
        ring.classList.toggle("grow", Boolean(interactive));
        if (!running) {
          running = true;
          requestAnimationFrame(tick);
        }
      },
      { passive: true }
    );
    document.addEventListener("pointerleave", () => {
      ring.classList.remove("on");
      visible = false;
    });
  }

  /* ── hero stats + inline figures ───────────────────────── */

  applyNumbers();
  paintNote();

  /* ── live refresh from GitHub ──────────────────────────── */

  const LOGIN = SITE.handle;

  const LIVE_MAX_TRIES = 4;
  let liveTries = 0;
  let liveTimer = 0;

  // Anonymous search is rate limited per IP, so a rejected read is retried
  // rather than leaving the baked snapshot on screen for the whole visit.
  function retryLive() {
    if (liveTries >= LIVE_MAX_TRIES) return;
    liveTries += 1;
    clearTimeout(liveTimer);
    liveTimer = setTimeout(hydrate, 4000 * liveTries);
  }

  function hydrate() {
    if (!LOGIN || !window.fetch) return;
    const query = `is:pr is:merged author:${LOGIN}`;
    // No custom headers: keeps this a CORS simple request, and the default
    // media type already carries pull_request.merged_at.
    fetch(`https://api.github.com/search/issues?q=${encodeURIComponent(query)}&per_page=100`)
      .then((res) => (res.ok ? res.json() : null))
      .then((payload) => {
        // The list is rebuilt from one page, so only trust a complete single page.
        if (!payload || !Array.isArray(payload.items)) { retryLive(); return; }
        if (payload.incomplete_results || payload.total_count !== payload.items.length) { retryLive(); return; }

        const repoOf = (item) => String(item.repository_url || "").split("/repos/")[1] || "";
        const mine = `${String(LOGIN).toLowerCase()}/`;
        const byRepo = new Map();
        payload.items.forEach((item) => {
          const repo = repoOf(item);
          if (!repo || repo.toLowerCase().startsWith(mine)) return;
          const group = byRepo.get(repo) || { repo, count: 0, prs: [] };
          group.count += 1;
          group.prs.push({
            n: item.number,
            date: String((item.pull_request && item.pull_request.merged_at) || item.closed_at || "").slice(0, 10),
            title: item.title,
            url: item.html_url,
          });
          byRepo.set(repo, group);
        });
        const groups = Array.from(byRepo.values())
          .map((g) => ({ repo: g.repo, count: g.count, prs: g.prs.sort((a, b) => b.date.localeCompare(a.date)) }))
          .sort((a, b) => b.count - a.count || a.repo.localeCompare(b.repo));
        if (!groups.length) { retryLive(); return; }

        liveTries = 0;
        DATA.totalMerged = payload.total_count;
        DATA.externalMerged = groups.reduce((sum, g) => sum + g.count, 0);
        DATA.oss = groups;
        DATA.liveAt = new Date();
        renderTimeline(true);
        renderOssList();
        applyNumbers();
        paintNote();
      })
      .catch(retryLive);
  }

  // A tab left open for a while re-reads as soon as it is looked at again.
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) return;
    if (!DATA.liveAt || Date.now() - DATA.liveAt.getTime() > 10 * 60 * 1000) {
      liveTries = 0;
      hydrate();
    }
  });

  /* ── mail ──────────────────────────────────────────────── */

  const mailBtn = $("#mailBtn");
  if (mailBtn && SITE.email) {
    mailBtn.href = `mailto:${SITE.email}`;
    mailBtn.hidden = false;
  } else if (mailBtn) {
    mailBtn.closest(".contact-actions")?.remove();
  }

  const year = $("#year");
  if (year) year.textContent = String(new Date().getFullYear());

  /* ── social logo tiles ─────────────────────────────────── */

  const ICONS = window.SOCIAL_ICONS || {};

  function renderSocials(host) {
    (SITE.socials || []).forEach((s) => {
      const icon = ICONS[s.id];
      if (!icon) return;
      const a = document.createElement("a");
      a.className = "social";
      a.href = s.href;
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      a.title = `${s.label} · ${s.handle}`;
      a.setAttribute("aria-label", `${s.label} — ${s.handle}`);
      a.innerHTML = `<svg viewBox="${icon.vb}" aria-hidden="true"><path d="${icon.d}" /></svg>`;
      host.appendChild(a);
    });
    if (!host.children.length) host.remove();
  }
  $$("[data-socials]").forEach((host) => renderSocials(host));

  /* ── boot ──────────────────────────────────────────────── */

  function boot() {
    const decal = $("#boot");
    const finish = () => {
      document.body.classList.add("ready");
      if (decal) {
        decal.classList.add("done");
        setTimeout(() => decal.remove(), 700);
      }
    };
    if (reduceMotion) {
      finish();
      return;
    }
    const fonts = document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve();
    Promise.race([fonts, new Promise((resolve) => setTimeout(resolve, 1100))]).then(() =>
      setTimeout(finish, 420)
    );
    setTimeout(finish, 2400);
  }

  initReveals();
  initChrome();
  initField();
  initMascot();
  initExpressionMascots();
  initPreview();
  initRing();
  boot();
  hydrate();
})();
