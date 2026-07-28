# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Primary: recruiters, hiring managers, and technical interviewers in IT and banking/financial services, evaluating Danish Ahmed N F for internship or entry-level data analytics / full-stack roles. They typically arrive from a resume, LinkedIn, or direct outreach link and are scanning to decide whether to shortlist.

Secondary: broader professional network (peers, potential collaborators, academic contacts) encountering the site as a durable personal profile, not tied to an active application.

## Product Purpose

A personal portfolio/resume site serving two purposes at once, roughly equal weight: (1) actively support an ongoing internship/entry-level job search in IT or banking, and (2) function as a durable professional presence independent of any single search cycle. Success is a recruiter or hiring contact coming away able to verify real, deployed work rather than taking claims on faith.

## Positioning

Breadth across full-stack engineering and data/ML — a "jack of all trades" combination a narrower CS-student portfolio (pure ML notebooks, or pure frontend work) can't truthfully claim. The differentiator is backed by real production-style platforms built on real government/financial datasets (RBI banking statistics, Election Commission affidavit filings) with verifiable, reconciled figures, not toy or Kaggle datasets.

This breadth must be presented honestly: versatile and capable across the stack, not framed as mastery of every domain or an "invincible" claim. Avoid boastful language; let the concrete, verifiable project details carry the positioning.

## Operating Context

Static single-page site (`index.html`), hosted via GitHub Pages at danishkfd.in (see `CNAME`). Linked from LinkedIn, resume outreach, and direct application submissions. Viewers typically click through to live project deployments (e.g., the RBI analytics dashboard on Vercel, Unified Dashboard on GitHub Pages) or the hosted resume PDF in the same repo.

## Capabilities and Constraints

- Static HTML/CSS/JS, no build step or backend of its own; content changes mean editing `index.html` directly.
- The hero is an operable "route console" (real destination links, no 3D/canvas library); a single scroll-bound signal indicator and GSAP/ScrollTrigger handle the entrance and section reveals; `prefers-reduced-motion` is already respected throughout.
- Responsive breakpoint at 800px collapsing multi-column sections to single column.
- Resume PDF (`Danish ahmed N F Resume.pdf`) lives in-repo and is linked directly from nav, hero, and footer.
- Not every listed project has a live deployment; several (GemTutor, satellite classification, pharma EDA, Re-store, Repo Reviewer) are described without a "View live" link.

## Brand Commitments

- Name: Danish Ahmed N F.
- Contact: ndanishahmed@gmail.com, +91 75581 33301.
- LinkedIn: linkedin.com/in/danish-ahmed-nf-b39649249.
- Location context: Coimbatore, Tamil Nadu, India.

## Evidence on Hand

- Seven described projects with concrete specifics (stack, data source, scale), notably:
  - RBI Banking Infrastructure & Digital Payments Analytics Platform — live at rbi-card-usage-analytics.vercel.app, validated against RBI's April 2026 data (63 banks, 26 metrics reconciled exactly).
  - Unified Dashboard — Election Data Hub — live at danishkfd.github.io/Unified-Dashboard/hub.html, 15 states/UTs live, 15,000+ candidate records across 28+ states.
  - GemTutor, Satellite Map Classification & Image Captioning, EDA in a Pharma Company, Re-store, Repo Reviewer — described, not all with live links.
- One professional role: Sales Associate (Part-time) at Codak Pharmaceuticals OPC Private Limited, 2022–present.
- Education: MSc Information Technology and PG Diploma in Advanced Computing (2025–27/2025–26) and B.Sc Computer Science with Data Analytics (2022–25), all at Sri Ramakrishna College of Arts & Science; prior schooling at Perks Matriculation Higher Secondary School.
- Certifications: TCS ION Industry Honor Courses (Data Mining and Warehousing; Data Modeling and Visualization), Introduction to MongoDB (MongoDB).
- Extracurriculars: Coimbatore Quiz Club, Omni Book Club, Programming Club.
- All current content is confirmed accurate as of this writing; nothing flagged as stale.

## Product Principles

1. Every project claim should be something a viewer can verify — a live link, a specific reconciled figure, a named dataset — not a generic or unverifiable assertion.
2. Communicate breadth (full-stack + data/ML) honestly as versatility, never as mastery-of-everything or boastful superiority over other candidates.
3. Serve the active internship/entry-level search and the durable professional profile with equal weight — don't optimize copy for one at the expense of the other.
4. Real, deployed, production-style work is the core credibility signal; prioritize surfacing it over volume of listed projects.

## Accessibility & Inclusion

`prefers-reduced-motion` is already respected across the hero's entrance motion, the scroll-bound signal indicator, and GSAP scroll-reveals; preserve this in any future changes.
