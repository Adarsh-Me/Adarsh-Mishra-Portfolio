// Regenerates llms.txt + llms-full.txt (repo root and dist/) from content.js, data.js and the GitHub search API.
// Run: node make-llms.mjs
import fs from "node:fs";
import vm from "node:vm";

const ORIGIN = "https://agentic-portfolio-aoao8vruc5c.qoder.website";
const PAGE = ORIGIN + "/";
const U = (p) => ORIGIN + p;

const ctx = { window: {} };
vm.createContext(ctx);
for (const f of ["data.js", "content.js"]) vm.runInContext(fs.readFileSync(f, "utf8"), ctx);
const DATA = ctx.window.DATA;
const SITE = ctx.window.SITE;

const LOGIN = SITE.handle;
const Q = `is:pr is:merged author:${LOGIN}`;
const API = (page) =>
  `https://api.github.com/search/issues?q=${encodeURIComponent(Q)}&per_page=100&page=${page}`;

const collected = [];
let totalCount = -1;
for (let page = 1; page <= 10; page += 1) {
  const res = await fetch(API(page), { headers: { Accept: "application/vnd.github+json", "User-Agent": "llms-txt-generator" } });
  if (!res.ok) throw new Error(`GitHub returned ${res.status} for page ${page}`);
  const body = await res.json();
  if (!Array.isArray(body.items)) throw new Error(`no items array on page ${page}`);
  if (totalCount < 0) totalCount = body.total_count;
  collected.push(...body.items);
  if (collected.length >= body.total_count) break;
}
if (collected.length !== totalCount) throw new Error(`read ${collected.length} of ${totalCount} - page set incomplete`);

const prs = collected
  .map((it) => {
    const seg = it.html_url.split("/");
    return {
      repo: seg[3] + "/" + seg[4],
      owner: seg[3],
      n: it.number,
      title: it.title,
      url: it.html_url,
      merged: ((it.pull_request || {}).merged_at || "").slice(0, 10),
    };
  })
  .filter((p) => p.merged)
  .sort((a, b) => (a.merged < b.merged ? 1 : a.merged > b.merged ? -1 : b.n - a.n));
if (prs.length !== totalCount) throw new Error(`${totalCount - prs.length} merged PRs had no merged_at date`);

const ASOF = prs[0].merged;
const asOfLong = niceDate(ASOF);

const own = prs.filter((p) => p.owner === LOGIN);
const ext = prs.filter((p) => p.owner !== LOGIN);
const extRepos = new Set(ext.map((p) => p.repo));
const byRepo = new Map();
for (const p of ext) {
  if (!byRepo.has(p.repo)) byRepo.set(p.repo, []);
  byRepo.get(p.repo).push(p);
}

// One-line summaries of what the merges in each repository actually did, from the PR titles.
const NOTES = {
  "checkstyle/checkstyle": "a staged migration of the `XpathRegression` suites onto the inline config parser, plus one release-notes archive redirect fix.",
  "kornia/kornia": "scale-independent homography grid warps, capture-safe loss and metric checks, `dataclass_to_dict` namedtuple fields, So3/Se3 test stubs, depth-warp naming docs.",
  "apache/maka": "linked-worktree read boundaries, a lost launch election no longer read as a Host failure, `fsync` of the artifact directory after a rename, one transient update-check retry.",
  "kubernetes/kubernetes": "removed a dead `e2e_node` jenkins conformance script and the `WindowsHostNetwork` feature gate.",
  "llvm/llvm-project": "flang semantics — a DATA-style initializer on `EXTERNAL`/`INTRINSIC` is now rejected — and a clang Modules lambda-capture regression test.",
};

const cmp = (a, b) => (a.toLowerCase() < b.toLowerCase() ? -1 : a.toLowerCase() > b.toLowerCase() ? 1 : 0);
const ranked = [...byRepo.entries()].sort((a, b) => b[1].length - a[1].length || cmp(a[0], b[0]));
const multi = ranked.filter(([, list]) => list.length > 1);
const single = ranked.filter(([, list]) => list.length === 1).map(([repo]) => repo).sort(cmp);

