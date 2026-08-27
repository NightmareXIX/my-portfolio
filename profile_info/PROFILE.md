# Profile: Kazi Fardin Islam (Sadnan)

**Location:** Bashabo, Dhaka, Bangladesh
**Contact:** fardinislamsadnan@gmail.com | +8801886694400
**Links:** LinkedIn | GitHub | Portfolio

---

## 1. Who I Am

A recent (2026) BSc graduate in Information and Communication Engineering from the University of Rajshahi (CGPA 3.60/4.00), transitioning from a strong competitive-programming background into professional software engineering. I sit at the intersection of three identities that show up differently depending on the role I'm targeting:

- **Backend/full-stack engineer** — hands-on experience building REST APIs, role-based authorization systems, and relational data models, most fluently in C#/ASP.NET Core and Node.js/Express, with growing full-stack range across Next.js, React, and TypeScript.
- **Systems-minded builder** — comfortable designing microservice architectures, API gateways, and state machines from scratch, and backing them with real test suites and Dockerized infrastructure rather than stopping at MVP scope.
- **AI-adjacent engineer** — actively integrating LLM APIs (Gemini, Groq, OpenRouter) into production-style systems, and using AI-assisted development tools (Claude Code, OpenAI Codex, Gemini CLI) as a core part of my workflow, with an emphasis on human verification of AI-generated code as a differentiator.

Underlying all of this is a strong problem-solving foundation from competitive programming (Codeforces Specialist, 2× ICPC Regional Finalist) and a consistent habit of thorough upfront planning — scoping feasibility and writing phase-separated specs before building.

---

## 2. Skills

**Software Engineering**
- REST API design & implementation
- Role-based access control (RBAC) and ownership-scoped authorization (not just role checks — resource-level ownership enforcement)
- Relational database design & ORM usage (Entity Framework Core, raw PostgreSQL/MySQL)
- State machine design (e.g., deadline/resubmission logic with server-side invariants)
- Microservices architecture & API gateway patterns
- Automated testing (unit + integration, auth-focused test suites without mocking frameworks)
- Structured logging & observability (Serilog, request/exception tracing)
- Containerization & multi-service orchestration (Docker Compose)

**AI/ML-Adjacent**
- LLM API integration (Gemini API, Groq, OpenRouter)
- Multi-provider API gateway design with automatic failover and typed error taxonomies
- Rate-limit/quota accounting (atomic Redis/Lua-based)
- AI-assisted development workflows (prompting, spec-driven handoff to coding agents, verifying AI-generated output)
- Applied ML exposure via academic thesis work (cross-species transcriptomic data translation)

**Problem Solving**
- Advanced algorithms & data structures (Codeforces Specialist, peak rating 1584)
- Competitive programming coaching (recursion, backtracking, graph algorithms)
- Contest problem authorship

**Collaboration & Leadership**
- Cross-functional team coordination (5-member executive committee)
- Technical event planning and delivery (seminars, workshops, inter-university contests)
- Fast learner in collaborative, cross-functional environments

---

## 3. Tech Stack

| Category | Technologies |
|---|---|
| **Languages** | C#, Python, JavaScript, TypeScript, C, C++, Java, Dart |
| **Backend Frameworks** | ASP.NET Core, Node.js, Express.js, FastAPI |
| **Databases & Data** | PostgreSQL, MySQL, Redis, Supabase, Entity Framework Core, LINQ |
| **Frontend** | React (incl. Vite), Next.js, TypeScript, HTML/CSS |
| **Mobile & Game Dev** | Flutter, Riverpod, Unity |
| **Auth & Security** | JWT Authentication, Role-Based Access Control (RBAC) |
| **Testing** | xUnit, ClaimsPrincipal/IAuthorizationService-based auth testing, EF Core InMemory |
| **DevOps & Tooling** | Docker, Docker Compose, Git, GitHub, Postman, Serilog |
| **AI-Assisted Development** | Claude Code, OpenAI Codex, Gemini CLI |
| **AI/LLM APIs** | Gemini API, Groq, OpenRouter |
| **Core CS Concepts** | Data Structures, Algorithms, OOP Design, DBMS, Microservices, REST APIs |

**Primary/deepest stack:** Node.js/Express, React/Next.js, PostgreSQL, Docker, ASP.NET Core/C#, with FastAPI/Python and Flutter/Dart as secondary but demonstrated stacks.

---

## 4. Projects

