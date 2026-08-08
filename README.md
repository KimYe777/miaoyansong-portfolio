# Industrial Editorial Portfolio

面向中国招聘方与院校评审的工业设计个人作品集网站。当前包含 ClearSense、NightCare、租前眼、出去晃晃四份完整作品集，以及一个明确保留的第三产品项目位置。

## Run locally

```powershell
npm.cmd install
npm.cmd run dev
```

Production build:

```powershell
npm.cmd run build
```

The default development URL used for review is `http://127.0.0.1:56589/`.

## Complete the remaining profile content

1. Add the third physical-product project in `src/data/projects.ts` and place its optimized media under `public/assets/projects/<project-slug>/`.
2. Update the name and email in:
   - `src/components/SiteHeader.tsx`
   - `src/components/SiteFooter.tsx`
   - `src/pages/HomePage.tsx`
   - `src/pages/AboutPage.tsx`
   - `index.html`
3. Add the final CV PDF under `public/`, then change the temporary “Request CV” email links to the PDF path.
4. Replace unverified duration, role, or year metadata only with information supported by the source project files.

## Visual rules

Read `DESIGN.md` before changing styles. The orange accent, warm paper canvas, editorial grid, serif/sans pairing, and restrained motion form one system. Avoid adding unrelated visual effects to individual pages.

## Validation

- `npm.cmd run build` performs TypeScript and Vite production checks.
- `node scripts/visual-qa.mjs` checks desktop, mobile, reduced-motion, project, and 404 routes against the URL in `PORTFOLIO_BASE_URL` (default `http://127.0.0.1:56589`).
- `node scripts/visual-qa.mjs --quick` checks the homepage at desktop and mobile sizes.
- QA screenshots are saved under `qa/`.

## Media workflow

- Production WebP files live in `public/assets/projects/` and total roughly 2.4 MB.
- Website-only PNG copies are retained under `tmp/source-assets-archive/`.
- Original source images and PDFs remain in their four source project directories.
- Run the bundled Python script `scripts/optimize-assets.py` after adding new PNG media.
- 四份最终PDF另外导出为 `public/assets/portfolio-pages/` 下的51张WebP页面；项目详情页严格按照这些原页的文件序号连续展示。
- 重新导出原页时，先用 Poppler 渲染至 `tmp/pdfs/original-pages/`，再运行 `scripts/prepare-portfolio-pages.py`。

## Deployment

This project uses `BrowserRouter`. Configure the host to rewrite unknown paths to `index.html` so direct project URLs continue to work.