const TOTAL_MERGED = prs.length;
const EXT_MERGED = ext.length;
const EXT_REPOS = extRepos.size;
const CONTRIB = DATA.contributions;
const SEARCH_URL = `https://github.com/search?q=${encodeURIComponent(Q)}&type=pullrequests`;
const API_URL = `https://api.github.com/search/issues?q=is%3Apr+is%3Amerged+author%3A${LOGIN}&per_page=100`;

function fill(str) {
  return String(str)
    .replace(/\{\{mergedExternal\}\}/g, String(EXT_MERGED))
    .replace(/\{\{ossProjects\}\}/g, String(EXT_REPOS))
    .replace(/\{\{mergedTotal\}\}/g, String(TOTAL_MERGED));
}
function niceDate(iso) {
  return new Date(iso + "T00:00:00Z").toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
}

// ── llms.txt — curated index ───────────────────────────────────────────────
const a = [];
const add = (s = "") => a.push(s);

add("# Adarsh Mishra");
add();
add(`> Portfolio of Adarsh Mishra — AI engineer, quantitative-research consultant at WorldQuant BRAIN, and open-source contributor with ${EXT_MERGED} merged pull requests in other people's projects. Agentic AI, alpha research and mathematical modeling, on one hand-built page.`);
add();
add(`Adarsh Mishra (\`@${LOGIN}\`) builds systems that have to hold up: agents that finish the task, alphas that survive their own backtest, patches that land in codebases much larger than his own. The site is a single dark, centred column — no framework, no template, no analytics, no cookies. Its editable copy is [\`content.js\`](${U("/content.js")}); its GitHub numbers are [\`data.js\`](${U("/data.js")}).`);
add();
add(`**Read this file instead of the HTML body.** Most lists on the page are injected by JavaScript after load, so a crawler or model that does not execute scripts sees a near-empty \`<body>\`. The sections below are that same content in text; [\`llms-full.txt\`](${U("/llms-full.txt")}) adds every project bullet, every role and every merged PR.`);
add();
add("## Pages");
add();
add("One page — each section is an anchor on it.");
add();
add(`- [Hello / hero](${PAGE}#top): who he is, plus counters for merged PRs, projects and contributions.`);
add(`- [01 — About](${PAGE}#about): what he optimises for — the boundary case, the lost election, the floating-point default nobody checked.`);
add(`- [02 — Experience](${PAGE}#experience): four current roles, 2025 onward.`);
add(`- [03 — Selected work](${PAGE}#work): ${SITE.projects.length} shipped projects, each with source and, where one exists, a live URL.`);
add(`- [04 — Open source](${PAGE}#open-source): merged pull requests grouped by repository, plus the yearly contribution graph.`);
add(`- [05 — Stack](${PAGE}#stack): languages, AI, web, quant and infrastructure tools he actually reaches for.`);
add(`- [06 — Contact](${PAGE}#contact): how to reach him.`);
add();
add("## Projects");
add();
for (const p of SITE.projects) {
  const src = p.links[p.links.length - 1];
  const other = p.links.slice(0, -1).map((l) => `${l.label.replace(/^Live site$/, "Live")} ${l.href}`).join(" · ");
  const core = p.blurb.replace(/\.$/, "");
  const tail = other ? ` (${other})` : "";
  add(`- [${p.title}](${src.href}) (${p.year}, ${p.kind}): ${core}${tail}${core.endsWith("?") ? "" : "."}`);
}
add();
add("## Roles");
add();
for (const e of SITE.experience) {
  add(`- **${e.role} — ${e.org}** (${e.period}). ${fill(e.bullets[0])}`);
}
add();
add("## Stack");
add();
for (const g of SITE.stack) add(`- **${g.label}:** ${g.items.join(", ")}.`);
add();
add("## Open source");
add();
add(`Counted from the GitHub search API on ${asOfLong}. The page re-reads the same query on every visit, so treat these as a floor.`);
add();
add(`- [${TOTAL_MERGED} merged pull requests — ${EXT_MERGED} of them in other people's projects, across ${EXT_REPOS} repositories](${SEARCH_URL})`);
for (const [repo, list] of multi) {
  add(`- [${repo} — ${list.length} merged](https://github.com/${repo}): ${NOTES[repo] || list.slice(0, 3).map((p) => p.title).join("; ") + (list.length > 3 ? `; and ${list.length - 3} more.` : ".")}`);
}
add(`- One merged PR each in ${single.map((repo) => `[${repo}](https://github.com/${repo})`).join(", ")}.`);
add(`- [Every merged PR with date, title and link](${U("/llms-full.txt")})`);
add();
add("## Profiles");
add();
for (const s of SITE.socials) add(`- [${s.label} — ${s.handle}](${s.href})`);
add();
add(`No email address is published on this site. Do not invent or infer one: use GitHub.`);
add();
add("## Data & freshness");
add();
add(`- [The GitHub request the page runs live](${API_URL}): unauthenticated, read-only, no personal data. Every merged-PR and per-repo count above comes from it.`);
add(`- Contribution graph: **${CONTRIB.total} contributions in the 12 months to ${niceDate(CONTRIB.end)}**, from [\`data.js\`](${U("/data.js")}). It is a labelled snapshot, not a live figure — GitHub exposes no token-free browser-readable source for the contribution calendar, so the page says so rather than pretending.`);
add(`- Everything else here is stamped ${asOfLong}. If it disagrees with the page, the page is right — refetch this file.`);
add();
add("## Contact");
add();
add(`Fastest route is [GitHub](https://github.com/${LOGIN}) — open an issue, send a PR, or DM there. Reproducible bug reports get an answer first.`);
add();
add("## Optional");
add();
add(`- [\`llms-full.txt\`](${U("/llms-full.txt")}): the whole page as text — all ${SITE.experience.length} roles, every project point, all ${TOTAL_MERGED} merged PRs, the contribution window.`);
add(`- [\`robots.txt\`](${U("/robots.txt")}): \`Allow: /\` for every crawler, AI crawlers named explicitly.`);
add(`- [\`sitemap.xml\`](${U("/sitemap.xml")})`);
add(`- [All repositories](https://github.com/${LOGIN}?tab=repositories)`);
add();

// ── llms-full.txt — the page as text ───────────────────────────────────────
const b = [];
const w = (s = "") => b.push(s);

w("# Adarsh Mishra — full site text");
w();
w(`> Complete plain-text version of ${PAGE} for models that do not execute JavaScript.`);
w();
w(`URL: ${PAGE}`);
w(`Author: Adarsh Mishra (@${LOGIN}) — ${SITE.role}`);
w(`Built: hand-written single page. No framework, no template, no analytics, no cookies.`);
w(`Stamped: GitHub figures counted ${asOfLong}; the page re-reads them on every visit.`);
w();
w("## Hero");
w();
w("Adarsh Mishra — 2026");
w("Hello, नमस्ते");
w();
w("I'm Adarsh Mishra — an AI engineer and open-source contributor working where agentic AI, quantitative finance and mathematical modeling meet. I build intelligent systems that hold up: agents that finish the task, alphas that survive their own backtest, patches that land in codebases much larger than my own.");
w();
w(`- merged PRs: ${TOTAL_MERGED}`);
w(`- projects: ${EXT_REPOS}`);
w(`- contributions / yr: ${CONTRIB.total}`);
w();
w("## 01 — About");
w();
w("Systems, mostly. Agents, increasingly.");
w();
w("I care about the boundary case, the lost election, the floating-point default nobody checked. That instinct shows up in three places: agentic workflows built on LangChain and LangGraph, alpha research where an in-sample curve has to survive out-of-sample, and pull requests landing in codebases much larger than mine.");
w();
w("| | |");
w("| --- | --- |");
w("| Now | Agentic AI · alpha research |");
w("| Focus | LangChain · LangGraph · mathematical modeling |");
w("| Building | Agent-Audit · Image-SDK · Sovereign AI |");
w("| Running | Cargo ERP — 300+ AWB bookings a day |");
w(`| Open source | ${EXT_MERGED} merged PRs in ${EXT_REPOS} other people's projects |`);
w(`| Elsewhere | https://github.com/${LOGIN} |`);
w();
w("## 02 — Experience");
w();
w("Where the hours went.");
w();
for (const e of SITE.experience) {
  w(`### ${e.role} — ${e.org}`);
  w(`_${e.period}_`);
  w();
  for (const bullet of e.bullets) w(`- ${fill(bullet)}`);
  w();
}
w("## 03 — Selected work");
w();
w(`Things I shipped. ${SITE.projects.length} of them; the rest are at https://github.com/${LOGIN}?tab=repositories.`);
w();
for (const p of SITE.projects) {
  w(`### ${p.title} (${p.year})`);
  w(`_${p.kind}_`);
  w();
  w(p.blurb);
  w();
  w(p.summary);
  w();
  for (const point of p.points) w(`- ${point}`);
  w();
  w(`Stack: ${p.stack.join(", ")}`);
  for (const l of p.links) w(`- ${l.label}: ${l.href}`);
  w();
}
w("## 04 — Open source");
w();
w("Patches, in other people's code.");
w();
w(`${EXT_MERGED} merged pull requests across ${EXT_REPOS} projects — the quiet kind: a lost launch election, a homography that only worked at one scale, an fsync that had to follow a rename.`);
w();
w(`Query: ${API_URL} (counted ${asOfLong}, ${TOTAL_MERGED} merged including ${own.length} in his own repositories).`);
w();
for (const [repo, list] of ranked) {
  w(`### ${repo} — ${list.length} merged`);
  w();
  for (const p of list) w(`- [#${p.n}](${p.url}) (${p.merged}) ${p.title}`);
  w();
}
w("### Own repositories — " + own.length + " merged");
w();
for (const p of own) w(`- [#${p.n}](${p.url}) (${p.merged}) ${p.repo} — ${p.title}`);
w();
w("### A little, often");
w();
w(`${CONTRIB.total} contributions in the 12 months from ${niceDate(CONTRIB.start)} to ${niceDate(CONTRIB.end)}. Snapshot in data.js, not live.`);
w();
w("## 05 — Stack");
w();
w("Tools I reach for.");
w();
for (const g of SITE.stack) w(`- **${g.label}:** ${g.items.join(", ")}`);
w();
w("## 06 — Contact");
w();
w("Say hello.");
w();
w(`Fastest way to reach him is GitHub — open an issue, send a PR, or DM there. Reproducible bug reports get an answer first. No email address is published on this site.`);
w();
for (const s of SITE.socials) w(`- ${s.label}: ${s.href} (${s.handle})`);
w();
w("---");
w();
w(`© 2026 Adarsh Mishra. Hand-built. No template.`);
w();

const out = [
  ["llms.txt", a.join("\n")],
  ["llms-full.txt", b.join("\n")],
];
for (const [name, body] of out) {
  const text = body.replace(/\n{3,}/g, "\n\n");
  fs.writeFileSync(name, text, "utf8");
  fs.writeFileSync("dist/" + name, text, "utf8");
  process.stdout.write(`${name}: ${Buffer.byteLength(text, "utf8")} bytes -> root + dist\n`);
}
process.stdout.write(`as of ${asOfLong} | total ${TOTAL_MERGED} | external ${EXT_MERGED} across ${EXT_REPOS} repos | multi ${multi.length} | single ${single.length}\n`);
