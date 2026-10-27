// ─────────────────────────────────────────────────────────────
//  EDIT EVERYTHING HERE
//  Copy lives in this file + index.html (hero / about / contact).
//  Numbers in data.js are a GitHub snapshot from 2026-10-26.
// ─────────────────────────────────────────────────────────────

window.SITE = {
  name: "Adarsh Mishra",
  handle: "Adarsh-Me",
  role: "AI engineer · quant researcher · open-source contributor",
  email: "", // add your address to reveal the Email button
  github: "https://github.com/Adarsh-Me",
  links: {
    github: "https://github.com/Adarsh-Me",
  },

  // Rendered as logo tiles in the hero and contact section. Add or drop lines freely.
  socials: [
    { id: "github", label: "GitHub", handle: "@Adarsh-Me", href: "https://github.com/Adarsh-Me" },
    { id: "x", label: "X", handle: "@itsadarshm", href: "https://x.com/ItsAdarshM" },
    { id: "instagram", label: "Instagram", handle: "@notsoadrsh", href: "https://www.instagram.com/notsoadrsh/" },
    { id: "linkedin", label: "LinkedIn", handle: "in/adarsh-mishra-linkdin", href: "https://www.linkedin.com/in/adarsh-mishra-linkdin/" },
  ],

  experience: [
    {
      period: "2026 — now",
      role: "Research Consultant",
      org: "WorldQuant BRAIN",
      bullets: [
        "Alpha research on the BRAIN platform: hypothesis to expression to backtest to submission.",
        "Signals tuned against the gates that actually matter — Sharpe, turnover, sub-universe stability and correlation to existing alphas.",
        "Daily-frequency equity work, judged on out-of-sample behaviour rather than a pretty in-sample curve.",
      ],
    },
    {
      period: "2026 — now",
      role: "Freelance developer",
      org: "Cargo ERP — logistics platform",
      bullets: [
        "Built and maintain a cargo ERP that now runs 300+ AWB bookings a day.",
        "Invoice generation, waybill and rate flows, plus the reporting the operations team lives on.",
        "Live client work: data corrections, edge cases and uptime are part of the job, not after it.",
      ],
    },
    {
      period: "2026 — now",
      role: "Open source contributor",
      org: "Apache · LLVM · Kubernetes · kornia · OWASP",
      bullets: [
        "{{mergedExternal}} merged pull requests across {{ossProjects}} other people's projects.",
        "Apache Maka: linked-worktree read boundaries, launch-election handling, durable renames.",
        "kornia: homography-scale-independent grid warps, capture-safe loss checks, namedtuple fixes.",
        "checkstyle: migrated a dozen XPath regression suites to the inline config parser.",
      ],
    },
    {
      period: "2025 — now",
      role: "Independent builder",
      org: "Agent-Audit · Image-SDK · Sovereign AI",
      bullets: [
        "Agent-Audit: 640 controlled LLM trials for agentic commerce, with a bounded test-mode checkout.",
        "Image-SDK: one TypeScript interface across eight image-generation providers.",
        "Sovereign AI audit: a training-free provenance check for state-funded models, written up as a research paper.",
        "optyra: a GSoC issue radar with tiered polling, rule scoring and Telegram alerts.",
      ],
    },
  ],

  projects: [
    {
      id: "agent-audit",
      title: "Agent-Audit",
      year: "2026",
      kind: "Product · LLM evals",
      blurb: "Can AI shopping agents actually see, choose and buy from your catalogue?",
      summary:
        "A controlled testbed for agentic commerce. Six hundred and forty LLM trials against a real catalogue, CI-backed metrics, a human-gated remediation loop, and a bounded Razorpay checkout in test mode.",
      points: [
        "640 controlled LLM trials across a catalogue the agent has to actually navigate.",
        "CI-backed metrics, with human-gated remediation — no silent prompt fixes.",
        "A bounded, test-mode Razorpay checkout: the agent can buy without spending.",
        "Public dashboard shipped at agentaudit-web.antideploy.com.",
      ],
      stack: ["TypeScript", "LLM evals", "CI", "Razorpay"],
      hue: 188,
      links: [
        { label: "Live site", href: "https://agentaudit-web.antideploy.com/" },
        { label: "Source", href: "https://github.com/Adarsh-Me/Agent-Audit" },
      ],
    },
    {
      id: "image-sdk",
      title: "Image-SDK",
      year: "2026",
      kind: "Library · TypeScript",
      blurb: "One interface, eight image-generation providers.",
      summary:
        "A lightweight TypeScript library for generating and editing images through Flux, OpenAI, Stability AI, Google Imagen, Replicate, fal.ai, Ideogram and Recraft — same call shape whichever provider is behind it.",
      points: [
        "A single typed surface across eight providers.",
        "Covers generation and editing, not just text-to-image.",
        "Drops into a Node script or a browser app without a framework.",
      ],
      stack: ["TypeScript", "Node.js", "Flux", "OpenAI"],
      hue: 212,
      links: [{ label: "Source", href: "https://github.com/Adarsh-Me/Image-SDK" }],
    },
    {
      id: "sovergien",
      title: "Sovereign AI",
      year: "2026",
      kind: "Research · Model provenance",
      blurb: "TensorGuard-Lite: auditing 'open-washed' sovereign models without training them.",
      summary:
        "A training-free provenance auditor for state-funded AI. It pulls deterministic gradient fingerprints out of model weights alone — no training data, no logs, no API — compares them across families, and publishes the result as a research paper with a governance scorecard attached.",
      points: [
        "Lineage detection holds: the known derivative (DeepSeek-R1-Distill-Qwen-1.5B) clusters with its parent Qwen2.5-1.5B while Llama and SmolLM stay apart.",
        "A 16-dimensional fingerprint — 5 global, 3 attention, 3 FFN, 3 embedding, 2 structural — averaged over deterministic forward-backward passes.",
        "Token Tax measured across English, Hindi and Tamil: English-centric tokenizers inflate fertility, and attention cost scales with its square.",
        "Ten-dimension transparency scorecard → LOW / MEDIUM / HIGH / UNVERIFIABLE, plus a Compute-Conditional Disclosure proposal tying public compute to disclosure.",
        "Single 2,097-line file on a Colab T4, with a Gradio dashboard and JSON, CSV, LaTeX, 600 DPI PNG and SVG exports.",
      ],
      stack: ["Python", "PyTorch", "Transformers", "Gradio", "Colab T4"],
      hue: 268,
      links: [
        { label: "Research paper", href: "https://github.com/Adarsh-Me/Sovergien/blob/main/Sovereign_AI_Reseach_Paper.pdf" },
        { label: "Open in Colab", href: "https://colab.research.google.com/github/Adarsh-Me/Sovergien/blob/main/TensorGuard_Lite_Colab.ipynb" },
        { label: "Source", href: "https://github.com/Adarsh-Me/Sovergien" },
      ],
    },
    {
      id: "lumiere",
      title: "Lumiere",
      year: "2026",
      kind: "Experiment · TypeScript",
      blurb: "Short-form video, generated in the browser.",
      summary:
        "A TypeScript short-form video generator, deployed on Netlify and usable end to end. Small experiment, live rather than a screenshot.",
      points: [
        "TypeScript end to end.",
        "Live and usable at lumierevid.netlify.app.",
      ],
      stack: ["TypeScript", "Netlify"],
      hue: 322,
      links: [
        { label: "Live site", href: "https://lumierevid.netlify.app/" },
        { label: "Source", href: "https://github.com/Adarsh-Me/Lumiere-Shorts-Generator" },
      ],
    },
  ],

  stack: [
    { label: "Languages", items: ["Python", "TypeScript", "JavaScript", "Kotlin", "Java", "C / C++"] },
    { label: "AI", items: ["LangChain", "LangGraph", "PyTorch", "Agent evals"] },
    { label: "Web", items: ["React", "Next.js", "Node.js"] },
    { label: "Quant", items: ["WorldQuant BRAIN", "Alpha research", "Backtesting"] },
    { label: "Infra", items: ["Git", "GitHub Actions", "Docker", "Kubernetes", "Linux"] },
  ],
};
