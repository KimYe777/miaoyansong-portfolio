# Industrial Design Portfolio Website · Design Specification

Date: 2026-08-07  
Status: Approved direction; real-content amendment ready for user review  
Visual direction: Industrial Editorial

## 1. Objective

Build a responsive portfolio for an industrial design student with three physical-product projects and two UI projects. The site must support two evaluation modes:

- A recruiter should understand discipline, strengths, and representative work within roughly 30 seconds.
- An admissions reviewer should be able to inspect the reasoning, experimentation, iteration, and reflection behind each project.

The site therefore prioritizes clear hierarchy and case-study depth over spectacle.

## 2. Confirmed Content and Assumptions

- Four final portfolio PDFs have been supplied and reviewed: ClearSense, NightCare, 租前眼, and 出去晃晃.
- The fifth project remains an explicitly labeled product-project placeholder until real material is provided.
- The interface and placeholder copy will be English-first.
- The architecture will allow later bilingual content, but language switching is outside version-one scope.
- Industrial-design work is the primary identity; UI work demonstrates complementary digital-product capability.
- Unknown personal information (name, email, CV, education dates, awards, client names, and measured outcomes) remains clearly marked and is never invented.

## 3. Information Architecture

```text
Home
├── Hero / positioning
├── Selected Product Work (2 real + 1 reserved)
├── Digital Work (2)
├── About preview
└── Contact / CV

Project Detail × 5
├── Summary and metadata
├── Hero media
├── Context and problem
├── Research and insight
├── Development and iteration
├── Prototype and validation
├── Final outcome
└── Reflection and next project

About
├── Biography
├── Education and skills
├── Design approach
├── CV download
└── Contact
```

## 4. Page Design

### 4.1 Global navigation

A thin, editorial navigation line contains the designer's name, Work, About, and Email. It remains visually quiet and does not become a floating glass or pill-shaped control. On mobile it collapses to the name, Work, and a compact menu trigger.

### 4.2 Home hero

The hero uses one sentence of positioning and one representative product visual. The preferred composition is large editorial text on the left and the product image occupying the right or lower-right field. Introductory motion is short and does not delay navigation.

### 4.3 Selected work

The project order is fixed for this revision:

1. ClearSense — wearable allergen-risk sensing system and home dock.
2. NightCare — campus night-time health support terminal and service flow.
3. Product Project 03 — visibly reserved for the missing third physical-product project.
4. 租前眼 — first-rental decision and evidence-recording application.
5. 出去晃晃 — AI-assisted spontaneous walking and memory application.

The two real product projects appear first as independent editorial chapters. Each entry contains project number, title, category, one-line premise, and one dominant image. The reserved third slot is quieter than a real project and is not linked to a fabricated case study.

The two UI projects appear in a denser section after the product work. 租前眼 leads the digital section because its decision-support narrative and end-to-end task flow are more mature; 出去晃晃 follows as a lighter, more emotional experience project.

### 4.4 Project detail

Each case study follows a predictable reading sequence while allowing its imagery to vary. A sticky desktop chapter index may be introduced only if real case studies become long enough to justify it. On mobile, the index becomes a simple progress label or is omitted.

Research and process claims must be supported by artifacts such as photos, sketches, matrices, prototype evidence, or captions. Decorative process diagrams are not acceptable substitutes.

Each real project keeps the global editorial shell but receives a controlled local palette derived from its supplied portfolio. Case-study chapters are adapted for scrolling rather than presented as sequential PDF-page images:

- ClearSense: problem and evidence → integrated system → form development → construction → journey and application → reflection.
- NightCare: night-time care gap → service journey → concept and modular product → screening and handoff → validation limits.
- 租前眼: unreliable rental decisions → evidence anchors → on-site actions → end-to-end task flow → interface system → reflection.
- 出去晃晃: barriers to leaving home → route generation → walking support → recording and review → long-term footprint.

### 4.5 About

The About page presents a short first-person biography, education, capabilities, working methods, CV link, and direct contact. Skill lists remain concrete and short. Software logos and percentage skill meters are excluded.

## 5. Content Model

Project content should be held in focused data files rather than duplicated across page components.

```ts
type Project = {
  slug: string;
  number: string;
  title: string;
  discipline: 'industrial' | 'ui';
  year: string;
  duration: string;
  role: string[];
  summary: string;
  sourceDocument?: string;
  accent: string;
  hero: MediaAsset;
  sections: ProjectSection[];
  theme?: 'light' | 'dark';
};
```

