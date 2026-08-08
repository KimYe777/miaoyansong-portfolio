# Real Project Integration Record

Date: 2026-08-07

## Result

- Replaced generic case-study data with ClearSense, NightCare, RentEye, and Wander.
- Preserved a clearly labelled fifth slot for the missing third physical-product project.
- Added project-specific palettes while retaining the shared industrial-editorial shell.
- Rebuilt project detail pages around real source media and project-specific narratives.
- Converted 29 website media assets from 38.2 MB of PNG copies to 2.4 MB of production WebP files.

## Verification

- `npm.cmd run build`: passed.
- Desktop and mobile homepage screenshots: passed without horizontal overflow.
- ClearSense, NightCare, RentEye, and Wander routes: returned HTTP 200 in full visual QA.
- Browser console warnings/errors: none.
- Reduced-motion reveal content: visible.
- Mobile navigation: opens correctly.

## Remaining Inputs

- Designer name and preferred English name.
- Email, CV, education and personal biography.
- Verified project roles and durations.
- The third physical-product project.

## Reusable Lesson

Use the source portfolio as a content library, not as a stack of embedded PDF pages. Select one hero image and a small number of process artifacts that each carry a distinct part of the narrative; preserve project identity through local color variables rather than rebuilding the global shell for every case study.

## Direction Correction

The initial integration over-applied a web case-study pattern: it used an English-first shell and re-edited each supplied portfolio into shorter web chapters. The user clarified that the audience is Chinese and that the existing PDF sequencing is intentional.

The corrected rule is now authoritative for this project:

- Website navigation and supporting interface use Chinese.
- The homepage is only a project index.
- Every project route displays every original PDF page in the original order, without rewriting, cropping, rearranging or omitting pages.
- The four verified counts are 12, 10, 14 and 15 pages.
