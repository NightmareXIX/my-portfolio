// Content source of truth — every value traces to profile_info/PROFILE.md.
// No fabricated metrics, years, clients, or testimonials.

export const profile = {
  name: "Kazi Fardin Islam",
  short: "Sadnan",
  lockup: { l1: "KAZI FARDIN", l2: "ISLAM" },
  role: "Backend / Full-stack Engineer",
  location: "Bashabo, Dhaka, Bangladesh",
  email: "fardinislamsadnan@gmail.com",
  phone: "+8801886694400",
  phoneDisplay: "+880 1886 694400",
  linkedin: "/in/kazi-fardin-islam",
  github: "github.com/sadnan",
  pitch:
    "role-based APIs, multi-provider LLM gateways, real-time platforms — backed by real test suites and Dockerized infra, not MVP scope.",
};

export const stats = [
  { big: "1584", cap: "Codeforces Peak · Specialist", accent: true },
  { big: "2×", cap: "ICPC Regional Finalist · 48/310+", accent: true },
  { big: "5", cap: "Projects Shipped", accent: false },
  { big: "3.60", cap: "CGPA / 4.00 · BSc ICE", accent: true },
];

export const about = [
  {
    no: "i.",
    h: "Backend / Full-stack Engineer",
    p: "REST APIs, role-based authorization and relational data models — most fluently in C#/ASP.NET Core and Node.js/Express, growing across Next.js, React and TypeScript.",
  },
  {
    no: "ii.",
    h: "Systems-minded Builder",
    p: "Designs microservice architectures, API gateways and state machines from scratch — backed by real test suites and Dockerized infra rather than stopping at MVP scope.",
  },
  {
    no: "iii.",
    h: "AI-adjacent Engineer",
    p: "Integrates LLM APIs (Gemini, Groq, OpenRouter) into production-style systems and uses AI coding agents as a core workflow — with human verification of AI output as a differentiator.",
  },
];

export const skills = [
  {
    h: "Software Engineering",
    items: [
      "REST API design & implementation",
      "RBAC + ownership-scoped authorization (resource-level)",
      "Relational DB design & ORM (EF Core, raw PG/MySQL)",
      "State machine design with server-side invariants",
      "Microservices & API gateway patterns",
      "Automated testing (auth-focused, no mocking frameworks)",
      "Structured logging & observability (Serilog)",
      "Containerization (Docker Compose)",
    ],
  },
  {
    h: "AI / ML-Adjacent",
    items: [
      "LLM API integration (Gemini, Groq, OpenRouter)",
      "Multi-provider gateway w/ failover & typed errors",
      "Atomic Redis/Lua quota accounting",
      "AI-assisted dev workflows & output verification",
      "Applied ML exposure (thesis: transcriptomic translation)",
    ],
  },
  {
    h: "Problem Solving",
    items: [
      "Advanced algorithms & data structures (CF Specialist 1584)",
      "CP coaching (recursion, backtracking, graphs)",
      "Contest problem authorship",
    ],
  },
  {
    h: "Collaboration & Leadership",
    items: [
      "Cross-functional coordination (5-member exec committee)",
      "Technical event planning & delivery",
      "Fast learner in cross-functional environments",
    ],
    pills: [
      "Node/Express",
      "Next.js",
      "PostgreSQL",
      "Docker",
      "ASP.NET Core",
      "FastAPI",
      "Redis",
      "Flutter",
    ],
  },
];

export const projects = [
  {
    h: "OnnoRokom Assignment System",
    status: "Complete",
    statusKind: "done",
    tag: "Role-based assignment & submission platform",
    ctx: "Originally a take-home for a job application; expanded into a full portfolio project.",
    stack: ["ASP.NET Core 8", "PostgreSQL", "Next.js", "TypeScript", "EF Core", "JWT"],
    bullets: [
      "Admin/Teacher/Student roles with strict ownership-scoped access, verified by dedicated auth test suites.",
      "Server-side deadline/resubmission state machine — 86 xUnit tests (real ClaimsPrincipal + IAuthorizationService vs EF Core InMemory).",
      "Serilog logging, paginated/filtered endpoints across 5 controllers, 5-trigger notifications.",
      "3-service Docker Compose stack validated end-to-end vs live Postgres.",
    ],
    links: [
      { label: "Repo ↗", href: "#" },
      { label: "Demo ↗", href: "#" },
    ],
  },
  {
    h: "LLM Gateway",
    status: "Ongoing",
    statusKind: "on",
    tag: "Unified multi-provider LLM API",
    ctx: "OpenAI-compatible gateway unifying three free-tier providers behind one contract.",
    stack: ["Python", "FastAPI", "PostgreSQL", "Redis (Lua)", "Next.js", "Supabase Auth"],
    bullets: [
      "Unified Gemini/Groq/OpenRouter behind one OpenAI-compatible contract for provider-agnostic access.",
      "Provider-adapter protocol with a typed error taxonomy driving mid-stream failover — zero duplicate output.",
      "Canonical message schema + atomic Redis/Lua quota accounting across heterogeneous limits.",
      "BYOK key resolver with shared-pool-first, private-key-upgrade flow.",
    ],
    links: [
      { label: "Repo ↗", href: "#" },
      { label: "Demo ↗", href: "#" },
    ],
  },
  {
    h: "ICEntral",
    status: "Complete",
    statusKind: "done",
    tag: "Department community platform",
    ctx: "Full-stack platform with a centralized gateway and modular services.",
    stack: ["React (Vite)", "Node.js", "Express", "PostgreSQL", "Docker"],
    bullets: [
      "Centralized API gateway + modular services for auth, users, posts, jobs and chat.",
      "JWT auth + RBAC for protected routes, moderation workflows and alumni verification.",
      "Feed posts, collaboration requests, job applications, notifications and real-time messaging.",
    ],
    links: [
      { label: "Repo ↗", href: "#" },
      { label: "Demo ↗", href: "#" },
    ],
  },
  {
    h: "Food Delivery + AI Health",
    status: "Complete",
    statusKind: "done",
    tag: "Cross-platform mobile ordering + health",
    ctx: "Combines food ordering with personalized, AI-driven health tracking.",
    stack: ["Flutter", "Supabase", "PostgreSQL", "Gemini API", "Riverpod"],
    bullets: [
      "Cross-platform mobile app pairing food ordering with personalized health tracking.",
      "Authentication, health-metric tracking and real-time data synchronization.",
      "Gemini API integration for personalized nutrition insights.",
    ],
    links: [{ label: "Repo ↗", href: "#" }],
  },
  {
    h: "llm-guard-probe",
    status: "Tool",
    statusKind: "tool",
    tag: "OWASP LLM Top 10 regression harness",
    ctx: "A cybersecurity-adjacent CLI portfolio project.",
    stack: ["Node.js (ESM)", "CLI"],
    bullets: [
      "CLI-based regression-testing harness for the OWASP LLM Top 10.",
      "Explores LLM safety failure modes as a security-adjacent project.",
    ],
    links: [{ label: "Repo ↗", href: "#" }],
  },
];