`ProjectSection` supports headings, rich text, image groups, video, captions, and an optional model asset. Media assets are exported or rendered from the supplied source portfolios into a dedicated public asset directory; temporary PDF-review renders are not referenced by production code. This keeps content structure stable while allowing different project narratives.

## 6. Technical Architecture

- React + TypeScript + Vite.
- React Router for Home, About, and project routes.
- CSS custom properties driven by `DESIGN.md`; implementation may use CSS modules or well-scoped global styles.
- Project data stored locally in typed TypeScript modules for version one.
- Images loaded responsively with width/height metadata to prevent layout shift.
- React Bits code used selectively for content reveal; an optional Model Viewer enhancement is isolated behind a media component.
- No backend or CMS in version one.

Suggested component boundaries:

```text
AppShell
├── SiteHeader
├── RouteTransition
├── PageContainer
└── SiteFooter

HomePage
├── PortfolioHero
├── FeaturedProject
├── DigitalProjectGrid
└── AboutPreview

ProjectPage
├── ProjectHeader
├── ProjectHero
├── ProjectSectionRenderer
├── MediaFigure
└── NextProject
```

Each component has one purpose and receives explicit data. Page-specific layout decisions remain in page components; reusable media and typography behavior remains shared.

## 7. Motion and Interaction

- Initial hero sequence completes within approximately 1.2 seconds.
- Section reveals combine opacity with no more than 32px of vertical movement.
- Project-media hover uses a maximum scale of 1.015.
- Route transitions remain under 250ms.
- No continuous decorative animation.
- Reduced-motion preferences remove movement and preserve immediate content visibility.
- Keyboard focus is always visible and is not replaced by hover-only behavior.

## 8. Responsive Behaviour

- Desktop: 12-column editorial grid and large asymmetric project compositions.
- Tablet: 8-column grid; hero media may move below the title.
- Mobile: 4-column grid; every project becomes a clear vertical sequence with metadata before media.
- Essential information and project links must remain available without hover.
- Type sizes use `clamp()` and are checked at 320px, 768px, 1280px, and 1440px widths.

## 9. Error and Fallback Handling

- Missing project images show an honest labeled placeholder with the expected asset type and ratio.
- Failed videos retain their poster and expose playback controls.
- Unsupported or missing 3D models fall back to a static render.
- Missing optional project fields are omitted without leaving empty labels.
- Unknown project slugs display a designed Not Found page with a route back to Selected Work.

## 10. Accessibility and Performance

- Semantic heading order and landmark regions.
- Descriptive image alternative text; decorative images use empty alt text.
- WCAG AA text contrast.
- Full keyboard navigation and visible focus.
- `prefers-reduced-motion` support.
- Lazy-load below-the-fold media.
- Use responsive images and compressed AVIF/WebP where suitable.
- Avoid loading 3D or video until it approaches the viewport.
- Target strong Core Web Vitals on a normal portfolio-hosting setup.

## 11. Verification

Before delivery:

1. Build and type-check without errors.
2. Test all routes and next-project links.
3. Check desktop, tablet, and mobile screenshots.
4. Test keyboard navigation and reduced-motion mode.
5. Verify images retain correct aspect ratios and do not cause layout shift.
6. Confirm all placeholders are labeled and no fabricated claims remain.
7. Check console output for errors and failed assets.

## 12. Deferred Decisions

The following are intentionally postponed until real content exists:

- Whether any case study needs sticky chapter navigation.
- Whether 3D model viewing is useful for a supplied project.
- Final translation of Chinese project copy and possible language switching.
- Hosting domain, analytics, and form handling.
- Identity, contact, CV, education, and the missing third product project.

These decisions do not block the real-content revision. Unknown personal details remain honest placeholders, while the four supplied projects replace the current generic project content.

## 13. Real-content Revision Acceptance Criteria

1. The homepage shows the four real project names in the confirmed order and a clearly reserved fifth slot.
2. ClearSense is the homepage lead project and uses a real supplied product image.
3. Each real case-study route contains project-specific copy, chapters, media, palette, and descriptive alternative text.
4. No PDF is embedded as the primary browsing experience and no low-resolution review contact sheet is used in production.
5. Personal information, unverified dates, responsibilities, research outcomes, and testing claims are not invented.
6. All real project routes, next-project links, responsive layouts, keyboard focus, reduced-motion mode, and production build pass verification.
