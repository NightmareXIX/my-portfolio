"use client";

import { useEffect } from "react";
import Clock from "./Clock";
import {
  profile, stats, about, skills, projects, contest, research, experience, education, contact,
} from "@/lib/data";

// Split a word into hover-animatable letters (spaces kept as plain nodes so
// words still wrap and the click-through gaps over the portrait are preserved).
function Letters({ text }: { text: string }) {
  return (
    <>
      {Array.from(text).map((ch, i) =>
        ch === " " ? " " : <span className="ltr" key={i}>{ch}</span>
      )}
    </>
  );
}

// Decorative doodle icons that float in the hero's blank spaces.
const HERO_ICONS = [
  // star
  <path key="s" d="M20 3 L24.5 15 L37 16 L27 24.5 L30.5 37 L20 29.5 L9.5 37 L13 24.5 L3 16 L15.5 15 Z" />,
  // lightning
  <path key="b" d="M25 2 L9 22 L18 22 L14 38 L31 16 L21 16 L27 2 Z" fill="currentColor" stroke="none" />,
  // 4-point sparkle
  <path key="k" d="M20 2 C20 14 22 16 34 16 C22 16 20 18 20 34 C20 18 18 16 6 16 C18 16 20 14 20 2 Z" fill="currentColor" stroke="none" />,
  // concentric circles
  <g key="c"><circle cx="20" cy="20" r="15" /><circle cx="20" cy="20" r="7" /></g>,
  // zigzag
  <path key="z" d="M4 26 L14 12 L14 24 L24 10 L24 24 L34 12" fill="none" />,
  // burst
  <path key="u" d="M20 3 L20 37 M3 20 L37 20 L20 3 M8 8 L32 32 M32 8 L8 32" fill="none" />,
];