export const contest = [
  { h: "Codeforces Specialist", p: "Peak rating 1584, built through consistent rated-contest performance." },
  { h: "2× ICPC Finalist", p: "Dhaka Regional Finalist (2024, 2025) — ranked 48th/310+ in 2025." },
  { h: "IUPC Finishes", p: "MU 31st/91 · BUET 46th/110 · CUET 62nd/130." },
  { h: "Hackathons", p: "HackTheAI by SmythOS (29th/100+ prelim), InnovateX 2026, BUET GameJam 2023 (11th prelim)." },
  { h: "Author & Coach", p: "Contest problem authorship + coaching in recursion, backtracking & graph algorithms." },
  { h: "Game Jams", p: "IUT 12th ICT Fest 2026 GameJam & BUET GameJam — mechanically-driven concepts." },
];

export const research = [
  {
    h: "Best Paper Award",
    when: "ICTDsC 2024",
    sub: "Springer LNNS",
    bullets: ["Best Paper award at ICTDsC 2024, published in Springer's Lecture Notes in Networks and Systems."],
  },
  {
    h: "BSc Thesis — TransComp-R",
    when: "2026",
    sub: "Applied ML / Computational Biology",
    bullets: [
      "A replication/validation study of TransComp-R, a cross-species transcriptomic translation method — applied ML depth beyond coursework.",
    ],
  },
];

export const experience = [
  {
    h: "Programming Instructor & Problem Setter",
    sub: "Programming Club, University of Rajshahi",
    when: "Jan – Jul 2026",
    bullets: [
      "Coached students in competitive programming — recursion, backtracking, graph algorithms and strategy.",
      "Authored problems for an Inter-University Contest (Intl. Girls in ICT Day) with IEEE BS, WIE & RUSB.",
    ],
  },
  {
    h: "Vice President",
    sub: "IEEE RUSB CS Chapter",
    when: "Apr 2025 – Feb 2026",
    bullets: [
      "Directed a 5-member executive committee delivering technical seminars, workshops and student events.",
      "Oversaw event coordination and team communication, growing student participation.",
    ],
  },
];

export const education = {
  h: "University of Rajshahi — Rajshahi, Bangladesh",
  sub: "BSc in Information & Communication Engineering · CGPA 3.60 / 4.00",
  when: "Mar 2022 – Jul 2026",
  bullets: [
    "Relevant coursework: Data Structures & Algorithms, OOP (Java), DBMS, Computer Networks, Software Engineering, Artificial Intelligence & Neural Networks, Cryptography.",
  ],
};

export const contact = [
  { k: "Email", v: profile.email, href: `mailto:${profile.email}` },
  { k: "Phone", v: profile.phoneDisplay, href: `tel:${profile.phone}` },
  { k: "LinkedIn", v: profile.linkedin, href: "#" },
  { k: "GitHub", v: profile.github, href: "#" },
];

// Chatbot canned answers (front-end shell only, no backend)
export const botAnswers = {
  stack:
    "Deepest stack: Node/Express, React/Next.js, PostgreSQL, Docker, ASP.NET Core/C#. Secondary but demonstrated: FastAPI/Python and Flutter/Dart. Plus Redis, EF Core, JWT/RBAC.",
  gateway:
    "LLM Gateway (ongoing): an OpenAI-compatible API unifying Gemini, Groq and OpenRouter, with typed-error mid-stream failover (zero duplicate output) and atomic Redis/Lua quota accounting.",
  contest:
    "Codeforces Specialist (peak 1584), 2× ICPC Dhaka Regional Finalist (2024, 2025 — 48th/310+), IUPC finishes (MU 31st/91, BUET 46th/110, CUET 62nd/130), plus HackTheAI, InnovateX 2026 and BUET GameJam.",
  def: "This is a static front-end shell for the design comparison — no live model yet. Try a chip, or reach Sadnan at fardinislamsadnan@gmail.com.",
};