### OnnoRokom Assignment & Submission Management System
*ASP.NET Core 8, PostgreSQL, Next.js, TypeScript, EF Core, JWT*
- Architected a role-based (Admin/Teacher/Student) assignment platform with strict, ownership-scoped data access — teacher-scoped mutations enforced via ownership checks beyond simple role checks, verified with dedicated authorization test suites.
- Designed a server-side deadline/resubmission state machine (hard-blocked late submissions, opt-in resubmission that clears prior grades, marks bounded to [0, MaxMarks]), backed by 86 xUnit tests using real ClaimsPrincipal + IAuthorizationService against EF Core InMemory.
- Shipped beyond-MVP infrastructure: Serilog structured logging, paginated/filtered endpoints across 5 controllers, a notification system (5 trigger points, 30s polling), and a 3-service Docker Compose stack validated end-to-end against a live Postgres instance.
- *(Originally built as a take-home assignment for a job application; expanded into a full portfolio project.)*

### LLM Gateway — Unified Multi-Provider LLM API *(Ongoing)*
*Python, FastAPI, PostgreSQL, Redis (Lua), Next.js/TypeScript, Supabase Auth*
- Built an OpenAI-compatible API gateway unifying three free-tier LLM providers (Gemini, Groq, OpenRouter) behind a single contract for provider-agnostic client access without hand-rolled failover.
- Designed a provider-adapter protocol with a typed error taxonomy driving automatic mid-stream failover — restarting a dropped stream on a different provider with zero duplicate output.
- Enforced conversation integrity via a canonical message schema and atomic Redis/Lua quota accounting across heterogeneous per-provider rate limits.
- Built around a BYOK (Bring Your Own Key) key resolver pattern with a shared-pool-first, private-key-upgrade flow.

### ICEntral — Department Community Platform
*React (Vite), Node.js, Express, PostgreSQL, Docker*
- Built a full-stack department community platform with a centralized API gateway and modular services for authentication, users, posts, jobs, and chat.
- Implemented JWT authentication and RBAC for protected routes, moderation workflows, and alumni verification.
- Delivered integrated community features: feed posts, collaboration requests, job applications, notifications, and real-time messaging.

### Food Delivery App with AI Health Tracking
*Flutter, Supabase, PostgreSQL, Gemini API, Riverpod*
- Built a cross-platform mobile app combining food ordering with personalized health tracking.
- Implemented authentication, health metric tracking, and real-time data synchronization.
- Integrated Gemini API for personalized nutrition insights.

### llm-guard-probe
*Node.js (ESM), CLI*
- CLI-based regression-testing harness for the OWASP LLM Top 10, built as a cybersecurity-adjacent portfolio project.

---

## 5. Achievements

- **Codeforces Specialist** — peak rating 1584, built through consistent rated-contest performance.
- **2× ICPC Dhaka Regional Finalist** (2024, 2025) — ranked 48th/310+ in 2025.
- **IUPC top finishes** — MU 31st/91, BUET 46th/110, CUET 62nd/130.
- **Hackathon finalist** — HackTheAI by SmythOS (29th/100+ prelim), InnovateX 2026, BUET GameJam 2023 (11th prelim).
- **Published research** — Best Paper award, Springer LNNS, at ICTDsC 2024.
- **BSc Thesis** — a replication/validation study of TransComp-R, a cross-species transcriptomic translation method, reflecting applied ML depth beyond coursework.
- **Game jam participation** — IUT 12th ICT Fest 2026 GameJam and BUET GameJam, designing mechanically-driven game concepts.

---

## 6. Experience

**Programming Instructor & Problem Setter** — Programming Club, University of Rajshahi *(Jan 2026 – Jul 2026)*
- Coached students in competitive programming, focusing on recursion, backtracking, graph algorithms, and broader problem-solving strategy.
- Authored algorithmic problems for an Inter-University Programming Contest celebrating International Girls in ICT Day, in collaboration with IEEE BS, IEEE WIE, and IEEE RUSB.

**Vice President** — IEEE RUSB CS Chapter *(Apr 2025 – Feb 2026)*
- Directed a 5-member executive committee to plan and deliver technical seminars, workshops, and student events.
- Oversaw event coordination and team communication, growing student participation in chapter activities.

---

## 7. Education

**University of Rajshahi** — Rajshahi, Bangladesh
BSc in Information and Communication Engineering, CGPA: 3.60/4.00 *(Mar 2022 – Jul 2026)*
Relevant Coursework: Data Structures & Algorithms, OOP (Java), DBMS, Computer Networks, Software Engineering, Artificial Intelligence & Neural Networks, Cryptography

---