export default function Sections() {
  // Scroll-reveal: fade + rise each section as it enters the viewport.
  // Applied at section level so per-card tilts are left untouched.
  useEffect(() => {
    const els = Array.from(document.querySelectorAll<HTMLElement>("[data-reveal]"));
    if (!("IntersectionObserver" in window)) {
      els.forEach((el) => el.classList.add("is-in"));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("is-in");
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  return (
    <>
      {/* NAV */}
      <header className="nav-wrap">
        <div className="nav">
          <a href="#top" className="logo">SADNAN<span className="b">!</span></a>
          <nav className="nav-links">
            <a href="#projects">Work</a>
            <a href="#about">About</a>
            <a href="#skills">Skills</a>
            <a href="#contest">Contest</a>
            <a href="#contact">Contact</a>
          </nav>
          <div className="nav-right">
            <Clock />
            <a href="/resume.pdf" target="_blank" rel="noopener noreferrer" className="badge-work resume-link">Résumé ↗</a>
          </div>
        </div>
      </header>

      <span id="top" />

      {/* HERO */}
      <section className="hero">
        <div className="wrap">
          <div className="tag-open"><span className="d" /> {profile.role} · Open to Work</div>
          <h1 className="name">
            <span className="l1"><Letters text={profile.lockup.l1} /></span>
            <span className="l2"><Letters text={profile.lockup.l2} /></span>
          </h1>

          {/* floating doodle icons in the blank spaces (hover to nudge them) */}
          <div className="hero-floaties" aria-hidden="true">
            {HERO_ICONS.map((icon, i) => (
              <span className={`fl fl${i + 1}`} key={i}>
                <span className="fl-in">
                  <svg viewBox="0 0 40 40" width="100%" height="100%" fill="none"
                    stroke="currentColor" strokeWidth={4} strokeLinejoin="round" strokeLinecap="round">
                    {icon}
                  </svg>
                </span>
              </span>
            ))}
          </div>

          <div className="hero-mid">
            <div>
              <p className="pitch">
                I build <span className="hl">production-grade systems</span> — {profile.pitch}
                <span className="cur" />
              </p>
              <div className="cta-row">
                <a href="#projects" className="btn btn-primary">View Projects →</a>
                <a href="#contact" className="btn btn-ghost">Contact</a>
              </div>
              <div className="hero-stamp" aria-label="Available for hire">
                <span className="st-star">✸</span>
                <span className="st-text disp">Available<br />for hire</span>
              </div>
            </div>
            <div className="hero-right">
              <div className="hero-portrait">
                <span className="star">✦</span>
                <img src="/portrait.jpg" alt="Kazi Fardin Islam (Sadnan)" />
                <span className="frame-label">Kazi Fardin Islam · Dhaka</span>
              </div>
              <div className="social-row">
                <a href={profile.githubUrl} target="_blank" rel="noopener noreferrer" className="sbtn">Github ↗</a>
                <a href={profile.linkedinUrl} target="_blank" rel="noopener noreferrer" className="sbtn">LinkedIn ↗</a>
                <a href={`mailto:${profile.email}`} className="sbtn">Email ↗</a>
              </div>
            </div>
          </div>

          <div className="stats">
            {stats.map((s, i) => (
              <div className="stat" key={i}>
                <div className="big">{s.accent ? <span className="u">{s.big}</span> : s.big}</div>
                <div className="cap">{s.cap}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ABOUT */}
      <section className="blk band paper" id="about" data-section="about">
        <div className="wrap" data-reveal>
          <div className="sec-top"><span className="sec-no">01</span><h2 className="sec-title">About</h2></div>
          <p className="sec-lead">
            Three identities, one problem-solving foundation. Which one leads depends on the role — but the depth is the same.
          </p>
          <div className="grid g3">
            {about.map((a, i) => (
              <div className="cardw" key={i}>
                <div className="no">{a.no}</div>
                <h3>{a.h}</h3>
                <p>{a.p}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SKILLS */}
      <section className="blk band card has-doodles" id="skills" data-section="skills">
        <div className="wrap" data-reveal>
          <div className="sec-top"><span className="sec-no">02</span><h2 className="sec-title">Skills</h2></div>
          <div className="grid g2">
            {skills.map((sk, i) => (
              <div className="skcard" key={i}>
                <h3>{sk.h}</h3>
                <ul>{sk.items.map((it, j) => <li key={j}>{it}</li>)}</ul>
                {sk.pills && (
                  <div className="pills">{sk.pills.map((p, j) => <span className="pill" key={j}>{p}</span>)}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PROJECTS */}
      <section className="blk band accent has-doodles" id="projects" data-section="projects">
        <div className="wrap" data-reveal>
          <div className="sec-top"><span className="sec-no">03</span><h2 className="sec-title">Projects</h2></div>
          <p className="sec-lead">Five projects — every bullet traces to real work. No fabricated metrics, no filler.</p>
          <div className="grid g2">
            {projects.map((pr, i) => (
              <div className="proj" key={i}>
                <div className="ptop">
                  <h3>{pr.h}</h3>
                  <span className={`status ${pr.statusKind}`}>{pr.status}</span>
                </div>
                <div className="tagl">{pr.tag}</div>
                <div className="ctx">{pr.ctx}</div>
                <div className="stk">{pr.stack.map((s, j) => <span key={j}>{s}</span>)}</div>
                <ul>{pr.bullets.map((b, j) => <li key={j}>{b}</li>)}</ul>
                <div className="plinks">
                  {pr.links.map((l, j) => (
                    <a href={l.href} target="_blank" rel="noopener noreferrer" key={j}>{l.label}</a>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CP */}
      <section className="blk band paper" id="contest" data-section="contest">
        <div className="wrap" data-reveal>
          <div className="sec-top"><span className="sec-no">04</span><h2 className="sec-title">Competitive Programming &amp; Hackathons</h2></div>
          <div className="grid g3">
            {contest.map((c, i) => (
              <div className="cardw" key={i}><h3>{c.h}</h3><p>{c.p}</p></div>
            ))}
          </div>
        </div>
      </section>

      {/* RESEARCH */}
      <section className="blk band pop" id="research" data-section="research">
        <div className="wrap" data-reveal>
          <div className="sec-top"><span className="sec-no">05</span><h2 className="sec-title">Research &amp; Publications</h2></div>
          <div className="grid g2">
            {research.map((r, i) => (
              <div className="row" key={i}>
                <div className="rt"><h3>{r.h}</h3><span className="when">{r.when}</span></div>
                <div className="sub">{r.sub}</div>
                <ul>{r.bullets.map((b, j) => <li key={j}>{b}</li>)}</ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* EXPERIENCE */}
      <section className="blk band card" id="experience" data-section="experience">
        <div className="wrap" data-reveal>
          <div className="sec-top"><span className="sec-no">06</span><h2 className="sec-title">Experience</h2></div>
          <div className="rows">
            {experience.map((e, i) => (
              <div className="row" key={i}>
                <div className="rt">
                  <div><h3>{e.h}</h3><div className="sub">{e.sub}</div></div>
                  <span className="when">{e.when}</span>
                </div>
                <ul>{e.bullets.map((b, j) => <li key={j}>{b}</li>)}</ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* EDUCATION */}
      <section className="blk band paper has-doodles" id="education" data-section="education">
        <div className="wrap" data-reveal>
          <div className="sec-top"><span className="sec-no">07</span><h2 className="sec-title">Education</h2></div>
          <div className="row">
            <div className="rt">
              <div><h3>{education.h}</h3><div className="sub">{education.sub}</div></div>
              <span className="when">{education.when}</span>
            </div>
            <ul>{education.bullets.map((b, j) => <li key={j}>{b}</li>)}</ul>
          </div>
        </div>
      </section>

      {/* CONTACT */}
      <section className="blk band pop" id="contact" data-section="contact">
        <div className="wrap final" data-reveal>
          <div className="sec-top" style={{ justifyContent: "center" }}><span className="sec-no">08</span></div>
          <h2>LET&apos;S BUILD</h2>
          <p className="lead">Open to entry-level software engineering roles. The fastest way to judge the code is to read it.</p>
          <a href="#projects" className="btn btn-primary">View Projects →</a>
          <div className="cgrid">
            {contact.map((c, i) => (
              <a
                className="cc"
                href={c.href}
                key={i}
                {...(c.href.startsWith("http")
                  ? { target: "_blank", rel: "noopener noreferrer" }
                  : {})}
              >
                <span className="k">{c.k}</span><span className="v">{c.v}</span>
              </a>
            ))}
          </div>
        </div>
      </section>

      <footer className="site-foot">
        KAZI FARDIN ISLAM (SADNAN) · {profile.location.toUpperCase()} · © 2026
      </footer>
    </>
  );
}
